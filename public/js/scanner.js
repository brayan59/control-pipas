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
      const placasTxt = data.placas ? ` — Placas ${data.placas}` : '';

      if (data.tipo === 'efectivo') {
        resultadoDiv.innerHTML = `
          <div class="mensaje ok">
            ✅ 💵 Venta en efectivo<br>
            ${data.nombre}${placasTxt}<br>
            Registrado a las ${hora}
          </div>
          <div class="tarjeta" style="margin-top:10px;">
            <label>¿Cuánto se le cobró?</label>
            <input type="number" id="monto-cobrado" placeholder="$" min="0" step="0.01">
            <button class="btn btn-exito" id="btn-guardar-monto">Guardar precio y continuar</button>
            <button class="btn btn-secundario" id="btn-omitir-monto">Continuar sin precio</button>
            <div id="monto-msg"></div>
          </div>
        `;
        document.getElementById('btn-guardar-monto').addEventListener('click', async () => {
          const montoVal = document.getElementById('monto-cobrado').value;
          const montoMsg = document.getElementById('monto-msg');
          if (!montoVal) {
            montoMsg.innerHTML = '<div class="mensaje error">Escribe un monto primero.</div>';
            return;
          }
          try {
            const r = await fetch(`/api/ventas/${data.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ monto: parseFloat(montoVal) }),
            });
            if (r.ok) {
              montoMsg.innerHTML = '<div class="mensaje ok">✅ Precio guardado. Regresando...</div>';
              setTimeout(() => {
                window.location.href = 'index.html';
              }, 1000);
            } else {
              montoMsg.innerHTML = '<div class="mensaje error">⚠️ No se pudo guardar.</div>';
            }
          } catch (err) {
            montoMsg.innerHTML = '<div class="mensaje error">⚠️ Sin conexión.</div>';
          }
        });
        document.getElementById('btn-omitir-monto').addEventListener('click', () => {
          window.location.href = 'index.html';
        });
      } else {
        mostrarMensaje('ok', `✅ 📋 Registro de contrato<br>${data.nombre}${placasTxt}<br>Registrado a las ${hora}`);
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      }
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
