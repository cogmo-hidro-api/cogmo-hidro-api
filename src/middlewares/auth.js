const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ 
      error: { code: 'UNAUTHORIZED', message: 'Token de autenticação não fornecido' } 
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ 
      error: { code: 'INVALID_TOKEN_FORMAT', message: 'Formato do token inválido' } 
    });
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET || 'chave_secreta_padrao';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ 
      error: { code: 'INVALID_TOKEN', message: 'Token inválido ou expirado' } 
    });
  }
}

module.exports = authMiddleware;