import hubMatchingRepository from "../repositories/hubMatchingRepository.js";
import hubOperationalTagService from "./hubOperationalTagService.js";

const VALID_MODES = new Set(["id", "name", "both"]);
const VALID_STATUSES = new Set([
  "sem_vinculo",
  "match_id",
  "match_nome",
  "match_ambos",
  "ambiguo",
  "baixo_score",
  "ja_vinculado"
]);

class HubMatchingService {
  normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  extractDeviceCode(value) {
    const match = String(value || "").match(/(?:^|[^0-9])(\d{2}-\d{3})(?=[^0-9]|$)/);
    return match ? match[1] : null;
  }

  levenshteinDistance(a, b) {
    if (a === b) return 0;
    if (!a) return b.length;
    if (!b) return a.length;

    const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    const current = new Array(b.length + 1);

    for (let i = 1; i <= a.length; i += 1) {
      current[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        current[j] = Math.min(
          previous[j] + 1,
          current[j - 1] + 1,
          previous[j - 1] + cost
        );
      }
      for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
    }

    return previous[b.length];
  }

  tokenScore(a, b) {
    const left = new Set(a.split(" ").filter(Boolean));
    const right = new Set(b.split(" ").filter(Boolean));
    if (left.size === 0 || right.size === 0) return 0;

    const intersection = [...left].filter(token => right.has(token)).length;
    const union = new Set([...left, ...right]).size;
    return Math.round((intersection / union) * 100);
  }

  nameScore(leftName, rightName, operationalTags = []) {
    const leftComparable = hubOperationalTagService.normalizeNameForComparison(leftName, operationalTags);
    const rightComparable = hubOperationalTagService.normalizeNameForComparison(rightName, operationalTags);
    const left = this.normalizeText(leftComparable);
    const right = this.normalizeText(rightComparable);
    if (!left || !right) return 0;
    if (left === right) return 100;

    const maxLength = Math.max(left.length, right.length);
    const distance = this.levenshteinDistance(left, right);
    const editScore = Math.round(((maxLength - distance) / maxLength) * 100);
    const tokenScore = this.tokenScore(left, right);
    const codeLeft = this.extractDeviceCode(leftName);
    const codeRight = this.extractDeviceCode(rightName);
    const codeBoost = codeLeft && codeRight && codeLeft === codeRight ? 98 : 0;

    return Math.max(editScore, tokenScore, codeBoost);
  }

  buildCandidate(device, score, matchOrigin) {
    return {
      glpiDeviceId: device.deviceId,
      glpiName: device.name,
      glpiAuvoCustomerId: device.auvoCustomerId,
      locationId: device.locationId,
      locationName: device.locationName,
      status: device.status,
      score,
      matchOrigin
    };
  }

  resolvePreview({ entity, devicesByAuvoId, devices, mode, minScore, operationalTags = [] }) {
    if (entity.alreadyLinked) {
      const linkedDevice = devices.find(device => device.deviceId === entity.linkedGlpiDeviceId);
      return {
        glpiDeviceId: entity.linkedGlpiDeviceId,
        glpiName: linkedDevice?.name || null,
        matchOrigin: entity.linkedMatchStrategy || "existing_link",
        score: entity.linkedConfidenceScore ?? 100,
        status: "ja_vinculado",
        canAutoConfirm: false,
        requiresManualReview: false,
        candidates: linkedDevice ? [this.buildCandidate(linkedDevice, entity.linkedConfidenceScore ?? 100, "existing_link")] : []
      };
    }

    const auvoId = entity.auvoCustomerId;
    const idCandidates = auvoId ? (devicesByAuvoId.get(auvoId) || []) : [];
    const baseName = entity.auvoName || entity.hubName;
    const baseDeviceCode = this.extractDeviceCode(baseName);
    const nameCandidateDevices = baseDeviceCode
      ? devices.filter(device => device.deviceCode === baseDeviceCode)
      : [];
    const scoredNameCandidates = nameCandidateDevices
      .map(device => this.buildCandidate(device, this.nameScore(baseName, device.name, operationalTags), "name"))
      .filter(candidate => candidate.score > 0)
      .sort((a, b) => b.score - a.score || String(a.glpiDeviceId).localeCompare(String(b.glpiDeviceId)));

    if (mode === "id") {
      if (idCandidates.length > 1) {
        return {
          glpiDeviceId: null,
          glpiName: null,
          matchOrigin: "id",
          score: 100,
          status: "ambiguo",
          canAutoConfirm: false,
          requiresManualReview: true,
          candidates: idCandidates.map(device => this.buildCandidate(device, 100, "id"))
        };
      }

      if (idCandidates.length === 1) {
        const candidate = this.buildCandidate(idCandidates[0], 100, "id");
        return {
          glpiDeviceId: candidate.glpiDeviceId,
          glpiName: candidate.glpiName,
          matchOrigin: "id",
          score: 100,
          status: "match_id",
          canAutoConfirm: true,
          requiresManualReview: false,
          candidates: [candidate]
        };
      }

      return this.emptyPreview("sem_vinculo");
    }

    if (mode === "name") {
      const strongCandidates = scoredNameCandidates.filter(candidate => candidate.score >= minScore);
      if (strongCandidates.length > 1) {
        return {
          glpiDeviceId: null,
          glpiName: null,
          matchOrigin: "name",
          score: strongCandidates[0].score,
          status: "ambiguo",
          canAutoConfirm: false,
          requiresManualReview: true,
          candidates: strongCandidates.slice(0, 10)
        };
      }

      if (strongCandidates.length === 1) {
        const candidate = strongCandidates[0];
        return {
          glpiDeviceId: candidate.glpiDeviceId,
          glpiName: candidate.glpiName,
          matchOrigin: "name",
          score: candidate.score,
          status: "match_nome",
          canAutoConfirm: true,
          requiresManualReview: false,
          candidates: [candidate]
        };
      }

      const topCandidate = scoredNameCandidates[0];
      if (topCandidate) {
        return {
          glpiDeviceId: topCandidate.glpiDeviceId,
          glpiName: topCandidate.glpiName,
          matchOrigin: "name",
          score: topCandidate.score,
          status: "baixo_score",
          canAutoConfirm: false,
          requiresManualReview: true,
          candidates: [topCandidate]
        };
      }

      return this.emptyPreview("sem_vinculo");
    }

    const bothCandidates = idCandidates
      .map(device => this.buildCandidate(device, this.nameScore(baseName, device.name, operationalTags), "id_and_name"))
      .sort((a, b) => b.score - a.score || String(a.glpiDeviceId).localeCompare(String(b.glpiDeviceId)));

    if (bothCandidates.length > 1) {
      return {
        glpiDeviceId: null,
        glpiName: null,
        matchOrigin: "id_and_name",
        score: bothCandidates[0]?.score ?? 100,
        status: "ambiguo",
        canAutoConfirm: false,
        requiresManualReview: true,
        candidates: bothCandidates
      };
    }

    if (bothCandidates.length === 1) {
      const candidate = bothCandidates[0];
      const strongEnough = candidate.score >= minScore;
      return {
        glpiDeviceId: candidate.glpiDeviceId,
        glpiName: candidate.glpiName,
        matchOrigin: "id_and_name",
        score: candidate.score,
        status: strongEnough ? "match_ambos" : "baixo_score",
        canAutoConfirm: strongEnough,
        requiresManualReview: !strongEnough,
        candidates: [candidate]
      };
    }

    return this.emptyPreview("sem_vinculo");
  }

  emptyPreview(status) {
    return {
      glpiDeviceId: null,
      glpiName: null,
      matchOrigin: null,
      score: 0,
      status,
      canAutoConfirm: false,
      requiresManualReview: false,
      candidates: []
    };
  }

  passesFilters(item, filters) {
    if (filters.reviewQueueOnly && !item.requiresManualReview) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (!filters.includeLinked && item.status === "ja_vinculado") return false;
    if (!filters.includeAmbiguous && item.status === "ambiguo") return false;
    if (!filters.includeLowScore && item.status === "baixo_score") return false;
    return true;
  }

  buildStatusCounts(items) {
    return items.reduce((acc, item) => {
      acc.total += 1;
      acc[item.status] = (acc[item.status] || 0) + 1;
      if (item.requiresManualReview) acc.reviewQueue += 1;
      if (item.canAutoConfirm && !item.alreadyLinked) acc.autoConfirmable += 1;
      return acc;
    }, {
      total: 0,
      reviewQueue: 0,
      autoConfirmable: 0,
      sem_vinculo: 0,
      match_id: 0,
      match_nome: 0,
      match_ambos: 0,
      ambiguo: 0,
      baixo_score: 0,
      ja_vinculado: 0
    });
  }

  async previewGlpiMatching({
    mode = "both",
    search = "",
    status = "",
    minScore = 90,
    sort = "score_desc",
    includeLinked = false,
    includeAmbiguous = true,
    includeLowScore = true,
    reviewQueueOnly = false,
    limit = 50,
    offset = 0,
    entityId = null
  } = {}) {
    const safeMode = VALID_MODES.has(mode) ? mode : "both";
    const safeStatus = VALID_STATUSES.has(status) ? status : "";
    const safeSort = ["score_desc", "score_asc", "name_asc"].includes(sort) ? sort : "score_desc";
    const safeMinScore = Math.min(Math.max(Number(minScore) || 90, 0), 100);
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const [entities, rawDevices] = await Promise.all([
      hubMatchingRepository.listHubAuvoEntities({ search }),
      hubMatchingRepository.listGlpiDevices()
    ]);
    const operationalTags = await hubOperationalTagService.listTags();
    const devices = rawDevices.map(device => ({
      ...device,
      deviceCode: this.extractDeviceCode(device.name)
    }));

    const targetEntities = entityId
      ? entities.filter(entity => Number(entity.entityId) === Number(entityId))
      : entities;

    const devicesByAuvoId = new Map();
    for (const device of devices) {
      if (!device.auvoCustomerId) continue;
      const current = devicesByAuvoId.get(device.auvoCustomerId) || [];
      current.push(device);
      devicesByAuvoId.set(device.auvoCustomerId, current);
    }

    const filters = {
      status: safeStatus,
      includeLinked,
      includeAmbiguous,
      includeLowScore,
      reviewQueueOnly: reviewQueueOnly === true || reviewQueueOnly === "true" || reviewQueueOnly === "1"
    };

    const baseItems = targetEntities
      .map(entity => {
        const resolved = this.resolvePreview({
          entity,
          devicesByAuvoId,
          devices,
          mode: safeMode,
          minScore: safeMinScore,
          operationalTags
        });

        return {
          previewId: `hub-${entity.entityId}-glpi-${resolved.glpiDeviceId || "none"}`,
          entityId: entity.entityId,
          hubName: entity.hubName,
          auvoCustomerId: entity.auvoCustomerId,
          auvoName: entity.auvoName,
          glpiDeviceId: resolved.glpiDeviceId,
          glpiName: resolved.glpiName,
          matchMode: safeMode,
          matchOrigin: resolved.matchOrigin,
          score: resolved.score,
          status: resolved.status,
          canAutoConfirm: resolved.canAutoConfirm,
          requiresManualReview: resolved.requiresManualReview,
          alreadyLinked: entity.alreadyLinked,
          propagationBlocked: true,
          candidates: resolved.candidates
        };
      });
    const statusCounts = this.buildStatusCounts(baseItems);
    const allItems = baseItems
      .filter(item => this.passesFilters(item, filters))
      .sort((left, right) => {
        if (safeSort === "score_asc") {
          return Number(left.score || 0) - Number(right.score || 0)
            || String(left.hubName || "").localeCompare(String(right.hubName || ""));
        }

        if (safeSort === "name_asc") {
          return String(left.hubName || "").localeCompare(String(right.hubName || ""))
            || Number(right.score || 0) - Number(left.score || 0);
        }

        return Number(right.score || 0) - Number(left.score || 0)
          || String(left.hubName || "").localeCompare(String(right.hubName || ""));
      });

    const pagedItems = allItems.slice(safeOffset, safeOffset + safeLimit);

    return {
      data: pagedItems,
      meta: {
        mode: safeMode,
        sort: safeSort,
        minScore: safeMinScore,
        limit: safeLimit,
        offset: safeOffset,
        total: allItems.length,
        hasMore: safeOffset + pagedItems.length < allItems.length,
        statusCounts,
        sourceStats: {
          hubAuvoEntities: targetEntities.length,
          glpiDevices: devices.length,
          glpiDevicesWithAuvoId: devices.filter(device => device.auvoCustomerId).length,
          glpiDevicesWithName: devices.filter(device => device.name).length
        }
      }
    };
  }

  async confirmSingleGlpiMatch({
    entityId,
    glpiDeviceId,
    matchMode = "both",
    score = null,
    confirmedBy = "admin",
    allowManualReview = true,
    allowLowScoreManual = false
  }) {
    const safeEntityId = Number(entityId);
    const safeGlpiDeviceId = glpiDeviceId ? String(glpiDeviceId) : "";
    const safeMode = VALID_MODES.has(matchMode) ? matchMode : "both";

    if (!Number.isInteger(safeEntityId) || safeEntityId <= 0) {
      return {
        success: false,
        status: "invalid",
        message: "entityId invalido",
        entityId,
        glpiDeviceId
      };
    }

    if (!safeGlpiDeviceId) {
      return {
        success: false,
        status: "invalid",
        message: "glpiDeviceId obrigatorio",
        entityId: safeEntityId,
        glpiDeviceId
      };
    }

    const preview = await this.previewGlpiMatching({
      entityId: safeEntityId,
      mode: safeMode,
      minScore: 90,
      includeLinked: true,
      includeAmbiguous: true,
      includeLowScore: true,
      limit: 1,
      offset: 0
    });
    const item = preview.data[0];

    if (!item) {
      return {
        success: false,
        status: "not_found",
        message: "Entidade HUB nao encontrada para preview",
        entityId: safeEntityId,
        glpiDeviceId: safeGlpiDeviceId
      };
    }

    if (item.alreadyLinked && item.glpiDeviceId === safeGlpiDeviceId) {
      return {
        success: true,
        status: "already_linked",
        message: "Vinculo GLPI ja existia no HUB",
        entityId: safeEntityId,
        glpiDeviceId: safeGlpiDeviceId,
        propagationBlocked: true,
        preview: item
      };
    }

    const candidate = (item.candidates || []).find(row => String(row.glpiDeviceId) === safeGlpiDeviceId);
    if (!candidate) {
      return {
        success: false,
        status: "candidate_not_allowed",
        message: "GLPI device nao esta entre os candidatos do preview atual",
        entityId: safeEntityId,
        glpiDeviceId: safeGlpiDeviceId,
        preview: item
      };
    }

    const confirmedScore = Number.isFinite(Number(score))
      ? Math.min(Math.max(Number(score), 0), 100)
      : candidate.score;
    const canConfirm = item.canAutoConfirm || (allowManualReview && item.requiresManualReview);

    const lowScoreBlocked = item.status === "baixo_score" && !allowLowScoreManual;
    if (!canConfirm || lowScoreBlocked || item.status === "sem_vinculo") {
      return {
        success: false,
        status: "not_confirmable",
        message: "Preview atual nao permite confirmacao desse vinculo",
        entityId: safeEntityId,
        glpiDeviceId: safeGlpiDeviceId,
        preview: item
      };
    }

    const glpiDevice = await hubMatchingRepository.getGlpiDevice(safeGlpiDeviceId);
    if (!glpiDevice) {
      return {
        success: false,
        status: "device_not_found",
        message: "Device GLPI nao encontrado no cache local",
        entityId: safeEntityId,
        glpiDeviceId: safeGlpiDeviceId
      };
    }

    const matchStrategy = item.matchOrigin || candidate.matchOrigin || safeMode;
    await hubMatchingRepository.upsertGlpiLink({
      entityId: safeEntityId,
      glpiDevice,
      score: confirmedScore,
      matchStrategy,
      confirmedBy
    });
    await hubMatchingRepository.insertLinkHistory({
      entityId: safeEntityId,
      glpiDevice,
      score: confirmedScore,
      matchStrategy,
      confirmedBy
    });

    return {
      success: true,
      status: "confirmed",
      message: "Vinculo GLPI confirmado no HUB",
      entityId: safeEntityId,
      glpiDeviceId: safeGlpiDeviceId,
      score: confirmedScore,
      matchStrategy,
      propagationBlocked: true
    };
  }

  async confirmGlpiMatches({ items = [], confirmedBy = "admin" } = {}) {
    const results = [];

    for (const item of items) {
      results.push(await this.confirmSingleGlpiMatch({
        entityId: item.entityId,
        glpiDeviceId: item.glpiDeviceId,
        matchMode: item.matchMode,
        score: item.score,
        confirmedBy,
        allowManualReview: false
      }));
    }

    return {
      success: results.every(result => result.success),
      confirmed: results.filter(result => result.status === "confirmed").length,
      alreadyLinked: results.filter(result => result.status === "already_linked").length,
      failed: results.filter(result => !result.success).length,
      propagationBlocked: true,
      results
    };
  }
}

export default new HubMatchingService();
