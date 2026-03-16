import pool from "./connection.js";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

export async function runMigrations() {
    const usersTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const alertsTableQuery = `
        CREATE TABLE IF NOT EXISTS datahub_ticket_alerts (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            ticket_id BIGINT NOT NULL,
            alert_type VARCHAR(100) NOT NULL,
            severity VARCHAR(30) NOT NULL,
            message TEXT NOT NULL,
            state ENUM('open', 'closed') NOT NULL DEFAULT 'open',
            first_detected_at DATETIME NOT NULL,
            last_detected_at DATETIME NOT NULL,
            closed_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_ticket_alert_type (ticket_id, alert_type),
            KEY idx_alert_state (state),
            KEY idx_alert_last_detected (last_detected_at)
        );
    `;

    try {
        await pool.query(usersTableQuery);
        console.log("Migration: Tabela 'users' verificada/criada com sucesso.");
        await pool.query(alertsTableQuery);
        console.log("Migration: Tabela 'datahub_ticket_alerts' verificada/criada com sucesso.");

        // Verifica se há usuários cadastrados
        const [rows] = await pool.query("SELECT COUNT(*) as count FROM users");
        if (rows[0].count === 0) {
            console.log("Migration: Tabela 'users' vazia. Criando usuário admin inicial...");

            const defaultUser = process.env.DASHBOARD_USER || "admin";
            const defaultPass = process.env.DASHBOARD_PASS || "admin";
            
            // Criptografar a senha padrão
            const hash = await bcryptjs.hash(defaultPass, 10);

            await pool.query(
                "INSERT INTO users (username, password_hash) VALUES (?, ?)", 
                [defaultUser, hash]
            );
            console.log(`Migration: Usuário '${defaultUser}' criado com sucesso.`);
        }

    } catch (error) {
        console.error("Migration Erro:", error);
    }
}
