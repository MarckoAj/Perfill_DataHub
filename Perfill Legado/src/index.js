import customExpress from "./config/customExpress.js";
import pool from "./infrastructure/database/conexao.js";
import db from "./infrastructure/database/DefinitionDb.js"
import dotenv from "dotenv";
import NgrokTunnel from "./api/ngrokTunnel.js";
import AuvoWebHook from "./api/auvoWebHooks.js"


dotenv.config();


const PORT = process.env.PORT || 3000;
const app = customExpress();

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));



pool.getConnection((error, connection) => {

  if (error) {
    console.log(error);
    throw error
  } else {
    console.log("Conexao com banco de dados bem sucedida");
    connection.release();
  }
});


try {
  db.init(pool)

} catch (error) {
  console.log(error)
}

/*try {

  await NgrokTunnel.ngrokConnect()

    .then(async () => {
      const result = await AuvoWebHook.deleteAllWebHooksActive()
      console.log(result)

    }).then(async () => {
      const result = await AuvoWebHook.addAllWebHooks()
      console.log(result)
    })


} catch (error) {
  console.log(error)
}*/



export default app;
