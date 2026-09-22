import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import './config/db.js';

import authRoutes from './routes/auth.js';
import casalRoutes from './routes/casal.js';
import fornecedorRoutes from './routes/fornecedor.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'Backend do Enlace rodando com sucesso!'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/casal', casalRoutes);
app.use('/api/fornecedor', fornecedorRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    ok: false,
    erro: 'Erro interno do servidor.'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
