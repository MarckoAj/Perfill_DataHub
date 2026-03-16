export default function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = err?.statusCode || 500;

  if (process.env.NODE_ENV === "production") {
    return res.status(statusCode).json({ error: "Algo deu errado..." });
  }

  return res.status(statusCode).json({
    error: err?.message || "Erro interno no servidor",
  });
}
