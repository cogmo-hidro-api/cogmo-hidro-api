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

  list(req, res, next) {
    try {
      return res.status(200).json(observationService.list(req.query));
    } catch (err) {
      next(err);
    }
  },

  getById(req, res, next) {
    try {
      return res.status(200).json(observationService.getById(req.params.id));
    } catch (err) {
      next(err);
    }
  },

  create(req, res, next) {
    try {
      return res.status(201).json(observationService.create(req.body));
    } catch (err) {
      next(err);
    }
  },

  update(req, res, next) {
    try {
      return res.status(200).json(observationService.update(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  },

  remove(req, res, next) {
    try {
      observationService.remove(req.params.id);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  listByStation(req, res, next) {
    try {
      return res.status(200).json(observationService.listByStation(req.params.id, req.query));
    } catch (err) {
      next(err);
    }
  },

  createForStation(req, res, next) {
    try {
      return res.status(201).json(observationService.createForStation(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  },

  getResponsible(req, res, next) {
    try {
      return res.status(200).json(observationService.getResponsible(req.params.id));
    } catch (err) {
      next(err);
    }
  },

  setResponsible(req, res, next) {
    try {
      return res.status(200).json(observationService.setResponsible(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = observationController;
