const { Router } = require('express');
const observationController = require('../controllers/observationController');
const authMiddleware = require('../middlewares/auth');

const router = Router();

// Leitura é pública; criar, editar e apagar exigem login (JWT)
router.get('/', observationController.list);
router.get('/:id', observationController.getById);
router.post('/', authMiddleware, observationController.create);
router.put('/:id', authMiddleware, observationController.update);
router.delete('/:id', authMiddleware, observationController.remove);

// Operador responsável pela leitura
router.get('/:id/responsible', observationController.getResponsible);
router.put('/:id/responsible', authMiddleware, observationController.setResponsible);

module.exports = router;
