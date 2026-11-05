const AppError = require('../utils/AppError');
function errorHandler(err, req, res, next) {
  // Erro previsto, lançado com AppError
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'O corpo da requisição não é um JSON válido' },
    });
  }

  console.error(err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
  });
}

module.exports = errorHandler;