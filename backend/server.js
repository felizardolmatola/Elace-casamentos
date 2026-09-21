import express from 'express';
import cors from 'cors';
import './config/db.js'; // inicializa a base de dados e cria as tabelas
import authRoutes from './routes/auth.js';
import casalRoutes from './routes/casal.js';
import fornecedorRoutes from './routes/fornecedor.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors()); // frontend (Vite, porta 5173) e backend (porta 8080) são origens diferentes
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Backend do Enlace rodando com sucesso!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/casal', casalRoutes);
app.use('/api/fornecedor', fornecedorRoutes);

// Middleware de erro genérico (fica no fim)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ ok: false, erro: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
