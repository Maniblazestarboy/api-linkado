import mongoose from 'mongoose';

const formDataSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'Nome completo é obrigatório'],
      trim: true,
    },
    contato: {
      type: String,
      required: [true, 'WhatsApp ou E-mail é obrigatório'],
      trim: true,
    },
    plano: {
      type: String,
      required: [true, 'Seleção de pacote é obrigatória'],
      enum: {
        values: ['essencial', 'profissional', 'premium'],
        message: 'Pacote inválido selecionado',
      },
    },
    instagram: {
      type: String,
      required: true,
      match: [/^@?[\w._]{1,30}$/, 'Por favor, insira um @ do Instagram válido'],
      trim: true,
    },
    links: {
      type: [String],
      required: [true, 'Lista de links é obrigatória'],
      validate: {
        validator(links) {
          return links.length > 0;
        },
        message: 'Pelo menos um link deve ser fornecido',
      },
    },
    logo: {
      type: String,
      default: '',
    },
    observacoes: {
      type: String,
      default: '',
      maxlength: [300, 'Observações não podem exceder 300 caracteres'],
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'completed', 'problem'],
      default: 'new',
    },
  },
  { timestamps: true },
); // Adiciona createdAt e updatedAt automaticamente

// Índices para consultas rápidas
formDataSchema.index({ createdAt: -1 });
formDataSchema.index({ plano: 1 });

const FormData = mongoose.model('FormData', formDataSchema);

export default FormData;
