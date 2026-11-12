const { Router } = require('express');
const stationController = require('../controllers/stationController');
const authMiddleware = require('../middlewares/auth');

const router = Router();

// Leitura é pública; criar, editar e apagar exigem login (JWT)
router.get('/', stationController.list);
router.post('/', authMiddleware, stationController.create);

// Contrato Cogmo e rota composta
router.get('/:id/summary', stationController.summary);
router.get('/:id/dashboard', stationController.dashboard);

// CRUD por id
router.get('/:id', stationController.getById);
router.put('/:id', authMiddleware, stationController.update);
router.delete('/:id', authMiddleware, stationController.remove);

module.exports = router;
