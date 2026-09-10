# Vinculação HUB x GLPI em lote

O botão `Vincular todos com 100%` trabalha sobre todos os cadastros elegíveis,
independentemente de busca, filtros ou paginação. Usa o modo `both` (ID + Nome,
incluindo o fallback por nome já existente), exige score 100, candidato único e
ausência de revisão manual. Exclui conflitos por nome e dispositivos disputados
por outros HUBs no levantamento inicial. Vínculos existentes são preservados.

`POST /api/hub/matching/glpi/bulk` inicia o trabalho e retorna 202; retorna 409 se
já houver lote em execução. `GET /api/hub/matching/glpi/bulk/status` informa estado,
processados/total, vinculados, ignorados, falhas e até 100 detalhes. Ambas as rotas
usam a autenticação do HUB. O navegador consulta o andamento a cada segundo.

Cada candidato é revalidado antes de gravar, exigindo ainda 100% e candidato único.
A gravação usa a transação existente, que protege propriedade do dispositivo e
registra o histórico atomicamente. Falhas individuais não interrompem o lote.
A operação cria vínculos locais; não propaga mudanças para GLPI ou AUVO.

O levantamento de disputas entre HUBs corresponde ao início do lote. O estado
do trabalho fica em memória por processo, como as filas de sincronização manual:
recarregar a página recupera o andamento; reiniciar o servidor interrompe o lote.
Uma nova execução pula vínculos já gravados. Não há retomada automática após restart.

Validação: testes de lote, matching e repositório cobrem múltiplas páginas,
concorrência de início, disputas, score alterado, falhas e histórico transacional.

## Indicador visual

- Durante a execução, a barra fica azul.
- Ao concluir, a barra fica verde em 100% e o texto mostra `✓ Concluído`, mantendo o contorno neutro do painel. Isso também vale quando não há candidatos elegíveis.
- Conclusão com falhas usa amarelo; falha na preparação usa vermelho.
- Os contadores de processados, vinculados, ignorados e falhas continuam visíveis.
- O estado é recuperado ao recarregar a página enquanto o mesmo processo do servidor permanecer ativo.
