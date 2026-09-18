const { Router } = require('express');
const autenticar = require('../middlewares/authMiddleware');
const pool = require('../config/db');

const router = Router();
router.use(autenticar);

// GET /api/categorias — usado para popular selects nos formulários de caso/incidente.
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, nome FROM categorias ORDER BY nome');
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
