# Importação local de planilhas — piloto 06-014

Implementado em 19/11/2026. Escopo aprovado: HUB 12130, AUVO 8561713, GLPI 4412. Somente campos HUB vazios; prioridade para gerenciamento. Fontes Excel permanecem intactas. IPs ficam para integração posterior do Zabbix.

## Uso

```powershell
node scripts/import-spreadsheet-pilot.js --base "caminho/base.xlsx" --management "caminho/gerenciamento.xlsx"
```

Sem `--apply`, executa apenas prévia com rollback. Acrescentar `--apply` para gravar o piloto. Não aceita outro ponto nesta etapa. As abas são `BASE_PERFILL_INST` e `EQUIPES POR REGIÃO`; usa cabeçalhos por nome, valida IDs AUVO/GLPI e o nome 06-014. Mais de uma correspondência bloqueia a execução; nenhuma vinculação por número da linha.

## Dados e rastreabilidade

- Planilha base: Cidade (`MUNICIPIO`), CICOM, Unidade.
- Gerenciamento: Cidade, CICOM, Unidade, Técnico de campo (`TEC.RESPONSAVEL`) e Técnico NOC (`RESP.NOC`).
- Gerenciamento preenche primeiro; base complementa somente quando falta o valor em gerenciamento. Valores já preenchidos no HUB são preservados. Tokens como N/A e travessão contam como indisponíveis.
- `hub_entity_links`: fontes `SPREADSHEET/base` e `SPREADSHEET/management`, identificadas por tipo e ID AUVO. Metadata contém arquivo, aba, linha de evidência, hash SHA256 do snapshot e data da leitura.
- `hub_entity_field_values`: valores de cada planilha separados pelo `sourceRecordId`, sem sobrescrever GLPI/AUVO. Campos canônicos HUB preenchidos separadamente.
- `hub_entity_history`: mudanças da fonte e preenchimentos HUB com proveniência. Links, valores e histórico gravados em uma única transação com lock no ponto; erro faz rollback. Registro de planilha já pertencente a outro ponto bloqueia gravação.
- Usa tabelas existentes; sem novas migrations, propagação externa ou conexão automática OneDrive. Para automatização futura, substituir a obtenção do snapshot por Microsoft Graph após validar o piloto e definir credenciais/acesso.

## Resultado aplicado

Cinco campos HUB antes vazios: OLINDINA; CICOM-EUCLIDES DA CUNHA; 06ª CIPM OLINDINA; Ariesnaldo Dos Santos Menezes; Rilston Rainê. Unidade da base é diferente da descrição de gerenciamento; prevaleceu gerenciamento por decisão do usuário. Ambas preservadas na fonte.

Gerados oito eventos de valores de origem e cinco de preenchimento canônico. Prévia após aplicação marcou os cinco campos como `preserved`. Nenhum outro ponto foi importado.

Listagem e detalhe HUB agora leem os campos canônicos; responsáveis aparecem nas colunas existentes, cidade continua comparável por fonte. API mantém contrato anterior e acrescenta campos de responsáveis/unidade. Removida a inferência de município por endereço no mapeamento do detalhe.

## Validação

143 testes em 26 suítes aprovados, incluindo duplicidade, conflito de IDs, prioridade, preservação de canônicos, rollback da prévia e gravação transacional restrita ao piloto. Banco e API real confirmaram os cinco valores. Validação visual autenticada permanece pendente; não foi declarada como concluída.

Próximas etapas: revisão do piloto pelo operador; tratar duplicidades das cópias completas; definir arquivos OneDrive e autenticação; depois expandir leitura mediante aprovação. Divergências e propagação bidirecional são etapas posteriores.

## Ampliação aprovada: Geral, Rede e Estado do ponto

Todas as 43 colunas da base possuem mapeamento explícito em `src/config/spreadsheetBaseFields.js`. Datas de células Excel são convertidas para calendário ISO; IDs originais permanecem distintos do entityId. Os valores originais da linha ficam também em metadata.rawFields. N/A é indisponível; `NÃO SE APLICA` permanece explícito para campos de estado em que tem significado.

Aplicados mais 19 campos vazios no piloto; oito já preenchidos preservados e 18 indisponíveis. Repetição da prévia propôs zero novos preenchimentos. Nome, coordenadas e prioridade de gerenciamento preservados. Valores inválidos de IP, máscara e coordenadas são marcados `review` para o HUB, com original mantido na fonte. Não houve importação de outros pontos.

A aba Planilha base mostra os dados originais nas três seções; HUB mostra seus próprios valores canônicos. Eventos de instalação não geram artificialmente um status físico atual nem histórico de eventos datado pela importação.

Conferência de rede nas demais linhas (somente leitura): 40 IPs válidos; 40 gateways válidos; 28 IPs de equipamento de link válidos. Máscaras: 40 preenchidas, quatro em formato IPv4 e 36 sem separadores (exemplo `255255255248`), exigindo revisão sem correção automática. Circuito preenchido em 5.031 linhas. Exemplos com rede: 4B-001 e 4B-002. O piloto 06-014 tem circuito ONN5011194 e disponibilidade 2022-08-26, mas IP/máscara/gateway/IP de link vazios.

Validação: suíte completa com 144 testes passou antes dos últimos três testes adicionais; testes finais focados de importação, modal e repository passaram (28 testes em três suítes). Sintaxe e diff verificados. Conferência visual autenticada permanece pendente.


## Validação visual — 25/11/2026

Operador confirmou a validação visual da página de Clientes e do piloto 06-014 / HUB-012130. Suíte completa executada antes da publicação: 147 testes aprovados em 26 suítes. A importação continua restrita ao piloto; expansão para outros pontos e novas integrações permanecem para uma próxima etapa.
