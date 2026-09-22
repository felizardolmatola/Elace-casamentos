import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { sql } from '../config/db.js';
import { exigirAutenticacao, exigirTipo } from '../middlewares/auth.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-troca-isto-em-producao';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

router.get('/me', exigirAutenticacao, exigirTipo('casal'), async (req, res) => {
  try {
    const [casal] = await sql`
      SELECT * FROM casais
      WHERE id = ${Number(req.usuario.id)}
      LIMIT 1
    `;

    if (!casal) return res.status(404).json({ ok: false, erro: 'Casal não encontrado.' });

    return res.json({ ok: true, casal: {
      id: casal.id, nome1: casal.nome1, nome2: casal.nome2, email: casal.email,
      dataCasamento: casal.data_casamento, telefone: casal.telefone || null,
      convidados: casal.convidados ?? null, estado: casal.estado || 'ativo', notas: casal.notas || '',
    }});
  } catch (err) {
    console.error('GET /api/casal/me:', err);
    return res.status(500).json({ ok: false, erro: 'Erro ao consultar o casal.' });
  }
});

router.post('/admin/login', (req, res) => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return res.status(503).json({ ok: false, erro: 'ADMIN_EMAIL e ADMIN_PASSWORD não estão configurados no servidor.' });
  }
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (email !== ADMIN_EMAIL.trim().toLowerCase() || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, erro: 'Credenciais de administrador inválidas.' });
  }
  const token = jwt.sign({ id: 'admin', tipo: 'admin', email: ADMIN_EMAIL }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ ok: true, token });
});

function mapearCasal(casal) {
  return {
    id: casal.id, nome1: casal.nome1, nome2: casal.nome2,
    nome: `${casal.nome1} & ${casal.nome2}`, email: casal.email,
    dataCasamento: casal.data_casamento, telefone: casal.telefone || '',
    convidados: casal.convidados ?? null, estado: casal.estado || 'ativo',
    notas: casal.notas || '', criadoEm: casal.criado_em,
  };
}

router.get('/admin/casais', exigirAutenticacao, exigirTipo('admin'), async (req, res) => {
  try {
    const casais = await sql`
      SELECT id, nome1, nome2, email, data_casamento, telefone, convidados, estado, notas, criado_em
      FROM casais ORDER BY id DESC
    `;
    return res.json({ ok: true, casais: casais.map(mapearCasal) });
  } catch (err) {
    console.error('GET /api/casal/admin/casais:', err);
    return res.status(500).json({ ok: false, erro: 'Erro ao listar os casais.' });
  }
});

router.patch('/admin/casais/:id', exigirAutenticacao, exigirTipo('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, erro: 'ID do casal inválido.' });

  try {
    const [atual] = await sql`SELECT * FROM casais WHERE id = ${id} LIMIT 1`;
    if (!atual) return res.status(404).json({ ok: false, erro: 'Casal não encontrado.' });

    const nome1 = String(req.body?.nome1 ?? atual.nome1).trim();
    const nome2 = String(req.body?.nome2 ?? atual.nome2).trim();
    const email = String(req.body?.email ?? atual.email).trim().toLowerCase();
    const dataCasamento = req.body?.dataCasamento ?? atual.data_casamento ?? null;
    const telefone = req.body?.telefone ?? atual.telefone ?? null;
    const convidados = req.body?.convidados === '' || req.body?.convidados == null ? null : Number(req.body.convidados);
    const estado = String(req.body?.estado ?? atual.estado ?? 'ativo').trim();
    const notas = String(req.body?.notas ?? atual.notas ?? '').trim();

    if (!nome1 || !nome2 || !email) return res.status(400).json({ ok: false, erro: 'Nome dos dois noivos e e-mail são obrigatórios.' });
    if (convidados !== null && (!Number.isInteger(convidados) || convidados < 0)) return res.status(400).json({ ok: false, erro: 'Número de convidados inválido.' });
    if (!['ativo', 'pendente', 'inativo'].includes(estado)) return res.status(400).json({ ok: false, erro: 'Estado da conta inválido.' });

    await sql`
      UPDATE casais SET nome1 = ${nome1}, nome2 = ${nome2}, email = ${email},
      data_casamento = ${dataCasamento || null}, telefone = ${telefone || null},
      convidados = ${convidados}, estado = ${estado}, notas = ${notas || null}
      WHERE id = ${id}
    `;

    const [atualizado] = await sql`
      SELECT id, nome1, nome2, email, data_casamento, telefone, convidados, estado, notas, criado_em
      FROM casais WHERE id = ${id} LIMIT 1
    `;
    return res.json({ ok: true, casal: mapearCasal(atualizado) });
  } catch (err) {
    console.error('PATCH /api/casal/admin/casais/:id:', err);
    if (err?.code === '23505') return res.status(409).json({ ok: false, erro: 'Já existe outro casal com esse e-mail.' });
    return res.status(500).json({ ok: false, erro: 'Não foi possível atualizar o casal.' });
  }
});

router.delete('/admin/casais/:id', exigirAutenticacao, exigirTipo('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, erro: 'ID do casal inválido.' });
  try {
    const resultado = await sql`DELETE FROM casais WHERE id = ${id} RETURNING id`;
    if (resultado.length === 0) return res.status(404).json({ ok: false, erro: 'Casal não encontrado.' });
    return res.json({ ok: true, mensagem: 'Conta do casal eliminada.' });
  } catch (err) {
    console.error('DELETE /api/casal/admin/casais/:id:', err);
    return res.status(500).json({ ok: false, erro: 'Não foi possível eliminar o casal.' });
  }
});

export default router;
