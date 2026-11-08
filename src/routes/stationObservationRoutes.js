const { Router } = require('express');
const observationController = require('../controllers/observationController');
const authMiddleware = require('../middlewares/auth');

// mergeParams: permite ler o :id da estação que vem da URL
const router = Router({ mergeParams: true });

// /api/stations/:id/observations
router.get('/', observationController.listByStation);
router.post('/', authMiddleware, observationController.createForStation);

module.exports = router;
