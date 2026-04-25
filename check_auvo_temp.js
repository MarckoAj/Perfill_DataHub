import pool from './src/database/connection.js';

async function checkAuvoUsers() {
    try {
        const [rows] = await pool.query("SELECT email, name FROM users_auvo WHERE email LIKE '%marcos%' OR name LIKE '%marcos%'");
        console.log("AUVO Users found:", JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error checking AUVO users:", error);
        process.exit(1);
    }
}

checkAuvoUsers();
