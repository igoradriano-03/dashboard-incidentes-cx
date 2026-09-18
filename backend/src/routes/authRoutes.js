const { Router } = require('express');
const { login, me } = require('../controllers/authController');
const { loginValidator } = require('../validators/authValidator');
const autenticar = require('../middlewares/authMiddleware');

const router = Router();

router.post('/login', loginValidator, login);
router.get('/me', autenticar, me);

module.exports = router;
