const observationRepository = require('../repositories/observationRepository');
const AppError = require('../utils/AppError');
const { METRIC_UNITS, parseId, parseMetric, parseHours } = require('../utils/validators');

// Data no formato ISO 8601 UTC sem milissegundos: 2026-11-03T12:00:00Z
const toIsoUtc = (date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');

const observationService = {
  getSeries(rawStationId, query) {
    const stationId = parseId(rawStationId, 'id da estação');
    const metric = parseMetric(query.metric);
    const hours = parseHours(query.hours);

    if (!observationRepository.stationExists(stationId)) {
      throw new AppError(404, 'STATION_NOT_FOUND', 'Estação não encontrada');
    }

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
};

module.exports = observationService;
