import { Router } from 'express';
import {
  registarCasal,
  login,
  loginCasal,
  registarFornecedor,
  loginFornecedor,
} from '../controllers/authController.js';

const router = Router();

// Casal (público que usa /registo.html — formulário principal)
router.post('/registo', registarCasal);

// login.html só tem UM formulário de login (sem seletor casal/fornecedor),
// por isso /login tenta ambas as tabelas pelo email.
router.post('/login', login);
router.post('/login-casal', loginCasal); // dedicado, caso venha a ser útil

// Fornecedor (público que usa /registo.html — segundo formulário)
router.post('/registo-fornecedor', registarFornecedor);
router.post('/login-fornecedor', loginFornecedor);

export default router;
