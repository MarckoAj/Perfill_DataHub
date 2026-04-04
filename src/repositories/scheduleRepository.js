import db from "../database/connection.js";

class ScheduleRepository {
  async getAllSchedules() {
    const [rows] = await db.query("SELECT * FROM sync_schedules ORDER BY `system` ASC, id ASC");
    return rows;
  }

  async getActiveSchedules() {
    const [rows] = await db.query("SELECT * FROM sync_schedules WHERE is_active = 1");
    return rows;
  }

  async getScheduleById(id) {
    const [rows] = await db.query("SELECT * FROM sync_schedules WHERE id = ?", [id]);
    return rows[0];
  }

  async createSchedule(data) {
    const filtersStr = data.filters ? JSON.stringify(data.filters) : null;
    const [result] = await db.query(
      `INSERT INTO sync_schedules (system, cron_expression, date_range, filters, is_active, description) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.system, data.cron_expression, data.date_range, filtersStr, data.is_active ?? true, data.description || '']
    );
    return result.insertId;
  }

  async updateSchedule(id, data) {
    const filtersStr = data.filters ? JSON.stringify(data.filters) : null;
    await db.query(
      `UPDATE sync_schedules 
       SET system = ?, cron_expression = ?, date_range = ?, filters = ?, is_active = ?, description = ? 
       WHERE id = ?`,
      [data.system, data.cron_expression, data.date_range, filtersStr, data.is_active, data.description || '', id]
    );
  }

  async deleteSchedule(id) {
    await db.query("DELETE FROM sync_schedules WHERE id = ?", [id]);
  }
}

export default new ScheduleRepository();
