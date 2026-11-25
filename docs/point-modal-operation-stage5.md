# Ficha do ponto — Etapa 5: gravação, identidade e histórico

Escopo exclusivo: HUB 12130 / 06-014, AUVO 8561713, GLPI 4412. Todas as contas autenticadas podem operar, conforme decisão do usuário; não foram criados perfis ou restrições por usuário. Cadastro configurável de campos e equivalências de tipos continuam adiados.

## Identificação e autorização

Login e troca inicial de senha retornam uma sessão individual aleatória para operações, além do token compartilhado já usado nas consultas. Sessão dura oito horas, fica em memória do servidor e é invalidada ao reiniciar. O browser a remove ao sair. Rotas novas exigem os dois tokens e verificam a existência da conta e a ausência de troca de senha pendente no banco. Nome informado pelo frontend não é utilizado como identidade. Sessões antigas precisam entrar novamente; visualização existente continua funcionando. Removido o log que imprimia o token compartilhado.

## Fluxo

1. Abrir confirmação prepara a operação no servidor, sem escrever nos sistemas externos ou no HUB. O servidor valida escopo, campos, valores, direção, vínculo e identidade; relê as fontes necessárias e compara com o que o operador revisou. Cache local das fontes é atualizado por essas leituras.
2. Revisão persistida em hub_point_operations, com ID aleatório, operador, valores e vencimento de dez minutos. Esse registro controla a execução e a repetição; a auditoria continua em hub_entity_history.
3. Confirmar envia somente o ID da revisão e confirmed=true. Não aceita alterações ao plano no momento da confirmação. Origem/destino e vínculos são conferidos novamente.
4. Um lock MySQL serializa operações do piloto. Alterações HUB e histórico são gravados na mesma transação com bloqueio da entidade; conflito faz rollback. Registro canônico existente é atualizado sem criar uma segunda linha canônica. Nome também atualiza o cadastro da entidade. Coordenadas seguem precisão de oito casas do banco.
5. Destinos externos são processados separadamente, com intenção registrada antes do envio, nova conferência do destino e leitura posterior. Histórico registra operador, horário, operação, campo, origem/destino, valores anteriores/novos e resultado. Falhas parciais ou incertas são apresentadas por destino, sem sucesso integral indevido.
6. Estado persistido impede reaplicar o mesmo ID. Resultado perdido pode ser consultado; operação RUNNING não é reiniciada automaticamente. Revisão pendente recuperada usa o plano do servidor, nunca um rascunho diferente. Valor antigo no histórico permite futura restauração como nova operação, sem apagar o original.
7. Ficha é atualizada sem recarregar a página e retorna à visualização; a mesma caixa mostra os resultados. Cancelamento antes da execução preserva o rascunho. Durante execução, ações ficam bloqueadas para evitar duplo envio.

## APIs e homologação

AUVO: PATCH /customers/{id}, com JSON Patch test/replace apenas nos campos selecionados. Nome de leitura description corresponde ao campo de patch name; latitude/longitude são numéricas. Contrato conferido na especificação pública oficial: https://developer.auvo.com.br/_bundle/openapi/api-reference.yaml .

GLPI: PUT Peripheral/{id}, apenas name nesta etapa; exige confirmação do ID e releitura. Utiliza cliente existente para leitura e renovação de sessão. Contrato: https://raw.githubusercontent.com/glpi-project/glpi/main/apirest.md . Coordenadas GLPI e tipos de catálogo não são gravados.

HUB_POINT_EXTERNAL_WRITES=false por padrão. Isso atende à instrução de homologar com mocks/ambiente de testes sem alterar registros reais das plataformas. Edição somente HUB e importação de fonte para HUB podem ser confirmadas após login; propagação externa só fica executável quando essa configuração for explicitamente ativada no ambiente escolhido. Não habilitada durante esta implementação.

Rotas autenticadas abaixo de /api/hub/entities/:entityId/operations: GET access, POST prepare, POST confirm, GET status/:operationId.

## Limites operacionais

Não existe transação distribuída entre as plataformas. GLPI não oferece atualização condicional neste contrato; a releitura imediatamente anterior reduz conflitos, mas não elimina a corrida entre GET e PUT com outro editor externo. AUVO usa testes no JSON Patch. Timeout ou confirmação divergente produz resultado incerto, não sucesso. Nunca repetir automaticamente uma escrita externa com resultado desconhecido. Uma operação interrompida requer consulta e conferência do destino; histórico de intenção e plano persistido permitem reconciliação. A sessão individual não substitui RBAC futuro, mas identifica o operador e impede usar apenas o token compartilhado para as novas gravações.

## Validação

Testes de escrita executados com APIs simuladas e tabelas MySQL temporárias, sem alteração dos registros reais do piloto. Cenários cobertos: autenticação, expiração, confirmação explícita, campos inválidos/imutáveis, origem forjada, correlação alterada, conflito, múltiplos destinos, falha parcial, leitura de confirmação divergente, repetição do mesmo ID, interrupção, recuperação do plano e ausência de envio antes de confirmar. Teste MySQL isolado confirmou transação HUB/histórico, rollback, claim único e preservação da linha canônica. Homologação visual autenticada desta etapa aguarda operador.

Validação final: regressão completa com 191 testes aprovados em 33 suítes; após a verificação adicional do vínculo Location, os quatro testes focados do adaptador passaram. MySQL real utilizado somente com tabelas temporárias nos testes de gravação. Servidor local reiniciado com HUB_POINT_EXTERNAL_WRITES=false, tabela de operações criada, piloto com 30 campos canônicos sem duplicação e vínculos esperados, health e Clientes HTTP 200. Requisição com apenas token compartilhado retornou 401 nas rotas novas, como esperado. Nenhum registro real AUVO/GLPI ou HUB foi alterado pelos testes de escrita.

Correção de disponibilidade do menu: usa o mesmo ID HUB do cabeçalho, priorizando hubId sobre identificadores legados. Sem token de consulta, o botão aparece desabilitado com orientação de autenticação. Versões dos scripts do modal e mapeador atualizadas nas quatro páginas que compartilham a ficha, para evitar uso de versões antigas. Validação de escrita no backend permanece inalterada e restrita ao piloto.

Homologação real autorizada e executada em 25/11/2026: nome do piloto alterado e restaurado em AUVO/GLPI pelas rotas de operação, com releitura e proteção contra repetição confirmadas. Corrigido PUT GLPI para input objeto de item único. Envio externo voltou a false. Relatório em point-modal-live-validation.md.

## Encerramento validado pelo usuário — 25/11/2026

Implementação da ficha do piloto validada integralmente pelo usuário na aplicação; publicação na main autorizada. Edição, sincronização, propagação e endereço encerrados no escopo aprovado. Propagação segue ativa no servidor local; padrão de novas inicializações continua false e requer configuração explícita. Este estado substitui pendências de validação visual e indicações históricas de envio desativado. Evidências, limites e itens futuros em [Validação final](./point-modal-validation-final.md).
