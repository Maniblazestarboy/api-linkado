import express from 'express';
import { protect, restrictTo } from '../utils/authUtils.js';
import FormData from '../models/FormData.js';

const router = express.Router();

// Rota para listar todos os envios (protegida por JWT)
router.get('/submissions', protect, restrictTo('admin'), async (req, res) => {
  try {
    const submissions = await FormData.find().sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar envios' });
  }
});

// Rota para obter detalhes de um envio específico (protegida por JWT)
router.get('/submissions/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const submission = await FormData.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Envio não encontrado' });
    }
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar envio' });
  }
});

export default router;