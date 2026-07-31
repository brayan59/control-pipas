let ultimoCodigo = null;
let ultimoTiempo = 0;
let procesando = false;
const resultadoDiv = document.getElementById('resultado');

function mostrarMensaje(tipo, texto) {
  resultadoDiv.innerHTML = `<div class="mensaje ${tipo}">${texto}</div>`;
}

async function alEscanear(codigoTexto) {
  const ahora = Date.now();
  // Evita registrar el mismo QR varias veces seguidas (si se queda frente a la cámara)
  if (procesando) return;
  if (codigoTexto === ultimoCodigo && ahora - ultimoTiempo < 8000) return;

  ultimoCodigo = codigoTexto;
  ultimoTiempo = ahora;
  procesando = true;

  mostrarMensaje('info', 'Verificando credencial...');

  try {
    const resp = await fetch('/api/registro/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: codigoTexto }),
    });
    const data = await resp.json();

    if (!resp.ok) {
      mostrarMensaje('error', `⚠️ ${data.error}`);
    } else {
      const hora = new Date(data.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      const etiqueta = data.tipo === 'efectivo' ? '💵 Venta en efectivo' : '📋 Registro de contrato';
      const placasTxt = data.placas ? ` — Placas ${data.placas}` : '';
      mostrarMensaje('ok', `✅ ${etiqueta}<br>${data.nombre}${placasTxt}<br>Registrado a las ${hora}`);
      if (navigator.vibrate) navigator.vibrate(120);
    }
  } catch (err) {
    mostrarMensaje('error', '⚠️ No se pudo conectar con el servidor.');
  } finally {
    procesando = false;
  }
}

const html5QrCode = new Html5Qrcode('lector-qr');

function iniciarCamara() {
  html5QrCode
    .start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decodedText) => alEscanear(decodedText),
      () => {} // errores de frame individuales, se ignoran
    )
    .catch(() => {
      mostrarMensaje('error', 'No se pudo acceder a la cámara. Revisa los permisos del navegador.');
    });
}

document.getElementById('btn-reiniciar').addEventListener('click', () => {
  html5QrCode
    .stop()
    .then(() => iniciarCamara())
    .catch(() => iniciarCamara());
});

iniciarCamara();
