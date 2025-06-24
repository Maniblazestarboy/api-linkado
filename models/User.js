import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    minlength: 2,
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'Email inválido'],
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: 6,
    select: false, // não retorna senha por padrão
  },
  role: {
    type: String,
    enum: ['admin', 'editor'],
    default: 'editor',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// 🔐 Hash da senha antes de salvar (ou alterar)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 🔐 Método de verificação de senha
userSchema.methods.correctPassword = async function (candidatePassword, hashedPassword) {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

const User = mongoose.model('User', userSchema);

export default User;
