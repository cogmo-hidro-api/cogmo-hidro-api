const authService = require('../services/authService');

const authController = {
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      return res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = authController;