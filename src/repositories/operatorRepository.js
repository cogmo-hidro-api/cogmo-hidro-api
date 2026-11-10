const db = require('../database/connection');

const operatorRepository = {
  findAll() {
    return db.prepare('SELECT id, name, email, phone, type FROM operators').all();
  },

  findById(id) {
    return db.prepare('SELECT id, name, email, phone, type FROM operators WHERE id = ?').get(id);
  },
stationExists(stationId) {
    return !!db.prepare('SELECT 1 FROM stations WHERE id = ?').get(stationId);
  },
  findByEmail(email) {
    return db.prepare('SELECT * FROM operators WHERE email = ?').get(email);
  },

  create({ name, email, phone, type }) {
    const stmt = db.prepare(
      'INSERT INTO operators (name, email, phone, type) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(name, email, phone, type);
    return { id: info.lastInsertRowid, name, email, phone, type };
  },

  update(id, { name, email, phone, type }) {
    const stmt = db.prepare(
      'UPDATE operators SET name = ?, email = ?, phone = ?, type = ? WHERE id = ?'
    );
    stmt.run(name, email, phone, type, id);
    return this.findById(id);
  },

  delete(id) {
    return db.prepare('DELETE FROM operators WHERE id = ?').run(id);
  },

  // Rotas N:N (Estação <-> Operador) 
  findOperatorsByStation(stationId) {
    return db.prepare(`
      SELECT o.id, o.name, o.email, o.phone, o.type, so.role, so.linked_at
      FROM operators o
      JOIN station_operators so ON o.id = so.operator_id
      WHERE so.station_id = ?
    `).all(stationId);
  },

  linkStation(stationId, operatorId, role) {
    const stmt = db.prepare(`
      INSERT INTO station_operators (station_id, operator_id, role)
      VALUES (?, ?, ?)
    `);
    return stmt.run(stationId, operatorId, role || null);
  },

  unlinkStation(stationId, operatorId) {
    return db.prepare(`
      DELETE FROM station_operators 
      WHERE station_id = ? AND operator_id = ?
    `).run(stationId, operatorId);
  }
};

module.exports = operatorRepository;