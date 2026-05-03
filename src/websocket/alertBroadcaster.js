import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

/**
 * AlertBroadcaster
 * 
 * Responsável por gerenciar as conexões WebSocket e transmitir eventos
 * de alertas em tempo real para os clientes conectados (NOC/Dashboards).
 */
class AlertBroadcaster {
  constructor() {
    this.wss = null;
  }

  /**
   * Inicializa o servidor WebSocket acoplado ao servidor HTTP.
   * @param {http.Server} server - Instância do servidor HTTP do Node.js
   */
  init(server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      const secret = process.env.API_AUTH_TOKEN || "PerfillDataHubSecureToken2026";
      const dashboardPass = process.env.DASHBOARD_PASS;

      const isValid = token && (token === secret || token === dashboardPass);

      if (!isValid) {
        console.warn(`[WebSocket] Conexão recusada: Token inválido.`);
        ws.send(JSON.stringify({ event: 'ERROR', message: 'Unauthorized' }));
        ws.close();
        return;
      }

      console.log('[WebSocket] Cliente autenticado e conectado.');

      ws.send(JSON.stringify({
        event: 'CONNECTED',
        message: 'Conectado e Autenticado no AlertBroadcaster',
        ts: new Date().toISOString()
      }));

      ws.on('close', () => {
        console.log('[WebSocket] Cliente desconectado.');
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Erro na conexão:', error.message);
      });
    });

    console.log('✅ Servidor WebSocket inicializado na mesma porta do HTTP.');
  }

  /**
   * Transmite uma mensagem para todos os clientes conectados.
   * @param {string} event - Nome do evento (ex: ALERT_OPENED, ALERT_CLOSED)
   * @param {object} payload - Dados do evento
   */
  broadcast(event, payload) {
    if (!this.wss) {
      console.warn('[WebSocket] Tentativa de broadcast sem servidor inicializado.');
      return;
    }

    const message = JSON.stringify({
      event,
      payload,
      ts: new Date().toISOString()
    });

    let count = 0;
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) { // 1 = OPEN
        client.send(message);
        count++;
      }
    });

    if (count > 0) {
      console.log(`[WebSocket] Broadcast: ${event} enviado para ${count} clientes.`);
    }
  }
}

export default new AlertBroadcaster();
