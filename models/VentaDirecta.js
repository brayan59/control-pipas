const mongoose = require('mongoose');

const ventaDirectaSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    default: null, // si viene de un escaneo QR de un cliente "efectivo"; null si fue captura manual
  },
  origen: {
    type: String,
    enum: ['manual', 'qr_efectivo'],
    default: 'manual',
  },
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
