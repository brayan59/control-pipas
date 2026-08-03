const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');
const Registro = require('../models/Registro');
const VentaDirecta = require('../models/VentaDirecta');

function requiereAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Clave de administrador inválida' });
  }
  next();
}

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
      return res.status(403).json({ error: `La credencial de ${cliente.nombre} está inactiva.` });
    }

    if (cliente.tipo === 'efectivo') {
      // Cliente frecuente sin contrato: se registra como venta directa, pero con datos automáticos
      const venta = new VentaDirecta({
        cliente: cliente._id,
        origen: 'qr_efectivo',
        nombre: cliente.nombre,
        placas: cliente.placas,
      });
      await venta.save();

      return res.status(201).json({
        mensaje: 'Venta en efectivo registrada',
        tipo: 'efectivo',
        id: venta._id,
        nombre: cliente.nombre,
        placas: cliente.placas,
        fecha: venta.fecha,
      });
    }

    // Cliente con contrato
    const registro = new Registro({
      cliente: cliente._id,
      nombre: cliente.nombre,
      placas: cliente.placas,
    });
    await registro.save();

    res.status(201).json({
      mensaje: 'Registro guardado',
      tipo: 'contrato',
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

// Eliminar un registro individual (por ejemplo, pruebas o errores de escaneo)
router.delete('/:id', requiereAdmin, async (req, res) => {
  try {
    const registro = await Registro.findByIdAndDelete(req.params.id);
    if (!registro) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json({ mensaje: 'Registro eliminado', registro });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
