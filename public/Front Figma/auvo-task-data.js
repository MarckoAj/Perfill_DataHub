// Dados Mock para Tarefas Auvo
const mockAuvoTask = {
  taskId: "AUVO-001",
  title: "PONTO INOPERANTE",
  fromUser: "Operador NOC",
  toUser: "Técnico Campo",
  address: "00-000 - Rua Nome Bairro",
  taskType: "Manutenção Corretiva",
  ticketId: "00000",
  priority: "Alta",
  questionnaireName: "Checklist Câmera PTZ",
  orientation: "Validar alimentação elétrica e funcionamento da câmera.",
  report: "Equipamento encontrado offline no momento da visita.",
  observations: "Necessária possível substituição da fonte.",
  attachments: [
    {
      id: 1,
      type: "image",
      url: "https://picsum.photos/600/400?1",
      name: "Foto do equipamento"
    },
    {
      id: 2,
      type: "image",
      url: "https://picsum.photos/600/400?2",
      name: "Localização do ponto"
    },
    {
      id: 3,
      type: "image",
      url: "https://picsum.photos/600/400?3",
      name: "Status da conexão"
    },
    {
      id: 4,
      type: "image",
      url: "https://picsum.photos/600/400?4",
      name: "Teste realizado"
    }
  ],
  questionnaire: [
    {
      type: "Texto",
      question: "Equipamento ligado?",
      answer: "Sim"
    },
    {
      type: "Foto",
      question: "Evidência do rack",
      answer: "2 imagens anexadas"
    },
    {
      type: "Checklist",
      question: "Nobreak operacional?",
      answer: "Validado"
    },
    {
      type: "Seleção",
      question: "Prioridade da falha",
      answer: "Alta"
    }
  ]
};

// Função para carregar dados da tarefa Auvo
function loadAuvoTaskData(alertId, taskId) {
  console.log(`[Auvo Task] Carregando dados mock para alerta: ${alertId}, tarefa: ${taskId}`);
  
  // Simulação de loading
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockAuvoTask);
    }, 500);
  });
}
