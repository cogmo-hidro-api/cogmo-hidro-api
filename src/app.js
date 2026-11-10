const express = require('express');
const cors = require('cors');
const stationOperatorRoutes = require('./routes/stationOperatorRoutes');
const seriesRoutes = require('./routes/seriesRoutes');
const observationRoutes = require('./routes/observationRoutes');
const stationObservationRoutes = require('./routes/stationObservationRoutes');
const simulatedNotice = require('./middlewares/simulatedNotice');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi');

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

// Documentação interativa (Swagger) em /api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));

// Aviso de dados simulados em todas as respostas da API (regra Cogmo).
// Fica depois do /api/health, que continua devolvendo só { ok: true }.
app.use('/api', simulatedNotice);

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/stations/:id/operators', stationOperatorRoutes);
app.use('/api/stations/:id/series', seriesRoutes);
app.use('/api/stations/:id/observations', stationObservationRoutes);
app.use('/api/observations', observationRoutes);

// Tratamento de erros: SEMPRE por último
app.use(notFound);
app.use(errorHandler);

module.exports = app;
