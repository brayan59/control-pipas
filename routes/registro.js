const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');
const Registro = require('../models/Registro');

// Se llama cada vez que se escanea un QR en la caseta
router.post('/scan', async (req, res) => {
  try {
    const { codigo } = req.body;
    if (!codigo) return res.status(400).json({ error: 'Falta el código escaneado' });

    const cliente = await Cliente.findOne({ codigo });
    if (!cliente) {
      return res.status(404).json({ error: 'Credencial no reconocida. Verifica el QR.' });
    }
    if (!cliente.activo) {
      return res.status(403).json({ error: `El contrato de ${cliente.nombre} está inactivo.` });
    }

    const registro = new Registro({
      cliente: cliente._id,
      nombre: cliente.nombre,
      placas: cliente.placas,
    });
    await registro.save();

    res.status(201).json({
      mensaje: 'Registro guardado',
      nombre: cliente.nombre,
      placas: cliente.placas,
      fecha: registro.fecha,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Historial de registros (últimos primero), con filtro opcional por fecha
router.get('/', async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const filtro = {};
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = new Date(desde);
      if (hasta) filtro.fecha.$lte = new Date(hasta);
    }
    const registros = await Registro.find(filtro).sort({ fecha: -1 }).limit(500);
    res.json(registros);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
