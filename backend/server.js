import express from 'express';
import cors from 'cors';
import './config/db.js';

import authRoutes from './routes/auth.js';
import casalRoutes from './routes/casal.js';
import fornecedorRoutes from './routes/fornecedor.js';

const app = express();

// O Render fornece a porta através de process.env.PORT.
const PORT = process.env.PORT || 8080;

// Permite requisições do frontend.
app.use(cors());

// Permite receber JSON nas requisições.
app.use(express.json());

// Rota de teste da API.
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'Backend do Enlace rodando com sucesso!'
  });
});

// Rotas da API.
app.use('/api/auth', authRoutes);
app.use('/api/casal', casalRoutes);
app.use('/api/fornecedor', fornecedorRoutes);

// Middleware de erro genérico.
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    ok: false,
    erro: 'Erro interno do servidor.'
  });
});

// O Render precisa que o servidor escute em 0.0.0.0.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
