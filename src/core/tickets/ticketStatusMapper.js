const STATUS_NAME_TO_ID = Object.freeze({
  novo: 1,
  atribuido: 2,
  planejado: 3,
  pendente: 4,
  solucionado: 5,
  fechado: 6,
  atrasado: 7,
});

const STATUS_ID_TO_NAME = Object.freeze({
  1: "novo",
  2: "atribuido",
  3: "planejado",
  4: "pendente",
  5: "solucionado",
  6: "fechado",
  7: "atrasado",
});

class TicketStatusMapper {
  toGlpiStatusId(statusName) {
    if (!statusName) return null;
    return STATUS_NAME_TO_ID[String(statusName).toLowerCase()] || null;
  }

  toDataHubStatus(statusId) {
    if (statusId === null || statusId === undefined) return "indefinido";
    return STATUS_ID_TO_NAME[Number(statusId)] || "indefinido";
  }

  isOverdue(statusNameOrId) {
    if (typeof statusNameOrId === "number") {
      return statusNameOrId === 7;
    }

    return String(statusNameOrId).toLowerCase() === "atrasado";
  }

  getAllStatusNames() {
    return Object.keys(STATUS_NAME_TO_ID);
  }
}

export default new TicketStatusMapper();
