const stationService = require('../services/stationService');

const SUMMARY_MESSAGE = 'Amostra simulada. Não representa condições reais.';

const stationController = {
  list(req, res, next) {
    try {
      // stations = chave do contrato Cogmo; data = formato das outras listas da API (mantido)
      const stations = stationService.list();
      return res.status(200).json({ data: stations, stations });
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
      // message: texto fixo exigido pelo contrato Cogmo (formato da resposta, não regra de negócio)
      return res.status(200).json({ message: SUMMARY_MESSAGE, ...stationService.summary(req.params.id) });
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
