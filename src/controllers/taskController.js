import taskRepository from "../repositories/taskRepository.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getInternalTasks = asyncHandler(async (req, res) => {
  const { externalId } = req.query;

  if (!externalId) {
    return res.status(400).json({ 
      success: false, 
      error: "O parâmetro externalId é obrigatório." 
    });
  }

  try {
    const tasks = await taskRepository.getTasksByExternalId(externalId);
    
    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error("[TaskController] Erro ao buscar tarefas:", error.message);
    res.status(500).json({ 
      success: false, 
      error: "Erro interno ao buscar tarefas." 
    });
  }
});
