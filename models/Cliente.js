const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true, // este es el valor que se guarda dentro del QR
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  tipo: {
    type: String,
    enum: ['contrato', 'efectivo'],
    default: 'contrato',
    // 'contrato': tiene trato con el dueño del pozo, se cuenta como registro de contrato
    // 'efectivo': cliente frecuente sin contrato, paga en efectivo cada vez, se cuenta como venta directa
  },
  placas: {
    type: String,
    trim: true,
    uppercase: true,
    default: '',
  },
  poso: {
    type: String, // nombre del pozo/dueño con el que tiene el trato (solo aplica a tipo 'contrato')
    trim: true,
    default: '',
  },
  activo: {
    type: Boolean,
    default: true,
  },
  fechaAlta: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Cliente', clienteSchema);
