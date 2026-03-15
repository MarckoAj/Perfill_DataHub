import express from "express";
import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import userRepository from "../repositories/userRepository.js";
import authMiddleware from "../middlewares/authMiddleware.js";

dotenv.config();

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await userRepository.findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const isMatch = await bcryptjs.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const secretToken = process.env.API_AUTH_TOKEN;
    return res.status(200).json({ token: secretToken });

  } catch (error) {
    console.error("Erro no Login:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Rota de Cadastro de Novos Usuários - Privada
router.post("/register", authMiddleware, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
  }

  try {
    // Verifica se já existe
    const existingUser = await userRepository.findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: "Usuário já existe" });
    }

    // Criptografa a senha
    const hash = await bcryptjs.hash(password, 10);
    const userId = await userRepository.createUser(username, hash);

    return res.status(201).json({ message: "Usuário criado com sucesso", userId });

  } catch (error) {
    console.error("Erro no Cadastro:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

export default router;
