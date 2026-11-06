const { Router } = require('express');
const observationController = require('../controllers/observationController');

// mergeParams: permite ler o :id da estação que vem da URL
const router = Router({ mergeParams: true });

// Rota pública do contrato Cogmo: /api/stations/:id/series?metric=level&hours=24
router.get('/', observationController.getSeries);

module.exports = router;
