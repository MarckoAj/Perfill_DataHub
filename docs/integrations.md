# Integrações

O Perfill Data Hub foi projetado para integrar múltiplos sistemas operacionais utilizados em ambientes de suporte e monitoramento.

---

# GLPI

Sistema de Service Desk.

Dados coletados:

- tickets
- status
- responsáveis
- atualizações

Uso no sistema:

- geração de alertas
- relatórios BI
- correlação com eventos externos

---

# AUVO (planejado)

Sistema de gestão de tarefas.

Integração permitirá:

- acompanhar execução de tarefas
- correlacionar tarefas com chamados
- detectar inconsistências operacionais

Exemplo:

tarefa fechada no AUVO  
ticket GLPI sem atualização

→ gerar alerta

---

# Zabbix (planejado)

Sistema de monitoramento de infraestrutura.

Uso no sistema:

- detectar falhas de dispositivos
- correlacionar com tickets existentes
- disparar automações

Exemplo:

camera offline no Zabbix  
↓  
verificar ticket GLPI  
↓  
abrir tarefa AUVO