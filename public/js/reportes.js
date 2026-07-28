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
            <div class="lbl">Venta directa</div>
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
      </div>
      <button class="btn btn-secundario" id="btn-imprimir">Imprimir / guardar como PDF</button>
    `;

    document.getElementById('btn-imprimir').addEventListener('click', () => window.print());
  } catch (err) {
    resultadoDiv.innerHTML = '<div class="mensaje error">⚠️ No se pudo conectar con el servidor.</div>';
  }
}

document.getElementById('btn-generar').addEventListener('click', generarReporte);
generarReporte();
