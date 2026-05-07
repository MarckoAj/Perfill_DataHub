import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RuleEngine {
  constructor() {
    this.rules = [];
  }

  /**
   * Carrega todas as regras do diretório /rules
   */
  async loadRules() {
    this.rules = [];
    const rulesDir = path.join(__dirname, 'rules');
    
    if (!fs.existsSync(rulesDir)) {
      console.warn('[RuleEngine] Diretório de regras não encontrado:', rulesDir);
      return;
    }

    const files = fs.readdirSync(rulesDir).filter(f => f.endsWith('.rule.js'));

    for (const file of files) {
      try {
        const filePath = path.join(rulesDir, file);
        // Usar import dinâmico com formatação de path para ES Modules
        const ruleModule = await import(`file://${filePath}`);
        
        if (ruleModule.default && typeof ruleModule.default.evaluate === 'function') {
          this.rules.push(ruleModule.default);
        } else {
          console.warn(`[RuleEngine] Regra ignorada (formato inválido): ${file}`);
        }
      } catch (err) {
        console.error(`[RuleEngine] Erro ao carregar regra ${file}:`, err);
      }
    }
    console.log(`[RuleEngine] ${this.rules.length} regras carregadas com sucesso.`);
  }

  /**
   * Avalia todas as regras carregadas contra o contexto fornecido
   * @param {Object} context Objeto contendo os dados do contexto unificado (ex: ticket, tasksAuvo)
   * @returns {Array} Array de resultados das regras avaliadas
   */
  evaluateAll(context) {
    const results = [];

    for (const rule of this.rules) {
      try {
        const isConditionMet = rule.evaluate(context);
        
        results.push({
          ruleId: rule.code,
          severity: rule.severity,
          condition: isConditionMet,
          description: rule.description || rule.name,
          source: rule.source || 'SYSTEM'
        });
      } catch (err) {
        console.error(`[RuleEngine] Erro ao avaliar regra ${rule.code}:`, err);
      }
    }

    return results;
  }
}

export default new RuleEngine();
