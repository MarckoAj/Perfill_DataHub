import express from "express";
import bodyParser from "body-parser";
import preventivas from "../controllers/preventivas.js"
import tecnicos from"../controllers/tecnicos.js"
import tarefas from "../controllers/tarefas.js"
import webhook from "../controllers/webHook.js"
import cors from "cors"


const ENV = process.env.NODE_ENV;

export default  () => {

  const app = express();
  app.use(cors())
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  app.get("/", (_req, res) => {
    res.send("Bem vindo ao Perfill API");
  });
  
  app.use("/",preventivas)
  app.use("/",tecnicos)
  app.use("/",tarefas)
  app.use("/",webhook)
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err) {
      if (ENV === "production") {
        res.status(500).send({ error: "Algo deu errado..." });
      } else {
        res.status(500).send({ error: err });
      }
      console.log(err);
    }
  });

  return app;
};
