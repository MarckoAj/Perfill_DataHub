import mysql from "mysql";

const DBHOST = process.env.DBHOST || "localhost";
const DBPORT = process.env.DBPORT ||  3306;
const DBUSER = process.env.DBUSER || "root";
const DBPASS = process.env.DBPASS || "Perfill0102@";
const DBNAME = process.env.DBNAME || "auvodb";

const localConfig = {
  connectionLimit: 100,
  host: DBHOST,
  port: DBPORT,
  user: DBUSER,
  password: DBPASS, 
  database: DBNAME 
};

const pool = mysql.createPool(process.env.DATABASE_URL || localConfig);

export default pool;
