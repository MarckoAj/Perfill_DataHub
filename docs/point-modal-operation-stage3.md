# Ficha do ponto — Etapa 3: edição e preparação da propagação

Escopo: piloto 06-014 / HUB 12130. Equivalências de tipos entre fontes foram adiadas pelo operador.

## Implementado

Na aba HUB, Opções > Editar informações mantém os inputs no grid e acrescenta a seleção AUVO/GLPI abaixo dos campos. Nenhum destino inicia selecionado. Sem seleção, a proposta contém apenas os campos modificados no HUB. Destinos sem ID correlacionado ficam indisponíveis.

Ao selecionar plataformas, o plano local inclui somente campos modificados e compatíveis por destino; valores já iguais no destino são ignorados. Nome HUB se traduz em description no AUVO e name no GLPI. Coordenadas AUVO preservam o mapeamento existente. Coordenadas GLPI e classificações sem equivalência permanecem bloqueadas, com motivo. Nulos, N/A e coordenadas inválidas não podem gerar propostas aplicáveis. Zero é válido; formatos numéricos equivalentes não criam alterações artificiais.

Cancelar descarta os destinos e o rascunho. A ficha e as fontes não são modificadas pela prévia. Por solicitação do operador, a direção inicial de sincronização agora é HUB → plataforma selecionada; a inversão continua disponível.

## Dependências para executar

A etapa prepara a propagação sem executá-la: confirmação pertence à Etapa 4 e integração dos serviços/histórico à Etapa 5. Salvar/Sincronizar permanecem desabilitados. Nenhum registro real AUVO/GLPI foi alterado.

Autenticação atual não identifica usuário individual (token compartilhado). Antes da gravação serão necessários autorização no backend, leitura atual do destino, verificação de vínculo e existência, controle de concorrência, confirmação e registro dos resultados por plataforma. A lista de compatibilidade do frontend NÃO substitui autorização. A preservação de campos HUB já implementada no piloto permanece ativa; expansão a outros pontos ainda exige definição explícita.

## Validação

Testes verificam direção padrão, HUB sem propagação, uma/múltiplas plataformas, exclusão de campos não modificados, tradução do nome AUVO, bloqueios de vínculo/mapeamento/valores inválidos, igualdade de destino, cancelamento e ausência de requisições de escrita. Conferência visual da Etapa 3 aguarda operador.

Resultado: 28 testes aprovados em três suítes focadas; sintaxe e git diff --check válidos.

Ajuste visual solicitado: seleção de destinos AUVO/GLPI movida para dentro da caixa superior Edição de informações. Mantidos vínculos, contagem e atualização da compatibilidade ao editar.

Disponibilidade dos destinos vinculada aos campos: AUVO/GLPI só ficam selecionáveis quando existe pelo menos uma alteração válida, com mapeamento vigente e valor diferente no destino. Reverter ou invalidar o último campo aplicável desmarca o destino automaticamente, preservando outros destinos ainda válidos. Cadastro configurável de campos e equivalências de tipos permanecem fora do escopo.

## Encerramento

Etapa integrada ao fluxo completo e validada pelo usuário na aplicação em 25/11/2026. Ver [Validação final](./point-modal-validation-final.md) para o estado atual; os bloqueios de prévia descritos acima são históricos.
