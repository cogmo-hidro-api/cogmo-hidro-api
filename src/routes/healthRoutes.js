const { Router } = require('express');
const healthController = require('../controllers/healthController');

const router = Router();

// /api/health (pública)
router.get('/', healthController.check);

module.exports = router;
