const observationRepository = require('../repositories/observationRepository');
const AppError = require('../utils/AppError');
const {
  METRIC_UNITS, parseId, parseMetric, parseHours, parseValue, parseObservedAt,
} = require('../utils/validators');

// Data no formato ISO 8601 UTC sem milissegundos: 2026-11-03T12:00:00Z
const toIsoUtc = (date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');

// ---------- funções de apoio ----------

function ensureStation(stationId) {
  if (!observationRepository.stationExists(stationId)) {
    throw new AppError(404, 'STATION_NOT_FOUND', 'Estação não encontrada');
  }
}

// responsible_id é opcional: null/ausente = sem responsável
function parseResponsible(value) {
  if (value === undefined || value === null) return null;
  const operatorId = parseId(value, 'responsible_id');
  if (!observationRepository.operatorExists(operatorId)) {
    throw new AppError(404, 'OPERATOR_NOT_FOUND', 'Operador responsável não encontrado');
  }
  return operatorId;
}

// Valida o corpo de criação/edição e devolve a leitura pronta pra salvar
function buildObservation(body = {}) {
  const metric = parseMetric(body.metric);
  return {
    metric,
    unit: METRIC_UNITS[metric], // unidade sai da métrica, o cliente não escolhe
    value: parseValue(body.value, metric),
    observed_at: parseObservedAt(body.observed_at),
    responsible_id: parseResponsible(body.responsible_id),
  };
}

function ensureNoDuplicate(stationId, data, ignoreId) {
  if (observationRepository.existsAt(stationId, data.metric, data.observed_at, ignoreId)) {
    throw new AppError(409, 'OBSERVATION_EXISTS', 'Já existe leitura dessa métrica nesse horário para a estação');
  }
}

const observationService = {
  // ---------- Série (contrato Cogmo) ----------
  getSeries(rawStationId, query) {
    const stationId = parseId(rawStationId, 'id da estação');
    const metric = parseMetric(query.metric);
    const hours = parseHours(query.hours);

    ensureStation(stationId);

    const base = { station_id: stationId, metric, unit: METRIC_UNITS[metric], hours };

    // A janela termina na última leitura da estação (o seed usa datas fixas)
    const last = observationRepository.findLastObservedAt(stationId, metric);
    if (!last) {
      return { ...base, from: null, to: null, count: 0, points: [] };
    }

    const to = last;
    const from = toIsoUtc(new Date(new Date(last).getTime() - hours * 60 * 60 * 1000));

    // Lacunas não são preenchidas: hora sem leitura simplesmente não aparece
    const points = observationRepository.findSeries(stationId, metric, from, to);

    return { ...base, from, to, count: points.length, points };
  },

  // ---------- CRUD ----------
  list(query = {}) {
    const filters = {};
    if (query.station_id !== undefined) filters.stationId = parseId(query.station_id, 'station_id');
    if (query.metric !== undefined) filters.metric = parseMetric(query.metric);
    return observationRepository.findAll(filters);
  },

  getById(rawId) {
    const id = parseId(rawId);
    const observation = observationRepository.findById(id);
    if (!observation) {
      throw new AppError(404, 'OBSERVATION_NOT_FOUND', 'Leitura não encontrada');
    }
    return observation;
  },

  create(body = {}) {
    const stationId = parseId(body.station_id, 'station_id');
    ensureStation(stationId);
    const data = buildObservation(body);
    ensureNoDuplicate(stationId, data);
    return observationRepository.create({ station_id: stationId, ...data });
  },

  update(rawId, body = {}) {
    const current = this.getById(rawId);
    const data = buildObservation(body);
    ensureNoDuplicate(current.station_id, data, current.id);
    return observationRepository.update(current.id, data);
  },

  remove(rawId) {
    const current = this.getById(rawId);
    observationRepository.delete(current.id);
  },

  // ---------- Leituras de uma estação (1:N Estação -> Leituras) ----------
  listByStation(rawStationId, query = {}) {
    const stationId = parseId(rawStationId, 'id da estação');
    ensureStation(stationId);
    const metric = query.metric !== undefined ? parseMetric(query.metric) : undefined;
    return observationRepository.findAll({ stationId, metric });
  },

  createForStation(rawStationId, body = {}) {
    return this.create({ ...body, station_id: rawStationId });
  },

  // ---------- Responsável pela leitura ----------
  getResponsible(rawId) {
    const observation = this.getById(rawId);
    const responsible = observationRepository.findResponsible(observation.id) || null;
    return { observation_id: observation.id, responsible };
  },

  setResponsible(rawId, body = {}) {
    const observation = this.getById(rawId);
    if (!('operator_id' in body)) {
      throw new AppError(400, 'MISSING_OPERATOR_ID', 'Informe operator_id (ou null para remover o responsável)');
    }
    const operatorId = parseResponsible(body.operator_id);
    observationRepository.setResponsible(observation.id, operatorId);
    return this.getResponsible(observation.id);
  },
};

module.exports = observationService;
