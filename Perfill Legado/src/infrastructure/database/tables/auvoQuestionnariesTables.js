import executeQuery from "../queries.js";



class Questionnaires {

  async createAllTables() {
    try {
      await this.createTableQuestionnaires()
      await this.createTableQuestionnairesQuestions()
      await this.createTableQuestionnairesAnswers()
      await this.createTableQuestionnariesReplies()

    } catch (error) {
      throw error

    }
  }


  async createTableQuestionnaires() {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`auvodb\`.\`questionnaires_auvo\` (
        \`questionaryId\` INT NOT NULL,
       \`description\` TEXT NULL,
        \`header\` TEXT NULL,
        \`footer\` TEXT NULL,
        \`creationDate\` DATETIME NULL,
        PRIMARY KEY (\`questionaryId\`))
         ENGINE = InnoDB;`
    return executeQuery(sql)
  }


  async createTableQuestionnairesQuestions() {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`auvodb\`.\`questionnairesQuestions\` (
        \`questionId\` INT NOT NULL,
        \`questionnaireId\` INT NOT NULL,
        \`answerType\` INT NULL,
        \`description\` TEXT NULL,
        \`subtitle\` TEXT NULL,
        \`requiredAnswer\` TINYINT NOT NULL,
        \`creationDate\` DATETIME NULL,
        INDEX \`fk_questionnairesQuestions_questionnaires_auvo1_idx\` (\`questionnaireId\` ASC) VISIBLE,
        PRIMARY KEY (\`questionId\`),
        CONSTRAINT \`fk_questionnairesQuestions_questionnaires_auvo1\`
          FOREIGN KEY (\`questionnaireId\`)
          REFERENCES \`auvodb\`.\`questionnaires_auvo\` (\`questionaryId\`)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;
      `
    return executeQuery(sql)
  }


  async createTableQuestionnairesAnswers() {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`auvodb\`.\`questionnairesAnswers\` (
        \`questionnairesAnswersId\` INT NOT NULL,
        \`questionnairesQuestionsId\` INT NOT NULL,
        \`questionId\` INT NULL,
        \`replyId\` INT NULL,
        PRIMARY KEY (\`questionnairesAnswersId\`, \`questionnairesQuestionsId\`),
        INDEX \`fk_questionnairesAnswers_questionnairesQuestions1_idx\` (\`questionnairesQuestionsId\` ASC) VISIBLE,
        CONSTRAINT \`fk_questionnairesAnswers_questionnairesQuestions1\`
          FOREIGN KEY (\`questionnairesQuestionsId\`)
          REFERENCES \`auvodb\`.\`questionnairesQuestions\` (\`questionId\`)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;
       `
    return executeQuery(sql)
  }


  async createTableQuestionnariesReplies() {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`auvodb\`.\`questionnariesReplies\` (
        \`idquestionnariesReplies\` INT NOT NULL,
        \`questionnairesAnswersId\` INT NOT NULL,
        \`replyId\` INT NULL,
        \`relpy\` TEXT NULL,
        \`replyDate\` DATETIME NULL,
        PRIMARY KEY (\`idquestionnariesReplies\`, \`questionnairesAnswersId\`),
        INDEX \`fk_questionnariesReplies_questionnairesAnswers1_idx\` (\`questionnairesAnswersId\` ASC) VISIBLE,
        CONSTRAINT \`fk_questionnariesReplies_questionnairesAnswers1\`
          FOREIGN KEY (\`questionnairesAnswersId\`)
          REFERENCES \`auvodb\`.\`questionnairesAnswers\` (\`questionnairesAnswersId\`)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;
      `
    return executeQuery(sql)
  }

}


export default new Questionnaires()