import pool from "../database/connection.js";

class IntegrationRepository {
  async getGlpiSyncStatus() {
    try {
      // Verifica último sync bem-sucedido através dos tickets
      const query = `
        SELECT 
          MAX(updated_at) as last_sync,
          COUNT(*) as total_tickets,
          SUM(CASE WHEN status = 'novo' THEN 1 ELSE 0 END) as new_tickets,
          SUM(CASE WHEN status = 'atribuido' THEN 1 ELSE 0 END) as assigned_tickets,
          SUM(CASE WHEN is_atrasado = 1 THEN 1 ELSE 0 END) as overdue_tickets
        FROM tickets
        WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `;

      const [rows] = await pool.query(query);
      return rows[0] || {
        last_sync: null,
        total_tickets: 0,
        new_tickets: 0,
        assigned_tickets: 0,
        overdue_tickets: 0
      };
    } catch (error) {
      console.error('Erro ao buscar status GLPI:', error);
      return {
        last_sync: null,
        total_tickets: 0,
        new_tickets: 0,
        assigned_tickets: 0,
        overdue_tickets: 0,
        error: error.message
      };
    }
  }

  async getSystemHealth() {
    try {
      const glpiStatus = await this.getGlpiSyncStatus();
      
      // Verifica se há alertas críticos
      const criticalAlertsQuery = `
        SELECT COUNT(*) as critical_count
        FROM datahub_ticket_alerts 
        WHERE state = 'open' AND severity = 'critical'
      `;
      
      const [alertRows] = await pool.query(criticalAlertsQuery);
      const criticalAlerts = alertRows[0]?.critical_count || 0;

      return {
        status: criticalAlerts > 10 ? 'degraded' : 'healthy',
        integrations: {
          glpi: {
            status: glpiStatus.error ? 'error' : (glpiStatus.last_sync ? 'connected' : 'disconnected'),
            last_sync: glpiStatus.last_sync,
            metrics: glpiStatus
          }
        },
        alerts: {
          critical_count: criticalAlerts,
          status: criticalAlerts > 10 ? 'critical' : 'normal'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao verificar saúde do sistema:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default new IntegrationRepository();
