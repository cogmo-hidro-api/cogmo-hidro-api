const { Router } = require('express');
const operatorController = require('../controllers/operatorController');
const authMiddleware = require('../middlewares/auth');

const router = Router();

router.use(authMiddleware); // Protege todas as rotas de operadores com JWT[cite: 6, 8]

router.get('/', operatorController.getAll);
router.get('/:id', operatorController.getById);
router.post('/', operatorController.create);
router.put('/:id', operatorController.update);
router.delete('/:id', operatorController.delete);

module.exports = router;