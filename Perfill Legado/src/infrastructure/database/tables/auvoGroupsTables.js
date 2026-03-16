import executeQuery from "../queries.js"


class Groups {

  async createAllTables() {

    try {

      await this.createTableGroups()

    } catch (error) {
      throw error
    }

  }

  createTableGroups() {
    const sql = `
        CREATE TABLE IF NOT EXISTS \`auvodb\`.\`groups_auvo\` (
          \`groupId\` INT NOT NULL,
          \`description\` TEXT NULL,
          PRIMARY KEY (\`groupId\`))
        ENGINE = InnoDB; `
    return executeQuery(sql)
  }

}
export default new Groups()
