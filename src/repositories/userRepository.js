import pool from "../database/connection.js";

class UserRepository {
  async createUser(username, passwordHash) {
    const query = "INSERT INTO users (username, password_hash) VALUES (?, ?)";
    try {
      const [result] = await pool.query(query, [username, passwordHash]);
      return result.insertId;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      throw error;
    }
  }

  async findUserByUsername(username) {
    const query = "SELECT * FROM users WHERE username = ?";
    try {
      const [rows] = await pool.query(query, [username]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Erro ao buscar usuário por username:", error);
      throw error;
    }
  }

  async findUserById(userId) {
    const query = "SELECT * FROM users WHERE id = ?";
    try {
      const [rows] = await pool.query(query, [userId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Erro ao buscar usuário por id:", error);
      throw error;
    }
  }

  async updatePassword(userId, newPasswordHash) {
    const query = "UPDATE users SET password_hash = ?, requires_password_change = 0 WHERE id = ?";
    try {
      const [result] = await pool.query(query, [newPasswordHash, userId]);
      return result.affectedRows;
    } catch (error) {
      console.error("Erro ao atualizar senha:", error);
      throw error;
    }
  }
}

export default new UserRepository();
