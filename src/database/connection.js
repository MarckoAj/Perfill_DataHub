import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = process.env.DB_URL
  ? mysql.createPool({ 
      uri: process.env.DB_URL, 
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
