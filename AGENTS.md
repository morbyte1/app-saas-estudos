# AGENTS.md — Revyza

Leia estas instruções antes de analisar ou modificar o projeto.

## Produto

Revyza é um SaaS de organização e inteligência de estudos.

Foco inicial: estudantes de ENEM e vestibulares brasileiros.

Posicionamento:
"Estude onde quiser. Organize no Revyza."

O Revyza não substitui cursinhos, professores, livros, PDFs ou outras plataformas.
Ele centraliza dados da preparação e os transforma em organização, análise e orientação.

Loop central:

estudar → registrar → interpretar → decidir → agir → gerar novos dados

Funcionalidades devem fortalecer esse ciclo, não existir apenas para aumentar a quantidade de ferramentas.

## Princípios de produto

- Priorizar simplicidade e utilidade.
- Não transformar o Revyza em uma coleção genérica de ferramentas.
- Não adicionar funcionalidades apenas porque concorrentes possuem.
- Evitar gamificação desnecessária.
- Evitar dashboards excessivamente densos.
- Não inventar dados ou problemas para preencher a interface.
- Novos usuários não devem receber alertas negativos sem evidência.
- O sistema recomenda; o usuário decide.

## Inteligência e recomendações

O objetivo é transformar dados em decisões contextualizadas.

Quando aplicável, considerar:
- tempo estudado;
- frequência e recência;
- questões e precisão;
- evolução;
- erros e recorrência;
- matéria e assunto;
- metas;
- planejamento;
- disponibilidade;
- objetivo e data da prova.

Recomendações devem:
- ter evidência nos dados;
- considerar tamanho da amostra;
- ser explicáveis;
- respeitar planejamento e disponibilidade quando possível;
- evitar certeza quando os dados apenas sugerem uma tendência.

"Nenhuma recomendação" é um estado válido.

Não duplicar lógica de métricas entre páginas.

## Responsabilidade das áreas

Dashboard:
síntese, contexto e próximo passo. Não virar painel gigante de gráficos.

Timer:
sensor de dados de estudo.

Histórico:
responde "o que eu fiz?". Não duplicar Estatísticas.

Minhas Matérias:
estrutura de matérias, assuntos e metas. Evitar mudanças desnecessárias.

Caderno de Erros:
estrutura falhas, recorrência e revisões. Fonte importante de sinais.

Calendário:
planejamento e contexto temporal. Dashboard não deve virar segundo calendário.

Objetivo / Meu Plano:
fornecem contexto sobre metas, disponibilidade, prioridades e planejamento.

Estatísticas / Desempenho:
análise detalhada de "como estou indo?".

## Stack

- Next.js 16
- React 19
- TypeScript strict
- Tailwind CSS 4
- Supabase Auth + Database
- Recharts
- Lucide React
- Vercel + Vercel Analytics

Antes de adicionar dependência, verificar se o stack existente resolve o problema.

## Engenharia

Priorizar:
1. correção;
2. integridade dos dados;
3. segurança;
4. simplicidade;
5. manutenibilidade;
6. UX;
7. performance.

Evitar overengineering.

Não modificar partes fora do escopo sem necessidade técnica real.

Não:
- fazer refatorações oportunistas;
- reorganizar pastas por preferência;
- alterar estilos globais durante tarefa localizada;
- remover funcionalidades sem autorização;
- criar abstrações prematuras.

Se encontrar problema relevante fora do escopo, informe em vez de corrigi-lo automaticamente.

## Antes de implementar

Para mudanças relevantes:

1. entender a implementação atual;
2. identificar arquivos e dependências envolvidos;
3. identificar origem dos dados;
4. procurar componentes, tipos e funções existentes reutilizáveis;
5. verificar impacto no Supabase;
6. considerar risco de regressão;
7. então implementar.

Se o prompt pedir apenas análise ou planejamento, NÃO modificar arquivos.

## Dados e métricas

Não inventar dados.

Distinguir corretamente:
- zero;
- null;
- ausência de dados;
- dado ainda não calculável.

Exemplo: 0% de precisão não significa necessariamente "nenhuma questão".

Manter fonte única de verdade para métricas como:
- tempo estudado;
- questões;
- erros;
- precisão;
- evolução;
- streak;
- metas;
- progresso.

Dashboard e Estatísticas não devem calcular a mesma métrica de formas diferentes.

Métricas por período devem tratar corretamente timezone, datas locais e intervalos.

Tendências/evolução devem exigir amostra suficiente.

### Banco de dados e Supabase

O código e o schema do Supabase devem permanecer sincronizados.

Sempre que uma tarefa exigir alteração de banco:
- primeiro identifique as tabelas, colunas e regras já utilizadas;
- não presuma schema, constraints, nullability, RLS ou tipos que não possam ser confirmados;
- informe explicitamente qualquer alteração necessária no Supabase;
- mudanças de schema devem ser representadas por SQL/migration versionável no repositório antes ou junto da implementação;
- não altere ou remova dados/colunas existentes sem autorização explícita;
- preserve compatibilidade com dados existentes;
- após mudança de schema, verifique se queries, mutations e tipos TypeScript afetados continuam consistentes.

Nunca considere uma funcionalidade que depende de mudança no banco concluída enquanto código e schema necessário estiverem divergentes.

## TypeScript / React / Next.js

Preservar TypeScript strict.

Evitar `any` usado apenas para silenciar erros.

Respeitar os padrões existentes do projeto.

Não converter Server Components em Client Components sem necessidade.

Usar `"use client"` apenas quando necessário.

Evitar `useEffect` como solução genérica quando houver alternativa mais apropriada.

## UI/UX

Preservar identidade visual e componentes existentes.

Antes de criar componente novo, procurar equivalente reutilizável.

Considerar:
- desktop;
- tablet;
- mobile;
- loading;
- erro;
- estado vazio;
- dados parciais.

Linguagem do produto deve ser clara, humana e não alarmista.

Evitar motivação genérica e afirmações mais fortes do que os dados permitem.

## Performance e custo

Evitar:
- queries desnecessárias;
- N+1;
- chamadas repetidas ao Supabase;
- datasets enormes para cálculos simples;
- polling sem necessidade.

Não fazer otimização prematura.

O produto deve permanecer barato de operar durante validação.

## Git e segurança operacional

Não executar comandos destrutivos sem autorização, incluindo:

- git reset --hard
- git clean -fd
- git push --force

Não apagar alterações do usuário.

Não criar commits automaticamente, salvo quando solicitado.

Nunca expor conteúdo de `.env` ou secrets.

## Validação

Após mudanças relevantes, verificar os scripts disponíveis em package.json.

Quando apropriado, executar:
- lint;
- typecheck;
- testes existentes;
- build.

Não afirmar que algo foi testado se não foi.

Distinguir claramente validação automática de teste manual necessário.

## Ao concluir uma tarefa

Resumir de forma curta:

1. o que foi alterado;
2. arquivos principais modificados;
3. decisões técnicas relevantes;
4. validações executadas;
5. riscos ou testes manuais restantes.

## Regra final

Antes de escrever código, entender o problema.
Antes de criar algo novo, verificar o que já existe.
Antes de alterar dados, entender sua origem.
Antes de adicionar complexidade, justificar o benefício.
Antes de concluir, validar.

O objetivo não é produzir mais código.
É melhorar o Revyza com segurança e chegar a usuários reais.