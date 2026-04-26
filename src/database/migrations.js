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
            requires_password_change BOOLEAN DEFAULT 1,
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
            dataSolucao DATETIME,
            dataAtualizacao DATETIME,
            categoriaSla VARCHAR(100),
            tempoSla VARCHAR(100),
            statusSla VARCHAR(50),
            motivoPausa VARCHAR(255),
            idTecnicoAtribuido INT,
            nomeTecnico VARCHAR(255),
            isAtrasado TINYINT DEFAULT 0,
            tipo VARCHAR(100),
            projeto VARCHAR(100),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_tickets_updated (updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const glpiTasksTableQuery = `
        CREATE TABLE IF NOT EXISTS glpi_tickettasks (
            id BIGINT PRIMARY KEY,
            tickets_id BIGINT NOT NULL,
            users_id BIGINT,
            nomeAutor VARCHAR(255),
            date_creation DATETIME,
            date_mod DATETIME,
            begin DATETIME,
            end DATETIME,
            content LONGTEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_glpi_tickettasks_ticketsId (tickets_id)
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

        try {
            await pool.query("ALTER TABLE users ADD COLUMN requires_password_change BOOLEAN DEFAULT 1;");
            console.log("Migration: Coluna requires_password_change adicionada na tabela users.");
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log("Migration: Coluna requires_password_change ja existe na tabela users.");
            } else {
                console.error("Erro ao adicionar coluna requires_password_change:", error.message);
            }
        }

        await pool.query(ticketsTableQuery);
        try {
            await pool.query("ALTER TABLE tickets ADD COLUMN dataSolucao DATETIME AFTER dataFechamento;");
            console.log("Migration: Coluna dataSolucao adicionada na tabela tickets.");
        } catch (error) {
            if (error.code !== 'ER_DUP_FIELDNAME') {
                console.error("Erro ao adicionar coluna dataSolucao:", error.message);
            }
        }

        try {
            await pool.query("ALTER TABLE tickets ADD COLUMN tipo VARCHAR(100) AFTER isAtrasado;");
            console.log("Migration: Coluna 'tipo' adicionada na tabela tickets.");
        } catch (error) {
            if (error.code !== 'ER_DUP_FIELDNAME') {
                console.error("Erro ao adicionar coluna 'tipo' em tickets:", error.message);
            }
        }

        try {
            await pool.query("ALTER TABLE tickets ADD COLUMN projeto VARCHAR(100) AFTER tipo;");
            console.log("Migration: Coluna 'projeto' adicionada na tabela tickets.");
        } catch (error) {
            if (error.code !== 'ER_DUP_FIELDNAME') {
                console.error("Erro ao adicionar coluna 'projeto' em tickets:", error.message);
            }
        }
        try {
            await pool.query("ALTER TABLE tickets ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;");
            console.log("Migration: Coluna 'updated_at' adicionada na tabela tickets.");
        } catch (error) {
            if (error.code !== 'ER_DUP_FIELDNAME') {
                console.error("Erro ao adicionar coluna 'updated_at' em tickets:", error.message);
            }
        }

        try {
            await pool.query("ALTER TABLE tickets ADD INDEX idx_tickets_updated (updated_at);");
            console.log("Migration: Indice 'idx_tickets_updated' adicionado na tabela tickets.");
        } catch (error) {
            if (error.code !== 'ER_DUP_KEYNAME') {
                console.error("Erro ao adicionar indice 'idx_tickets_updated':", error.message);
            }
        }

        await pool.query(glpiTasksTableQuery);
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

        // Garantir existência e senha do usuário administrador nativo (admin)
        console.log("Migration: Garantindo integridade do usuário 'admin'...");
        const adminPassword = "Perfill0102@";
        const adminHash = await bcryptjs.hash(adminPassword, 10);
        
        const [adminRows] = await pool.query("SELECT id FROM users WHERE username = 'admin'");
        if (adminRows.length === 0) {
            await pool.query(
                "INSERT INTO users (username, password_hash, requires_password_change) VALUES (?, ?, 0)",
                ['admin', adminHash]
            );
            console.log("Migration: Usuário 'admin' criado com sucesso.");
        } else {
            // Forçar a senha correta solicitada pelo usuário
            await pool.query(
                "UPDATE users SET password_hash = ?, requires_password_change = 0 WHERE username = 'admin'",
                [adminHash]
            );
            console.log("Migration: Senha do usuário 'admin' atualizada/confirmada.");
        }

        // Sincronizar usuários do AUVO para a tabela de autenticação
        console.log("Migration: Sincronizando usuários do AUVO para a tabela de autenticação...");
        const defaultAuvoPassword = "Perfill0102@";
        const defaultAuvoHash = await bcryptjs.hash(defaultAuvoPassword, 10);
        
        await pool.query(`
            INSERT IGNORE INTO users (username, password_hash, requires_password_change)
            SELECT login, ?, 1 FROM users_auvo WHERE login IS NOT NULL AND login != '' AND login != 'admin'
        `, [defaultAuvoHash]);
        console.log("Migration: Sincronização de usuários do AUVO concluída.");


        // Novas tabelas de Auditoria de Sincronizacao
        await createSyncLogsTables();
        await createSyncSchedulesTable();
        // await runScheduleSeeds();

    } catch (error) {
        console.error("Migration Erro:", error);
    }
}
