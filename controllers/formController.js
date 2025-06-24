import FormData from '../models/FormData.js';

export const submitForm = async (req, res) => {
  try {
    const { nome, contato, plano, instagram, links, observacoes } = req.body;

    // Validação de campos obrigatórios
    const camposFaltando = [];
    if (!nome) camposFaltando.push('nome');
    if (!contato) camposFaltando.push('contato');
    if (!plano) camposFaltando.push('plano');
    if (!instagram) camposFaltando.push('instagram');
    if (!links) camposFaltando.push('links');

    if (camposFaltando.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos obrigatórios faltando: ${camposFaltando.join(', ')}`,
      });
    }

    // Normalizar links (como string ou array)
    const linksArray = Array.isArray(links)
      ? links.map((link) => {
          const trimmed = link.trim();
          return trimmed.startsWith('http') ? trimmed : `http://${trimmed}`;
        })
      : links.split(',').map((link) => {
          const trimmed = link.trim();
          return trimmed.startsWith('http') ? trimmed : `http://${trimmed}`;
        });

    // Limpar e formatar o @ do Instagram
    let instagramHandle = instagram
      .trim()
      .replace(/\s+/g, '') // Remove espaços
      .replace(/^@+/, ''); // Remove todos os @ do início

    instagramHandle = `@${instagramHandle}`; // Garante só 1 @

    // Criar novo documento
    const newFormData = new FormData({
      nome,
      contato,
      plano,
      instagram: instagramHandle,
      links: linksArray,
      observacoes: observacoes || '',
      logo: req.file ? req.file.filename : '',
    });

    await newFormData.save();

    res.status(201).json({
      success: true,
      message: 'Formulário enviado com sucesso!',
      data: {
        id: newFormData._id,
        nome: newFormData.nome,
        plano: newFormData.plano,
        createdAt: newFormData.createdAt,
      },
    });
  } catch (error) {
    console.error('Erro ao salvar formulário:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno no servidor',
    });
  }
};
