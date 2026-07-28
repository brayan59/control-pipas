const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const Cliente = require('../models/Cliente');

// Middleware simple de protección con clave de administrador
function requiereAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Clave de administrador inválida' });
  }
  next();
}

// Crear un nuevo cliente con contrato + generar su QR
router.post('/', requiereAdmin, async (req, res) => {
  try {
    const { nombre, placas, poso } = req.body;
    if (!nombre || !placas) {
      return res.status(400).json({ error: 'Nombre y placas son obligatorios' });
    }

    const codigo = uuidv4(); // identificador único que va dentro del QR
    const cliente = new Cliente({ codigo, nombre, placas, poso: poso || '' });
    await cliente.save();

    // Generamos el QR como imagen dataURL (se puede imprimir directo desde el navegador)
    const qrDataUrl = await QRCode.toDataURL(codigo, { width: 400, margin: 2 });

    res.status(201).json({ cliente, qr: qrDataUrl });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Ese código ya existe, intenta de nuevo' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Listar todos los clientes (activos e inactivos)
router.get('/', requiereAdmin, async (req, res) => {
  try {
    const clientes = await Cliente.find().sort({ fechaAlta: -1 });
    res.json(clientes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Volver a generar el QR de un cliente existente (por si se pierde la credencial)
router.get('/:id/qr', requiereAdmin, async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    const qrDataUrl = await QRCode.toDataURL(cliente.codigo, { width: 400, margin: 2 });
    res.json({ cliente, qr: qrDataUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activar / desactivar un cliente (si ya no tiene contrato vigente)
router.patch('/:id', requiereAdmin, async (req, res) => {
  try {
    const { activo, nombre, placas, poso } = req.body;
    const update = {};
    if (activo !== undefined) update.activo = activo;
    if (nombre !== undefined) update.nombre = nombre;
    if (placas !== undefined) update.placas = placas;
    if (poso !== undefined) update.poso = poso;

    const cliente = await Cliente.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
