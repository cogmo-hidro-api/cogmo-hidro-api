const db = require('../database/connection');

const observationRepository = {
  stationExists(stationId) {
    return !!db.prepare('SELECT 1 FROM stations WHERE id = ?').get(stationId);
  },

  // Horário da leitura mais recente da estação para a métrica (fim da janela)
  findLastObservedAt(stationId, metric) {
    const row = db
      .prepare('SELECT MAX(observed_at) AS last FROM observations WHERE station_id = ? AND metric = ?')
      .get(stationId, metric);
    return row.last; // null se não houver leitura
  },

  // Pontos da série dentro da janela (from, to], em ordem de horário
  findSeries(stationId, metric, from, to) {
    return db
      .prepare(`
        SELECT observed_at, value
        FROM observations
        WHERE station_id = ? AND metric = ? AND observed_at > ? AND observed_at <= ?
        ORDER BY observed_at ASC
      `)
      .all(stationId, metric, from, to);
  },

  // Última leitura de uma métrica (vai ser usada no /summary da Kyara)
  findLatest(stationId, metric) {
    return db
      .prepare(`
        SELECT metric, value, unit, observed_at
        FROM observations
        WHERE station_id = ? AND metric = ?
        ORDER BY observed_at DESC
        LIMIT 1
      `)
      .get(stationId, metric);
  },
};

module.exports = observationRepository;
