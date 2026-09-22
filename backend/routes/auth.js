import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '../config/db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-troca-isto-em-producao';

router.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      erro: 'E-mail e senha são obrigatórios.'
    });
  }

  try {
    const [casal] = await sql`
      SELECT id, nome1, nome2, email, password_hash
      FROM casais WHERE LOWER(email) = ${email} LIMIT 1
    `;

    if (casal) {
      const valido = await bcrypt.compare(password, casal.password_hash);
      if (valido) {
        const token = jwt.sign(
          { id: casal.id, tipo: 'casal', email: casal.email },
          JWT_SECRET,
          { expiresIn: '8h' }
        );
        return res.json({ ok: true, token, tipo: 'casal' });
      }
    }

    const [fornecedor] = await sql`
      SELECT id, email, password_hash
      FROM fornecedores WHERE LOWER(email) = ${email} LIMIT 1
    `;

    if (fornecedor && fornecedor.password_hash) {
      const valido = await bcrypt.compare(password, fornecedor.password_hash);
      if (valido) {
        const token = jwt.sign(
          { id: fornecedor.id, tipo: 'fornecedor', email: fornecedor.email },
          JWT_SECRET,
          { expiresIn: '8h' }
        );
        return res.json({ ok: true, token, tipo: 'fornecedor' });
      }
    }

    return res.status(401).json({
      ok: false,
      erro: 'E-mail ou senha inválidos.'
    });
  } catch (err) {
    console.error('POST /api/auth/login:', err);
    return res.status(500).json({
      ok: false,
      erro: 'Erro ao realizar login.'
    });
  }
});

export default router;
