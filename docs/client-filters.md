# Filtros da listagem de clientes

Implementado em 19/11/2026 na tela `/clientes`.

- Busca por nome, codigo ou ID, incluindo `HUB-012130`.
- `Tags` abre seletor com busca sem distinguir acentos; nenhuma selecao permite todas as tags. Multiplas selecoes usam OU.
- `Sem tags` permite selecionar pontos sem nenhuma tag. Pode ser combinada com outras tags.
- Selecoes e coordenadas aparecem como chips removiveis.
- `Mais filtros > Ocultar pontos com...` separa exclusao de inclusao. Exclusao prevalece; conflitos ficam explicitos. Resumo `Ocultando` continua visivel com painel fechado.
- Ocultacoes iniciais usam `hideByDefault` do cadastro global.
- `Limpar filtros` remove todas as restricoes de tags/coordenadas; `Restaurar padrao` reaplica ocultacoes globais. Ambos preservam busca textual.
- Coordenadas completas possuem latitude e longitude; incompletas possuem apenas uma; ausentes nao possuem nenhuma. Zero conta como coordenada presente. Nao e uma validacao de limites geograficos.
- Mudancas retornam a primeira pagina; navegacao preserva os filtros. Contagem e resultados usam os mesmos criterios no servidor.
- Falha da API exibe erro com tentativa novamente, sem apresentar dados mockados como resultados. Falha no cadastro de tags preserva ocultacoes padrao do servidor.

## API

`GET /api/hub/entities` mantem `search`, `limit`, `offset`, `includeTags` e `excludeTags` (listas separadas por virgula).

Novos parametros: `includeUntagged=true|false` e `coordinates=all|complete|incomplete|missing`. Coordenadas desconhecidas retornam HTTP 400. Omitir `excludeTags` usa padrao global; enviar vazio remove ocultacoes.

## Proximas etapas

- Validar visualmente a interface no navegador e em tela estreita; ferramenta de controle interrompeu a verificacao por nao conseguir confirmar a URL do Chrome.
- Avaliar presets pessoais/salvamento de filtros somente apos validar este fluxo.
- Otimizar filtragem no banco se o volume demandar; atualmente a filtragem compartilha a logica existente em memoria antes de paginar.

## Validacao

- Suite existente e novos testes de API/repositorio: 131 testes aprovados em 24 suites; testes adicionais da interface: 3 aprovados. Total: 134 testes em 25 suites.
- Consulta de leitura ao banco em 19/11/2026, sem ocultacoes: 9.604 pontos, 8.875 com coordenadas completas, nenhum com apenas uma coordenada e 729 sem coordenadas.
- Busca `HUB-012130` retornou exatamente a entidade 12130.
- Servidor local reiniciado na porta 3002 apos autorizacao para interromper a sincronizacao de teste. Health e pagina retornaram HTTP 200; API confirmou 729 pontos sem coordenadas, 5.656 sem tags com coordenadas completas, busca HUB unica e HTTP 400 para filtro invalido.
