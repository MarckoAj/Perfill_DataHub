# Listagem operacional — Etapa 1

Implementada em 19/11/2026, conforme diagnostico e observacoes aprovadas.

## Colunas

ID do ponto (HUB), Nome, Cidade, Unidade CICOM, IP, Tecnico de campo, Tecnico NOC e Tags. Fonte, latitude e longitude removidas do seletor conforme revisao do escopo. Filtro de coordenadas preservado.

ID e Nome sempre visiveis. Colunas opcionais podem ser ocultadas ou movidas pelas setas. Preferencias versionadas em localStorage (hub.operationalColumns.v1), com restauracao independente dos filtros. ID HUB exibe IDs AUVO e GLPI em hover/foco. Linha e nome preservam abertura por entityId.

## Cidade por fonte

Leitura exclusiva de hub_entity_field_values com fieldKey=city. O valor HUB exige sourceSystem=HUB e isCanonical=1. GLPI, ZABBIX e SPREADSHEET permanecem separados, inclusive sourceRecordId, sem copiar automaticamente para HUB. AUVO nao oferece o campo. Comparacao por hover/foco; ausencia exibida como travessao. Nenhuma escrita, migracao, inferencia geográfica ou integracao nova nesta etapa. Importacao/sincronizacao e edicao desses valores permanecem futuras; atualmente nao existem cidades preenchidas nessa estrutura.

CICOM e lido somente de glpi_devices.cicom por vinculo ativo GLPI/device. Atualmente vazio nos dispositivos consultados. IP e tecnicos permanecem sem valores ate integracoes aprovadas. Nao reutilizar hardwareTechnician nem userName como responsaveis.

## API e desempenho

Extensao aditiva em GET /api/hub/entities: platformIds, city, cityBySource e cicom. Campos antigos mantidos para compatibilidade. Enriquecimento em duas consultas em lote apenas para entidades da pagina; sem N+1 e sem chamar detalhes que podem hidratar valores canonicos. Consulta/filtragem em memoria e duplicacao para total preexistentes permanecem como oportunidade de otimizacao futura.

## Validacao e limites

Testes cobrem selecao, ordem, restauracao, persistencia, identidade obrigatoria, filtros, paginacao e separacao das fontes. Piloto real HUB 12130 retornou AUVO 8561713 e GLPI 4412, cidade/CICOM ausentes. Conferencia visual, responsividade real, abertura manual do modal e console da tela autenticada pendentes: navegador de teste redirecionou ao login. Nao foi alterada a autenticacao para contornar isso.

## Proxima etapa

Validar visualmente com operador autenticado; depois definir fonte estruturada da cidade GLPI e politica de sincronizacao por campo. Planilhas e Zabbix exigem aprovacao separada. Nenhuma dessas integracoes foi iniciada.


## Validação visual — 25/11/2026

Operador confirmou a validação visual da página de Clientes e do piloto 06-014 / HUB-012130. Suíte completa executada antes da publicação: 147 testes aprovados em 26 suítes. A importação continua restrita ao piloto; expansão para outros pontos e novas integrações permanecem para uma próxima etapa.
