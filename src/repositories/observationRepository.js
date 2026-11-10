const db = require('../database/connection');

const observationRepository = {
  stationExists(stationId) {
    return !!db.prepare('SELECT 1 FROM stations WHERE id = ?').get(stationId);
  },

  operatorExists(operatorId) {
    return !!db.prepare('SELECT 1 FROM operators WHERE id = ?').get(operatorId);
  },

  // ---------- Série (contrato Cogmo) ----------

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

  // ---------- CRUD de leituras ----------

  // Filtros opcionais: station_id e metric. Mais recentes primeiro.
  findAll({ stationId, metric } = {}) {
    let sql = 'SELECT id, station_id, metric, value, unit, observed_at, responsible_id FROM observations WHERE 1 = 1';
    const params = [];
    if (stationId) {
      sql += ' AND station_id = ?';
      params.push(stationId);
    }
    if (metric) {
      sql += ' AND metric = ?';
      params.push(metric);
    }
    sql += ' ORDER BY observed_at DESC, id DESC';
    return db.prepare(sql).all(...params);
  },

  findById(id) {
    return db
      .prepare('SELECT id, station_id, metric, value, unit, observed_at, responsible_id FROM observations WHERE id = ?')
      .get(id);
  },

  // Já existe leitura da mesma estação/métrica nesse horário? (ignora a própria no update)
  existsAt(stationId, metric, observedAt, ignoreId = 0) {
    return !!db
      .prepare('SELECT 1 FROM observations WHERE station_id = ? AND metric = ? AND observed_at = ? AND id <> ?')
      .get(stationId, metric, observedAt, ignoreId);
  },

  create({ station_id, metric, value, unit, observed_at, responsible_id }) {
    const info = db
      .prepare(`
        INSERT INTO observations (station_id, metric, value, unit, observed_at, responsible_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(station_id, metric, value, unit, observed_at, responsible_id);
    return this.findById(info.lastInsertRowid);
  },

  update(id, { metric, value, unit, observed_at, responsible_id }) {
    db.prepare(`
      UPDATE observations
      SET metric = ?, value = ?, unit = ?, observed_at = ?, responsible_id = ?
      WHERE id = ?
    `).run(metric, value, unit, observed_at, responsible_id, id);
    return this.findById(id);
  },

  delete(id) {
    return db.prepare('DELETE FROM observations WHERE id = ?').run(id);
  },

  // ---------- Responsável pela leitura (1:N Operador -> Leituras) ----------

  // Rota pública: devolve só id, nome e tipo (e-mail e telefone são dado pessoal)
  findResponsible(observationId) {
    return db
      .prepare(`
        SELECT op.id, op.name, op.type
        FROM observations o
        JOIN operators op ON op.id = o.responsible_id
        WHERE o.id = ?
      `)
      .get(observationId);
  },

  setResponsible(observationId, operatorId) {
    return db.prepare('UPDATE observations SET responsible_id = ? WHERE id = ?').run(operatorId, observationId);
  },
};

module.exports = observationRepository;
