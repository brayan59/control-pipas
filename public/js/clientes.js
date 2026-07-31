const tarjetaLogin = document.getElementById('tarjeta-login');
const panel = document.getElementById('panel');
const loginMsg = document.getElementById('login-msg');
const listaClientes = document.getElementById('lista-clientes');
const resultadoAlta = document.getElementById('resultado-alta');

function getAdminKey() {
  return sessionStorage.getItem('adminKey');
}

async function verificarYEntrar(key) {
  const resp = await fetch('/api/clientes', { headers: { 'x-admin-key': key } });
  if (resp.ok) {
    sessionStorage.setItem('adminKey', key);
    tarjetaLogin.style.display = 'none';
    panel.style.display = 'block';
    cargarClientes();
    return true;
  }
  return false;
}

document.getElementById('btn-entrar').addEventListener('click', async () => {
  const key = document.getElementById('admin-key').value.trim();
  if (!key) return;
  const ok = await verificarYEntrar(key);
  if (!ok) {
    loginMsg.innerHTML = '<div class="mensaje error">Clave incorrecta.</div>';
  }
});

// Si ya inició sesión antes en este dispositivo, entra directo
if (getAdminKey()) {
  verificarYEntrar(getAdminKey());
}

async function cargarClientes() {
  const resp = await fetch('/api/clientes', { headers: { 'x-admin-key': getAdminKey() } });
  const clientes = await resp.json();
  listaClientes.innerHTML = '';

  if (clientes.length === 0) {
    listaClientes.innerHTML = '<li>Aún no hay clientes registrados.</li>';
    return;
  }

  clientes.forEach((c) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${c.nombre}</strong><br>
        <span style="color:var(--gris); font-size:12px;">${c.placas ? c.placas + ' · ' : ''}${c.tipo === 'efectivo' ? '💵 Efectivo' : '📋 Contrato'}${c.poso ? ' · ' + c.poso : ''}</span>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="badge ${c.activo ? 'activo' : 'inactivo'}">${c.activo ? 'Activo' : 'Inactivo'}</span>
        <button class="btn-ver-qr" data-id="${c._id}" style="border:none;background:none;font-size:20px;cursor:pointer;">🔳</button>
        <button class="btn-borrar-cliente" data-id="${c._id}" data-nombre="${c.nombre}" style="border:none;background:none;font-size:18px;cursor:pointer;">🗑️</button>
      </div>
    `;
    listaClientes.appendChild(li);
  });

  document.querySelectorAll('.btn-ver-qr').forEach((btn) => {
    btn.addEventListener('click', () => verQr(btn.dataset.id));
  });

  document.querySelectorAll('.btn-borrar-cliente').forEach((btn) => {
    btn.addEventListener('click', () => borrarCliente(btn.dataset.id, btn.dataset.nombre));
  });
}

async function borrarCliente(id, nombre) {
  const confirmar = confirm(`¿Seguro que quieres borrar a "${nombre}"? Se eliminará su credencial (su historial de escaneos pasados se conserva).`);
  if (!confirmar) return;

  const resp = await fetch(`/api/clientes/${id}`, {
    method: 'DELETE',
    headers: { 'x-admin-key': getAdminKey() },
  });
  const data = await resp.json();

  if (!resp.ok) {
    alert(`Error: ${data.error}`);
    return;
  }
  cargarClientes();
}

async function verQr(id) {
  const resp = await fetch(`/api/clientes/${id}/qr`, { headers: { 'x-admin-key': getAdminKey() } });
  const data = await resp.json();
  if (!resp.ok) return;
  mostrarQr(data.cliente, data.qr);
}

function mostrarQr(cliente, qrDataUrl) {
  resultadoAlta.innerHTML = `
    <div class="mensaje ok">✅ Credencial de ${cliente.nombre} (${cliente.tipo === 'efectivo' ? '💵 Efectivo' : '📋 Contrato'})</div>
    <div class="qr-preview">
      <img src="${qrDataUrl}" alt="QR de ${cliente.nombre}">
      <div style="margin-top:8px; font-weight:700;">${cliente.nombre}</div>
      ${cliente.placas ? `<div style="color:var(--gris); font-size:13px;">${cliente.placas}</div>` : ''}
      <button class="btn btn-secundario" onclick="imprimirQr('${qrDataUrl}', '${cliente.nombre}', '${cliente.placas || ''}')">Imprimir credencial</button>
    </div>
  `;
  resultadoAlta.scrollIntoView({ behavior: 'smooth' });
}

function imprimirQr(qrDataUrl, nombre, placas) {
  const ventana = window.open('', '_blank');
  ventana.document.write(`
    <html>
      <head><title>Credencial - ${nombre}</title></head>
      <body style="text-align:center; font-family: sans-serif; padding-top:40px;">
        <img src="${qrDataUrl}" style="width:260px;">
        <h2>${nombre}</h2>
        <p>${placas}</p>
        <script>window.print();</script>
      </body>
    </html>
  `);
}

document.getElementById('form-cliente').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    nombre: document.getElementById('nombre').value.trim(),
    placas: document.getElementById('placas').value.trim(),
    poso: document.getElementById('poso').value.trim(),
    tipo: document.getElementById('tipo').value,
  };

  const resp = await fetch('/api/clientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminKey() },
    body: JSON.stringify(body),
  });
  const data = await resp.json();

  if (!resp.ok) {
    resultadoAlta.innerHTML = `<div class="mensaje error">⚠️ ${data.error}</div>`;
    return;
  }

  mostrarQr(data.cliente, data.qr);
  document.getElementById('form-cliente').reset();
  cargarClientes();
});
