import asyncHandler from "../utils/asyncHandler.js";
import glpiTickets from "../service/glpi_service.js";
import ticketRepository from "../repositories/ticketRepository.js";

export const getTicketsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const tickets = await glpiTickets.getTicketsByStatus(status);
  res.status(200).json(tickets);
});

export const getTicketsForBi = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  // Agora buscamos do banco local para performance máxima com os 27k+ tickets
  const tickets = await ticketRepository.getAllTickets(startDate, endDate);
  res.status(200).json(tickets);
});
