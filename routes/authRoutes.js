import express from 'express';
import jwt from 'jsonwebtoken';
import validator from 'validator';
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

// ✅ LOGIN - Autenticação de usuário
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validação básica
  if (!email || !password) {
    return res.status(400).json({ 
      status: 'fail',
      message: 'Email e senha são obrigatórios.',
      code: 'MISSING_CREDENTIALS'
    });
  }

  // Validação de formato de email
  if (!validator.isEmail(email)) {
    return res.status(400).json({ 
      status: 'fail',
      message: 'Formato de email inválido.',
      code: 'INVALID_EMAIL_FORMAT'
    });
  }

  try {
    // Buscar usuário incluindo a senha
    const user = await User.findOne({ email }).select('+password');
    
    // Verificar se usuário existe
    if (!user) {
      return res.status(401).json({ 
        status: 'fail',
        message: 'Email ou senha incorretos.',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Verificar se a senha está correta
    const isPasswordValid = await user.correctPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        status: 'fail',
        message: 'Email ou senha incorretos.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Gerar token JWT
    const token = createToken(user._id, user.role);

    // Configurar cookie HTTP-only (opcional)
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 dias
    });

    // Remover propriedade de senha antes de enviar
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    // Resposta de sucesso com token e dados do usuário
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Erro no processo de login:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Erro interno no servidor durante o login.',
      code: 'LOGIN_SERVER_ERROR'
    });
  }
});

// ✅ LOGOUT - Encerramento de sessão
router.post('/logout', (req, res) => {
  try {
    // Limpar cookie JWT se estiver sendo usado
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    
    // Resposta de sucesso
    res.status(200).json({ 
      status: 'success',
      message: 'Logout realizado com sucesso.'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Erro ao processar logout.',
      code: 'LOGOUT_ERROR'
    });
  }
});

// ✅ ME - Obter dados do usuário autenticado
router.get('/me', protect, async (req, res) => {
  try {
    // Buscar dados do usuário (sem senha)
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        status: 'fail',
        message: 'Usuário não encontrado.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Retornar dados do usuário
    res.status(200).json({
      status: 'success',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Erro ao recuperar informações do usuário.',
      code: 'USER_DATA_ERROR'
    });
  }
});

export default router;