import dotenv from 'dotenv';
import customExpress from "./config/customExpress.js";
import startJobs from "./jobs/cronJob.js";
import { runMigrations } from "./database/migrations.js";

dotenv.config();


const PORT = process.env.PORT || 3000;
const app = customExpress();

// Inicialização do servidor
app.listen(PORT, async () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    
    // Executa as migrations de banco de dados
    await runMigrations();
    
    startJobs();
});




