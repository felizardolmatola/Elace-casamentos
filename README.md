# Elace — Gestão de Casamentos

Projeto dividido em duas pastas independentes, cada uma com o seu próprio `package.json` e `node_modules`:

```
Elace-casamentos/
├── backend/     # API Node + Express + SQLite (autenticação de casais e fornecedores)
└── frontend/    # Vite (servidor estático), páginas HTML/CSS/JS em public/ (incluindo public/admin/)
```

## Backend

```bash
cd backend
npm install
npm start        # http://localhost:8080
```

Endpoints principais: `POST /api/auth/registo`, `POST /api/auth/login` (unificado — casal ou fornecedor), `POST /api/auth/registo-fornecedor`, `GET /api/casal/me`, `GET /api/fornecedor/me` (protegidos com JWT).

A base de dados SQLite é criada automaticamente em `backend/data/enlace.db` (pasta ignorada pelo git).

## Frontend

Noutro terminal:

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

## Rotas principais (frontend)

- `/` — página inicial
- `/login.html` — login
- `/registo.html` — registo (casal e fornecedor)
- `/fornecedores.html` — lista de fornecedores
- `/dashboard.html` — painel do casal (protegido, backend real)
- `/dashboard-fornecedor.html` — painel do fornecedor (protegido, backend real)
- `/convite.html` — convite
- `/admin/fornecedores.html` — área administrativa (pública, edição de fornecedores)
- `/admin/admin-fornecedores.html` — painel de administração de fornecedores

Todas as páginas são HTML/CSS/JS autónomos servidos diretamente por `public/`, sem camada de SPA/React — cada uma faz a sua própria navegação (`window.location`) e chama a API do backend diretamente quando necessário.
