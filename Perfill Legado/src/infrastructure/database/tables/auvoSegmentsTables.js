import executeQuery from "../queries.js"

class Segments {
    async createAllTables() {
        try {

            await this.createTableSegments()

        } catch (error) {
            throw error
        }

    }

    async createTableSegments() {
        const sql = `CREATE TABLE IF NOT EXISTS \`auvodb\`.\`segments_auvo\` (
            \`segmentId\` INT NOT NULL,
            \`description\` VARCHAR(100) NULL,
            \`registrationDate\` DATETIME NULL,
            PRIMARY KEY (\`segmentId\`))
          ENGINE = InnoDB;`
        return executeQuery(sql)
    }
}
export default new Segments()
const teste = new Segments()
console.log(await teste.createAllTables())
