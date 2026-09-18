const { Router } = require('express');
const autenticar = require('../middlewares/authMiddleware');
const incidenteController = require('../controllers/incidenteController');
const atualizacaoController = require('../controllers/atualizacaoIncidenteController');
const {
  criarIncidenteValidator,
  atualizarIncidenteValidator,
  idParamValidator,
} = require('../validators/incidenteValidator');
const {
  listarAtualizacoesValidator,
  criarAtualizacaoValidator,
} = require('../validators/atualizacaoIncidenteValidator');

const router = Router();

// Todas as rotas de incidentes exigem usuário autenticado (Seção 29).
router.use(autenticar);

router.get('/', incidenteController.listar);
router.get('/:id', idParamValidator, incidenteController.buscarPorId);
router.post('/', criarIncidenteValidator, incidenteController.criar);
router.put('/:id', atualizarIncidenteValidator, incidenteController.atualizar);

// Atualizações — timeline do incidente (ETAPA 7 / Seção 11)
router.get('/:id/atualizacoes', listarAtualizacoesValidator, atualizacaoController.listar);
router.post('/:id/atualizacoes', criarAtualizacaoValidator, atualizacaoController.criar);

// Observação: a especificação (Seção 28) não lista DELETE para incidentes,
// então essa rota não foi criada — coerente com a RN10 (incidente encerrado
// é uma forma de "fechamento", não de exclusão).

module.exports = router;
