import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-troca-isto-em-producao';

export function exigirAutenticacao(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [tipo, token] = authHeader.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({
      ok: false,
      erro: 'Token de autenticação não fornecido.'
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload;
    next();
  } catch {
    return res.status(401).json({
      ok: false,
      erro: 'Token inválido ou expirado.'
    });
  }
}

export function exigirTipo(tipoEsperado) {
  return (req, res, next) => {
    if (!req.usuario || req.usuario.tipo !== tipoEsperado) {
      return res.status(403).json({
        ok: false,
        erro: 'Acesso não autorizado.'
      });
    }

    next();
  };
}
