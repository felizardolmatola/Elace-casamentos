import { Router } from 'express';
import { db } from '../config/db.js';
import { exigirAutenticacao, exigirTipo } from '../middlewares/auth.js';

const router = Router();

// GET /api/casal/me — dados do casal autenticado (usado pelo dashboard.html para
// confirmar a sessão e mostrar o nome dos noivos).
router.get('/me', exigirAutenticacao, exigirTipo('casal'), (req, res) => {
  const casal = db.prepare('SELECT * FROM casais WHERE id = ?').get(req.usuario.id);

  if (!casal) {
    return res.status(404).json({ ok: false, erro: 'Casal não encontrado.' });
  }

  return res.json({
    ok: true,
    casal: {
      id: casal.id,
      nome1: casal.nome1,
      nome2: casal.nome2,
      email: casal.email,
      dataCasamento: casal.data_casamento,
    },
  });
});

export default router;
