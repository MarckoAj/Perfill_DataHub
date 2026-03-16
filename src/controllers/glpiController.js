import asyncHandler from "../utils/asyncHandler.js";
import glpiTickets from "../services/glpi_service.js";
import ticketRepository from "../repositories/ticketRepository.js";
import syncService from "../core/tickets/syncTicketsService.js";

export const getTicketsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const tickets = await glpiTickets.getTicketsByStatus(status);
  res.status(200).json(tickets);
});

export const getTicketsForBi = asyncHandler(async (req, res) => {
  const { startDate, endDate, statusGroup, limit, offset } = req.query;
  
  const tickets = await ticketRepository.getAllTickets(
    startDate, 
    endDate, 
    statusGroup || 'todos', 
    parseInt(limit) || 100, 
    parseInt(offset) || 0
  );
  
  res.status(200).json(tickets);
});

export const getTicketsStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await ticketRepository.getStats(startDate, endDate);
  res.status(200).json(stats);
});

export const syncBiManual = asyncHandler(async (req, res) => {
  // Dispara a sincronização de forma assíncrona (não prende a resposta HTTP)
  syncService.syncAll().then(() => console.log("Sincronização manual finalizada com sucesso."))
    .catch((e) => console.error("Erro na sincronização manual:", e));

  // Retorna um HTML simples
  res.status(200).send(`
    <html>
      <head>
        <title>Sincronização Iniciada</title>
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f4f6f9; color: #333; }
          .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
          h2 { color: #0284c7; }
        </style>
      </head>
      <body>
        <div class="card">
           <h2>🔄 Sincronização Iniciada</h2>
           <p>A sincronização com o GLPI foi iniciada em segundo plano.</p>
           <p>Leva um curto período para as informações serem atualizadas completamente no banco de dados do BI.</p>
        </div>
      </body>
    </html>
  `);
});
