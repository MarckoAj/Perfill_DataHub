import dotenv from "dotenv";

dotenv.config();

/**
 * Middleware simples para autenticação via Bearer Token.
 * O token esperado deve ser definido na variável de ambiente API_AUTH_TOKEN.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const secretToken = process.env.API_AUTH_TOKEN;

  // Se não houver token configurado no servidor, permite acesso (opcional, mas seguro por padrão)
  if (!secretToken) {
    console.warn("AVISO: API_AUTH_TOKEN não definido no .env. Acesso bloqueado por segurança.");
    return res.status(500).json({ error: "Erro de configuração de segurança no servidor." });
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(`[Auth] Falha: Cabeçalho ausente ou malformado para ${req.method} ${req.url}`);
    return res.status(401).json({ error: "Token de autenticação não fornecido." });
  }

  const token = authHeader.split(" ")[1];

  if (token !== secretToken) {
    return res.status(401).json({ error: "Token de autenticação inválido." });
  }

  next();
};

export default authMiddleware;
