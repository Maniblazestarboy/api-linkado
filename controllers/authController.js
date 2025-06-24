import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// 🔐 Função para gerar o JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  });
};

// 🚪 Login Controller
export const login = async (req, res) => {
  const { email, password } = req.body;

  // 1) Verifica se os campos foram preenchidos
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    // 2) Verifica se o usuário existe
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // 3) Gera token JWT
    const token = signToken(user._id);

    // 4) Define o cookie JWT
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true em produção com HTTPS
      sameSite: 'Lax',
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 dias
    });

    // 5) Envia a resposta com dados básicos
    res.status(200).json({
      message: 'Login bem-sucedido!',
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

// 🚪 Logout (opcional, se usar)
export const logout = (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
  });
  res.status(200).json({ message: 'Logout realizado com sucesso.' });
};
