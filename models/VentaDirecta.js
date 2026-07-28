const mongoose = require('mongoose');

const ventaDirectaSchema = new mongoose.Schema({
  nombre: { type: String, trim: true, default: '' },
  placas: { type: String, trim: true, uppercase: true, default: '' },
  monto: { type: Number, default: null }, // opcional, si quieren llevar el $ también
  notas: { type: String, trim: true, default: '' },
  registradoPor: { type: String, trim: true, default: '' },
  fecha: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('VentaDirecta', ventaDirectaSchema);
