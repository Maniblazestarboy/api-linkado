import jwt from 'jsonwebtoken';
import validator from 'validator';
import User from '../models/User.js';

// 🔐 Função para gerar o JWT com informações completas
const signToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '90d' }
  );
};

// 🚪 Login Controller
export const login = async (req, res) => {
  const { email, password } = req.body;

  // 1) Validação de campos obrigatórios
  if (!email || !password) {
    return res.status(400).json({ 
      status: 'fail',
      message: 'Email e senha são obrigatórios.',
      code: 'MISSING_CREDENTIALS'
    });
  }

  // 2) Validação de formato de email
  if (!validator.isEmail(email)) {
    return res.status(400).json({ 
      status: 'fail',
      message: 'Formato de email inválido.',
      code: 'INVALID_EMAIL_FORMAT'
    });
  }

  try {
    // 3) Buscar usuário incluindo senha
    const user = await User.findOne({ email }).select('+password');
    
    // 4) Verificar se usuário existe
    if (!user) {
      return res.status(401).json({ 
        status: 'fail',
        message: 'Credenciais inválidas.',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // 5) Verificar senha
    const isPasswordValid = await user.correctPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        status: 'fail',
        message: 'Credenciais inválidas.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // 6) Gerar token JWT com role
    const token = signToken(user._id, user.role);

    // 7) Configurar cookie (opcional)
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 dias
    });

    // 8) Remover senha antes de enviar resposta
    user.password = undefined;

    // 9) Enviar resposta completa
    res.status(200).json({
      status: 'success',
      token, // Enviar token no corpo também
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
      message: 'Erro interno no servidor.',
      code: 'LOGIN_SERVER_ERROR'
    });
  }
};

// 🚪 Logout Controller
export const logout = (req, res) => {
  try {
    // Limpar cookie JWT
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    
    // Enviar resposta de sucesso
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
};