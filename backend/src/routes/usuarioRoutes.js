const { Router } = require('express');
const autenticar = require('../middlewares/authMiddleware');
const pool = require('../config/db');

const router = Router();
router.use(autenticar);

// GET /api/usuarios — usado para popular o select de "Responsável" nos formulários.
// Não retorna a coluna "senha" por segurança.
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, nome, perfil FROM usuarios ORDER BY nome');
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
