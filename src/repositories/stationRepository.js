const db = require('../database/connection');

// Colunas públicas da estação (mesma ordem em todas as consultas)
const COLUMNS = 'id, code, name, river, municipality, state, latitude, longitude';

const stationRepository = {
  // Lista em ordem alfabética pelo nome (regra do contrato Cogmo).
  // updated_at = horário da leitura mais recente da estação (null se não tiver leitura).
  findAll() {
    return db
      .prepare(`
        SELECT s.id, s.code, s.name, s.river, s.municipality, s.state, s.latitude, s.longitude,
               (SELECT MAX(o.observed_at) FROM observations o WHERE o.station_id = s.id) AS updated_at
        FROM stations s
        ORDER BY s.name COLLATE NOCASE ASC, s.id ASC
      `)
      .all();
  },

  findById(id) {
    return db.prepare(`SELECT ${COLUMNS} FROM stations WHERE id = ?`).get(id);
  },

  // Usada para impedir código repetido (ignora a própria estação no update)
  codeInUse(code, ignoreId = 0) {
    return !!db.prepare('SELECT 1 FROM stations WHERE code = ? AND id <> ?').get(code, ignoreId);
  },

  create({ code, name, river, municipality, state, latitude, longitude }) {
    const info = db
      .prepare(`
        INSERT INTO stations (code, name, river, municipality, state, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(code, name, river, municipality, state, latitude, longitude);
    return this.findById(info.lastInsertRowid);
  },

  update(id, { code, name, river, municipality, state, latitude, longitude }) {
    db.prepare(`
      UPDATE stations
      SET code = ?, name = ?, river = ?, municipality = ?, state = ?, latitude = ?, longitude = ?
      WHERE id = ?
    `).run(code, name, river, municipality, state, latitude, longitude, id);
    return this.findById(id);
  },

  // Leituras e vínculos saem junto (ON DELETE CASCADE no banco)
  delete(id) {
    return db.prepare('DELETE FROM stations WHERE id = ?').run(id);
  },

  // ---------- Dashboard (rota composta) ----------

  // Horário da leitura mais recente da estação, de qualquer métrica (fim da janela)
  findLastObservedAt(stationId) {
    return db.prepare('SELECT MAX(observed_at) AS last FROM observations WHERE station_id = ?').get(stationId).last;
  },

  // Leituras da janela (from, to] com o responsável (LEFT JOIN: leitura sem responsável continua aparecendo).
  // Só id, nome e tipo do operador: a rota é pública e e-mail/telefone são dado pessoal.
  findObservationsWithResponsible(stationId, from, to) {
    return db
      .prepare(`
        SELECT o.id, o.station_id, o.metric, o.value, o.unit, o.observed_at, o.responsible_id,
               op.name AS responsible_name, op.type AS responsible_type
        FROM observations o
        LEFT JOIN operators op ON op.id = o.responsible_id
        WHERE o.station_id = ? AND o.observed_at > ? AND o.observed_at <= ?
        ORDER BY o.observed_at ASC, o.metric ASC
      `)
      .all(stationId, from, to);
  },

  // Operadores vinculados (N:N) sem dados de contato
  findPublicOperators(stationId) {
    return db
      .prepare(`
        SELECT op.id, op.name, op.type, so.role
        FROM station_operators so
        JOIN operators op ON op.id = so.operator_id
        WHERE so.station_id = ?
        ORDER BY op.name COLLATE NOCASE ASC
      `)
      .all(stationId);
  },
};

module.exports = stationRepository;
