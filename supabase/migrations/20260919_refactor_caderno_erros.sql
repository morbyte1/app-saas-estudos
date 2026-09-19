BEGIN;

-- Preserve the original answer and taxonomy; no existing row is deleted.
ALTER TABLE public.caderno_erros
  ADD COLUMN assunto_texto text,
  ADD COLUMN motivo_erro_original text,
  ADD COLUMN estado text NOT NULL DEFAULT 'ativo',
  ADD COLUMN resolvido_em timestamptz;

UPDATE public.caderno_erros AS e
SET assunto_texto = a.name
FROM public.assuntos AS a
WHERE e.assunto_id = a.id AND e.assunto_texto IS NULL;

UPDATE public.caderno_erros
SET motivo_erro_original = motivo_erro,
    motivo_erro = CASE
      WHEN motivo_erro = 'Falta de atenção' THEN 'Desatenção'
      WHEN motivo_erro = 'Descuido / Cálculo' THEN 'Erro de cálculo/procedimento'
      ELSE 'Outro'
    END
WHERE motivo_erro IS NOT NULL
  AND motivo_erro NOT IN (
    'Não sabia o conteúdo', 'Confundi conceitos', 'Interpretação',
    'Erro de cálculo/procedimento', 'Desatenção', 'Falta de tempo', 'Outro'
  );

ALTER TABLE public.caderno_erros
  ALTER COLUMN enunciado DROP NOT NULL,
  ALTER COLUMN resposta_correta DROP NOT NULL,
  ALTER COLUMN confianca DROP NOT NULL,
  ALTER COLUMN assunto_id DROP NOT NULL,
  ALTER COLUMN proxima_revisao DROP NOT NULL;

ALTER TABLE public.caderno_erros
  ADD CONSTRAINT caderno_erros_estado_check CHECK (estado IN ('ativo', 'resolvido'));

ALTER TABLE public.caderno_erros
  ADD CONSTRAINT caderno_erros_motivo_erro_check CHECK (motivo_erro IN (
    'Não sabia o conteúdo', 'Confundi conceitos', 'Interpretação',
    'Erro de cálculo/procedimento', 'Desatenção', 'Falta de tempo', 'Outro'
  ));

-- Match the existing key types instead of assuming they are UUIDs.
DO $migration$
DECLARE
  erro_type text;
  user_type text;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod) INTO erro_type
  FROM pg_attribute a WHERE a.attrelid = 'public.caderno_erros'::regclass AND a.attname = 'id' AND NOT a.attisdropped;
  SELECT format_type(a.atttypid, a.atttypmod) INTO user_type
  FROM pg_attribute a WHERE a.attrelid = 'public.caderno_erros'::regclass AND a.attname = 'user_id' AND NOT a.attisdropped;
  IF erro_type IS NULL OR user_type IS NULL THEN
    RAISE EXCEPTION 'caderno_erros.id/user_id não encontrados; confirme o schema antes de aplicar';
  END IF;
  EXECUTE format(
    'CREATE TABLE public.caderno_revisoes (
       id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       user_id %s NOT NULL,
       erro_id %s NOT NULL REFERENCES public.caderno_erros(id) ON DELETE CASCADE,
       reviewed_at timestamptz NOT NULL DEFAULT now(),
       resultado text NOT NULL CHECK (resultado IN (''acertou'', ''errou'')),
       motivo_erro text,
       confianca text,
       created_at timestamptz NOT NULL DEFAULT now()
     )', user_type, erro_type
  );
END $migration$;

CREATE INDEX caderno_revisoes_erro_data_idx ON public.caderno_revisoes (erro_id, reviewed_at DESC);
ALTER TABLE public.caderno_revisoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY caderno_revisoes_select ON public.caderno_revisoes FOR SELECT TO authenticated
USING (user_id::text = auth.uid()::text AND EXISTS (
  SELECT 1 FROM public.caderno_erros e WHERE e.id = erro_id AND e.user_id::text = auth.uid()::text
));
CREATE POLICY caderno_revisoes_insert ON public.caderno_revisoes FOR INSERT TO authenticated
WITH CHECK (user_id::text = auth.uid()::text AND EXISTS (
  SELECT 1 FROM public.caderno_erros e WHERE e.id = erro_id AND e.user_id::text = auth.uid()::text
));
GRANT SELECT, INSERT ON public.caderno_revisoes TO authenticated;

-- Recording a review and advancing the current state happen in one transaction.
CREATE FUNCTION public.registrar_revisao_caderno(
  p_erro_id text, p_acertou boolean, p_motivo text DEFAULT NULL, p_confianca text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $function$
DECLARE
  erro public.caderno_erros%ROWTYPE;
  novo_nivel integer;
  atualizados integer;
  hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  SELECT * INTO erro FROM public.caderno_erros
  WHERE id::text = p_erro_id AND user_id::text = auth.uid()::text FOR UPDATE;
  IF NOT FOUND OR erro.estado = 'resolvido' THEN
    RAISE EXCEPTION 'Erro não encontrado ou já resolvido';
  END IF;
  IF p_acertou IS NULL THEN RAISE EXCEPTION 'Resultado da revisão obrigatório'; END IF;
  IF p_motivo IS NOT NULL AND p_motivo NOT IN (
    'Não sabia o conteúdo', 'Confundi conceitos', 'Interpretação',
    'Erro de cálculo/procedimento', 'Desatenção', 'Falta de tempo', 'Outro'
  ) THEN RAISE EXCEPTION 'Motivo de erro inválido'; END IF;
  IF p_confianca IS NOT NULL AND p_confianca NOT IN ('Baixa', 'Média', 'Alta') THEN
    RAISE EXCEPTION 'Confiança inválida';
  END IF;

  -- The next successful attempt after level 3 resolves the error.
  novo_nivel := CASE WHEN p_acertou THEN COALESCE(erro.nivel_revisao, 0) + 1 ELSE 0 END;
  UPDATE public.caderno_erros SET
    nivel_revisao = LEAST(novo_nivel, 4),
    proxima_revisao = CASE
      WHEN novo_nivel >= 4 THEN NULL
      WHEN NOT p_acertou THEN hoje + 1
      WHEN novo_nivel = 1 THEN hoje + 3
      WHEN novo_nivel = 2 THEN hoje + 7
      ELSE hoje + 21 END,
    erros_recorrentes_count = COALESCE(erro.erros_recorrentes_count, 0) + CASE WHEN p_acertou THEN 0 ELSE 1 END,
    motivo_erro = COALESCE(p_motivo, erro.motivo_erro),
    confianca = COALESCE(p_confianca, erro.confianca),
    estado = CASE WHEN novo_nivel >= 4 THEN 'resolvido' ELSE 'ativo' END,
    resolvido_em = CASE WHEN novo_nivel >= 4 THEN now() ELSE NULL END
  WHERE id = erro.id AND user_id::text = auth.uid()::text;
  GET DIAGNOSTICS atualizados = ROW_COUNT;
  IF atualizados <> 1 THEN RAISE EXCEPTION 'Não foi possível atualizar o erro'; END IF;

  INSERT INTO public.caderno_revisoes (user_id, erro_id, resultado, motivo_erro, confianca)
  VALUES (erro.user_id, erro.id, CASE WHEN p_acertou THEN 'acertou' ELSE 'errou' END,
          p_motivo, p_confianca);
END $function$;

REVOKE ALL ON FUNCTION public.registrar_revisao_caderno(text, boolean, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_revisao_caderno(text, boolean, text, text) TO authenticated;

COMMIT;
