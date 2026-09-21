import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-troca-isto-em-producao';

// Middleware genérico: exige um token válido no cabeçalho Authorization.
// Uso futuro: router.get('/dashboard', exigirAutenticacao, handler)
export function exigirAutenticacao(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [tipo, token] = authHeader.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ ok: false, erro: 'Token em falta ou inválido.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload; // { id, tipo: 'casal' | 'fornecedor', email }
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, erro: 'Token expirado ou inválido.' });
  }
}

// Restringe a um tipo específico de utilizador (ex.: só 'fornecedor')
export function exigirTipo(tipoEsperado) {
  return (req, res, next) => {
    if (!req.usuario || req.usuario.tipo !== tipoEsperado) {
      return res.status(403).json({ ok: false, erro: 'Acesso não autorizado.' });
    }
    next();
  };
}
