# Plano Diretor de Refatoração UX/UI — Perfill DataHub

Este documento define a nova arquitetura visual, estrutural e de interface do Perfill DataHub, elevando o sistema ao padrão de plataformas corporativas de observabilidade (Grafana, Datadog) com a identidade institucional da Perfill Tecnologia.

---

## 1. Proposta Visual e Conceitual (Design System)

A interface deixará de ser um "painel com caixas neon" para se tornar uma **superfície contínua de monitoramento**. O foco é redução de ruído (bordas fortes, sombras excessivas) e aumento de clareza pela tipografia e espaçamento.

### Tokens Visuais Base (CSS Variables)
O novo `index.css` será baseado em uma escala semântica:

```css
:root {
  /* Surfaces & Backgrounds (Profundidade) */
  --bg-canvas: #0B0F19; /* Fundo absoluto, mais profundo e escuro */
  --bg-surface: #111827; /* Paineis primários (Sidebar, Header) */
  --bg-elevated: #1F2937; /* Cards secundários */
  
  /* Borders (Sutileza) */
  --border-subtle: rgba(255, 255, 255, 0.05);
  --border-strong: rgba(255, 255, 255, 0.1);
  
  /* Brand (Perfill Tecnologia) */
  --brand-primary: #19c5ff; /* Azul tecnológico suave */
  --brand-glow: rgba(25, 197, 255, 0.15);
  
  /* Severities (Operacional) */
  --sev-critical: #EF4444;
  --sev-warning: #F59E0B;
  --sev-info: #3B82F6;
  --sev-resolved: #10B981;
  
  /* Typography */
  --text-primary: #F9FAFB;
  --text-secondary: #9CA3AF;
  --text-tertiary: #6B7280;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
}
```

---

## 2. Nova Arquitetura de Navegação

A tradicional barra superior (Navbar) será substituída por uma **Sidebar Operacional Fixa** (lado esquerdo).
Isso libera espaço vertical para as grids de dados e aproxima a UI do padrão Datadog/Kibana.

**Estrutura da Sidebar:**
- **Logo Perfill:** Topo, minimalista.
- **Navegação Principal:**
  - 📊 Dashboard NOC
  - 🚨 Central de Alertas
  - 🎫 Chamados
  - ⚙️ Rule Engine
- **Navegação Secundária (Bottom):**
  - 🔄 Status de Sincronização
  - 👤 Perfil / Logout

---

## 3. Estrutura do Layout NOC (Hero Section)

A tela principal do NOC será redesenhada para acabar com a "competição visual". 

**Incident Hero Section:**
Se houver um chamado de severidade Crítica/SLA Violado, ele não será apenas um card na lista. Ele ocupará uma **Hero Section** no topo:
- Tipografia gigante para o número do chamado.
- Fundo levemente banhado em vermelho sutil (`rgba(239, 68, 68, 0.05)`), sem bordas grossas.
- Ações rápidas (Quick Actions) visíveis imediatamente (ex: "Sincronizar Tarefa", "Justificar").

Abaixo do Hero, os demais chamados organizados em uma grid refinada.

---

## 4. Refatoração das Tabelas (Grids Operacionais)

As tabelas deixarão de ser tags `<table>` pesadas para se tornarem grids de dados SaaS.
- **Header Limpo:** Sem background pesado. Apenas texto em `uppercase` e borda inferior sutil.
- **Células:** Tipografia monospace para IDs.
- **Badges:** Ao invés de fundos coloridos inteiros, os badges de status terão fundo translúcido (ex: texto verde `10B981` com fundo verde em 10% de opacidade).
- **Hover:** O hover da linha não adicionará borda, apenas clareará levemente o `background-color` da row.

---

## 5. Componentização (Vanilla JS + CSS)

Mesmo sem React/Vue, padronizaremos os componentes CSS:

- `.c-badge`: Base para severidades.
- `.c-surface`: Base para painéis (substituindo antigas box-shadows gigantes por sombras microscópicas e bordas 0.05).
- `.c-hero-incident`: Componente de ticket crítico.
- `.c-metric-card`: Cards de contagem (ex: "14 Alertas Ativos").

---

## 6. Micro-Interações e Realtime ("Viva")

A sensação de "Ao Vivo" não deve ser histérica.
- **Pulso de Conexão:** Apenas um ponto verde muito pequeno no rodapé da Sidebar com uma animação de opacidade lenta (3s).
- **Entrada de Alerta:** Quando um alerta via WebSocket chegar, a row da tabela deve dar um flash de background sutil por 1 segundo e deslizar (slide-down), em vez de apenas piscar ou recarregar a tela abruptamente.

---

## 7. Fases de Implementação (Validação Progressiva)

Para garantir que não quebraremos nada no sistema que já funciona e manter o controle de qualidade, a refatoração será dividida em **5 Etapas de Validação**. Não avançaremos para a próxima sem a sua aprovação.

### 🔲 Etapa 1: Fundação do Design System e Login
- Limpeza global do `index.css`.
- Implementação dos novos Tokens CSS (Cores, Espaçamentos, Tipografia).
- Refatoração sutil da tela de Login (aumento do blur, foco no form, limpeza do background competitivo).
- **Validação:** Checar se as cores base estão premium e o login atende ao critério corporativo.

### ✅ Etapa 2: A Grande Mudança de Navegação (Topbar Global Unificada)
- *Ajuste Estratégico:* Em vez de uma Sidebar, optou-se pela consolidação de uma **Topbar Global** limpa e consistente em todas as páginas para maximizar o espaço horizontal.
- Roteamento via URLs padronizadas (`/noc`, `/alerts`, `/tickets`, `/admin/sync`).
- **Validação:** Checar fluxo de navegação e sensação de "Software SaaS". (Concluído)

### ✅ Etapa 3: Refatoração da Tela NOC (Dashboard) e Modais
- Implementação da **Hero Section** para incidentes críticos (Parcial).
- Refatoração dos estilos base para remover o "excesso de neon" (Concluído).
- **Refatoração de Modais:** NOC Enterprise Modal e Point Modal migrados para a identidade Deep Dark Glassmorphism, com arquitetura em CSS Grid para eliminar vazamentos de layout.
- **Validação:** Checar clareza hierárquica e densidade da tela mais importante. (Concluído)

### 🔲 Etapa 4: Refatoração de Grids, Alertas e Chamados
- Transformação das tabelas antigas para o modelo de Grids Modernas.
- Refinamento das *Severity Badges* e *SLA Badges*.
- Atualização das views `alerts.html` e `tickets.html` (com auditoria de dependências CSS já finalizada).
- **Validação:** Checar legibilidade, escaneabilidade e requinte das tabelas.

### 🔲 Etapa 5: Polimento, Micro-Animações e Responsividade
- Adição dos indicadores realtime pulsantes.
- Transições CSS de Hover e injeção de dados (WebSockets).
- Ajustes de quebra de layout para Tablets e telas menores (Sidebar colapsável).
- **Validação:** Entrega final e refinamento do "feel" operacional.
