import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ message: 'Você não está autenticado!' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado!' });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
  };
};
