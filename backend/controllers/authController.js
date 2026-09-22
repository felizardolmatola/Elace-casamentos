import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-troca-isto-em-producao';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

function gerarToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ===================== CASAL =====================

export async function registarCasal(req, res) {
  const { nome1, nome2, email, dataCasamento, password, confirmarPassword } = req.body || {};

  const erros = {};
  if (!nome1 || !String(nome1).trim()) erros.nome1 = 'Nome obrigatório.';
  if (!nome2 || !String(nome2).trim()) erros.nome2 = 'Nome obrigatório.';
  if (!validEmail(email)) erros.email = 'Email inválido.';
  if (!password || String(password).length < 8) erros.password = 'Mínimo de 8 caracteres.';
  if (password !== confirmarPassword) erros.confirmarPassword = 'As palavras-passe não coincidem.';

  if (Object.keys(erros).length > 0) {
    return res.status(400).json({ ok: false, erros });
  }

  const emailNorm = String(email).trim().toLowerCase();

  try {
    const [existente] = await sql`
      SELECT id FROM casais WHERE LOWER(email) = ${emailNorm} LIMIT 1
    `;

    if (existente) {
      return res.status(409).json({
        ok: false,
        erros: { email: 'Este email já está registado.' }
      });
    }

    const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);

    const [resultado] = await sql`
      INSERT INTO casais (nome1, nome2, email, data_casamento, password_hash)
      VALUES (
        ${String(nome1).trim()},
        ${String(nome2).trim()},
        ${emailNorm},
        ${dataCasamento || null},
        ${passwordHash}
      )
      RETURNING id, nome1, nome2, email, data_casamento
    `;

    const casal = {
      id: resultado.id,
      nome1: resultado.nome1,
      nome2: resultado.nome2,
      email: resultado.email,
      dataCasamento: resultado.data_casamento || null,
    };

    const token = gerarToken({ id: casal.id, tipo: 'casal', email: casal.email });

    return res.status(201).json({ ok: true, token, casal });
  } catch (err) {
    console.error('POST /registarCasal:', err);

    if (err?.code === '23505') {
      return res.status(409).json({
        ok: false,
        erros: { email: 'Este email já está registado.' }
      });
    }

    return res.status(500).json({ ok: false, erro: 'Erro ao registar o casal.' });
  }
}

// Login unificado: procura primeiro em casais e depois em fornecedores pelo mesmo email.
export async function login(req, res) {
  const { email, password } = req.body || {};

  if (!validEmail(email) || !password) {
    return res.status(400).json({ ok: false, erro: 'Email e palavra-passe são obrigatórios.' });
  }

  const emailNorm = String(email).trim().toLowerCase();

  try {
    const [casal] = await sql`
      SELECT * FROM casais WHERE LOWER(email) = ${emailNorm} LIMIT 1
    `;

    if (casal && await bcrypt.compare(String(password), casal.password_hash)) {
      const token = gerarToken({ id: casal.id, tipo: 'casal', email: casal.email });
      return res.json({
        ok: true,
        token,
        tipo: 'casal',
        usuario: {
          id: casal.id,
          nome1: casal.nome1,
          nome2: casal.nome2,
          email: casal.email,
          dataCasamento: casal.data_casamento,
        },
      });
    }

    const [fornecedor] = await sql`
      SELECT * FROM fornecedores WHERE LOWER(email) = ${emailNorm} LIMIT 1
    `;

    if (fornecedor?.password_hash && await bcrypt.compare(String(password), fornecedor.password_hash)) {
      const token = gerarToken({ id: fornecedor.id, tipo: 'fornecedor', email: fornecedor.email });
      return res.json({
        ok: true,
        token,
        tipo: 'fornecedor',
        usuario: {
          id: fornecedor.id,
          nomeNegocio: fornecedor.nome_negocio,
          responsavel: fornecedor.responsavel,
          email: fornecedor.email,
          categoria: fornecedor.categoria,
        },
      });
    }

    return res.status(401).json({ ok: false, erro: 'Credenciais inválidas.' });
  } catch (err) {
    console.error('POST /login:', err);
    return res.status(500).json({ ok: false, erro: 'Erro ao realizar login.' });
  }
}

export async function loginCasal(req, res) {
  const { email, password } = req.body || {};

  if (!validEmail(email) || !password) {
    return res.status(400).json({ ok: false, erro: 'Email e palavra-passe são obrigatórios.' });
  }

  const emailNorm = String(email).trim().toLowerCase();

  try {
    const [casal] = await sql`
      SELECT * FROM casais WHERE LOWER(email) = ${emailNorm} LIMIT 1
    `;

    if (!casal || !(await bcrypt.compare(String(password), casal.password_hash))) {
      return res.status(401).json({ ok: false, erro: 'Credenciais inválidas.' });
    }

    const token = gerarToken({ id: casal.id, tipo: 'casal', email: casal.email });

    return res.json({
      ok: true,
      token,
      casal: {
        id: casal.id,
        nome1: casal.nome1,
        nome2: casal.nome2,
        email: casal.email,
        dataCasamento: casal.data_casamento,
      },
    });
  } catch (err) {
    console.error('POST /loginCasal:', err);
    return res.status(500).json({ ok: false, erro: 'Erro ao realizar login.' });
  }
}

// ===================== FORNECEDOR =====================

export async function registarFornecedor(req, res) {
  const {
    nomeNegocio,
    responsavel,
    telefone,
    emailFornecedor,
    categoria,
    localizacao,
    faixaPreco,
    preco,
    descricao,
    passwordFornecedor,
    confirmarPasswordFornecedor,
  } = req.body || {};

  const erros = {};
  if (!nomeNegocio || !String(nomeNegocio).trim()) erros.nomeNegocio = 'Nome do negócio obrigatório.';
  if (!responsavel || !String(responsavel).trim()) erros.responsavel = 'Responsável obrigatório.';
  if (!validEmail(emailFornecedor)) erros.emailFornecedor = 'Email inválido.';
  if (!passwordFornecedor || String(passwordFornecedor).length < 8) {
    erros.passwordFornecedor = 'Mínimo de 8 caracteres.';
  }
  if (passwordFornecedor !== confirmarPasswordFornecedor) {
    erros.confirmarPasswordFornecedor = 'As palavras-passe não coincidem.';
  }

  if (Object.keys(erros).length > 0) {
    return res.status(400).json({ ok: false, erros });
  }

  const emailNorm = String(emailFornecedor).trim().toLowerCase();

  try {
    const [existente] = await sql`
      SELECT id FROM fornecedores WHERE LOWER(email) = ${emailNorm} LIMIT 1
    `;

    if (existente) {
      return res.status(409).json({
        ok: false,
        erros: { emailFornecedor: 'Este email já está registado.' }
      });
    }

    const passwordHash = await bcrypt.hash(String(passwordFornecedor), SALT_ROUNDS);

    const [resultado] = await sql`
      INSERT INTO fornecedores
        (nome_negocio, responsavel, telefone, email, categoria, localizacao, faixa_preco, preco, descricao, password_hash)
      VALUES (
        ${String(nomeNegocio).trim()},
        ${String(responsavel).trim()},
        ${telefone || null},
        ${emailNorm},
        ${categoria || null},
        ${localizacao || null},
        ${faixaPreco || null},
        ${preco || null},
        ${descricao || null},
        ${passwordHash}
      )
      RETURNING id, nome_negocio, responsavel, email, categoria
    `;

    const fornecedor = {
      id: resultado.id,
      nomeNegocio: resultado.nome_negocio,
      responsavel: resultado.responsavel,
      email: resultado.email,
      categoria: resultado.categoria,
    };

    const token = gerarToken({ id: fornecedor.id, tipo: 'fornecedor', email: fornecedor.email });

    return res.status(201).json({ ok: true, token, fornecedor });
  } catch (err) {
    console.error('POST /registarFornecedor:', err);

    if (err?.code === '23505') {
      return res.status(409).json({
        ok: false,
        erros: { emailFornecedor: 'Este email já está registado.' }
      });
    }

    return res.status(500).json({ ok: false, erro: 'Erro ao registar o fornecedor.' });
  }
}

export async function loginFornecedor(req, res) {
  const { email, password } = req.body || {};

  if (!validEmail(email) || !password) {
    return res.status(400).json({ ok: false, erro: 'Email e palavra-passe são obrigatórios.' });
  }

  const emailNorm = String(email).trim().toLowerCase();

  try {
    const [fornecedor] = await sql`
      SELECT * FROM fornecedores WHERE LOWER(email) = ${emailNorm} LIMIT 1
    `;

    if (!fornecedor || !fornecedor.password_hash || !(await bcrypt.compare(String(password), fornecedor.password_hash))) {
      return res.status(401).json({ ok: false, erro: 'Credenciais inválidas.' });
    }

    const token = gerarToken({ id: fornecedor.id, tipo: 'fornecedor', email: fornecedor.email });

    return res.json({
      ok: true,
      token,
      fornecedor: {
        id: fornecedor.id,
        nomeNegocio: fornecedor.nome_negocio,
        responsavel: fornecedor.responsavel,
        email: fornecedor.email,
        categoria: fornecedor.categoria,
      },
    });
  } catch (err) {
    console.error('POST /loginFornecedor:', err);
    return res.status(500).json({ ok: false, erro: 'Erro ao realizar login.' });
  }
}
