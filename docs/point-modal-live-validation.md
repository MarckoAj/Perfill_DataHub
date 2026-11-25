# Homologação real das APIs — 25/11/2026

Autorizada expressamente pelo usuário após a etapa com mocks. Escopo: somente o nome do piloto 06-014 / HUB 12130, cliente AUVO 8561713 e Peripheral GLPI 4412. Valores originais capturados antes das escritas. Operações executadas pelas rotas POST prepare/confirm do Data Hub, com login técnico admin existente; nenhuma senha ou token salvo nos relatórios.

## Resultado

| Validação | AUVO | GLPI |
|---|---|---|
| Leitura do registro original | Aprovada | Aprovada |
| Alteração temporária do nome | Aprovada | Aprovada após correção do payload |
| Leitura posterior confirmou o nome temporário | Aprovada | Aprovada |
| Restauração do nome original | Aprovada | Aprovada |
| Confirmação repetida não reaplicou a operação | Aprovada | Aprovada |

HUB também foi restaurado após cada teste. Conferência final nas três fontes confirmou os nomes originais. Permanecem os horários de atualização e o histórico legítimo dos testes. Foram encontrados 17 eventos de histórico associados às operações e à observação de reconciliação.

## Correção identificada no GLPI

Nesta instalação, PUT /Peripheral/4412 exige input como objeto de item único: {"input":{"id":4412,"name":"valor"}}. O formato em lista devolveu HTTP 200 com corpo vazio e não alterou o nome. O serviço corretamente não apresentou sucesso integral: registrou resultado parcial/incerto e o HUB foi restaurado. O formato foi corrigido no adaptador e nos testes; a nova homologação GLPI concluiu alteração, releitura e restauração. A tentativa anterior permanece no histórico, acompanhada de um evento de verificação do nome original, sem apagar registros.

## Limites e continuidade

A homologação cobriu o campo nome, não coordenadas, localização, tipos ou equivalências. Não foram forçadas falhas ou alterações concorrentes em produção; esses cenários continuam cobertos por testes simulados. Cadastro configurável e equivalências permanecem adiados.

HUB_POINT_EXTERNAL_WRITES voltou a false após os testes. Servidor na porta 3002 responde HTTP 200. Reinício invalida as sessões individuais; é necessário entrar novamente para novas confirmações. O teste não autoriza envio contínuo ou expansão para outros pontos.

Evidências locais: scratch/point-live-validation-baseline.json, scratch/point-live-validation-first-attempt.json, scratch/point-live-validation-result.json e scratch/point-live-validation-summary.json. Contêm nomes e IDs operacionais, sem credenciais. Testes focados após a correção: 15 aprovados em duas suítes (adaptador e serviço).

- Após a homologação, o usuário solicitou reativar o envio real para validação manual. Servidor local reiniciado com HUB_POINT_EXTERNAL_WRITES=true, mantendo escopo exclusivo do piloto 12130/06-014. Sessões individuais anteriores invalidadas pelo reinício; necessário novo login.

## Encerramento validado pelo usuário — 25/11/2026

Implementação da ficha do piloto validada integralmente pelo usuário na aplicação; publicação na main autorizada. Edição, sincronização, propagação e endereço encerrados no escopo aprovado. Propagação segue ativa no servidor local; padrão de novas inicializações continua false e requer configuração explícita. Este estado substitui pendências de validação visual e indicações históricas de envio desativado. Evidências, limites e itens futuros em [Validação final](./point-modal-validation-final.md).
