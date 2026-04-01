import pool from '../src/database/connection.js';

async function migrate() {
  try {
    console.log('Alterando coluna descricao para LONGTEXT...');
    await pool.query('ALTER TABLE tickets MODIFY COLUMN descricao LONGTEXT');
    console.log('Sucesso!');
  } catch (error) {
    console.error('Erro ao alterar coluna:', error.message);
  } finally {
    process.exit();
  }
}

migrate();
