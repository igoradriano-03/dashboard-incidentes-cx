// Middleware central de erros (Seção 30 da especificação).
// Objetivo: nunca deixar vazar mensagem técnica/stack trace para o usuário final.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);

  // 23505 = unique_violation no PostgreSQL (ex: e-mail duplicado)
  if (err.code === '23505') {
    return res.status(409).json({ mensagem: 'Já existe um registro com esses dados.' });
  }

  // 23503 = foreign_key_violation (ex: categoria_id/responsavel_id/incidente_id inexistente)
  if (err.code === '23503') {
    return res.status(400).json({
      mensagem: 'Não foi possível salvar: verifique se a categoria, o responsável ou o incidente informado realmente existem.',
    });
  }

  // 23502 = not_null_violation (campo obrigatório do banco não foi preenchido)
  if (err.code === '23502') {
    return res.status(400).json({
      mensagem: `O campo "${err.column}" é obrigatório e não foi preenchido.`,
    });
  }

  // Erro lançado pelo trigger trg_casos_valida_incidente_encerrado (RN10)
  if (err.message && err.message.startsWith('Não é possível associar')) {
    return res.status(400).json({ mensagem: err.message });
  }

  return res.status(500).json({
    mensagem: 'Ocorreu um erro interno. Tente novamente mais tarde.',
  });
}

module.exports = errorHandler;
