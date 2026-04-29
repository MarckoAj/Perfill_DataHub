import dashboardRepository from "../repositories/dashboardRepository.js";

class DashboardController {
  async getAuvoData(req, res) {
    try {
      const data = await dashboardRepository.getAuvoGrafanaData();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getGlpiData(req, res) {
    try {
      const { status, projeto, tipo, tecnico, categoria } = req.query;
      const filters = {
        status: status || "",
        projeto: projeto || "",
        tipo: tipo || "",
        tecnico: tecnico || "",
        categoria: categoria || ""
      };

      const data = await dashboardRepository.getGlpiGrafanaData(filters);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getOperationalMetrics(req, res) {
    try {
      const metrics = await dashboardRepository.getOperationalMetrics();

      // Transformar para o formato esperado pelo frontend
      const formattedMetrics = [
        { label: "Novos", count: String(metrics.novos || 0), variant: "success", icon: "plus" },
        { label: "Criados hoje", count: String(metrics.criados_hoje || 0), variant: "blue", icon: "calendar" },
        { label: "Encerrados hoje", count: String(metrics.encerrados || 0), variant: "purple", icon: "checkCircle" },
        { label: "Aberto SLA", count: String(metrics.chamados_abertos || 0), variant: "gray", icon: "clock" },
        { label: "Proativos", count: String(metrics.proativos || 0), variant: "danger", icon: "spark" },
        { label: "Pendentes", count: String(metrics.pendentes || 0), variant: "neutral", icon: "pause" }
      ];

      res.status(200).json({ success: true, data: formattedMetrics });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getActiveAlerts(req, res) {
    try {
      const alerts = await dashboardRepository.getActiveAlerts();
      res.status(200).json({ success: true, data: alerts });
    } catch (error) {
      console.error("[DashboardController] Erro ao buscar alertas:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new DashboardController();
