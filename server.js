import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Middlewares de autenticação
import { protect, restrictTo } from './utils/authUtils.js';

// Rotas
import formRoutes from './routes/formRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Caminhos ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globais
app.use(cors({
  origin: true,
  credentials: true, // ✅ Importante para o cookie do login
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Servir arquivos públicos (login, css, etc)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔌 Conectar ao MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado com sucesso!'))
  .catch((err) => console.error('❌ Erro na conexão com MongoDB:', err));

// 📌 Rotas da API
app.use('/api/form', formRoutes);      // Envio de formulários
app.use('/api/auth', authRoutes);      // Login, logout, sessão
app.use('/api/admin', adminRoutes);    // Recursos administrativos

// 🧪 Rota de teste
app.get('/', (req, res) => {
  res.send('✅ API do Formulário Funcionando!');
});

// 📂 Página de Login Admin (acesso livre)
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// 📂 Protege toda a pasta /admin (HTML, JS, CSS)
app.use(
  '/admin',
  protect,
  restrictTo('admin'),
  express.static(path.join(__dirname, 'admin'))
);

// 📂 Redireciona /admin para index.html protegido
app.get('/admin', protect, restrictTo('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// 🧯 Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: err.message });
  }

  res.status(500).json({ success: false, message: 'Erro interno no servidor' });
});

// 🚀 Iniciar o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Uploads sendo servidos de: ${path.join(__dirname, 'uploads')}`);
});
