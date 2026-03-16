import express from "express";
import webhooMod from "../models/webHookMod.js"


const router = express.Router();

router.post("/webhook", (req, res, next) => {
  const OriginIP = req.headers['x-forwarded-for'] 
  const data =  req.body
  console.log(OriginIP)
  webhooMod.executeAction(data)
  .then((resultados) => res.status(200).json(resultados))
  .catch((erros) => next(erros));

});





export default router;