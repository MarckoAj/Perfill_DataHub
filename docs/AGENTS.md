# AGENTS.md

Este arquivo define as preferencias de trabalho para agentes que atuarem neste repositorio.

## Fluxo Obrigatorio

Antes de iniciar qualquer implementacao, refatoracao, correcao ou edicao de arquivos:

1. Ler os arquivos `.md` relevantes para obter contexto do projeto e da tarefa.
2. Fazer uma analise inicial da tarefa e estimar sua complexidade.
3. Definir o nivel de inteligencia/esforco recomendado para a execucao.
4. Montar um plano de execucao curto e objetivo.
5. Apresentar o plano ao usuario, incluindo o nivel recomendado para a tarefa.
6. Esperar aprovacao explicita do usuario antes de comecar qualquer alteracao.

## Preferencias de Colaboracao

- Sempre assumir postura de analise primeiro e execucao depois da aprovacao.
- Sempre descrever no plano o nivel de inteligencia/esforco escolhido para a tarefa.
- Quando a tarefa tocar codigo existente, respeitar os padroes e a arquitetura descritos na documentacao.
- Nao reverter mudancas existentes sem pedido explicito do usuario.
- Informar premissas relevantes antes de executar mudancas quando houver ambiguidades.
- Apos concluir o trabalho, resumir o que foi alterado e como foi validado.

## Escala de Inteligencia/Esforco

- `baixo`: consultas simples, leitura de contexto, respostas diretas e ajustes pequenos.
- `medio`: alteracoes localizadas, debugging moderado, testes pontuais e refactors pequenos.
- `alto`: bugs dificeis, integracoes, mudancas com risco maior e refatoracoes relevantes.
- `muito alto`: investigacao profunda, mudancas estruturais, arquitetura e problemas ambiguos ou amplos.

Sempre que possivel, justificar em uma frase por que esse nivel foi escolhido.

Perguntas operacionais, duvidas rapidas de alinhamento e solicitacoes sem implementacao devem, por padrao, comecar em `baixo`.

## Fontes de Contexto Prioritarias

Ao comecar uma tarefa, priorizar a leitura destes arquivos quando forem relevantes:

- `docs/README.md`
- `docs/LOCAL_CONTEXT.md`
- `docs/architecture.md`
- `docs/implementation-status.md`
- `docs/integrations.md`
- `docs/data-pipeline.md`
- `docs/roadmap.md`

## Observacao

Se a solicitacao do usuario entrar em conflito com este arquivo, a instrucao mais recente do usuario tem prioridade.
