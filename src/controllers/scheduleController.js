import scheduleRepository from "../repositories/scheduleRepository.js";
import dynamicScheduler from "../jobs/dynamicScheduler.js";

class ScheduleController {
  async index(req, res) {
    try {
      const schedules = await scheduleRepository.getAllSchedules();
      res.json(schedules);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  async store(req, res) {
    try {
      const id = await scheduleRepository.createSchedule(req.body);
      // Reload no motor de cron para pegar o relógio novo imediatamente
      dynamicScheduler.reloadSchedules();
      res.status(201).json({ id, message: "Aviso: Job de sincronização cadastrado e inserido no Node-Cron ativo!" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      await scheduleRepository.updateSchedule(id, req.body);
      dynamicScheduler.reloadSchedules();
      res.json({ message: "Job atualizado e recarregado no Node-Cron" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;
      await scheduleRepository.deleteSchedule(id);
      dynamicScheduler.reloadSchedules();
      res.json({ message: "Job deletado e varrido da memória!" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  async triggerManual(req, res) {
      // Deixa a porta para simular um relógio via Painel manual
      res.json({ message: "To-do handler manual" });
  }
}

export default new ScheduleController();
