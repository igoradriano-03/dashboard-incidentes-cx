const { Router } = require('express');
const autenticar = require('../middlewares/authMiddleware');
const casoController = require('../controllers/casoController');
const interacaoController = require('../controllers/interacaoController');
const {
  criarCasoValidator,
  atualizarCasoValidator,
  idParamValidator,
} = require('../validators/casoValidator');
const {
  listarInteracoesValidator,
  criarInteracaoValidator,
} = require('../validators/interacaoValidator');

const router = Router();

// Todas as rotas de casos exigem usuário autenticado (Seção 29).
router.use(autenticar);

router.get('/', casoController.listar);
router.get('/:id', idParamValidator, casoController.buscarPorId);
router.post('/', criarCasoValidator, casoController.criar);
router.put('/:id', atualizarCasoValidator, casoController.atualizar);
router.delete('/:id', idParamValidator, casoController.remover);

// Interações — timeline do caso (ETAPA 7 / Seção 12)
router.get('/:id/interacoes', listarInteracoesValidator, interacaoController.listar);
router.post('/:id/interacoes', criarInteracaoValidator, interacaoController.criar);

module.exports = router;
