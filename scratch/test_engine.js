import ruleEngine from '../src/engine/RuleEngine.js';

async function run() {
  await ruleEngine.loadRules();
  console.log('Regras carregadas:', ruleEngine.rules.map(r => r.code));
  
  const fakeContext = {
    ticket: {
      status: 'novo',
      statusSla: 'Vencido',
      ultimaTarefa: 'Sem tarefas'
    },
    timestamps: {
      elapsed: 600000 // 10 minutes
    },
    tasksAuvo: []
  };

  const results = ruleEngine.evaluateAll(fakeContext);
  console.log('Resultados da avaliação:');
  console.log(JSON.stringify(results, null, 2));
}

run();
