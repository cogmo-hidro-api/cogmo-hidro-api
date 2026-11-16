const stationRepository = require('../repositories/stationRepository');
const observationRepository = require('../repositories/observationRepository');
const AppError = require('../utils/AppError');
const { parseId } = require('../utils/validators');

const REQUIRED = ['code', 'name', 'river', 'municipality', 'state'];
const DASHBOARD_HOURS = 24;

// Data no formato ISO 8601 UTC sem milissegundos: 2026-11-03T12:00:00Z
const toIsoUtc = (date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');

// ---------- validação ----------

// Texto obrigatório: string não vazia (espaços nas pontas são removidos)
function cleanText(value) {
  return typeof value === 'string' ? value.trim() : value;
}

// Coordenada opcional: null/ausente = sem coordenada; se vier, número dentro do limite
function parseCoordinate(value, field, limit) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > limit) {
    throw new AppError(400, 'INVALID_COORDINATES', `${field} deve ser um número entre -${limit} e ${limit}`);
  }
  return value;
}

// Valida a estação completa (já com os campos mesclados no caso de edição)
function validateStation(data) {
  const station = {
    code: cleanText(data.code),
    name: cleanText(data.name),
    river: cleanText(data.river),
    municipality: cleanText(data.municipality),
    state: typeof data.state === 'string' ? data.state.trim().toUpperCase() : data.state,
  };

  const missing = REQUIRED.filter((f) => typeof station[f] !== 'string' || station[f] === '');
  if (missing.length) {
    throw new AppError(400, 'INVALID_INPUT', `Campos obrigatórios ausentes ou vazios: ${missing.join(', ')}`);
  }
  if (!/^[A-Z]{2}$/.test(station.state)) {
    throw new AppError(400, 'INVALID_STATE', 'state deve ser a sigla da UF com 2 letras (ex.: DF)');
  }

  station.latitude = parseCoordinate(data.latitude, 'latitude', 90);
  station.longitude = parseCoordinate(data.longitude, 'longitude', 180);
  return station;
}

function ensureCodeFree(code, ignoreId) {
  if (stationRepository.codeInUse(code, ignoreId)) {
    throw new AppError(409, 'STATION_CODE_EXISTS', `Já existe estação com o código ${code}`);
  }
}

// Leitura mais recente no formato { value, unit, observed_at } ou null
function latestOf(stationId, metric) {
  const row = observationRepository.findLatest(stationId, metric);
  return row ? { value: row.value, unit: row.unit, observed_at: row.observed_at } : null;
}

const stationService = {
  list() {
    return stationRepository.findAll();
  },

  getById(rawId) {
    const id = parseId(rawId, 'id da estação');
    const station = stationRepository.findById(id);
    if (!station) {
      throw new AppError(404, 'STATION_NOT_FOUND', 'Estação não encontrada');
    }
    return station;
  },

  create(body = {}) {
    const data = validateStation(body);
    ensureCodeFree(data.code);
    return stationRepository.create(data);
  },

  // PUT aceita edição parcial: o que não vier no corpo continua como está
  update(rawId, body = {}) {
    const current = this.getById(rawId);
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      throw new AppError(400, 'INVALID_INPUT', 'Envie ao menos um campo para editar');
    }
    const data = validateStation({ ...current, ...body });
    ensureCodeFree(data.code, current.id);
    return stationRepository.update(current.id, data);
  },

  remove(rawId) {
    const current = this.getById(rawId);
    stationRepository.delete(current.id);
  },

  // ---------- Resumo (contrato Cogmo) ----------
  // Cada métrica tem o próprio horário: um não reaproveita o horário do outro.
  // Sem leitura → null (nunca inventamos valor).
  summary(rawId) {
    const station = this.getById(rawId);
    const level = latestOf(station.id, 'level');
    const rain = latestOf(station.id, 'rain');

    return {
      station,
      latest: {
        // formato com unidade explícita (usado pelo nosso Swagger)
        level,
        rain,
        // campos planos do contrato Cogmo (o front da Cogmo lê estes nomes)
        level_observed_at: level ? level.observed_at : null,
        level_m: level ? level.value : null,
        rain_observed_at: rain ? rain.observed_at : null,
        rain_mm_h: rain ? rain.value : null,
      },
    };
  },

  // ---------- Dashboard (rota composta: cruza as 3 entidades) ----------
  // Estação + leituras das últimas 24 h (com o responsável) + operadores vinculados.
  // A janela termina na última leitura da estação, igual à série (o seed usa datas fixas).
  dashboard(rawId) {
    const station = this.getById(rawId);
    const operators = stationRepository.findPublicOperators(station.id);
    const last = stationRepository.findLastObservedAt(station.id);

    if (!last) {
      return {
        station,
        window: { hours: DASHBOARD_HOURS, from: null, to: null },
        latest: { level: null, rain: null },
        observations: [],
        operators,
      };
    }

    const to = last;
    const from = toIsoUtc(new Date(new Date(last).getTime() - DASHBOARD_HOURS * 3600 * 1000));

    const observations = stationRepository
      .findObservationsWithResponsible(station.id, from, to)
      .map(({ responsible_name, responsible_type, ...obs }) => ({
        ...obs,
        responsible: obs.responsible_id
          ? { id: obs.responsible_id, name: responsible_name, type: responsible_type }
          : null,
      }));

    return {
      station,
      window: { hours: DASHBOARD_HOURS, from, to },
      latest: { level: latestOf(station.id, 'level'), rain: latestOf(station.id, 'rain') },
      observations,
      operators,
    };
  },
};

module.exports = stationService;
