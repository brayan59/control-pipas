const mongoose = require('mongoose');

const registroSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true,
  },
  nombre: { type: String, required: true }, // guardado también aquí como respaldo histórico
  placas: { type: String, required: true },
  fecha: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Registro', registroSchema);
