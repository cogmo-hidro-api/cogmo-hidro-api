const stationService = require('../services/stationService');

const stationController = {
  list(req, res, next) {
    try {
      return res.status(200).json(stationService.list());
    } catch (err) {
      next(err);
    }
  },

  getById(req, res, next) {
    try {
      return res.status(200).json(stationService.getById(req.params.id));
    } catch (err) {
      next(err);
    }
  },

  create(req, res, next) {
    try {
      return res.status(201).json(stationService.create(req.body));
    } catch (err) {
      next(err);
    }
  },

  update(req, res, next) {
    try {
      return res.status(200).json(stationService.update(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  },

  remove(req, res, next) {
    try {
      stationService.remove(req.params.id);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  summary(req, res, next) {
    try {
      return res.status(200).json(stationService.summary(req.params.id));
    } catch (err) {
      next(err);
    }
  },

  dashboard(req, res, next) {
    try {
      return res.status(200).json(stationService.dashboard(req.params.id));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = stationController;
