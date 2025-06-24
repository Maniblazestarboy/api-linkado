import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../utils/authUtils.js';

const router = express.Router();

// 🔐 Função para gerar o JWT
const createToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '90d' }
  );
};

// ✅ LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ message: 'Email ou senha incorretos.' });
    }

    const token = createToken(user._id, user.role);

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 dias
    });

    res.status(200).json({
      message: 'Login bem-sucedido',
      name: user.name,
      role: user.role,
    });

  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ message: 'Erro interno no login.' });
  }
});

// ✅ LOGOUT
router.get('/logout', (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  });
  res.redirect('/admin/login');
});

// ✅ ME: Dados do usuário autenticado
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name email role');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error('Erro ao buscar dados do usuário:', err);
    res.status(500).json({ message: 'Erro ao buscar informações do usuário.' });
  }
});

export default router;
