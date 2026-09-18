const { Router } = require('express');
const autenticar = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

const router = Router();

router.use(autenticar);
router.get('/', dashboardController.obter);

module.exports = router;
