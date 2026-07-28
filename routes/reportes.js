const express = require('express');
const router = express.Router();
const Registro = require('../models/Registro');
const VentaDirecta = require('../models/VentaDirecta');

// Reporte de corte: totales de contrato vs venta directa en un rango de fechas
// Uso: GET /api/reportes/corte?desde=2026-07-20&hasta=2026-07-27
router.get('/corte', async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ error: 'Debes indicar "desde" y "hasta" (YYYY-MM-DD)' });
    }

    const fechaDesde = new Date(desde + 'T00:00:00');
    const fechaHasta = new Date(hasta + 'T23:59:59');

    const registros = await Registro.find({
      fecha: { $gte: fechaDesde, $lte: fechaHasta },
    }).sort({ fecha: 1 });

    const ventas = await VentaDirecta.find({
      fecha: { $gte: fechaDesde, $lte: fechaHasta },
    }).sort({ fecha: 1 });

    // Desglose por cliente de contrato (cuántas veces llenó cada quien)
    const porCliente = {};
    registros.forEach((r) => {
      const key = `${r.nombre} (${r.placas})`;
      porCliente[key] = (porCliente[key] || 0) + 1;
    });

    const montoTotalVentas = ventas.reduce((acc, v) => acc + (v.monto || 0), 0);

    res.json({
      rango: { desde, hasta },
      totalContrato: registros.length,
      totalVentaDirecta: ventas.length,
      totalGeneral: registros.length + ventas.length,
      montoTotalVentaDirecta: montoTotalVentas,
      desgloseContrato: porCliente,
      registros,
      ventas,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
