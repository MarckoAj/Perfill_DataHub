import pool from "../connection.js";

export async function runAuvoSeeds() {
    console.log("Iniciando Seeders do AUVO...");

    const seeds = [
        {
            name: "tasks_prioritys",
            query: `
                INSERT INTO tasks_prioritys (taskPriorityId, priorityDescription)
                SELECT taskPriorityId, priorityDescription FROM (
                    SELECT 1 AS taskPriorityId, 'Baixa' AS priorityDescription UNION ALL
                    SELECT 2 AS taskPriorityId, 'Média' AS priorityDescription UNION ALL
                    SELECT 3 AS taskPriorityId, 'Alta' AS priorityDescription
                ) AS temp
                WHERE NOT EXISTS (SELECT 1 FROM tasks_prioritys WHERE tasks_prioritys.taskPriorityId = temp.taskPriorityId)
            `
        },
        {
            name: "tasks_status",
            query: `
                INSERT INTO tasks_status (taskStatusId, statusDescriptions)
                SELECT taskStatusId, statusDescriptions FROM (
                    SELECT 1 AS taskStatusId, 'Aberta' AS statusDescriptions UNION ALL
                    SELECT 2 AS taskStatusId, 'Em Deslocamento' AS statusDescriptions UNION ALL
                    SELECT 3 AS taskStatusId, 'Check-in (Atendimento)' AS statusDescriptions UNION ALL
                    SELECT 4 AS taskStatusId, 'Check-out' AS statusDescriptions UNION ALL
                    SELECT 5 AS taskStatusId, 'Finalizada' AS statusDescriptions UNION ALL
                    SELECT 6 AS taskStatusId, 'Pausada' AS statusDescriptions
                ) AS temp
                WHERE NOT EXISTS (SELECT 1 FROM tasks_status WHERE tasks_status.taskStatusId = temp.taskStatusId)
            `
        },
        {
            name: "userstypes_auvo (placeholder)",
            query: `
                INSERT INTO userstypes_auvo (userTypeId, description)
                SELECT 0, 'Geral/Padrão'
                WHERE NOT EXISTS (SELECT 1 FROM userstypes_auvo WHERE userTypeId = 0)
            `
        },
        {
            name: "users_auvo (placeholder)",
            query: `
                INSERT INTO users_auvo (userId, name, userType, active)
                SELECT 0, 'Usuário Padrão', 0, 1
                WHERE NOT EXISTS (SELECT 1 FROM users_auvo WHERE userId = 0)
            `
        },
        {
            name: "segments_auvo (placeholder)",
            query: `
                INSERT INTO segments_auvo (segmentId, description)
                SELECT 0, 'Sem Segmento'
                WHERE NOT EXISTS (SELECT 1 FROM segments_auvo WHERE segmentId = 0)
            `
        },
        {
            name: "questionnaires_auvo (placeholder)",
            query: `
                INSERT INTO questionnaires_auvo (questionaryId, description)
                SELECT 0, 'Questionário Padrão'
                WHERE NOT EXISTS (SELECT 1 FROM questionnaires_auvo WHERE questionaryId = 0)
            `
        }
    ];

    for (const seed of seeds) {
        try {
            await pool.query(seed.query);
            console.log(`Seeders AUVO: Inserido '${seed.name}' com sucesso.`);
        } catch (error) {
            console.error(`Erro ao rodar seed AUVO '${seed.name}':`, error.message);
        }
    }
}
