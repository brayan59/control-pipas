const express = require('express');
const router = express.Router();
const VentaDirecta = require('../models/VentaDirecta');

// Registrar una venta directa (manual, hecha por el encargado)
router.post('/', async (req, res) => {
  try {
    const { nombre, placas, monto, notas, registradoPor } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    const venta = new VentaDirecta({ nombre, placas, monto, notas, registradoPor });
    await venta.save();
    res.status(201).json(venta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Historial de ventas directas
router.get('/', async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const filtro = {};
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = new Date(desde);
      if (hasta) filtro.fecha.$lte = new Date(hasta);
    }
    const ventas = await VentaDirecta.find(filtro).sort({ fecha: -1 }).limit(500);
    res.json(ventas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar una venta directa (por si se anotó mal)
router.delete('/:id', async (req, res) => {
  try {
    const venta = await VentaDirecta.findByIdAndDelete(req.params.id);
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json({ mensaje: 'Venta eliminada', venta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar una venta existente (por ejemplo, poner el monto después de escanear)
router.patch('/:id', async (req, res) => {
  try {
    const { monto, notas } = req.body;
    const update = {};
    if (monto !== undefined) update.monto = monto;
    if (notas !== undefined) update.notas = notas;

    const venta = await VentaDirecta.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json(venta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
