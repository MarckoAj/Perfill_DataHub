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
    extracted.push(...syntax.found.map(label => ({
      label,
      normalizedLabel: this.normalizeLabel(label),
      source: "name_prefix"
    })));

    let changed = true;
    while (changed) {
      changed = false;
      for (const tag of tags) {
        const label = tag.label || tag;
        const pattern = new RegExp(`^(?:[*_~\`]+)?${this.escapeRegex(label)}(?:[*_~\`]+)?\\s*[-_:|]*\\s*`, "i");
        const match = text.match(pattern);
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

  async createTag({
    label,
    description = null,
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
}

export default new HubOperationalTagService();
