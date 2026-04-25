import pool from './src/database/connection.js';

async function checkLogins() {
    try {
        const [rows] = await pool.query("SELECT login, name FROM users_auvo WHERE name LIKE '%marcos%'");
        console.log("Logins found:", JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error checking logins:", error);
        process.exit(1);
    }
}

checkLogins();
