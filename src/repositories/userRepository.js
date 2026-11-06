const db = require('../database/connection');

const userRepository = {
  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  create({ name, email, password_hash }) {
    const stmt = db.prepare(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
    );
    const info = stmt.run(name, email, password_hash);
    return { id: info.lastInsertRowid, name, email };
  }
};

module.exports = userRepository;