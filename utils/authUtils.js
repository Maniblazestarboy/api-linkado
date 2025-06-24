import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// 🔐 Middleware para proteger rotas
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.jwt; // <-- aqui estava 'token'
    
    if (!token) {
      return res.redirect('/admin/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.redirect('/admin/login');
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Erro de autenticação:', err);
    return res.redirect('/admin/login');
  }
};

// 🔒 Middleware para restringir acesso por função
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).send('Acesso negado. Permissões insuficientes.');
    }
    next();
  };
};

// 🆕 Gerar JWT
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
};

// 🆕 Middleware para checar sessão
export const checkSession = async (req, res, next) => {
  try {
    const token = req.cookies.jwt; // <-- também estava 'token'

    if (!token) {
      return res.status(401).json({ 
        status: 'fail', 
        message: 'Não autenticado. Faça login.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ 
        status: 'fail', 
        message: 'Usuário não encontrado.' 
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ 
      status: 'fail', 
      message: 'Token inválido ou expirado.' 
    });
  }
};
