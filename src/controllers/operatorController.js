const operatorService = require('../services/operatorService');

const operatorController = {
  getAll(req, res, next) {
    try {
      const operators = operatorService.getAll();
      return res.status(200).json(operators);
    } catch (err) {
      next(err);
    }
  },

  getById(req, res, next) {
    try {
      const operator = operatorService.getById(req.params.id);
      return res.status(200).json(operator);
    } catch (err) {
      next(err);
    }
  },

  create(req, res, next) {
    try {
      const operator = operatorService.create(req.body);
      return res.status(201).json(operator);
    } catch (err) {
      next(err);
    }
  },

  update(req, res, next) {
    try {
      const operator = operatorService.update(req.params.id, req.body);
      return res.status(200).json(operator);
    } catch (err) {
      next(err);
    }
  },

  delete(req, res, next) {
    try {
      operatorService.delete(req.params.id);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  getByStation(req, res, next) {
    try {
      const operators = operatorService.getOperatorsByStation(req.params.id);
      return res.status(200).json(operators);
    } catch (err) {
      next(err);
    }
  },

  linkStation(req, res, next) {
    try {
      const { operator_id, role } = req.body;
      operatorService.linkStation(req.params.id, operator_id, role);
      return res.status(201).json({ message: 'Operador vinculado com sucesso' });
    } catch (err) {
      next(err);
    }
  },

  unlinkStation(req, res, next) {
    try {
      operatorService.unlinkStation(req.params.id, req.params.operatorId);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
};

module.exports = operatorController;