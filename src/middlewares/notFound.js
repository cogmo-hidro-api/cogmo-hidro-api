const AppError = require('../utils/AppError'); 
function notFound(req, res, next) {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `Rota ${req.method} ${req.originalUrl} não existe`));
}

module.exports = notFound;