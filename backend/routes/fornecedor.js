import { Router } from 'express';
import { db } from '../config/db.js';
import { exigirAutenticacao, exigirTipo } from '../middlewares/auth.js';

const router = Router();

// GET /api/fornecedor/me — dados do fornecedor autenticado
router.get('/me', exigirAutenticacao, exigirTipo('fornecedor'), (req, res) => {
  const fornecedor = db.prepare('SELECT * FROM fornecedores WHERE id = ?').get(req.usuario.id);

  if (!fornecedor) {
    return res.status(404).json({ ok: false, erro: 'Fornecedor não encontrado.' });
  }

  return res.json({
    ok: true,
    fornecedor: {
      id: fornecedor.id,
      nomeNegocio: fornecedor.nome_negocio,
      responsavel: fornecedor.responsavel,
      telefone: fornecedor.telefone,
      email: fornecedor.email,
      categoria: fornecedor.categoria,
      localizacao: fornecedor.localizacao,
      faixaPreco: fornecedor.faixa_preco,
      preco: fornecedor.preco,
      descricao: fornecedor.descricao,
      ativo: !!fornecedor.ativo,
    },
  });
});

export default router;
