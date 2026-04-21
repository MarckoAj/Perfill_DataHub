import pool from "../database/connection.js";

class DashboardRepository {
  async getAuvoGrafanaData() {
    // Retorna exatamente a estrutura que o Grafana consumia do AUVO
    const query = `
      SELECT 
          t.externalId AS "Ticket",
          c.description AS "Nome_Cliente",
          t.tasksTypesId AS "ID_Tarefa",    
          u.name AS "Usuario_Atendimento",
          DATE_ADD(t.TaskDate, INTERVAL +1 HOUR) AS "Previsão",
          DATE_ADD(t.checkOutDate, INTERVAL +1 HOUR) AS "Finalizado",
          t.taskUrl AS "Link",
          CASE WHEN t.taskStatusID = 5 THEN 'Sim' ELSE 'Não' END AS "Tarefa_Finalizada",
          CASE WHEN t.taskStatusID = 3 THEN 'Sim' ELSE 'Não' END AS "Tecnico_Local"
      FROM tasks_auvo t
      LEFT JOIN customers_auvo c ON t.customerId = c.customerId
      LEFT JOIN users_auvo u ON t.userToId = u.userId
      WHERE t.tasksTypesId NOT IN (144733, 210031, 210030)
      AND t.TaskDate >= NOW() - INTERVAL 30 DAY
      ORDER BY t.TaskDate DESC;
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  async getGlpiGrafanaData(filters = {}) {
    const { status = '', projeto = '', tipo = '', tecnico = '', categoria = '' } = filters;

    // Adaptado perfeitamente baseando-se no layout limpo e otimizado do DataHub
    const query = `
      SELECT  
        DATE_ADD(t.dataCriacao, INTERVAL -3 HOUR) AS "Data de Criação",
        DATE_ADD(t.dataAtualizacao, INTERVAL -3 HOUR) AS "Última Atualização",

        CASE
          WHEN TIMESTAMPDIFF(HOUR, t.dataAtualizacao, NOW()) <= 2 THEN 'RECENTE'
          WHEN TIMESTAMPDIFF(HOUR, t.dataAtualizacao, NOW()) <= 3 THEN 'VERIFICAR'
          ELSE 'ATUALIZAR'
        END AS "Status Atualização",

        TRIM(CAST(t.ticketId AS CHAR)) AS "Ticket",
        t.titulo AS "Chamado",
        t.descricao AS "Descrição",

        tt.content AS "Última Tarefa",
        DATE_ADD(tt.begin, INTERVAL -3 HOUR) AS "Início Tarefa",
        DATE_ADD(tt.end, INTERVAL -3 HOUR) AS "Fim Tarefa",
        tt.nomeAutor AS "Autor Tarefa",
        
        t.nomeCliente AS "Cliente Local",
        t.nomeTecnico AS "Técnico",

        t.tempoSla AS "Tempo para Resolver",

        CONCAT('https://glpi.perfilltecnologia.com.br/front/ticket.form.php?id=', t.ticketId) AS "taskGLPI",

        t.projeto AS "Projeto",
        t.categoriaSla AS "Categoria",
        t.statusSla AS "Status do SLA",
        t.status AS "Status do Chamado",
        t.tipo AS "TIPO",

        ua.name AS "Técnico Auvo",
        ta.taskUrl AS "Link Auvo",
        CASE
          WHEN ta.taskStatusID = 1 THEN 'Aberto'
          WHEN ta.taskStatusID = 2 THEN 'Em deslocamento'
          WHEN ta.taskStatusID = 3 THEN 'No Local'
          WHEN ta.taskStatusID = 4 THEN 'Pausada'
          WHEN ta.taskStatusID = 5 THEN 'Finalizada'
          WHEN ta.taskStatusID = 6 THEN 'Pausada'
          ELSE ta.taskStatusID
        END AS "Status Auvo"

      FROM tickets t

      /* Pega apenas a tarefa mais recente atrelada ao chamado */
      LEFT JOIN glpi_tickettasks tt ON tt.id = (
          SELECT tt2.id
          FROM glpi_tickettasks tt2
          WHERE tt2.tickets_id = t.ticketId
          ORDER BY tt2.date_mod DESC
          LIMIT 1
      )

      /* Relacionamento com tarefas AUVO */
      LEFT JOIN (
          SELECT t1.*, ROW_NUMBER() OVER(PARTITION BY t1.externalId ORDER BY t1.TaskDate DESC) as rn
          FROM tasks_auvo t1
          WHERE t1.externalId IS NOT NULL 
            AND t1.externalId != ''
            AND t1.tasksTypesId NOT IN (144733, 210031, 210030)
      ) ta ON ta.externalId = t.ticketId AND ta.rn = 1
      LEFT JOIN users_auvo ua ON ta.userToId = ua.userId

      WHERE  
          ( ? = '' OR FIND_IN_SET(t.status, ?) > 0 )
        AND 
          ( ? = '' OR FIND_IN_SET(t.projeto, ?) > 0 )
        AND 
          ( ? = '' OR FIND_IN_SET(t.tipo, ?) > 0 )
        AND 
          ( ? = '' OR t.nomeTecnico = ? )
        AND 
          ( ? = '' OR FIND_IN_SET(t.categoriaSla, ?) > 0 )
      
      ORDER BY t.dataCriacao DESC;
    `;

    const values = [
      status, status,
      projeto, projeto,
      tipo, tipo,
      tecnico, tecnico,
      categoria, categoria
    ];

    const [rows] = await pool.query(query, values);
    return rows;
  }
}

export default new DashboardRepository();
