const STATUS_NAME_TO_ID = Object.freeze({
  novo: 1,
  atribuido: 2,
  planejado: 3,
  pendente: 4,
  solucionado: 5,
  fechado: 6,
  atrasado: 7,
});

const STATUS_ID_TO_NAME = Object.freeze(
  Object.fromEntries(
    Object.entries(STATUS_NAME_TO_ID).map(([key, value]) => [value, key])
  )
);

const OVERDUE_STATUS = STATUS_NAME_TO_ID.atrasado;

class TicketStatusMapper {
  toGlpiStatusId(statusName) {
    if (statusName === null || statusName === undefined) return null;

    return STATUS_NAME_TO_ID[String(statusName).toLowerCase()] ?? null;
  }

  toDataHubStatus(statusId) {
    if (statusId === null || statusId === undefined) return null;

    return STATUS_ID_TO_NAME[Number(statusId)] ?? null;
  }

  isOverdue(statusNameOrId) {
    if (typeof statusNameOrId === "number") {
      return statusNameOrId === OVERDUE_STATUS;
    }

    return String(statusNameOrId).toLowerCase() === "atrasado";
  }

  getAllStatusNames() {
    return Object.keys(STATUS_NAME_TO_ID);
  }
}

export default new TicketStatusMapper();