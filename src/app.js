const express = require('express');
const cors = require('cors');

// Importação das suas rotas
const authRoutes = require('./routes/authRoutes');
const operatorRoutes = require('./routes/operatorRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Registro das rotas na API
app.use('/api/auth', authRoutes);
app.use('/api/operators', operatorRoutes);

// Tratamento global de erros
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Erro interno no servidor';
  const code = err.code || 'INTERNAL_ERROR';

  return res.status(status).json({
    error: { code, message }
  });
});

module.exports = app;