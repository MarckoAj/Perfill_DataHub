import express from "express";
import relatorioPreventivas from"../utils/relatorio.js"


const router = express.Router();

router.get("/preventivas", (_req, res, next) => {
  relatorioPreventivas
    .relatorioPreventivas()
    .then((resultados) => res.status(200).json(resultados))
    .catch((erros) => next(erros));
});


export default router;

