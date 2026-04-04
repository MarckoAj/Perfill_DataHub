import pool from "./connection.js";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";
import { runAuvoMigrations } from "./migrations/auvoTables.js";
import { runAuvoSeeds } from "./seeds/auvoSeeds.js";
import { createSyncLogsTables } from "./migrations/syncLogsTables.js";
import { createSyncSchedulesTable } from "./migrations/syncSchedulesTables.js";
import { runScheduleSeeds } from "./seeds/scheduleSeeds.js";

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

    const ticketsTableQuery = `
        CREATE TABLE IF NOT EXISTS tickets (
            ticketId BIGINT PRIMARY KEY,
            nomeCliente VARCHAR(255),
            titulo VARCHAR(255),
            descricao LONGTEXT,
            dataCriacao DATETIME,
            status VARCHAR(50),
            dataFechamento DATETIME,
            dataAtualizacao DATETIME,
            categoriaSla VARCHAR(100),
            tempoSla VARCHAR(100),
            statusSla VARCHAR(50),
            motivoPausa VARCHAR(255),
            idTecnicoAtribuido INT,
            nomeTecnico VARCHAR(255),
            isAtrasado TINYINT DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_tickets_updated (updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
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

    const rawTicketsTableQuery = `
        CREATE TABLE IF NOT EXISTS raw_glpi_tickets (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            external_id BIGINT NOT NULL,
            payload_json JSON NOT NULL,
            fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_raw_external_id (external_id),
            INDEX idx_raw_fetched_at (fetched_at)
        );
    `;

    const rawAuvoTasksQuery = `
        CREATE TABLE IF NOT EXISTS raw_auvo_tasks (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            external_id BIGINT NOT NULL,
            payload_json JSON NOT NULL,
            fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_raw_auvo_tasks_ext (external_id),
            INDEX idx_raw_auvo_tasks_fetch (fetched_at)
        );
    `;

    const rawAuvoCustomersQuery = `
        CREATE TABLE IF NOT EXISTS raw_auvo_customers (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            external_id BIGINT NOT NULL,
            payload_json JSON NOT NULL,
            fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_raw_auvo_cust_ext (external_id),
            INDEX idx_raw_auvo_cust_fetch (fetched_at)
        );
    `;

    try {
        await pool.query(usersTableQuery);
        console.log("Migration: Tabela 'users' verificada/criada com sucesso.");
        await pool.query(ticketsTableQuery);
        console.log("Migration: Tabela 'tickets' verificada/criada com sucesso.");
        await pool.query(alertsTableQuery);
        console.log("Migration: Tabela 'datahub_ticket_alerts' verificada/criada com sucesso.");
        await pool.query(rawTicketsTableQuery);
        console.log("Migration: Tabela 'raw_glpi_tickets' verificada/criada com sucesso.");
        await pool.query(rawAuvoTasksQuery);
        console.log("Migration: Tabela 'raw_auvo_tasks' verificada/criada com sucesso.");
        await pool.query(rawAuvoCustomersQuery);
        console.log("Migration: Tabela 'raw_auvo_customers' verificada/criada com sucesso.");

        // Executar Migrations e Seeds do AUVO
        await runAuvoMigrations();
        await runAuvoSeeds();

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
        
        
        // Novas tabelas de Auditoria de Sincronizacao
        await createSyncLogsTables();
        await createSyncSchedulesTable();
        // await runScheduleSeeds();

    } catch (error) {
        console.error("Migration Erro:", error);
    }
}
