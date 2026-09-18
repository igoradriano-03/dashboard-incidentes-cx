const { Router } = require('express');
const authRoutes = require('./authRoutes');
const casoRoutes = require('./casoRoutes');
const incidenteRoutes = require('./incidenteRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const categoriaRoutes = require('./categoriaRoutes');
const usuarioRoutes = require('./usuarioRoutes');

const router = Router();

// Endpoint simples para confirmar que a API está de pé (usado no teste da ETAPA 3)
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', mensagem: 'API Dashboard de Gestão de Incidentes no ar.' });
});

router.use('/auth', authRoutes);
router.use('/casos', casoRoutes);
router.use('/incidentes', incidenteRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/usuarios', usuarioRoutes);

module.exports = router;
