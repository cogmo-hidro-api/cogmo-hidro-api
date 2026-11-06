const observationService = require('../services/observationService');

const observationController = {
  getSeries(req, res, next) {
    try {
      const series = observationService.getSeries(req.params.id, req.query);
      return res.status(200).json(series);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = observationController;
