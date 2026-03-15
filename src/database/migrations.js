import pool from "./connection.js";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

export async function runMigrations() {
    const tableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(tableQuery);
        console.log("Migration: Tabela 'users' verificada/criada com sucesso.");

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
