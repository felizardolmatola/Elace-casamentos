import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Usa o módulo nativo node:sqlite do Node.js (>=22.5) — sem dependências
// nativas para compilar. É "experimental" mas estável para o que precisamos.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'enlace.db');
export const db = new DatabaseSync(DB_PATH);

// Ativa chaves estrangeiras
db.exec('PRAGMA foreign_keys = ON;');

// ===== Tabela: casais (utilizadores que se registam em /registo) =====
db.exec(`
  CREATE TABLE IF NOT EXISTS casais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome1 TEXT NOT NULL,
    nome2 TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    data_casamento TEXT,
    password_hash TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ===== Tabela: fornecedores (negócios que se registam em /registo) =====
db.exec(`
  CREATE TABLE IF NOT EXISTS fornecedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_negocio TEXT NOT NULL,
    responsavel TEXT NOT NULL,
    telefone TEXT,
    email TEXT NOT NULL UNIQUE,
    categoria TEXT,
    localizacao TEXT,
    faixa_preco TEXT,
    preco TEXT,
    descricao TEXT,
    password_hash TEXT NOT NULL,
    ativo INTEGER NOT NULL DEFAULT 0,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

console.log(`Base de dados SQLite pronta em: ${DB_PATH}`);
