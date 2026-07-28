require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de la API
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/registro', require('./routes/registro'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/reportes', require('./routes/reportes'));

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error conectando a MongoDB:', err.message));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚰 Servidor de control de pipas corriendo en el puerto ${PORT}`);
});
