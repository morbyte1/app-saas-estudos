BEGIN;

-- Apply 20260919_refactor_caderno_erros.sql first. Keep legacy rows valid.
ALTER TABLE public.caderno_erros
  ADD COLUMN origem_questao text,
  ADD COLUMN deleted_at timestamptz;

COMMENT ON COLUMN public.caderno_erros.origem_questao IS 'Origem ou banca da questão, texto livre para análise futura.';
COMMENT ON COLUMN public.caderno_erros.motivo_erro_original IS 'Motivo informado no cadastro original; não muda nas revisões.';
COMMENT ON COLUMN public.caderno_erros.motivo_erro IS 'Diagnóstico atual; pode mudar após uma revisão.';
COMMENT ON COLUMN public.caderno_revisoes.motivo_erro IS 'Diagnóstico informado nesta tentativa de revisão.';

-- Earlier migration fills this only for renamed legacy motives; fill the remaining originals.
UPDATE public.caderno_erros
SET motivo_erro_original = motivo_erro
WHERE motivo_erro_original IS NULL AND motivo_erro IS NOT NULL;

CREATE INDEX caderno_erros_usuario_ativos_idx
  ON public.caderno_erros (user_id, created_at DESC) WHERE deleted_at IS NULL;

-- The original diagnosis is immutable after registration, including through direct API updates.
CREATE FUNCTION public.preservar_motivo_original_caderno()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.motivo_erro_original IS NOT NULL THEN
      NEW.motivo_erro_original := OLD.motivo_erro_original;
    ELSIF NEW.motivo_erro_original IS NULL THEN
      NEW.motivo_erro_original := OLD.motivo_erro;
    END IF;
  ELSIF NEW.motivo_erro_original IS NULL THEN
    NEW.motivo_erro_original := NEW.motivo_erro;
  END IF;
  RETURN NEW;
END $function$;

CREATE TRIGGER preservar_motivo_original_caderno
BEFORE INSERT OR UPDATE ON public.caderno_erros
FOR EACH ROW EXECUTE FUNCTION public.preservar_motivo_original_caderno();

-- Replaces the previous RPC without changing its signature or review history.
CREATE OR REPLACE FUNCTION public.registrar_revisao_caderno(
  p_erro_id text, p_acertou boolean, p_motivo text DEFAULT NULL, p_confianca text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $function$
DECLARE
  erro public.caderno_erros%ROWTYPE;
  novo_nivel integer;
  atualizados integer;
  hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  SELECT * INTO erro FROM public.caderno_erros
  WHERE id::text = p_erro_id AND user_id::text = auth.uid()::text
    AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND OR erro.estado = 'resolvido' THEN
    RAISE EXCEPTION 'Erro não encontrado ou já resolvido';
  END IF;
  IF erro.proxima_revisao IS NOT NULL AND erro.proxima_revisao > hoje THEN
    RAISE EXCEPTION 'Esta revisão ainda não está disponível';
  END IF;
  IF erro.assunto_id IS NULL OR nullif(btrim(erro.enunciado), '') IS NULL
     OR nullif(btrim(erro.resposta_correta), '') IS NULL THEN
    RAISE EXCEPTION 'Complete assunto, questão e resolução antes de revisar';
  END IF;
  IF p_acertou IS NULL THEN RAISE EXCEPTION 'Resultado da revisão obrigatório'; END IF;
  IF p_motivo IS NOT NULL AND p_motivo NOT IN (
    'Não sabia o conteúdo', 'Confundi conceitos', 'Interpretação',
    'Erro de cálculo/procedimento', 'Desatenção', 'Falta de tempo', 'Outro'
  ) THEN RAISE EXCEPTION 'Motivo de erro inválido'; END IF;
  IF p_confianca IS NOT NULL AND p_confianca NOT IN ('Baixa', 'Média', 'Alta') THEN
    RAISE EXCEPTION 'Confiança inválida';
  END IF;

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
  WHERE id = erro.id AND user_id::text = auth.uid()::text AND deleted_at IS NULL;
  GET DIAGNOSTICS atualizados = ROW_COUNT;
  IF atualizados <> 1 THEN RAISE EXCEPTION 'Não foi possível atualizar o erro'; END IF;

  INSERT INTO public.caderno_revisoes (user_id, erro_id, resultado, motivo_erro, confianca)
  VALUES (erro.user_id, erro.id, CASE WHEN p_acertou THEN 'acertou' ELSE 'errou' END,
          p_motivo, p_confianca);
END $function$;

COMMIT;
