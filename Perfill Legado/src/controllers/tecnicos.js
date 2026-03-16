import express from "express";
import acompanhamentoTecnico from "../utils/acompanhamentoTecnico.js";
import ticketsMod from "../models/ticketsMod.js";

const router = express.Router();

router.get("/acompanhamento/tickets/:status", (_req, res, next) => {
    const status = _req.params.status;
    ticketsMod.getTicketsByStatus(status)
        .then((resultados) => res.status(200).json(resultados))
        .catch((erros) => next(erros));
});

router.get("/acompanhamento/tarefas", (_req, res, next) => {
    acompanhamentoTecnico
        .hasTasks()
        .then((resultados) => res.status(200).json(resultados))
        .catch((erros) => next(erros));
});


router.get("/acompanhamento/resumotarefas", (_req, res, next) => {
    acompanhamentoTecnico
        .tarefas()
        .then((resultados) => res.status(200).json(resultados))
        .catch((erros) => next(erros));
});



export default router;