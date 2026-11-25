# Ficha do ponto — Etapa 2: direção e seleção

Piloto: HUB 12130 / 06-014. Etapa 1 validada pelo operador. Etapa 2 continua como prévia local, sem gravações.

## Comportamento

Durante sincronização, a barra apresenta Origem, Destino e botão de inversão, conforme protótipo V4. Plataforma externa corresponde à aba atual. Direção inicial mantém plataforma → HUB; inverter permite HUB → plataforma. Botão X e Cancelar descartam a seleção. Fora do modo de sincronização, os controles não aparecem.

Inverter recalcula elegibilidade e mantém somente seleções que continuam válidas. Todos divergentes seleciona somente campos divergentes elegíveis na direção atual. Campo mostra o HUB e o novo valor proposto no destino. Campos bloqueados mostram motivo. IDs, valores nulos/vazios/N/A e coordenadas fora do intervalo não são selecionáveis. Zero é válido. Plataforma sem ID correlacionado bloqueia seleção.

## Mapeamentos de prévia

- AUVO → HUB: nome (description), latitude, longitude.
- HUB → AUVO: nome (description), latitude, longitude.
- GLPI → HUB: nome, latitude, longitude, nome de localização e projeto, lidos do cache existente.
- HUB → GLPI: nome do dispositivo. Coordenadas ficam bloqueadas: derivam da localização GLPI, cuja escrita e possível compartilhamento exigem validação própria. Tipo da planilha e tipo GLPI não são considerados automaticamente equivalentes; nomes de classificação não são tratados como IDs de catálogo.

Essas regras limitam a prévia; não comprovam permissão de escrita real. A autenticação compartilhada ainda não fornece autorização individual. Salvar e sincronizar permanecem desabilitados até os serviços, permissões e confirmação das próximas etapas. Lista opcional de campos disponíveis no destino pode restringir ainda mais a prévia, nunca ampliá-la. Nenhum novo endpoint ou chamada de escrita foi adicionado.

## Testes

Cobertura de inversão, conservação/remoção de seleção, valor proposto por destino, zero válido, origem ausente, coordenada inválida, ID de plataforma ausente, restrições por destino e isolamento dos dados de origem. Validação visual desta etapa aguarda operador.

Validação final: 23 testes aprovados em três suítes focadas (operação, divergências e layout), sintaxe JavaScript válida e diff sem erros de whitespace.

## Encerramento

Etapa integrada ao fluxo completo e validada pelo usuário na aplicação em 25/11/2026. Ver [Validação final](./point-modal-validation-final.md) para o estado atual; os bloqueios de prévia descritos acima são históricos.
