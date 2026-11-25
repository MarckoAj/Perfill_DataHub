# Coleta GLPI do piloto — 25/11/2026

A sincronização manual de dispositivos mantém a busca paginada e, ao final, atualiza detalhes somente do Peripheral 4412 (HUB 12130). Não introduz consultas por dispositivo para toda a frota.

- Peripheral.locations_id aponta para Location 12341; latitude, longitude e município (town) são lidos dessa localização.
- Peripheral.groups_id_tech resolve Group.completename para CICOM do dispositivo. Location.state é armazenado separadamente como locationCicom, sem equivalência ou preenchimento cruzado.
- Tipo, status, fabricante, modelo, técnico e usuário são resolvidos nos catálogos relacionados. CAMERA FIXA é mantido como valor GLPI; equivalência com TIPO II segue adiada.
- Raw JSON mantém peripheral, location, referências de catálogos e search separados. Município e CICOM da localização são expostos no detalhe da fonte; não alteram o cadastro canônico do HUB.
- Upsert atualiza somente propriedades fornecidas. Ausência preserva; null explícito limpa; zero é válido. JSON de busca é mesclado para preservar os detalhes coletados.
- Falha ao buscar um registro relacionado impede persistir o snapshot detalhado incompleto e sinaliza falha na coleta. A busca básica previamente processada pode permanecer no cache.
- A leitura das coordenadas não libera sua escrita: alteração de Location compartilhada continua bloqueada nesta etapa.

Validação real por GET: Location 12341, OLINDINA, latitude -11.3572093, longitude -38.328445, tipo CAMERA FIXA, fabricante HUAWEI e status INSTALADO. Ambos CICOM vazios na origem. Cache local atualizado; sem PUT/POST nas plataformas.

## Ajuste da ficha

Tipo e CICOM foram retirados da guia GLPI e da comparação/contagem GLPI até definição da relação de campos. A coleta original permanece preservada no cache. Endereço passou a ser exibido em Informações Gerais das fontes e do HUB; o endereço AUVO já era preenchido no HUB somente quando vazio. GLPI usa Location.address separado de locationName. No piloto, endereço AUVO/HUB é Rua Otávio Mangabeira, Olindina - BA, 48470-000, Brasil; Location.address está vazio, portanto não foi preenchido artificialmente nem recebeu escrita externa.

## Sincronização de endereço autorizada

Endereço habilitado na edição HUB, leitura das fontes e sincronização. GLPI escreve Location.address somente para Peripheral 4412 / Location 12341; confere endereço anterior e vínculo exclusivo a esse Peripheral antes do PUT. Campos de coordenadas continuam bloqueados para escrita. A relação da localização é conferida novamente antes da execução. Cache local preserva o endereço ao consultar apenas o nome. AUVO usa PATCH /address com test do valor anterior e leitura posterior, no mesmo fluxo existente; sua escrita de endereço não foi homologada ao vivo nesta etapa.

Teste real HUB → GLPI: operação bc6a01cf-5e93-4f0d-b299-096ef9f2d09a COMPLETED; endereço Rua Otávio Mangabeira, Olindina - BA, 48470-000, Brasil confirmado na Location 12341. Mantido no destino por solicitação do usuário, sem restaurar para vazio. Histórico existente registra operador, valores e resultado. Servidor permanece com HUB_POINT_EXTERNAL_WRITES=true para validação do piloto.

## Encerramento validado pelo usuário — 25/11/2026

Implementação da ficha do piloto validada integralmente pelo usuário na aplicação; publicação na main autorizada. Edição, sincronização, propagação e endereço encerrados no escopo aprovado. Propagação segue ativa no servidor local; padrão de novas inicializações continua false e requer configuração explícita. Este estado substitui pendências de validação visual e indicações históricas de envio desativado. Evidências, limites e itens futuros em [Validação final](./point-modal-validation-final.md).
