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
  },
  // ✅ 1. NOVO CAMPO ADICIONADO
  passwordChangedAt: Date,
});

// 🔐 Hash da senha antes de salvar (ou alterar)
userSchema.pre('save', async function (next) {
  // Executar esta função apenas se a senha foi realmente modificada
  if (!this.isModified('password')) return next();

  // Fazer o hash da senha com custo 12
  this.password = await bcrypt.hash(this.password, 12);

  // ✅ 2. ATUALIZAÇÃO DO CAMPO AO MUDAR A SENHA
  // Garante que o campo `passwordChangedAt` seja atualizado corretamente.
  // O "-1000" é um pequeno truque para garantir que o token seja sempre criado DEPOIS da mudança da senha.
  if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000;
  }
  
  next();
});

// 🔐 Método de verificação de senha
userSchema.methods.correctPassword = async function (
  candidatePassword,
  hashedPassword
) {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

// ✅ 3. MÉTODO QUE ESTAVA EM FALTA, AGORA ADICIONADO
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    // Se a hora em que a senha foi mudada for MAIOR que a hora em que o token foi criado,
    // significa que a senha mudou. Retorna true.
    return JWTTimestamp < changedTimestamp;
  }

  // False significa que a senha NÃO foi mudada após a criação do token
  return false;
};


const User = mongoose.model('User', userSchema);

export default User;