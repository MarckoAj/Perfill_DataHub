import pool from "../database/connection.js";

export default class BaseRepository {
  /**
   * Executa um upsert/insert em lote usando a mesma query genérica
   * @param {Array} items Lista de itens a serem inseridos
   * @param {String} query Query SQL a ser executada
   * @param {Function} getValuesFn Função que recebe cada item e retorna o array ordenado de valores
   * @param {String} entityName Nome da entidade para exibição no log de erro (ex: "usuário AUVO")
   */
  async executeUpsertMany(items, query, getValuesFn, entityName) {
    const metrics = { inserts: 0, updates: 0, skips: 0, errors: 0, errorLogs: [] };
    if (!items || items.length === 0) return metrics;

    for (const item of items) {
      const values = getValuesFn(item);
      try {
        const [result] = await pool.query(query, values);
        if (result.affectedRows === 1) metrics.inserts++;
        else if (result.affectedRows === 2) metrics.updates++;
        else metrics.skips++;
      } catch (error) {
        metrics.errors++;
        const itemId = item.id || item.userID || item.taskID || item.questionaryId || item.groupId || item.tasksTypesId || 'desconhecido';
        metrics.errorLogs.push({ entityName, entityId: itemId, message: error.sqlMessage || error.message });
        console.error(`Erro ao salvar ${entityName} ${itemId}:`, error.sqlMessage || error.message);
      }
    }
    return metrics;
  }

  /**
   * Verifica rapidamente se uma chave primária externa existe em uma tabela
   * @param {String} tableName Nome da tabela
   * @param {String} idColumn Nome da coluna referente ao ID (ex: userId)
   * @param {any} entityId Valor do ID que estamos buscando
   * @returns {Promise<boolean>} Retorna true se encontrar
   */
  async checkExists(tableName, idColumn, entityId) {
    if (entityId === null || entityId === undefined) return false;
    try {
      const query = `SELECT 1 FROM ${tableName} WHERE ${idColumn} = ? LIMIT 1`;
      const [rows] = await pool.query(query, [entityId]);
      return rows.length > 0;
    } catch (err) {
      console.error(`Erro ao verificar existência na tabela ${tableName} [ID ${entityId}]:`, err.message);
      return false;
    }
  }
}
