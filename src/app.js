const express = require('express');
const cors = require('cors');
const stationOperatorRoutes = require('./routes/stationOperatorRoutes');
const seriesRoutes = require('./routes/seriesRoutes');
const simulatedNotice = require('./middlewares/simulatedNotice');

const authRoutes = require('./routes/authRoutes');
const operatorRoutes = require('./routes/operatorRoutes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Rota de verificação: confirma que a API está no ar
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Aviso de dados simulados em toda resposta das rotas de estações (regra Cogmo)
app.use('/api/stations', simulatedNotice);

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/stations/:id/operators', stationOperatorRoutes);
app.use('/api/stations/:id/series', seriesRoutes);

// Tratamento de erros: SEMPRE por último
app.use(notFound);
app.use(errorHandler);

module.exports = app;
