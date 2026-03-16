import executeQuery from "../queries.js"


class Auxiliary {

  async createAllTables() {
    try {

      await this.createTableRequiredQuestionnaires()

    } catch (error) {
      throw error
    }
  }

  createTableRequiredQuestionnaires() {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`auvodb\`.\`requiredQuestionnaires\` (
        \`questionnaireId\` INT NOT NULL,
        \`TaskTypesRequirementId\` INT NOT NULL,
        PRIMARY KEY (\`questionnaireId\`, \`TaskTypesRequirementId\`),
        INDEX \`fk_questionnaires_auvo_has_tasks_types_requirements_tasks_t_idx\` (\`TaskTypesRequirementId\` ASC) VISIBLE,
        INDEX \`fk_questionnaires_auvo_has_tasks_types_requirements_questio_idx\` (\`questionnaireId\` ASC) VISIBLE,
        CONSTRAINT \`fk_questionnaires_auvo_has_tasks_types_requirements_questionn1\`
          FOREIGN KEY (\`questionnaireId\`)
          REFERENCES \`auvodb\`.\`questionnaires_auvo\` (\`questionaryId\`)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT \`fk_questionnaires_auvo_has_tasks_types_requirements_tasks_typ1\`
          FOREIGN KEY (\`TaskTypesRequirementId\`)
          REFERENCES \`auvodb\`.\`tasks_types_requirements\` (\`taskTypeRequirementId\`)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;
      `
    return executeQuery(sql)
  }

}
export default new Auxiliary()

