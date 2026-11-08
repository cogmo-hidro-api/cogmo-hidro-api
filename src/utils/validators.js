const AppError = require('./AppError');

// Unidade de cada métrica (regra da Cogmo: nunca misturar)
const METRIC_UNITS = { level: 'm', rain: 'mm/h' };

// id da URL: tem que ser inteiro positivo
function parseId(value, field = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'INVALID_ID', `${field} deve ser um número inteiro positivo`);
  }
  return id;
}

// metric: obrigatória e só "level" ou "rain"
function parseMetric(value) {
  if (value === undefined || value === '') {
    throw new AppError(400, 'MISSING_METRIC', 'Informe metric=level ou metric=rain');
  }
  if (!Object.keys(METRIC_UNITS).includes(value)) {
    throw new AppError(400, 'INVALID_METRIC', 'metric deve ser level ou rain');
  }
  return value;
}

// hours: opcional (padrão 24), inteiro de 1 a 72
function parseHours(value) {
  if (value === undefined || value === '') return 24;
  const hours = Number(value);
  if (!Number.isInteger(hours) || hours < 1 || hours > 72) {
    throw new AppError(400, 'INVALID_HOURS', 'hours deve ser um número inteiro de 1 a 72');
  }
  return hours;
}

// value: número obrigatório; chuva não pode ser negativa
function parseValue(value, metric) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new AppError(400, 'INVALID_VALUE', 'value deve ser um número');
  }
  if (metric === 'rain' && value < 0) {
    throw new AppError(400, 'INVALID_VALUE', 'Chuva (rain) não pode ser negativa');
  }
  return value;
}

// observed_at: ISO 8601 em UTC, sem milissegundos. Ex: 2026-11-03T12:00:00Z
function parseObservedAt(value) {
  const formatoOk = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value);
  // a data também tem que existir de verdade (ex: 31/02 não passa)
  if (!formatoOk || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 19) + 'Z' !== value) {
    throw new AppError(400, 'INVALID_OBSERVED_AT', 'observed_at deve estar em UTC no formato 2026-11-03T12:00:00Z');
  }
  return value;
}

module.exports = { METRIC_UNITS, parseId, parseMetric, parseHours, parseValue, parseObservedAt };
