// reportes.js
// Lógica de las pantallas de Reportes. Los datos se guardan en localStorage (comun.js).

const CLAVE_REPORTES = "reportes";

function reportesDeEjemplo() {
  return [
    { id: 1, nombre: "Informe mensual - Lote 1", fecha: "2026-08-15", notas: "El presente informe consolida los registros fenológicos, aplicación de insumos agrícolas y monitoreo climático correspondientes al Lote 1 de Finca El Manantial. Se observa un desarrollo óptimo en la etapa actual con niveles estables de humedad en suelo y aprovechamiento eficiente de fertilización NPK.", habilitado: true },
    { id: 2, nombre: "Uso de insumos Q2", fecha: "2026-08-10", notas: "Resumen del uso de fertilizantes, fungicidas y herbicidas durante el segundo trimestre.", habilitado: true },
    { id: 3, nombre: "Rendimiento por lote", fecha: "2026-08-02", notas: "Comparación del rendimiento esperado contra el obtenido en cada lote de la finca.", habilitado: true }
  ];
}

function obtenerReportes() {
  return obtenerLista(CLAVE_REPORTES, reportesDeEjemplo());
}

function reportesHabilitados() {
  return obtenerReportes().filter(function (r) { return r.habilitado; });
}

// "2026-08-15" -> "15 Ago 2026"
function fechaCorta(fecha) {
  let meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  let partes = fecha.split("-");
  return partes[2] + " " + meses[Number(partes[1]) - 1] + " " + partes[0];
}

// ================== LISTA DE REPORTES ==================
function mostrarReportes() {
  let contenedor = document.getElementById("listaReportes");

  if (contenedor === null) {
    return;
  }

  let lista = reportesHabilitados();
  let html = "";

  for (let i = 0; i < lista.length; i++) {
    let r = lista[i];
    html += `
      <div class="tarjeta p-3 rounded-4 d-flex justify-content-between align-items-center gap-2">
        <div>
          <strong class="d-block small">${textoSeguro(r.nombre)}</strong>
          <span class="texto_gris" style="font-size: 0.75rem;">Generado ${fechaCorta(r.fecha)}</span>
        </div>
        <a href="pdf.html?id=${r.id}" class="btn-agro-sm text-nowrap">Exportar en PDF</a>
      </div>`;
  }

  if (lista.length === 0) {
    html = '<p class="texto_gris small">No hay informes. Crea uno con "+ Nuevo".</p>';
  }

  contenedor.innerHTML = html;
}

// ================== CREAR REPORTE ==================
function activarCrearReporte() {
  let formulario = document.getElementById("formReporte");

  if (formulario === null) {
    return;
  }

  // la fecha no puede ser después de hoy
  document.getElementById("fechaReporte").max = fechaDeHoy(0);

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let nombre = document.getElementById("nombreReporte").value.trim();
    let fecha = document.getElementById("fechaReporte").value;

    if (nombre.length < 3) {
      alert("El nombre del reporte debe tener mínimo 3 letras");
      return;
    }

    if (fecha === "" || fecha > fechaDeHoy(0)) {
      alert("Elige una fecha válida (no puede ser después de hoy)");
      return;
    }

    let lista = obtenerReportes();
    lista.unshift({
      id: nuevoId(lista),
      nombre: nombre,
      fecha: fecha,
      notas: document.getElementById("notasReporte").value.trim(),
      habilitado: true
    });

    guardarLista(CLAVE_REPORTES, lista);
    registrarEvento("Reporte creado", nombre, "sistema", "bi-file-earmark-text", "success");
    window.location.href = "reportes.html?mensaje=guardado";
  });
}

// ================== INHABILITAR REPORTE ==================
function activarInhabilitarReporte() {
  let contenedor = document.getElementById("listaInhabilitarReportes");

  if (contenedor === null) {
    return;
  }

  let lista = reportesHabilitados();
  let html = "";

  for (let i = 0; i < lista.length; i++) {
    let r = lista[i];
    html += `
      <label class="tarjeta p-3 rounded-4 d-flex align-items-center gap-3" style="cursor: pointer;">
        <input type="checkbox" name="reportesSeleccionados" value="${r.id}" class="form-check-input m-0">
        <div>
          <strong class="d-block small">${textoSeguro(r.nombre)}</strong>
          <span class="texto_gris" style="font-size: 0.75rem;">Generado ${fechaCorta(r.fecha)}</span>
        </div>
      </label>`;
  }

  contenedor.innerHTML = html;

  document.getElementById("botonInhabilitarReporte").addEventListener("click", async function (evento) {
    evento.preventDefault();

    let marcados = document.querySelectorAll('input[name="reportesSeleccionados"]:checked');

    if (marcados.length === 0) {
      alert("Selecciona al menos un reporte");
      return;
    }

    if (await preguntar("¿Estás seguro?", "Se van a inhabilitar " + marcados.length + " reporte(s).", "Inhabilitar") === false) {
      return;
    }

    let todos = obtenerReportes();

    for (let i = 0; i < marcados.length; i++) {
      let reporte = buscarPorId(todos, Number(marcados[i].value));
      marcarInhabilitado(reporte);
      registrarEvento("Reporte inhabilitado", reporte.nombre, "sistema", "bi-slash-circle", "danger");
    }

    guardarLista(CLAVE_REPORTES, todos);
    window.location.href = "reportes.html?mensaje=inhabilitado";
  });
}

// ================== VISTA PDF ==================
// Muestra el reporte elegido. "Exportar PDF" usa la impresión del navegador (Guardar como PDF).
function mostrarPdf() {
  let titulo = document.getElementById("pdfTitulo");

  if (titulo === null) {
    return;
  }

  let lista = obtenerReportes();
  let activos = lista.filter(function (r) { return r.habilitado; });

  if (pedirElegir("¿Qué reporte quieres exportar?", activos.map(function (r) { return { id: r.id, nombre: r.nombre, detalle: "Generado " + fechaCorta(r.fecha) }; }), "reportes.html")) {
    return;
  }

  let reporte = buscarPorId(lista, idDeLaDireccion()) || activos[0];

  if (reporte === undefined) {
    titulo.textContent = "No hay reportes";
    document.getElementById("pdfTexto").textContent = "Crea un reporte en Reportes con \"+ Nuevo\" para poder exportarlo.";
    return;
  }

  titulo.textContent = reporte.nombre;
  mostrarResumenPdf();
  document.getElementById("pdfFecha").textContent = fechaCorta(reporte.fecha);
  document.getElementById("pdfTexto").textContent = reporte.notas || "Sin observaciones.";
  document.title = reporte.nombre + " - Agro Verde";
}

// Resumen de la propiedad que va dentro del PDF: cultivos, insumos, plagas y costos
function mostrarResumenPdf() {
  let caja = document.getElementById("pdfResumen");

  if (caja === null) {
    return;
  }

  let cultivos = leerLista("cultivos").filter(function (c) { return c.habilitado; });
  let terrenos = leerLista("terrenos").filter(function (t) { return t.habilitado; });
  let insumos = typeof insumosHabilitados === "function" ? insumosHabilitados() : [];
  let plagas = typeof obtener_plagas === "function" ? obtener_plagas().filter(function (p) { return p.habilitada; }) : [];
  let valorStock = insumos.reduce(function (total, i) { return total + i.cantidad * i.precio; }, 0);
  let porAgotar = insumos.filter(function (i) { return i.cantidad <= i.minimo; });

  let filasCultivos = cultivos.map(function (c) {
    return "<tr><td>" + textoSeguro(c.nombre) + "</td><td>" + textoSeguro(c.etapa) + "</td><td>" + textoSeguro(c.terreno) + "</td><td>" + c.area + " ha</td></tr>";
  }).join("") || '<tr><td colspan="4">Sin cultivos activos</td></tr>';

  let filasPlagas = plagas.map(function (p) {
    return "<tr><td>" + textoSeguro(p.nombre) + "</td><td>" + textoSeguro(p.ubicacion) + "</td><td>" + textoSeguro(p.estado) + "</td><td>" + fechaBonita(p.fecha) + "</td></tr>";
  }).join("") || '<tr><td colspan="4">Sin plagas activas</td></tr>';

  caja.innerHTML = `
    <h6 class="mt-3">Resumen de ${textoSeguro(nombrePropiedadActual())} al ${fechaBonita(fechaDeHoy(0))}</h6>
    <table class="table table-sm tabla-pdf">
      <tbody>
        <tr><td>Terrenos activos</td><td>${terrenos.length}</td></tr>
        <tr><td>Cultivos activos</td><td>${cultivos.length}</td></tr>
        <tr><td>Insumos en inventario</td><td>${insumos.length} (${porAgotar.length} por agotarse)</td></tr>
        <tr><td>Valor del inventario</td><td>$${Math.round(valorStock).toLocaleString("es-CO")}</td></tr>
        <tr><td>Plagas activas</td><td>${plagas.length}</td></tr>
      </tbody>
    </table>
    <h6>Cultivos</h6>
    <table class="table table-sm tabla-pdf"><thead><tr><th>Cultivo</th><th>Etapa</th><th>Terreno</th><th>Área</th></tr></thead><tbody>${filasCultivos}</tbody></table>
    <h6>Plagas</h6>
    <table class="table table-sm tabla-pdf mb-0"><thead><tr><th>Plaga</th><th>Cultivo</th><th>Estado</th><th>Desde</th></tr></thead><tbody>${filasPlagas}</tbody></table>`;
}

// ================== REPORTE DE CONSUMO ==================
// Se calcula con los usos de insumos que se registran en el módulo de Insumos
function mostrarConsumo() {
  if (document.getElementById("consumoSemanal") === null || typeof obtenerUsosInsumos !== "function") {
    return;
  }

  let usos = obtenerUsosInsumos();
  let insumos = obtenerInsumos();
  let semana = fechaDeHoy(7);
  let mes = fechaDeHoy(0).slice(0, 7);
  let totalSemana = 0;
  let totalMes = 0;
  let porInsumo = {};
  let total = 0;

  for (let i = 0; i < usos.length; i++) {
    let u = usos[i];
    total += u.cantidad;
    porInsumo[u.insumo] = (porInsumo[u.insumo] || 0) + u.cantidad;

    // todo se pasa a kilos (los bultos y sacos con su peso aproximado; los líquidos no cuentan)
    let insumo = insumoPorNombre(insumos, u.insumo) || { nombre: u.insumo, unidad: u.unidad };
    let kilos = kilosDe(insumo, u.cantidad);

    if (u.fecha >= semana) {
      totalSemana += kilos;
    }
    if (u.fecha.slice(0, 7) === mes) {
      totalMes += kilos;
    }
  }

  // el insumo con más cantidad usada
  let masUsado = "----";
  let mayor = 0;
  for (let nombre in porInsumo) {
    if (porInsumo[nombre] > mayor) {
      mayor = porInsumo[nombre];
      masUsado = nombre;
    }
  }

  let meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  let hoy = new Date();

  document.getElementById("consumoSemanal").textContent = Math.round(totalSemana) + " kg";
  document.getElementById("consumoMensual").textContent = Math.round(totalMes) + " kg";
  document.getElementById("consumoMes").textContent = meses[hoy.getMonth()] + " " + hoy.getFullYear();
  document.getElementById("consumoInsumo").textContent = masUsado;
  document.getElementById("consumoPorcentaje").textContent = total > 0 ? Math.round((mayor / total) * 100) + "%" : "0%";
}

mostrarReportes();
activarCrearReporte();
activarInhabilitarReporte();
mostrarPdf();
mostrarConsumo();
