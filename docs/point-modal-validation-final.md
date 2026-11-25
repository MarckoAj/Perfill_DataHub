# Encerramento da ficha do ponto piloto — 25/11/2026

Status: **implementação validada pelo usuário na aplicação e aprovada para publicação na main**. Esta é a referência atual; os documentos das etapas anteriores preservam o histórico da evolução.

## Escopo entregue

- Piloto HUB 12130 / 06-014, AUVO 8561713, GLPI Peripheral 4412 / Location 12341.
- Edição HUB, seleção de propagação, sincronização nos dois sentidos permitidos, revisão centralizada, salvar/cancelar e contador superior.
- Direção inicial HUB → plataforma selecionada; seleção Todos divergentes. Exclamações e contadores nas fontes; HUB sem indicação de divergência.
- Sessão de operador, plano revisado no servidor, confirmação explícita, auditoria, proteção contra repetição e detecção de mudanças entre revisão e execução.
- Coleta GLPI do dispositivo, localização e catálogos; cache preserva campos ausentes em consultas parciais.
- Tipo e CICOM retirados da guia e comparação GLPI até definição da relação de campos, sem apagar a origem coletada.
- Endereço AUVO disponível no HUB; GLPI usa Location.address. Campo editável e propagável, com texto completo em hover. Escrita de endereço GLPI limitada à localização do piloto e bloqueada se outro Peripheral estiver associado.
- Propagação externa permanece ativa no servidor local por solicitação do usuário (HUB_POINT_EXTERNAL_WRITES=true). O padrão do código e do .env.example permanece false; futuras inicializações precisam configurar true explicitamente. Sessões de operação expiram ao reiniciar.

## Evidências e validação

Usuário declarou a validação final de toda a implementação na aplicação e autorizou atualização dos MDs, commit e push na main. Essa validação encerra as pendências de homologação manual desta etapa.

Testes automatizados: 202 testes em 34 suítes aprovados. APIs originais confirmaram nome alterado/restaurado no AUVO e GLPI e endereço HUB → GLPI gravado e relido. Operação de endereço bc6a01cf-5e93-4f0d-b299-096ef9f2d09a concluída; endereço mantido conforme solicitado. Conferência posterior confirmou endereço igual no HUB, AUVO e GLPI, sem operações RUNNING.

A evidência automatizada de escrita de endereço nesta etapa cobre HUB → GLPI; AUVO e sentido GLPI → HUB ficam registrados como abrangidos pela validação declarada pelo usuário, sem alegação de teste automatizado ao vivo desses caminhos. Escritas AUVO usam JSON Patch com test e confirmação por leitura. Não houve novo envio externo durante o encerramento.

## Fora desta entrega

Cadastro configurável de campos, equivalências (como TIPO II ↔ CAMERA FIXA), relação definitiva de CICOM, escrita de coordenadas GLPI, permissões por perfil, expansão além do piloto e integrações Zabbix/planilha automática permanecem para etapas futuras. Não há transação distribuída nem repetição automática de escrita com resultado incerto.
