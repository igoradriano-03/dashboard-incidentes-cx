require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function seedAdmin() {
  try {
    const senhaHash = await bcrypt.hash('admin123', 10);

    await pool.query(
      `INSERT INTO usuarios (nome, email, senha, perfil)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET senha = EXCLUDED.senha`,
      ['Administrador CX', 'admin@dash.cx.com', senhaHash, 'Administrador']
    );

    console.log('✅ Senha do admin resetada com sucesso!');
    console.log('E-mail: admin@dash.cx.com');
    console.log('Senha:  admin123');
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
  } finally {
    await pool.end();
  }
}
seedAdmin();
