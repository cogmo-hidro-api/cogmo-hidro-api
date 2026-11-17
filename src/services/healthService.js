const healthRepository = require('../repositories/healthRepository');

// Regra: a API está "ok" só se o banco também responder.
// Não lança erro: o resultado da verificação É a resposta (status/database do contrato Cogmo).
const healthService = {
  check() {
    try {
      healthRepository.ping();
      return { status: 'ok', database: 'ok' };
    } catch (err) {
      console.error(err);
      return { status: 'error', database: 'error' };
    }
  },
};

module.exports = healthService;
