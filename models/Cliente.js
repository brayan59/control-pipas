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
  placas: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  poso: {
    type: String, // nombre del pozo/dueño con el que tiene el trato (opcional)
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
