import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let dbUrl = process.env.DB_URL;
if (dbUrl && dbUrl.includes('ssl-mode=')) {
  dbUrl = dbUrl.replace(/(\?|&)(ssl-mode|sslmode)=[^&]*/g, "");
}

const pool = dbUrl
  ? mysql.createPool({ 
      uri: dbUrl, 
      ssl: { rejectUnauthorized: false },
      waitForConnections: true, 
      connectionLimit: 10, 
      queueLimit: 0 
    })
  : mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
  });

export default pool;
