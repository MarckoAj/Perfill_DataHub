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
}

export default new DashboardController();
