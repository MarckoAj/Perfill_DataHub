import hubOperationalTagRepository from "../repositories/hubOperationalTagRepository.js";

class HubOperationalTagService {
  normalizeLabel(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[*_`~]+/g, "")
      .replace(/[^A-Za-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();
  }

  cleanLabel(value) {
    return String(value || "")
      .replace(/[*_`~]+/g, "")
      .trim()
      .replace(/\s+/g, " ");
  }

  escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  getTagAliases(tag) {
    const aliases = [
      {
        alias: tag.label || tag,
        normalizedAlias: tag.normalizedLabel || this.normalizeLabel(tag.label || tag),
        matchType: "prefix",
        removeFromName: true
      },
      ...(Array.isArray(tag.aliases) ? tag.aliases : [])
    ];

    const unique = new Map();
    for (const alias of aliases) {
      const normalizedAlias = alias.normalizedAlias || this.normalizeLabel(alias.alias);
      if (!normalizedAlias) continue;
      unique.set(`${normalizedAlias}|${alias.matchType || "prefix"}`, {
        alias: alias.alias || normalizedAlias,
        normalizedAlias,
        matchType: alias.matchType || "prefix",
        removeFromName: alias.removeFromName !== false
      });
    }

    return [...unique.values()];
  }

  expandRegexChar(char) {
    const map = {
      A: "[AÀÁÂÃÄÅ]",
      C: "[CÇ]",
      E: "[EÈÉÊË]",
      I: "[IÌÍÎÏ]",
      O: "[OÒÓÔÕÖ]",
      U: "[UÙÚÛÜ]"
    };
    return map[char] || this.escapeRegex(char);
  }

  buildFlexibleWordPattern(word) {
    return String(word || "")
      .toUpperCase()
      .split("")
      .map(char => this.expandRegexChar(char))
      .join("");
  }

  buildPrefixPattern(alias) {
    const words = this.normalizeLabel(alias).split(" ").filter(Boolean);
    if (words.length === 0) return null;
    const flexibleAlias = words.map(word => this.buildFlexibleWordPattern(word)).join("[^A-Za-z0-9]+");
    return new RegExp(`^(?:[*_~\`´]+)?${flexibleAlias}(?:[*_~\`´]+)?\\s*[-_:|/]*\\s*`, "i");
  }

  findConfiguredTagForLabel(label, tags = []) {
    const normalizedLabel = this.normalizeLabel(label);
    if (!normalizedLabel) return null;

    return tags.find(tag => {
      if (this.normalizeLabel(tag.normalizedLabel || tag.label || tag) === normalizedLabel) return true;
      return this.getTagAliases(tag).some(alias => alias.normalizedAlias === normalizedLabel);
    }) || null;
  }

  stripLeadingTagSyntax(value) {
    let text = String(value || "").trim();
    const found = [];

    let changed = true;
    while (changed) {
      changed = false;
      const match = text.match(/^([*_`~]{1,3})([^*_`~]{2,80})\1\s*/);
      if (match) {
        found.push(this.cleanLabel(match[2]));
        text = text.slice(match[0].length).trim();
        changed = true;
      }
    }

    return { text, found };
  }

  extractTags(value, tags = []) {
    let text = String(value || "").trim();
    const extracted = [];
    const syntax = this.stripLeadingTagSyntax(text);
    text = syntax.text;
    extracted.push(...syntax.found.map(label => {
      const configuredTag = this.findConfiguredTagForLabel(label, tags);
      if (configuredTag) {
        return {
          label: configuredTag.label || label,
          normalizedLabel: this.normalizeLabel(configuredTag.normalizedLabel || configuredTag.label || label),
          source: "configured_tag"
        };
      }

      return {
        label,
        normalizedLabel: this.normalizeLabel(label),
        source: "name_prefix"
      };
    }));

    let changed = true;
    while (changed) {
      changed = false;
      for (const tag of tags) {
        const label = tag.label || tag;
        const aliases = this.getTagAliases(tag);
        const match = aliases
          .filter(alias => alias.matchType === "prefix")
          .map(alias => this.buildPrefixPattern(alias.alias))
          .filter(Boolean)
          .map(pattern => text.match(pattern))
          .find(Boolean);

        if (match) {
          extracted.push({
            label,
            normalizedLabel: this.normalizeLabel(label),
            source: "configured_tag"
          });
          text = text.slice(match[0].length).trim();
          changed = true;
          break;
        }
      }
    }

    const unique = new Map();
    for (const tag of extracted) {
      if (!tag.normalizedLabel) continue;
      unique.set(tag.normalizedLabel, tag);
    }

    return {
      cleanName: text,
      tags: [...unique.values()]
    };
  }

  normalizeNameForComparison(value, tags = []) {
    return this.extractTags(value, tags).cleanName;
  }

  async listTags(options = {}) {
    return hubOperationalTagRepository.listTags(options);
  }

  async previewName(value) {
    const tags = await this.listTags();
    return this.extractTags(value, tags);
  }

  async createTag({
    label,
    description = null,
    color = null,
    hideByDefault = false,
    displayOrder = 0,
    aliases = [],
    createdBy = "admin_panel",
    entityId = null,
    addToHistory = false,
    comment = ""
  }) {
    const clean = this.cleanLabel(label);
    const normalizedLabel = this.normalizeLabel(clean);

    if (!normalizedLabel) {
      return {
        success: false,
        status: "invalid",
        message: "Tag operacional invalida"
      };
    }

    const tag = await hubOperationalTagRepository.upsertTag({
      label: clean,
      normalizedLabel,
      description,
      color: this.cleanColor(color),
      hideByDefault,
      displayOrder: Number(displayOrder) || 0,
      createdBy
    });

    await this.syncAliasesFromInput({
      tagId: tag.tagId,
      aliases,
      createdBy
    });

    if (addToHistory && entityId) {
      await hubOperationalTagRepository.insertTagHistory({
        entityId,
        action: "add_operational_tag",
        label: clean,
        comment,
        createdBy
      });
    }

    return {
      success: true,
      status: "saved",
      data: tag
    };
  }

  cleanColor(value) {
    const text = String(value || "").trim();
    return /^#[0-9A-Fa-f]{6}$/.test(text) ? text : null;
  }

  normalizeAliasInput(aliases) {
    const items = Array.isArray(aliases)
      ? aliases
      : String(aliases || "").split(/\r?\n|,/);

    const unique = new Map();
    for (const item of items) {
      const alias = typeof item === "string" ? item.trim() : String(item?.alias || "").trim();
      if (!alias) continue;
      const normalizedAlias = this.normalizeLabel(alias);
      if (!normalizedAlias) continue;
      unique.set(normalizedAlias, {
        alias,
        normalizedAlias,
        matchType: "prefix",
        removeFromName: true
      });
    }

    return [...unique.values()];
  }

  async syncAliasesFromInput({ tagId, aliases = [], createdBy = "admin_panel" }) {
    const safeTagId = Number(tagId);
    if (!Number.isInteger(safeTagId) || safeTagId <= 0) return;

    for (const alias of this.normalizeAliasInput(aliases)) {
      await hubOperationalTagRepository.upsertTagAlias({
        tagId: safeTagId,
        ...alias,
        createdBy
      });
    }
  }

  async updateTag({
    tagId,
    label,
    description = null,
    color = null,
    hideByDefault = false,
    displayOrder = 0,
    aliases = [],
    createdBy = "admin_panel"
  }) {
    const safeTagId = Number(tagId);
    const clean = this.cleanLabel(label);
    const normalizedLabel = this.normalizeLabel(clean);

    if (!Number.isInteger(safeTagId) || safeTagId <= 0 || !normalizedLabel) {
      return {
        success: false,
        status: "invalid",
        message: "Tag operacional invalida"
      };
    }

    const tag = await hubOperationalTagRepository.updateTag({
      tagId: safeTagId,
      label: clean,
      normalizedLabel,
      description,
      color: this.cleanColor(color),
      hideByDefault,
      displayOrder: Number(displayOrder) || 0
    });

    await this.syncAliasesFromInput({
      tagId: safeTagId,
      aliases,
      createdBy
    });

    return {
      success: true,
      status: "updated",
      data: tag
    };
  }

  async createTagAlias({ tagId, alias, createdBy = "admin_panel" }) {
    const safeTagId = Number(tagId);
    const [normalizedAlias] = this.normalizeAliasInput([alias]);

    if (!Number.isInteger(safeTagId) || safeTagId <= 0 || !normalizedAlias) {
      return {
        success: false,
        status: "invalid",
        message: "Alias invalido"
      };
    }

    await hubOperationalTagRepository.upsertTagAlias({
      tagId: safeTagId,
      ...normalizedAlias,
      createdBy
    });

    return {
      success: true,
      status: "saved"
    };
  }

  async removeTagAlias({ aliasId }) {
    const safeAliasId = Number(aliasId);
    if (!Number.isInteger(safeAliasId) || safeAliasId <= 0) {
      return {
        success: false,
        status: "invalid",
        message: "aliasId invalido"
      };
    }

    const alias = await hubOperationalTagRepository.deactivateTagAlias(safeAliasId);
    if (!alias) {
      return {
        success: false,
        status: "not_found",
        message: "Alias nao encontrado"
      };
    }

    return {
      success: true,
      status: "removed",
      data: alias
    };
  }

  async removeTag({
    tagId,
    createdBy = "admin_panel",
    entityId = null,
    addToHistory = false,
    comment = ""
  }) {
    const safeTagId = Number(tagId);
    if (!Number.isInteger(safeTagId) || safeTagId <= 0) {
      return {
        success: false,
        status: "invalid",
        message: "tagId invalido"
      };
    }

    const tag = await hubOperationalTagRepository.deactivateTag(safeTagId);
    if (!tag) {
      return {
        success: false,
        status: "not_found",
        message: "Tag operacional nao encontrada"
      };
    }

    if (addToHistory && entityId) {
      await hubOperationalTagRepository.insertTagHistory({
        entityId,
        action: "remove_operational_tag",
        label: tag.label,
        comment,
        createdBy
      });
    }

    return {
      success: true,
      status: "removed",
      data: tag
    };
  }

  async assignEntityTag({
    entityId,
    tagId,
    createdBy = "admin_panel",
    addToHistory = true,
    comment = ""
  }) {
    const safeEntityId = Number(entityId);
    const safeTagId = Number(tagId);
    if (!Number.isInteger(safeEntityId) || safeEntityId <= 0) {
      return {
        success: false,
        status: "invalid",
        message: "entityId invalido"
      };
    }
    if (!Number.isInteger(safeTagId) || safeTagId <= 0) {
      return {
        success: false,
        status: "invalid",
        message: "tagId invalido"
      };
    }

    const tag = await hubOperationalTagRepository.assignEntityTag({
      entityId: safeEntityId,
      tagId: safeTagId,
      createdBy
    });

    if (!tag) {
      return {
        success: false,
        status: "not_found",
        message: "Tag operacional nao encontrada"
      };
    }

    if (addToHistory) {
      await hubOperationalTagRepository.insertTagHistory({
        entityId: safeEntityId,
        action: "assign_operational_tag",
        label: tag.label,
        comment,
        createdBy
      });
    }

    return {
      success: true,
      status: "assigned",
      data: tag
    };
  }

  async unassignEntityTag({
    entityId,
    tagId,
    createdBy = "admin_panel",
    addToHistory = true,
    comment = ""
  }) {
    const safeEntityId = Number(entityId);
    const safeTagId = Number(tagId);
    if (!Number.isInteger(safeEntityId) || safeEntityId <= 0) {
      return {
        success: false,
        status: "invalid",
        message: "entityId invalido"
      };
    }
    if (!Number.isInteger(safeTagId) || safeTagId <= 0) {
      return {
        success: false,
        status: "invalid",
        message: "tagId invalido"
      };
    }

    const tag = await hubOperationalTagRepository.unassignEntityTag({
      entityId: safeEntityId,
      tagId: safeTagId
    });

    if (!tag) {
      return {
        success: false,
        status: "not_found",
        message: "Tag operacional nao encontrada"
      };
    }

    if (addToHistory) {
      await hubOperationalTagRepository.insertTagHistory({
        entityId: safeEntityId,
        action: "unassign_operational_tag",
        label: tag.label,
        comment,
        createdBy
      });
    }

    return {
      success: true,
      status: "unassigned",
      data: tag
    };
  }
}

export default new HubOperationalTagService();
