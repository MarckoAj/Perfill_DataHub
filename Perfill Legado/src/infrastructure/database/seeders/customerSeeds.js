import executeQuery from "../queries.js";


class CustomerSeeds {

    async addAllSeeds() {
        await this.seedDataCustomersAuvo()
    }

    seedDataCustomersAuvo() {
        const sql = `
     INSERT INTO customers_auvo (customerId,description,segmentId)
    SELECT customerId,description,segmentId
    FROM (
    SELECT 0 AS customerId,"Não atribuido" AS description, 0 AS segmentId
    )AS temp
    WHERE NOT EXISTS (
    SELECT 1 FROM customers_auvo WHERE customers_auvo.customerId = temp.customerId
    );
      `
        return executeQuery(sql)
    }
}

export default new CustomerSeeds()
