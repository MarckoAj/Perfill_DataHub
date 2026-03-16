import executeQuery from "../queries.js";

class SegmentSeeds {

    async addAllSeeds() {
        await this.seedDataSegments()
    }

    seedDataSegments() {
        const sql = `
   INSERT INTO segments_auvo (segmentId, description, registrationDate)
   SELECT *
   FROM (SELECT 0 AS segmentId, "Nao Atribuido" AS description, NOW() AS registrationDate)
    AS  TEMP
   WHERE NOT EXISTS (
       SELECT segmentId FROM segments_auvo WHERE segmentId = 0
   )
   UNION ALL
   SELECT *
   FROM (SELECT 22923 AS segmentId, "Selecione" AS description, NOW() AS registrationDate) AS TEMP
   WHERE NOT EXISTS (
       SELECT segmentId FROM segments_auvo WHERE segmentId = 22923
   );
   `
        return executeQuery(sql)
    }

}

export default new SegmentSeeds()