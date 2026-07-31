const form = document.getElementById('form-venta');
const resultadoDiv = document.getElementById('resultado');

const listaVentas = document.getElementById('lista-ventas');

async function cargarVentas() {
  const resp = await fetch('/api/ventas');
  const ventas = await resp.json();
  listaVentas.innerHTML = '';

  if (ventas.length === 0) {
    listaVentas.innerHTML = '<li>Aún no hay ventas registradas.</li>';
    return;
  }

  ventas.slice(0, 20).forEach((v) => {
    const hora = new Date(v.fecha).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${v.nombre || 'Sin nombre'}</strong> ${v.placas ? '· ' + v.placas : ''}<br>
        <span style="color:var(--gris); font-size:12px;">${hora}${v.monto ? ' · $' + v.monto.toFixed(2) : ''}</span>
      </div>
      <button class="btn-borrar-venta" data-id="${v._id}" style="border:none;background:none;font-size:18px;cursor:pointer;">🗑️</button>
    `;
    listaVentas.appendChild(li);
  });

  document.querySelectorAll('.btn-borrar-venta').forEach((btn) => {
    btn.addEventListener('click', () => borrarVenta(btn.dataset.id));
  });
}

async function borrarVenta(id) {
  const confirmar = confirm('¿Seguro que quieres borrar esta venta?');
  if (!confirmar) return;

  const resp = await fetch(`/api/ventas/${id}`, { method: 'DELETE' });
  if (!resp.ok) {
    const data = await resp.json();
    alert(`Error: ${data.error}`);
    return;
  }
  cargarVentas();
}

cargarVentas();

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
      cargarVentas();
    }
  } catch (err) {
    resultadoDiv.innerHTML = `<div class="mensaje error">⚠️ No se pudo conectar con el servidor.</div>`;
  }
});
