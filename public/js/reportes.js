const inputDesde = document.getElementById('desde');
const inputHasta = document.getElementById('hasta');
const resultadoDiv = document.getElementById('resultado');

// Por defecto: últimos 7 días
const hoy = new Date();
const hace7 = new Date();
hace7.setDate(hoy.getDate() - 6);
inputHasta.value = hoy.toISOString().slice(0, 10);
inputDesde.value = hace7.toISOString().slice(0, 10);

async function generarReporte() {
  const desde = inputDesde.value;
  const hasta = inputHasta.value;
  if (!desde || !hasta) return;

  resultadoDiv.innerHTML = '<div class="mensaje info">Generando reporte...</div>';

  try {
    const resp = await fetch(`/api/reportes/corte?desde=${desde}&hasta=${hasta}`);
    const data = await resp.json();

    if (!resp.ok) {
      resultadoDiv.innerHTML = `<div class="mensaje error">⚠️ ${data.error}</div>`;
      return;
    }

    const filasDesglose = Object.entries(data.desgloseContrato)
      .sort((a, b) => b[1] - a[1])
      .map(([cliente, veces]) => `<tr><td>${cliente}</td><td>${veces}</td></tr>`)
      .join('');

    const filasEfectivo = Object.entries(data.desgloseEfectivo)
      .sort((a, b) => b[1] - a[1])
      .map(([cliente, veces]) => `<tr><td>${cliente}</td><td>${veces}</td></tr>`)
      .join('');

    const filasRegistrosIndividuales = data.registros
      .map((r) => {
        const hora = new Date(r.fecha).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        return `<tr>
          <td>${r.nombre}${r.placas ? ' (' + r.placas + ')' : ''}</td>
          <td>${hora}</td>
          <td><button class="btn-borrar-registro" data-id="${r._id}" style="border:none;background:none;font-size:16px;cursor:pointer;">🗑️</button></td>
        </tr>`;
      })
      .join('');

    const filasVentasIndividuales = data.ventas
      .map((v) => {
        const hora = new Date(v.fecha).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        const etiqueta = v.origen === 'qr_efectivo' ? '💵' : '🧾';
        return `<tr>
          <td>${etiqueta} ${v.nombre || 'Sin nombre'}</td>
          <td>${hora}</td>
          <td><button class="btn-borrar-venta-reporte" data-id="${v._id}" style="border:none;background:none;font-size:16px;cursor:pointer;">🗑️</button></td>
        </tr>`;
      })
      .join('');

    resultadoDiv.innerHTML = `
      <div class="tarjeta" id="area-imprimir">
        <h3>Corte del ${data.rango.desde} al ${data.rango.hasta}</h3>
        <div class="stat-grid">
          <div class="stat">
            <div class="num">${data.totalContrato}</div>
            <div class="lbl">Con contrato</div>
          </div>
          <div class="stat">
            <div class="num">${data.totalVentaDirecta}</div>
            <div class="lbl">Venta directa (total)</div>
          </div>
          <div class="stat">
            <div class="num">${data.totalVentaEfectivoQR}</div>
            <div class="lbl">Efectivo frecuente (QR)</div>
          </div>
          <div class="stat">
            <div class="num">${data.totalVentaManual}</div>
            <div class="lbl">Nuevos / manual</div>
          </div>
          <div class="stat">
            <div class="num">${data.totalGeneral}</div>
            <div class="lbl">Total pipas</div>
          </div>
          <div class="stat">
            <div class="num">$${data.montoTotalVentaDirecta.toFixed(2)}</div>
            <div class="lbl">Cobrado venta directa</div>
          </div>
        </div>

        <h3 style="margin-top:18px;">Desglose por cliente (contrato)</h3>
        <table>
          <thead><tr><th>Cliente / placas</th><th>Llenados</th></tr></thead>
          <tbody>${filasDesglose || '<tr><td colspan="2">Sin registros en este rango.</td></tr>'}</tbody>
        </table>

        <h3 style="margin-top:18px;">Desglose por cliente frecuente (efectivo)</h3>
        <table>
          <thead><tr><th>Cliente</th><th>Veces</th></tr></thead>
          <tbody>${filasEfectivo || '<tr><td colspan="2">Sin registros en este rango.</td></tr>'}</tbody>
        </table>
      </div>
      <button class="btn btn-secundario" id="btn-imprimir">Imprimir / guardar como PDF</button>

      <div class="tarjeta">
        <h3>Registros de contrato (detalle)</h3>
        <table>
          <thead><tr><th>Cliente</th><th>Fecha</th><th></th></tr></thead>
          <tbody>${filasRegistrosIndividuales || '<tr><td colspan="3">Sin registros.</td></tr>'}</tbody>
        </table>
      </div>

      <div class="tarjeta">
        <h3>Ventas (detalle)</h3>
        <table>
          <thead><tr><th>Cliente</th><th>Fecha</th><th></th></tr></thead>
          <tbody>${filasVentasIndividuales || '<tr><td colspan="3">Sin ventas.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-imprimir').addEventListener('click', () => window.print());

    document.querySelectorAll('.btn-borrar-registro').forEach((btn) => {
      btn.addEventListener('click', () => borrarRegistro(btn.dataset.id));
    });
    document.querySelectorAll('.btn-borrar-venta-reporte').forEach((btn) => {
      btn.addEventListener('click', () => borrarVentaDesdeReporte(btn.dataset.id));
    });
  } catch (err) {
    resultadoDiv.innerHTML = '<div class="mensaje error">⚠️ No se pudo conectar con el servidor.</div>';
  }
}

document.getElementById('btn-generar').addEventListener('click', generarReporte);
generarReporte();

function getAdminKey() {
  let key = sessionStorage.getItem('adminKey');
  if (!key) {
    key = prompt('Ingresa la clave de administrador para borrar registros:');
    if (key) sessionStorage.setItem('adminKey', key);
  }
  return key;
}

async function borrarRegistro(id) {
  const confirmar = confirm('¿Seguro que quieres borrar este registro de contrato?');
  if (!confirmar) return;
  const key = getAdminKey();
  if (!key) return;

  const resp = await fetch(`/api/registro/${id}`, {
    method: 'DELETE',
    headers: { 'x-admin-key': key },
  });

  if (resp.status === 401) {
    sessionStorage.removeItem('adminKey');
    alert('Clave incorrecta.');
    return;
  }
  if (!resp.ok) {
    const data = await resp.json();
    alert(`Error: ${data.error}`);
    return;
  }
  generarReporte();
}

async function borrarVentaDesdeReporte(id) {
  const confirmar = confirm('¿Seguro que quieres borrar esta venta?');
  if (!confirmar) return;

  const resp = await fetch(`/api/ventas/${id}`, { method: 'DELETE' });
  if (!resp.ok) {
    const data = await resp.json();
    alert(`Error: ${data.error}`);
    return;
  }
  generarReporte();
}
