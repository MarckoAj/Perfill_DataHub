import express from "express";
import tarefas from "../utils/tarefas.js";
import tasksMod from "../models/tasksMod.js";
import acompanhamentoTecnico from "../utils/acompanhamentoTecnico.js";


const router = express.Router();

router.get("/tarefasTecnicos", (_req, res, next) => {
         tarefas
        .TaskListByTecnicos("dia")
        .then((resultados) => res.status(200).json(resultados))
        .catch((erros) => next(erros));
});

router.get("/tarefasManutencao", (_req, res, next) => {
        tarefas
       .TaskListManutencao("dia")
       .then((resultados) => res.status(200).json(resultados))
       .catch((erros) => next(erros));
});

router.get("/tarefasManutencaoDb", (req, res, next) => {
        const filters = {
          externalId: req.query.externalId || null,
          taskStatusID: req.query.taskStatusID || null,
          customerId: req.query.customerId || null,
          userFromId: req.query.userFromId || null,
          taskDate: req.query.taskDate || null,
          externalIdNot: req.query.externalIdNot || null, 
          taskStatusIDNot: req.query.taskStatusIDNot || null,
        };
      
        tasksMod
          .getTasksByfilters(filters)
          .then((resultados) => res.status(200).json(resultados)) 
          .catch((erros) => next(erros));
      });


 router.get("/tarefasResumo", (_req, res, next) => {
        acompanhamentoTecnico
          .resumo()
          .then((resultados) => res.status(200).json(resultados))
          .catch((erros) => next(erros));
});
      


export default router;