const jwt = require('jsonwebtoken');

// Protege rotas exigindo um token JWT válido no header Authorization.
// Uso: router.get('/rota-protegida', autenticar, controller)
function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Token de autenticação não informado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, nome, email, perfil }
    return next();
  } catch (err) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado. Faça login novamente.' });
  }
}

module.exports = autenticar;
