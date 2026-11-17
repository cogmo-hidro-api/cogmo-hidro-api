const healthService = require('../services/healthService');

const healthController = {
  check(req, res, next) {
    try {
      const result = healthService.check();
      const ok = result.status === 'ok';
      // ok: campo que a API já devolvia (mantido); status/database: contrato Cogmo
      return res.status(ok ? 200 : 503).json({ ok, ...result });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = healthController;
