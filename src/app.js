const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Rota de verificação: confirma que a API está no ar
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// TODO (P2, P3, P4): registrar aqui as rotas de stations, observations, operators e auth
// TODO (Márcio): errorHandler no final, depois de todas as rotas

module.exports = app;