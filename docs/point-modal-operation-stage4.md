# Ficha do ponto — Etapa 4: confirmação

Piloto 06-014 / HUB 12130. Etapa 3 validada pelo operador.

## Interface

Salvar alterações e Sincronizar agora abrem uma revisão quando existem propostas válidas. A caixa usa dialog nativo centralizado sobre a ficha com fundo escurecido, foco contido no diálogo, título e ícone da operação, origem/destinos e quantidade de alterações. Tabela compacta exibe Campo/destino, Valor atual e Novo valor. Valores atuais são os da plataforma de destino do cache carregado; novos valores são do rascunho ou da origem escolhida. Cada linha identifica seu destino; múltiplas plataformas não são misturadas.

Valores atuais em cinza claro, propostos em verde suave e advertências em amarelo. Lista tem rolagem interna e ações ficam fora da região rolável. Valores e mensagens são escapados para HTML. Propostas incompatíveis não entram na lista de aplicação; seus motivos aparecem nas advertências.

Cancelar, Escape ou clicar fora fecha somente a revisão, mantendo rascunho/seleções. Fechar devolve foco ao controle anterior. Abrir outro ponto ou descartar o modo remove a revisão. Campo HUB inválido, seleção inválida ou ausência de propostas bloqueiam abertura.

Mensagem exigida preservada: Esta operação será registrada no histórico de alterações, permitindo consultar e restaurar os valores anteriores, quando permitido.

## Limite desta etapa

O botão final Confirmar permanece desabilitado e o diálogo informa que execução e histórico pertencem à próxima etapa. Não há gravação ou mensagem de sucesso fictícia. Nenhuma requisição de escrita é realizada. A revisão guarda somente uma cópia para apresentação; não constitui autorização nem payload validado pelo servidor.

Etapa 5 deverá integrar permissões individuais no backend, releitura das fontes, comparação contra os valores revisados, vínculo, mapeamento e disponibilidade de API, histórico e resultados independentes por destino. A confirmação nunca deverá aplicar um snapshot antigo sem revalidação.

## Validação

34 testes focados aprovados em três suítes: valores anteriores por destino, origem/destino invertidos, múltiplas plataformas, HTML escapado, bloqueio sem alterações ou valores inválidos, fechamento com devolução de foco e preservação de rascunho/seleções. Conferência visual autenticada da Etapa 4 aguarda operador.

Regressão completa: 170 testes aprovados em 28 suítes; sintaxe e diff verificados. Servidor local confirmou entrega do script atualizado (HTTP 200).

Refinamento visual: diálogo com posição fixa, inset zero e margens automáticas para centralização no viewport. Contador e ações Cancelar/Salvar (ou Sincronizar) movidos do rodapé da ficha para a caixa superior do modo ativo, mantendo a atualização ao editar.

## Encerramento

Etapa integrada ao fluxo completo e validada pelo usuário na aplicação em 25/11/2026. Ver [Validação final](./point-modal-validation-final.md) para o estado atual; os bloqueios de prévia descritos acima são históricos.
