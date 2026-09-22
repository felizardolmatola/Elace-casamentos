import { Router } from 'express';
import { sql } from '../config/db.js';
import { exigirAutenticacao, exigirTipo } from '../middlewares/auth.js';

const router = Router();

function mapearFornecedor(f) {
  return {
    id: f.id, nomeNegocio: f.nome_negocio, responsavel: f.responsavel,
    telefone: f.telefone, email: f.email, categoria: f.categoria,
    localizacao: f.localizacao, faixaPreco: f.faixa_preco, preco: f.preco,
    descricao: f.descricao, foto: f.foto || null, ativo: !!f.ativo, criadoEm: f.criado_em,
  };
}

router.get('/', async (req, res) => {
  try {
    const fornecedores = await sql`
      SELECT id, nome_negocio, responsavel, telefone, email, categoria, localizacao,
      faixa_preco, preco, descricao, foto, ativo, criado_em
      FROM fornecedores WHERE ativo = TRUE ORDER BY id DESC
    `;
    return res.json({ ok: true, fornecedores: fornecedores.map(mapearFornecedor) });
  } catch (err) {
    console.error('GET /api/fornecedor:', err);
    return res.status(500).json({ ok: false, erro: 'Erro ao consultar fornecedores.' });
  }
});

router.get('/me', exigirAutenticacao, exigirTipo('fornecedor'), async (req, res) => {
  try {
    const [fornecedor] = await sql`
      SELECT id, nome_negocio, responsavel, telefone, email, categoria, localizacao,
      faixa_preco, preco, descricao, foto, ativo, criado_em
      FROM fornecedores WHERE id = ${Number(req.usuario.id)} LIMIT 1
    `;
    if (!fornecedor) return res.status(404).json({ ok: false, erro: 'Fornecedor não encontrado.' });
    return res.json({ ok: true, fornecedor: mapearFornecedor(fornecedor) });
  } catch (err) {
    console.error('GET /api/fornecedor/me:', err);
    return res.status(500).json({ ok: false, erro: 'Erro ao consultar o fornecedor.' });
  }
});

router.get('/pendentes', exigirAutenticacao, exigirTipo('admin'), async (req, res) => {
  try {
    const fornecedores = await sql`
      SELECT id, nome_negocio, responsavel, telefone, email, categoria, localizacao,
      faixa_preco, preco, descricao, foto, ativo, criado_em
      FROM fornecedores WHERE ativo = FALSE ORDER BY id DESC
    `;
    return res.json({ ok: true, fornecedores: fornecedores.map(mapearFornecedor) });
  } catch (err) {
    console.error('GET /api/fornecedor/pendentes:', err);
    return res.status(500).json({ ok: false, erro: 'Erro ao consultar fornecedores pendentes.' });
  }
});

router.patch('/:id/aprovar', exigirAutenticacao, exigirTipo('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, erro: 'ID do fornecedor inválido.' });
  try {
    const resultado = await sql`
      UPDATE fornecedores SET ativo = TRUE WHERE id = ${id}
      RETURNING id, nome_negocio, responsavel, telefone, email, categoria, localizacao,
      faixa_preco, preco, descricao, foto, ativo, criado_em
    `;
    if (resultado.length === 0) return res.status(404).json({ ok: false, erro: 'Fornecedor não encontrado.' });
    return res.json({ ok: true, fornecedor: mapearFornecedor(resultado[0]), mensagem: 'Fornecedor aprovado.' });
  } catch (err) {
    console.error('PATCH /api/fornecedor/:id/aprovar:', err);
    return res.status(500).json({ ok: false, erro: 'Não foi possível aprovar o fornecedor.' });
  }
});

router.patch('/:id/reprovar', exigirAutenticacao, exigirTipo('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, erro: 'ID do fornecedor inválido.' });
  try {
    const resultado = await sql`
      UPDATE fornecedores SET ativo = FALSE WHERE id = ${id}
      RETURNING id, nome_negocio, responsavel, telefone, email, categoria, localizacao,
      faixa_preco, preco, descricao, foto, ativo, criado_em
    `;
    if (resultado.length === 0) return res.status(404).json({ ok: false, erro: 'Fornecedor não encontrado.' });
    return res.json({ ok: true, fornecedor: mapearFornecedor(resultado[0]), mensagem: 'Fornecedor reprovado.' });
  } catch (err) {
    console.error('PATCH /api/fornecedor/:id/reprovar:', err);
    return res.status(500).json({ ok: false, erro: 'Não foi possível reprovar o fornecedor.' });
  }
});

export default router;
