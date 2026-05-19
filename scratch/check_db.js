import pool from "../src/database/connection.js";

async function checkSchedules() {
  try {
    const [rows] = await pool.query("SELECT * FROM sync_schedules");
    console.log("Schedules found:", rows.length);
    console.table(rows);
    process.exit(0);
  } catch (e) {
    console.error("Error checking schedules:", e.message);
    process.exit(1);
  }
}

checkSchedules();
