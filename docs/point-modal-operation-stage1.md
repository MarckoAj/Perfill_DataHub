# Ficha do ponto — Etapa 1 visual

Referência: datahub-prototipo-v4.html, fornecido em C:/Users/MARCOS PERFILL/Desktop/doc. Solicitação: edição e sincronização incrementais sem substituir o modal existente. Escopo inicial mantido no piloto 06-014 / HUB 12130.

## Implementado

- Visualização padrão mantém o grid, mapa, identificadores, seletor de plataformas e ausência de ferramentas permanentes nos campos.
- Opções > Editar informações, com lápis, abre rascunho local na aba HUB e leva a Informações Gerais. Campos gerais compatíveis viram inputs; coordenadas têm limites e identificadores não são editáveis. Destaque e contador acompanham as alterações.
- Opções > Sincronizar campos, ou indicador de divergência, abre seleção local nas abas AUVO/GLPI. Indicador pré-seleciona o campo quando elegível. Checkboxes circulares, comparação HUB, seleção coletiva e destaque usam o grid existente, com campos não selecionados discretos. Origem sem valor e IDs não são selecionáveis.
- Cancelar descarta rascunho/seleção; sair de aba ou fechar a ficha pede confirmação de descarte.
- Salvar alterações e Sincronizar estão desabilitados com explicação nesta etapa exclusivamente visual. Nenhuma requisição de escrita é realizada; os objetos originais não são alterados.

## Dependências e próximas etapas

A sessão atual usa token compartilhado, sem identidade ou permissão individual. A prévia local está disponível somente no piloto em sessão autenticada; isso NÃO representa autorização de escrita. Antes de habilitar gravação, o backend deve fornecer capacidades verificadas por usuário e validar as operações independentemente do frontend.

Direção nesta etapa: plataforma selecionada → HUB para demonstrar seleção. Inversão de direção e elegibilidade específica por destino pertencem à Etapa 2. Propagação de edições, confirmação centralizada, persistência, conflitos e falhas parciais pertencem às etapas posteriores autorizadas separadamente. Não foram criados endpoints de escrita, histórico paralelo ou políticas no modal.

## Validação

Testes de interface com DOM simulado cobrem visualização, edição exclusiva HUB, identidade imutável, rascunho sem mutação de fonte, cancelamento, pré-seleção, seleção coletiva, zero válido, campos ausentes, descarte e restrição de escopo/sessão. Navegador de teste redirecionou ao login; validação visual autenticada pendente do operador.

Regressão final: 156 testes aprovados em 28 suítes; verificação de sintaxe e git diff --check aprovadas.

Operador validou a Etapa 1. Rótulo da seleção coletiva alterado para “Todos divergentes”; regras de elegibilidade preservadas.

## Encerramento

Etapa integrada ao fluxo completo e validada pelo usuário na aplicação em 25/11/2026. Ver [Validação final](./point-modal-validation-final.md) para o estado atual; os bloqueios de prévia descritos acima são históricos.
