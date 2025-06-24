import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const adminUser = new User({
      name: 'Guilherme Manuel',
      email: 'blazemani152@gmail.com',
      password: 'Slyfooxx123',
      role: 'admin',
    });

    await adminUser.save();
    console.log('✅ Usuário admin criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  } finally {
    mongoose.disconnect();
  }
}

createAdmin();
