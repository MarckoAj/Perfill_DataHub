# Plano UI/UX - Perfill Data Hub

## Natureza do Documento

Este documento e um plano evolutivo de UI/UX. Ele nao substitui a documentacao de arquitetura ou status; serve para orientar refinamentos visuais e de experiencia.

## Direcao Visual

A interface deve parecer uma ferramenta operacional corporativa de observabilidade:

- alta densidade de informacao;
- pouco ruido visual;
- contraste forte, mas controlado;
- foco em leitura rapida;
- componentes consistentes entre telas;
- microinteracoes discretas para realtime.

## Telas Atuais

- `/noc` - dashboard NOC.
- `/alerts` - central de alertas.
- `/tickets` - chamados.
- `/clientes` - clientes operacionais.
- `/admin/sync` - sincronizacao.
- `/login.html` - login.

## Tokens Recomendados

```css
:root {
  --bg-canvas: #0B0F19;
  --bg-surface: #111827;
  --bg-elevated: #1F2937;
  --border-subtle: rgba(255, 255, 255, 0.05);
  --border-strong: rgba(255, 255, 255, 0.1);
  --brand-primary: #19c5ff;
  --sev-critical: #EF4444;
  --sev-warning: #F59E0B;
  --sev-info: #3B82F6;
  --sev-resolved: #10B981;
  --text-primary: #F9FAFB;
  --text-secondary: #9CA3AF;
  --text-tertiary: #6B7280;
}
```

## Fases

### Etapa 1 - Fundacao Visual

Status: parcialmente concluida.

- Padronizar tokens CSS.
- Limpar excesso de sombras/neon.
- Melhorar login.
- Reduzir competicao visual entre cards.

### Etapa 2 - Navegacao Global

Status: concluida.

- Topbar global adotada.
- Rotas amigaveis implementadas:
  - `/noc`
  - `/alerts`
  - `/tickets`
  - `/clientes`
  - `/admin/sync`

### Etapa 3 - NOC e Modais

Status: concluida/parcial.

- Dashboard NOC reformulado.
- Modais operacionais melhorados.
- Layouts com melhor hierarquia visual.

### Etapa 4 - Grids, Alertas e Chamados

Status: em andamento.

- Melhorar tabelas e listas densas.
- Padronizar badges de SLA/severidade.
- Reduzir template strings complexas no JS quando possivel.

### Etapa 5 - Polimento e Responsividade

Status: pendente.

- Ajustar tablets e telas menores.
- Refinar estados de hover/foco.
- Melhorar indicativos realtime.
- Verificar sobreposicao de textos em todos os breakpoints.

## Diretrizes

- Nao criar landing page; a primeira tela deve ser util.
- Evitar textos explicativos longos dentro da UI operacional.
- Priorizar leitura, filtros e acao.
- Manter consistencia entre NOC, alertas, tickets, clientes e sync.
- Evitar componentes visuais que dificultem manutencao no Vanilla JS atual.
