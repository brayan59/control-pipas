const form = document.getElementById('form-venta');
const resultadoDiv = document.getElementById('resultado');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const body = {
    nombre: document.getElementById('nombre').value.trim(),
    placas: document.getElementById('placas').value.trim(),
    monto: document.getElementById('monto').value ? parseFloat(document.getElementById('monto').value) : null,
    notas: document.getElementById('notas').value.trim(),
    registradoPor: document.getElementById('registradoPor').value.trim(),
  };

  try {
    const resp = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json();

    if (!resp.ok) {
      resultadoDiv.innerHTML = `<div class="mensaje error">⚠️ ${data.error}</div>`;
    } else {
      resultadoDiv.innerHTML = `<div class="mensaje ok">✅ Venta registrada correctamente.</div>`;
      form.reset();
    }
  } catch (err) {
    resultadoDiv.innerHTML = `<div class="mensaje error">⚠️ No se pudo conectar con el servidor.</div>`;
  }
});
