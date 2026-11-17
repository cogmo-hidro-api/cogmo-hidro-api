const db = require('../database/connection');

// Única camada que fala com o banco: aqui só confirmamos que ele responde.
const healthRepository = {
  ping() {
    db.prepare('SELECT 1').get();
  },
};

module.exports = healthRepository;
