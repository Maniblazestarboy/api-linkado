import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// 🔐 Middleware para proteger rotas
export const protect = async (req, res, next) => {
  try {
    // 1. Obter token de múltiplas fontes
    let token;
    if (req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 2. Verificar se token existe
    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'Você não está logado. Por favor faça login para acessar.',
        code: 'UNAUTHORIZED'
      });
    }

    // 3. Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Verificar se usuário ainda existe
    const currentUser = await User.findById(decoded.id).select('-password');
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'O usuário pertencente a este token não existe mais.',
        code: 'USER_NOT_FOUND'
      });
    }

    // 5. Verificar se usuário alterou senha após o token ser emitido
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: 'fail',
        message: 'Sua senha foi alterada recentemente. Por favor faça login novamente.',
        code: 'PASSWORD_CHANGED'
      });
    }

    // 6. Conceder acesso à rota protegida
    req.user = currentUser;
    next();
  } catch (error) {
    // Tratamento específico para diferentes erros de token
    let message = 'Token inválido. Faça login novamente.';
    let code = 'INVALID_TOKEN';
    
    if (error.name === 'TokenExpiredError') {
      message = 'Sua sessão expirou. Por favor faça login novamente.';
      code = 'TOKEN_EXPIRED';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Token inválido. Autenticação falhou.';
    }

    console.error('Erro de autenticação:', error);
    res.status(401).json({
      status: 'fail',
      message,
      code
    });
  }
};

// 🔒 Middleware para restringir acesso por função
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'Acesso negado. Permissões insuficientes.',
        code: 'FORBIDDEN'
      });
    }
    next();
  };
};

// 🆕 Gerar JWT (com role)
export const generateToken = (id, role) => {
  return jwt.sign(
    { id, role }, // Incluir role para autorização
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    }
  );
};

// 🆕 Middleware para checar sessão (simplificado e unificado com protect)
export const checkSession = async (req, res, next) => {
  try {
    let token;
    if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};