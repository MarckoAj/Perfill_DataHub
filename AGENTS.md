# AGENTS.md

Este arquivo define as preferências de trabalho para agentes que atuarem neste repositório.

## Fluxo Obrigatório

Antes de iniciar qualquer implementação, refatoração, correção ou edição de arquivos:

1. Ler os arquivos `.md` relevantes para obter contexto do projeto e da tarefa.
2. Fazer uma análise inicial da tarefa e estimar sua complexidade.
3. Definir o nível de inteligência/esforço recomendado para a execução.
4. Montar um plano de execução curto e objetivo.
5. Apresentar o plano ao usuário, incluindo o nível recomendado para a tarefa.
6. Esperar aprovação explícita do usuário antes de começar qualquer alteração.

## Preferências de Colaboração

- Sempre assumir postura de análise primeiro e execução depois da aprovação.
- Sempre descrever no plano o nível de inteligência/esforço escolhido para a tarefa, para que o usuário possa ajustar manualmente antes da execução.
- Quando a tarefa tocar código existente, respeitar os padrões e a arquitetura já descritos na documentação.
- Não reverter mudanças existentes sem pedido explícito do usuário.
- Informar premissas relevantes antes de executar mudanças quando houver ambiguidades.
- Após concluir o trabalho, resumir o que foi alterado e como foi validado.

## Escala de Inteligência/Esforço

Usar a seguinte escala como referência no plano:

- `baixo`: consultas simples, leitura de contexto, respostas diretas e ajustes pequenos.
- `médio`: alterações localizadas, debugging moderado, testes pontuais e refactors pequenos.
- `alto`: bugs difíceis, integrações, mudanças com risco maior e refatorações relevantes.
- `muito alto`: investigação profunda, mudanças estruturais, arquitetura e problemas ambíguos ou amplos.

Sempre que possível, justificar em uma frase por que esse nível foi escolhido.

Perguntas operacionais, dúvidas rápidas de alinhamento e solicitações sem implementação devem, por padrão, começar em `baixo`.

## Fontes de Contexto Prioritárias

Ao começar uma tarefa, priorizar a leitura destes arquivos quando forem relevantes:

- `README.md`
- `LOCAL_CONTEXT.md`
- `docs/architecture/architecture.md`
- `docs/implementation-status.md`
- `docs/integrations.md`
- `docs/data-pipeline.md`
- `docs/roadmap.md`

## Observação

Se a solicitação do usuário entrar em conflito com este arquivo, a instrução mais recente do usuário tem prioridade.
