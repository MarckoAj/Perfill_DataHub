import pool from "../connection.js";

const operationalTagSeeds = [
  {
    label: "Desinstalado",
    normalizedLabel: "DESINSTALADO",
    description: "Tag operacional para pontos ou componentes com nomenclatura de desinstalacao.",
    color: "#f97316",
    hideByDefault: true,
    displayOrder: 10,
    aliases: [
      "Desinstalado",
      "Desinstalada",
      "Desinstalacao",
      "Desinstalação",
      "Desinstalaçaõ",
      "Desinstalar",
      "Camera desinstalada",
      "Câmera desinstalada",
      "Camera-desinstalada",
      "Câmera-desinstalada",
      "Caixa desinstalada",
      "Caixa-desinstalada",
      "PI desinstalado"
    ]
  },
  {
    label: "Inativo no AUVO",
    normalizedLabel: "INATIVO NO AUVO",
    description: "Tag operacional automatica para clientes AUVO com active = 0.",
    color: "#64748b",
    hideByDefault: true,
    displayOrder: 20,
    aliases: [
      "Inativo no AUVO"
    ]
  }
];

function normalizeLabel(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[*_`~´]+/g, "")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

async function upsertOperationalTag({ label, normalizedLabel, description, color, hideByDefault, displayOrder, aliases }) {
  await pool.query(
    `
      INSERT INTO hub_operational_tags (
        label, normalizedLabel, description, color, hideByDefault, displayOrder, isActive, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 'seed')
      ON DUPLICATE KEY UPDATE
        label = VALUES(label),
        description = VALUES(description),
        color = VALUES(color),
        hideByDefault = VALUES(hideByDefault),
        displayOrder = VALUES(displayOrder),
        isActive = 1,
        updatedAt = CURRENT_TIMESTAMP
    `,
    [label, normalizedLabel, description, color || null, hideByDefault ? 1 : 0, displayOrder || 0]
  );

  const [[tag]] = await pool.query(
    "SELECT tagId FROM hub_operational_tags WHERE normalizedLabel = ? LIMIT 1",
    [normalizedLabel]
  );

  if (!tag?.tagId) return;

  for (const alias of aliases) {
    await pool.query(
      `
        INSERT INTO hub_operational_tag_aliases (
          tagId, alias, normalizedAlias, matchType, removeFromName, isActive, createdBy
        ) VALUES (?, ?, ?, 'prefix', 1, 1, 'seed')
        ON DUPLICATE KEY UPDATE
          alias = VALUES(alias),
          removeFromName = VALUES(removeFromName),
          isActive = 1,
          updatedAt = CURRENT_TIMESTAMP
      `,
      [tag.tagId, alias, normalizeLabel(alias)]
    );
  }
}

export async function runHubOperationalTagSeeds() {
  console.log("Iniciando Seeders de tags operacionais do HUB...");

  for (const seed of operationalTagSeeds) {
    try {
      await upsertOperationalTag(seed);
      console.log(`Seeders HUB: Tag operacional '${seed.label}' garantida.`);
    } catch (error) {
      console.error(`Erro ao rodar seed de tag operacional '${seed.label}':`, error.message);
      throw error;
    }
  }
}
