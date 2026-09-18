const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Retorna { token, usuario } se as credenciais forem válidas, ou null caso contrário.
// Propositalmente não diferencia "e-mail não existe" de "senha errada" na resposta,
// para não revelar quais e-mails estão cadastrados no sistema.
async function autenticarUsuario(email, senha) {
  const { rows } = await pool.query(
    'SELECT id, nome, email, senha, perfil FROM usuarios WHERE email = $1',
    [email]
  );

  const usuario = rows[0];

  if (!usuario) {
    return null;
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    return null;
  }

  const token = jwt.sign(
    {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    },
  };
}

module.exports = { autenticarUsuario };
