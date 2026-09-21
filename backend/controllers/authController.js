import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

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

export function registarCasal(req, res) {
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

  const existente = db.prepare('SELECT id FROM casais WHERE email = ?').get(email);
  if (existente) {
    return res.status(409).json({ ok: false, erros: { email: 'Este email já está registado.' } });
  }

  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

  const resultado = db
    .prepare(
      `INSERT INTO casais (nome1, nome2, email, data_casamento, password_hash)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(nome1.trim(), nome2.trim(), email.trim().toLowerCase(), dataCasamento || null, passwordHash);

  const casal = {
    id: resultado.lastInsertRowid,
    nome1,
    nome2,
    email,
    dataCasamento: dataCasamento || null,
  };

  const token = gerarToken({ id: casal.id, tipo: 'casal', email: casal.email });

  return res.status(201).json({ ok: true, token, casal });
}

// Login unificado: o login.html só tem um formulário (sem seletor de tipo),
// por isso procura primeiro em casais e depois em fornecedores pelo mesmo email.
export function login(req, res) {
  const { email, password } = req.body || {};

  if (!validEmail(email) || !password) {
    return res.status(400).json({ ok: false, erro: 'Email e palavra-passe são obrigatórios.' });
  }

  const emailNorm = String(email).trim().toLowerCase();

  const casal = db.prepare('SELECT * FROM casais WHERE email = ?').get(emailNorm);
  if (casal && bcrypt.compareSync(password, casal.password_hash)) {
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

  const fornecedor = db.prepare('SELECT * FROM fornecedores WHERE email = ?').get(emailNorm);
  if (fornecedor && bcrypt.compareSync(password, fornecedor.password_hash)) {
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
}

export function loginCasal(req, res) {
  const { email, password } = req.body || {};

  if (!validEmail(email) || !password) {
    return res.status(400).json({ ok: false, erro: 'Email e palavra-passe são obrigatórios.' });
  }

  const casal = db
    .prepare('SELECT * FROM casais WHERE email = ?')
    .get(String(email).trim().toLowerCase());

  if (!casal || !bcrypt.compareSync(password, casal.password_hash)) {
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
}

// ===================== FORNECEDOR =====================

export function registarFornecedor(req, res) {
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

  const existente = db.prepare('SELECT id FROM fornecedores WHERE email = ?').get(emailFornecedor);
  if (existente) {
    return res.status(409).json({ ok: false, erros: { emailFornecedor: 'Este email já está registado.' } });
  }

  const passwordHash = bcrypt.hashSync(passwordFornecedor, SALT_ROUNDS);

  const resultado = db
    .prepare(
      `INSERT INTO fornecedores
        (nome_negocio, responsavel, telefone, email, categoria, localizacao, faixa_preco, preco, descricao, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      nomeNegocio.trim(),
      responsavel.trim(),
      telefone || null,
      emailFornecedor.trim().toLowerCase(),
      categoria || null,
      localizacao || null,
      faixaPreco || null,
      preco || null,
      descricao || null,
      passwordHash
    );

  const fornecedor = {
    id: resultado.lastInsertRowid,
    nomeNegocio,
    responsavel,
    email: emailFornecedor,
    categoria,
  };

  const token = gerarToken({ id: fornecedor.id, tipo: 'fornecedor', email: fornecedor.email });

  return res.status(201).json({ ok: true, token, fornecedor });
}

export function loginFornecedor(req, res) {
  const { email, password } = req.body || {};

  if (!validEmail(email) || !password) {
    return res.status(400).json({ ok: false, erro: 'Email e palavra-passe são obrigatórios.' });
  }

  const fornecedor = db
    .prepare('SELECT * FROM fornecedores WHERE email = ?')
    .get(String(email).trim().toLowerCase());

  if (!fornecedor || !bcrypt.compareSync(password, fornecedor.password_hash)) {
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
}
