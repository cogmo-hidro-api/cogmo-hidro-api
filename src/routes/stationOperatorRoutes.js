const { Router } = require('express');
const operatorController = require('../controllers/operatorController');
const authMiddleware = require('../middlewares/auth');

// mergeParams: permite ler o :id da estação que vem da URL
const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', operatorController.getByStation);
router.post('/', operatorController.linkStation);
router.delete('/:operatorId', operatorController.unlinkStation);

module.exports = router;