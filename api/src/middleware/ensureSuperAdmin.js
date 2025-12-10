// api/src/middleware/ensureSuperAdmin.js
// Garante que a rota só seja acessível por usuários SUPER_ADMIN

function ensureSuperAdmin(req, res, next) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: 'Autenticação necessária' });
  }

  const role = typeof user.role === 'string' ? user.role.toUpperCase() : user.role;

  if (role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito ao painel mestre' });
  }

  return next();
}

module.exports = ensureSuperAdmin;
