import pool from './src/database/connection.js';

async function checkUsers() {
    try {
        const [rows] = await pool.query("SELECT username, requires_password_change FROM users WHERE username LIKE '%marcos%'");
        console.log("Users found:", JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error checking users:", error);
        process.exit(1);
    }
}

checkUsers();
