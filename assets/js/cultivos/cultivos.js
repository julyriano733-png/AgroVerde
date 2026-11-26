// cultivos.js
// Lógica de todas las pantallas de Cultivos. Los datos se guardan en localStorage
// con las funciones de comun.js. Cada parte solo se ejecuta si su pantalla está abierta.

const CLAVE_CULTIVOS = "cultivos";

// Cultivos que existen la primera vez (los mismos del Figma)
function cultivosDeEjemplo() {
  return [
    { id: 1, nombre: "Maíz - Lote 1", tipo: "cereal", terreno: "Terreno 1", ubicacion: "Finca el Manantial Norte", etapa: "Floración", estado: "Óptimo", fechaSiembra: "2026-02-12", area: 2.5, rendimiento: 7.2, notas: "Cultivo en etapa de floración, sin novedades registradas.", fuente: "Río", caudal: 120, latitud: "4.85921", longitud: "-74.05812", habilitado: true },
    { id: 2, nombre: "Café - Lote 2", tipo: "permanente", terreno: "Terreno de Café", ubicacion: "Finca el Manantial Sur", etapa: "Maduración", estado: "Revisar", fechaSiembra: "2025-09-03", area: 1.8, rendimiento: 1.5, notas: "Revisar la humedad del suelo.", fuente: "Pozo", caudal: 80, latitud: "4.85810", longitud: "-74.05790", habilitado: true },
    { id: 3, nombre: "Fríjol - Lote 3", tipo: "leguminosa", terreno: "Terreno loma", ubicacion: "Finca el Manantial Este", etapa: "Siembra", estado: "Alerta plaga", fechaSiembra: "2026-10-20", area: 1.2, rendimiento: 1.8, notas: "Se reportó plaga en el lote.", fuente: "Acueducto", caudal: 60, latitud: "4.86011", longitud: "-74.05655", habilitado: true },
    { id: 4, nombre: "Tomate - Lote 4", tipo: "hortaliza", terreno: "Terreno huerta", ubicacion: "Finca el Manantial Oeste", etapa: "Crecimiento", estado: "Óptimo", fechaSiembra: "2026-08-15", area: 0.8, rendimiento: 40, notas: "Crecimiento normal.", fuente: "Río", caudal: 100, latitud: "4.85700", longitud: "-74.05900", habilitado: true }
  ];
}

function obtenerCultivos() {
  return obtenerLista(CLAVE_CULTIVOS, cultivosDeEjemplo());
}

// Solo los cultivos que no se han inhabilitado
function cultivosHabilitados() {
  return obtenerCultivos().filter(function (cultivo) {
    return cultivo.habilitado;
  });
}

// El cultivo del ?id= de la dirección, o el primero si no viene ninguno
// Si no hay ningún cultivo guardado se vuelve a la lista
function cultivoDeLaPagina(lista) {
  // fase fenológica tiene su propio selector; las demás piden elegir si no viene el ?id=
  let habilitados = lista.filter(function (c) { return c.habilitado; });
  if (document.getElementById("detalleCultivoFase") === null &&
      pedirElegir("¿Qué cultivo?", habilitados.map(function (c) { return { id: c.id, nombre: c.nombre, detalle: "Etapa: " + c.etapa + " • " + c.terreno }; }), "cultivos.html")) {
    return null;
  }

  let cultivo = buscarPorId(lista, idDeLaDireccion());

  if (cultivo === null) {
    cultivo = lista[0];
  }

  if (cultivo === undefined) {
    alert("No hay cultivos registrados todavía");
    window.location.href = "cultivos.html";
    return null;
  }

  return cultivo;
}

// Clase de color de la insignia según el estado
function claseInsignia(estado) {
  if (estado === "Revisar") return "insignia_revisar";
  if (estado === "Alerta plaga") return "insignia_alerta";
  return "insignia_optimo";
}

function ponerTexto(id, texto) {
  let elemento = document.getElementById(id);

  if (elemento !== null) {
    elemento.textContent = texto;
  }
}

// ================== LISTA DE CULTIVOS ==================
function mostrarListaCultivos() {
  let contenedor = document.getElementById("listaCultivos");

  if (contenedor === null) {
    return;
  }

  let html = "";
  let lista = cultivosHabilitados();

  for (let i = 0; i < lista.length; i++) {
    let c = lista[i];
    html += `
      <div class="col-12 col-md-6 col-lg-3 tarjeta-buscable" data-temporada="${temporadaDe(c)}">
        <a href="ver-cultivo.html?id=${c.id}" class="tarjeta p-3 rounded-4 d-flex justify-content-between align-items-center text-decoration-none h-100">
          <div>
            <h6 class="m-0 text-white fw-bold">${textoSeguro(c.nombre)}</h6>
            <p class="m-0 small texto_gris">Etapa: ${textoSeguro(c.etapa)}</p>
            <p class="m-0 texto_gris" style="font-size: 0.75rem;"><i class="bi bi-cloud-drizzle me-1"></i>${NOMBRES_TEMPORADA[temporadaDe(c)]}</p>
          </div>
          <span class="insignia ${claseInsignia(c.estado)}">${textoSeguro(c.estado)}</span>
        </a>
      </div>`;
  }

  if (lista.length === 0) {
    html = '<p class="texto_gris">No hay cultivos registrados. Crea uno con "+ Nuevo".</p>';
  }

  contenedor.innerHTML = html;

  // buscador y filtro por temporada se aplican juntos
  let temporadaElegida = "todas";
  let buscador = document.getElementById("buscadorCultivos");

  function aplicarFiltros() {
    let texto = buscador.value.toLowerCase();
    let tarjetas = contenedor.querySelectorAll(".tarjeta-buscable");

    for (let i = 0; i < tarjetas.length; i++) {
      let coincideTexto = tarjetas[i].textContent.toLowerCase().includes(texto);
      let coincideTemporada = temporadaElegida === "todas" || tarjetas[i].dataset.temporada === temporadaElegida;
      tarjetas[i].classList.toggle("d-none", !(coincideTexto && coincideTemporada));
    }
  }

  buscador.addEventListener("input", aplicarFiltros);

  let botones = document.querySelectorAll("#filtrosTemporada button");
  for (let i = 0; i < botones.length; i++) {
    botones[i].addEventListener("click", function () {
      temporadaElegida = botones[i].dataset.temporada;
      for (let j = 0; j < botones.length; j++) {
        botones[j].className = "boton_acceso border-0 py-1 px-3 rounded-4";
      }
      botones[i].className = "btn_nuevo border-0 py-1 px-3";
      aplicarFiltros();
    });
  }
}

// ================== TEMPORADA, COSECHA, RIEGO Y FERTILIZACIÓN ==================
// Temporada del cultivo: la que se eligió o la que dice la guía
function temporadaDe(cultivo) {
  return cultivo.temporada || guiaDelCultivo(cultivo).temporada;
}

// Días del ciclo (siembra -> cosecha) según la guía del cultivo
function cicloDe(cultivo) {
  return guiaDelCultivo(cultivo).ciclo || CICLOS[tipoDelCultivo(cultivo)] || 120;
}

// Suma días a una fecha "2026-11-01" y devuelve otra en el mismo formato
function sumarDias(fecha, dias) {
  let d = new Date(fecha + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// Fecha estimada de cosecha: la escrita a mano o la calculada
function fechaCosechaDe(cultivo) {
  return cultivo.fechaCosecha || sumarDias(cultivo.fechaSiembra, cicloDe(cultivo));
}

// Próxima fertilización según la guía (días desde la siembra). null si ya pasaron todas.
function proximaFertilizacion(cultivo) {
  let dias = guiaDelCultivo(cultivo).fertilizacion || [];

  for (let i = 0; i < dias.length; i++) {
    let fecha = sumarDias(cultivo.fechaSiembra, dias[i]);
    if (fecha >= fechaDeHoy(0) && fecha > (cultivo.ultimaFertilizacion || "")) {
      return fecha;
    }
  }

  return null;
}

// Próximo riego: cada N días desde el último riego registrado (o desde la siembra)
function proximoRiego(cultivo) {
  let base = cultivo.ultimoRiego || cultivo.fechaSiembra;
  let proximo = sumarDias(base, guiaDelCultivo(cultivo).riegoCada || 3);
  return proximo < fechaDeHoy(0) ? fechaDeHoy(0) : proximo;
}

// ================== CREAR CULTIVO ==================
// Terrenos habilitados (vienen de terreno.js)
function terrenosDisponibles() {
  return obtenerTerrenos().filter(function (t) { return t.habilitado; });
}

// Cultivo que ocupa un terreno (sin contar el cultivo que se está editando). null si está libre.
function cultivoEnTerreno(nombreTerreno, idCultivoActual) {
  let lista = cultivosHabilitados();

  for (let i = 0; i < lista.length; i++) {
    if (lista[i].terreno === nombreTerreno && lista[i].id !== idCultivoActual) {
      return lista[i];
    }
  }

  return null;
}

// Si la ubicación del terreno son coordenadas ("5.75566, -72.90892") las separa
function coordenadasDe(texto) {
  let partes = (texto || "").split(",");

  if (partes.length === 2 && !isNaN(parseFloat(partes[0])) && !isNaN(parseFloat(partes[1]))) {
    return { latitud: partes[0].trim(), longitud: partes[1].trim() };
  }

  return { latitud: "", longitud: "" };
}

// Valida fecha y área contra el terreno elegido. Devuelve un texto de error o "".
function errorDeSiembra(fecha, area, terreno) {
  if (fecha === "" || fecha > fechaDeHoy(0)) {
    return "La fecha de siembra no puede ser después de hoy";
  }

  if (isNaN(area) || area <= 0) {
    return "Escribe el área sembrada en hectáreas, por ejemplo 2.5";
  }

  if (terreno !== null && area > terreno.area) {
    return "El área sembrada (" + area + " ha) no puede ser mayor que el terreno " + terreno.nombre + " (" + terreno.area + " ha)";
  }

  return "";
}

function activarCrearCultivo() {
  let formulario = document.getElementById("formCultivo");

  if (formulario === null) {
    return;
  }

  document.getElementById("fecha").max = fechaDeHoy(0);
  activarSugerenciasDeCultivo("nombre", "tipo", "fecha", "temporada", "fechaCosecha");
  mostrarRecomendados();

  // la lista de terrenos sale de los terrenos registrados
  let terrenos = terrenosDisponibles();
  let lista = document.getElementById("listaTerrenosCultivo");
  let html = "";

  for (let i = 0; i < terrenos.length; i++) {
    let ocupado = cultivoEnTerreno(terrenos[i].nombre, null);

    // un terreno con un cultivo sembrado no se puede volver a usar hasta que quede libre
    if (ocupado !== null) {
      html += `
      <li>
        <span class="terreno-item terreno-ocupado" title="Ocupado">${textoSeguro(terrenos[i].nombre)} - ocupado por ${textoSeguro(ocupado.nombre)}</span>
      </li>`;
      continue;
    }

    html += `
      <li>
        <input type="radio" name="terreno" id="t${terrenos[i].id}" value="${terrenos[i].id}" class="opcion-oculta">
        <label for="t${terrenos[i].id}" class="terreno-item">${textoSeguro(terrenos[i].nombre)} (${terrenos[i].area} ha) - libre</label>
      </li>`;
  }

  lista.innerHTML = html || '<li class="texto_gris small p-2">No hay terrenos. Crea uno en el módulo Terreno.</li>';

  // al elegir un terreno se cierra la lista y se muestra el elegido
  let items = lista.querySelectorAll("label.terreno-item");
  let campoTerreno = document.getElementById("terrenoSeleccionado");
  for (let i = 0; i < items.length; i++) {
    items[i].addEventListener("click", function () {
      for (let j = 0; j < items.length; j++) {
        items[j].classList.remove("activo");
      }
      items[i].classList.add("activo");
      campoTerreno.textContent = items[i].textContent;
      campoTerreno.classList.add("con-valor");
      document.getElementById("detalleTerreno").removeAttribute("open");
    });
  }

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let nombre = document.getElementById("nombre").value.trim();
    let terreno = document.querySelector('input[name="terreno"]:checked');

    if (nombre.length < 3) {
      alert("El nombre del cultivo debe tener mínimo 3 letras");
      return;
    }

    if (terreno === null) {
      alert("Selecciona el terreno donde vas a sembrar");
      return;
    }

    let datosTerreno = buscarPorId(terrenos, Number(terreno.value));
    let ocupante = cultivoEnTerreno(datosTerreno.nombre, null);

    if (ocupante !== null) {
      alert(datosTerreno.nombre + " ya está ocupado por " + ocupante.nombre + ". Elige un terreno libre.");
      return;
    }

    let fecha = document.getElementById("fecha").value;
    let area = Number(document.getElementById("area").value);
    let error = errorDeSiembra(fecha, area, datosTerreno);

    if (error !== "") {
      alert(error);
      return;
    }

    let lista = obtenerCultivos();
    let nombreTerreno = datosTerreno.nombre;

    lista.push({
      id: nuevoId(lista),
      nombre: nombre,
      tipo: document.getElementById("tipo").value,
      terreno: nombreTerreno,
      ubicacion: datosTerreno.ubicacion || "Finca el Manantial",
      etapa: "Siembra",
      estado: "Óptimo",
      fechaSiembra: fecha,
      area: area,
      rendimiento: 0,
      notas: document.getElementById("notas").value.trim(),
      fuente: { rio: "Río", pozo: "Pozo", acueducto: "Acueducto" }[datosTerreno.fuente] || "Río",
      caudal: datosTerreno.caudal || 0,
      temporada: document.getElementById("temporada").value,
      fechaCosecha: document.getElementById("fechaCosecha").value,
      latitud: coordenadasDe(datosTerreno.ubicacion).latitud,
      longitud: coordenadasDe(datosTerreno.ubicacion).longitud,
      habilitado: true
    });

    guardarLista(CLAVE_CULTIVOS, lista);
    registrarEvento("Cultivo registrado", "Se agregó " + nombre + " en " + nombreTerreno, "cultivos", "bi-plus-circle", "success");
    window.location.href = "cultivos.html?mensaje=guardado";
  });
}

// Llena solas la temporada y la fecha de cosecha según el cultivo (se pueden cambiar a mano)
function activarSugerenciasDeCultivo(idNombre, idTipo, idSiembra, idTemporada, idCosecha) {
  let nombre = document.getElementById(idNombre);
  let tipo = document.getElementById(idTipo);
  let siembra = document.getElementById(idSiembra);
  let temporada = document.getElementById(idTemporada);
  let cosecha = document.getElementById(idCosecha);
  let cosechaAMano = cosecha.value !== "";

  cosecha.addEventListener("input", function () {
    cosechaAMano = cosecha.value !== "";
  });

  function sugerir() {
    let cultivo = { nombre: nombre.value, tipo: tipo.value };
    let guia = guiaDelCultivo(cultivo);
    temporada.value = guia.temporada;

    if (!cosechaAMano && siembra.value !== "") {
      cosecha.value = sumarDias(siembra.value, cicloDe(cultivo));
    }

    let ayuda = document.getElementById("ayudaCosecha");
    if (ayuda !== null) {
      ayuda.textContent = "Ciclo aproximado de " + (guia.nombre || "este cultivo") + ": " + cicloDe(cultivo) + " días. Puedes cambiar la fecha si la conoces.";
    }
  }

  nombre.addEventListener("change", sugerir);
  tipo.addEventListener("change", sugerir);
  siembra.addEventListener("change", sugerir);
}

// Tarjetas de cultivos recomendados para la temporada actual; al tocar una se llena el formulario
function mostrarRecomendados() {
  let caja = document.getElementById("recomendados");

  if (caja === null) {
    return;
  }

  let temporada = temporadaActual();
  document.getElementById("textoTemporada").textContent = "Estamos en " + NOMBRES_TEMPORADA[temporada].toLowerCase() + ". Toca uno para llenar el formulario.";

  let lista = cultivosRecomendados().slice(0, 6);
  let html = "";
  for (let i = 0; i < lista.length; i++) {
    html += `
      <div class="col-4 col-md-2">
        <button type="button" class="card-reco w-100 border-0" data-indice="${GUIA_CULTIVOS.indexOf(lista[i])}">
          <span class="punto"></span>
          <strong class="nombre-reco">${lista[i].nombre}</strong>
          <small class="compat">${lista[i].ciclo} días • ${NOMBRES_TEMPORADA[lista[i].temporada]}</small>
        </button>
      </div>`;
  }
  caja.innerHTML = html;

  caja.addEventListener("click", function (evento) {
    let boton = evento.target.closest("[data-indice]");

    if (boton === null) {
      return;
    }

    let guia = GUIA_CULTIVOS[Number(boton.dataset.indice)];
    document.getElementById("nombre").value = guia.nombre;
    document.getElementById("tipo").value = guia.tipo;
    document.getElementById("nombre").dispatchEvent(new Event("change"));
  });
}

// ================== VER CULTIVO ==================
function mostrarCultivo() {
  if (document.getElementById("verNombre") === null) {
    return;
  }

  let c = cultivoDeLaPagina(obtenerCultivos());

  if (c === null) {
    return;
  }

  ponerTexto("verNombre", c.nombre);
  ponerTexto("verEstado", c.estado);
  ponerTexto("verUbicacion", c.ubicacion);
  ponerTexto("verTerreno", c.terreno);
  ponerTexto("verEtapa", c.etapa);
  ponerTexto("verRendimiento", c.rendimiento > 0 ? c.rendimiento + " ton/ha" : "Sin estimar (agrégalo en Editar)");
  ponerTexto("verArea", c.area + " ha");
  ponerTexto("verFecha", fechaBonita(c.fechaSiembra));
  ponerTexto("verNotas", c.notas || "Sin descripción.");
  ponerTexto("verFuente", c.fuente);
  ponerTexto("verCaudal", c.caudal + " L/min");
  // 5.75566 -> "5.75566° N" y -72.90892 -> "72.90892° O" (el signo dice el hemisferio)
  let lat = parseFloat(c.latitud);
  let lon = parseFloat(c.longitud);
  ponerTexto("verLatitud", isNaN(lat) ? "----" : Math.abs(lat) + "° " + (lat >= 0 ? "N" : "S"));
  ponerTexto("verLongitud", isNaN(lon) ? "----" : Math.abs(lon) + "° " + (lon >= 0 ? "E" : "O"));

  document.getElementById("enlaceEditar").href = "editar-cultivo.html?id=" + c.id;
  mostrarGuiaDelCultivo(c);

  // Exportar PDF: la impresión del navegador (elegir "Guardar como PDF")
  document.getElementById("botonPdfCultivo").addEventListener("click", function () {
    document.title = c.nombre + " - Agro Verde";
    window.print();
  });
}

// Cosecha, abono, riego, fertilización, cuidados de la fase y plagas frecuentes del cultivo
function mostrarGuiaDelCultivo(c) {
  let caja = document.getElementById("guiaCultivo");
  let guia = guiaDelCultivo(c);
  let fase = FASES[c.etapa] || FASES["Siembra"];
  let fertilizacion = proximaFertilizacion(c);
  let plagas = (typeof catalogo !== "undefined" ? catalogo : []).filter(function (p) {
    return guia.plagas.includes(p.nombre) || textoSinTildes(p.cultivo).includes(textoSinTildes(guia.nombre));
  });

  let consejos = fase.consejos.map(function (consejo) { return "<li>" + consejo + "</li>"; }).join("");
  let listaPlagas = plagas.map(function (p) {
    return `
      <div class="fila d-block">
        <span class="d-flex justify-content-between"><strong class="text-white">${p.nombre}</strong><span class="small">Riesgo ${p.riesgo.toLowerCase()}</span></span>
        <small class="texto_gris d-block">${p.descripcion}</small>
        <small class="d-block mt-1"><strong class="text-success">Cómo controlarla:</strong> ${p.control}</small>
      </div>`;
  }).join("") || '<p class="texto_gris small">No hay plagas frecuentes registradas para este cultivo.</p>';

  caja.innerHTML = `
    <h5 class="fw-bold mb-3"><i class="bi bi-journal-text text-success me-2"></i>Guía del cultivo</h5>

    <div class="fila"><span>Fecha estimada de cosecha</span><span class="valor">${fechaBonita(fechaCosechaDe(c))}${c.fechaCosecha ? "" : " (calculada)"}</span></div>
    <div class="fila"><span>Temporada de siembra</span><span class="valor">${NOMBRES_TEMPORADA[temporadaDe(c)]}</span></div>
    <div class="fila"><span>Rendimiento de referencia</span><span class="valor">${guia.rendimiento.toLocaleString("es-CO")} kg/ha</span></div>

    <p class="titulo-seccion">Abono recomendado</p>
    <p class="descripcion">${guia.abono}</p>

    <p class="titulo-seccion">Riego y fertilización</p>
    <div class="fila"><span>Riego</span><span class="valor">Cada ${guia.riegoCada} días • próximo: ${fechaBonita(proximoRiego(c))}</span></div>
    <div class="fila"><span>Próxima fertilización</span><span class="valor">${fertilizacion ? fechaBonita(fertilizacion) : "Sin fertilizaciones pendientes"}</span></div>
    <div class="row g-2 mt-1 mb-2 no-imprimir">
      <div class="col-6"><button type="button" class="btn-agro-outline w-100 py-2" id="botonRegue"><i class="bi bi-droplet me-1"></i> Regué hoy</button></div>
      <div class="col-6"><button type="button" class="btn-agro-outline w-100 py-2" id="botonFertilice"><i class="bi bi-bucket me-1"></i> Fertilicé hoy</button></div>
    </div>

    <p class="titulo-seccion">Cuidados en la fase de ${c.etapa.toLowerCase()}</p>
    <ul class="descripcion ps-3">${consejos}</ul>

    <p class="titulo-seccion">Plagas frecuentes de este cultivo</p>
    ${listaPlagas}
    <a href="../plagas/catalogo-plagas.html" class="btn-agro-sm mt-2 no-imprimir">Ver catálogo de plagas</a>`;

  // registrar riego o fertilización de hoy (mueve los recordatorios)
  function registrar(campo, titulo) {
    let lista = obtenerCultivos();
    let guardado = buscarPorId(lista, c.id);
    guardado[campo] = fechaDeHoy(0);
    guardarLista(CLAVE_CULTIVOS, lista);
    registrarEvento(titulo, c.nombre, "cultivos", campo === "ultimoRiego" ? "bi-droplet" : "bi-bucket", "success");
    window.location.href = "ver-cultivo.html?id=" + c.id + "&mensaje=guardado";
  }

  document.getElementById("botonRegue").addEventListener("click", function () { registrar("ultimoRiego", "Riego registrado"); });
  document.getElementById("botonFertilice").addEventListener("click", function () { registrar("ultimaFertilizacion", "Fertilización registrada"); });
}

// ================== EDITAR CULTIVO ==================
// Pone en un <select> la opción cuyo texto coincide (si no existe la agrega)
function elegirOpcion(select, texto) {
  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].text === texto || select.options[i].value === texto) {
      select.selectedIndex = i;
      return;
    }
  }

  select.add(new Option(texto, texto, true, true));
}

function activarEditarCultivo() {
  let formulario = document.getElementById("formEditarCultivo");

  if (formulario === null) {
    return;
  }

  let lista = obtenerCultivos();
  let c = cultivoDeLaPagina(lista);

  if (c === null) {
    return;
  }

  // la flecha de volver regresa al detalle de este mismo cultivo
  document.querySelector('a[aria-label="Volver"]').href = "ver-cultivo.html?id=" + c.id;

  // los terrenos del select salen de los terrenos registrados
  let terrenos = terrenosDisponibles();
  let selectTerreno = document.getElementById("editTerrenoLote");
  for (let i = 0; i < terrenos.length; i++) {
    let ocupante = cultivoEnTerreno(terrenos[i].nombre, c.id);
    let opcion = new Option(terrenos[i].nombre + (ocupante ? " - ocupado por " + ocupante.nombre : ""), terrenos[i].nombre);
    opcion.disabled = ocupante !== null;
    selectTerreno.add(opcion);
  }
  document.getElementById("editFechaSiembra").max = fechaDeHoy(0);

  // llenamos el formulario con los datos guardados
  document.getElementById("editNombreCultivo").value = c.nombre;
  elegirOpcion(document.getElementById("editTipoCultivo"), tipoDelCultivo(c));
  elegirOpcion(document.getElementById("editTerrenoLote"), c.terreno);
  document.getElementById("editUbicacion").value = c.ubicacion;
  elegirOpcion(document.getElementById("editEtapa"), c.etapa);
  document.getElementById("editFechaSiembra").value = c.fechaSiembra;
  document.getElementById("editArea").value = c.area;
  document.getElementById("editRendimiento").value = c.rendimiento;
  document.getElementById("editNotas").value = c.notas;
  document.getElementById("editTemporada").value = temporadaDe(c);
  document.getElementById("editFechaCosecha").value = fechaCosechaDe(c);
  document.getElementById("editCaudal").value = c.caudal;
  formulario.elements["latitud"].value = c.latitud;
  formulario.elements["longitud"].value = c.longitud;

  let fuentes = formulario.elements["fuenteHidricaCultivo"];
  for (let i = 0; i < fuentes.length; i++) {
    fuentes[i].checked = fuentes[i].nextElementSibling.textContent.trim() === c.fuente;
  }

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let nombre = document.getElementById("editNombreCultivo").value.trim();

    if (nombre.length < 3) {
      alert("El nombre del cultivo debe tener mínimo 3 letras");
      return;
    }

    let terreno = document.getElementById("editTerrenoLote");
    let etapa = document.getElementById("editEtapa");
    let datosTerreno = null;
    for (let i = 0; i < terrenos.length; i++) {
      if (terrenos[i].nombre === terreno.value) {
        datosTerreno = terrenos[i];
      }
    }
    let ocupante = cultivoEnTerreno(terreno.value, c.id);

    if (ocupante !== null) {
      alert(terreno.value + " ya está ocupado por " + ocupante.nombre + ". Elige un terreno libre.");
      return;
    }

    let error = errorDeSiembra(document.getElementById("editFechaSiembra").value, Number(document.getElementById("editArea").value), datosTerreno);

    if (error !== "") {
      alert(error);
      return;
    }
    let fuente = formulario.querySelector('input[name="fuenteHidricaCultivo"]:checked');

    c.nombre = nombre;
    c.tipo = document.getElementById("editTipoCultivo").value;
    c.terreno = terreno.options[terreno.selectedIndex].text;
    c.ubicacion = document.getElementById("editUbicacion").value.trim();
    c.etapa = etapa.options[etapa.selectedIndex].text;
    c.fechaSiembra = document.getElementById("editFechaSiembra").value;
    c.area = Number(document.getElementById("editArea").value);
    c.rendimiento = Number(document.getElementById("editRendimiento").value);
    c.notas = document.getElementById("editNotas").value.trim();
    c.temporada = document.getElementById("editTemporada").value;
    c.fechaCosecha = document.getElementById("editFechaCosecha").value;

    if (c.fechaCosecha !== "" && c.fechaCosecha <= c.fechaSiembra) {
      alert("La fecha de cosecha debe ser después de la fecha de siembra");
      return;
    }
    c.caudal = Number(document.getElementById("editCaudal").value);
    c.latitud = formulario.elements["latitud"].value.trim();
    c.longitud = formulario.elements["longitud"].value.trim();
    if (fuente !== null) {
      c.fuente = fuente.nextElementSibling.textContent.trim();
    }

    guardarLista(CLAVE_CULTIVOS, lista);
    registrarEvento("Cultivo actualizado", "Se editó " + c.nombre, "cultivos", "bi-pencil-square", "success");
    window.location.href = "cultivos.html?mensaje=guardado";
  });
}

// ================== INHABILITAR CULTIVO ==================
function activarInhabilitarCultivo() {
  let contenedor = document.getElementById("listaInhabilitar");

  if (contenedor === null) {
    return;
  }

  let html = "";
  let lista = cultivosHabilitados();
  let clases = { "Óptimo": "optimo", "Revisar": "revisar", "Alerta plaga": "alerta" };

  for (let i = 0; i < lista.length; i++) {
    let c = lista[i];
    html += `
      <label class="tarjeta p-3 rounded-4 d-flex justify-content-between align-items-center tarjeta-buscable" style="cursor: pointer;">
        <div class="d-flex align-items-center gap-3">
          <input type="checkbox" name="cultivosEliminar" value="${c.id}" class="form-check-input m-0">
          <div>
            <strong class="d-block">${textoSeguro(c.nombre)}</strong>
            <span class="texto_gris small">Etapa: ${textoSeguro(c.etapa)}</span>
          </div>
        </div>
        <span class="badge-estado badge-estado--${clases[c.estado] || "optimo"}">${textoSeguro(c.estado)}</span>
      </label>`;
  }

  contenedor.innerHTML = html;
  activarBuscadorDeLista("buscadorInhabilitar", ".tarjeta-buscable");

  document.getElementById("botonInhabilitar").addEventListener("click", async function (evento) {
    evento.preventDefault();

    let marcados = document.querySelectorAll('input[name="cultivosEliminar"]:checked');

    if (marcados.length === 0) {
      alert("Selecciona al menos un cultivo");
      return;
    }

    if (await preguntar("¿Estás seguro?", "Se van a inhabilitar " + marcados.length + " cultivo(s).", "Inhabilitar") === false) {
      return;
    }

    let todos = obtenerCultivos();

    for (let i = 0; i < marcados.length; i++) {
      let cultivo = buscarPorId(todos, Number(marcados[i].value));
      marcarInhabilitado(cultivo);
      anotarUsoAnterior(cultivo);
      registrarEvento("Cultivo inhabilitado", "Se inhabilitó " + cultivo.nombre, "cultivos", "bi-slash-circle", "danger");
    }

    guardarLista(CLAVE_CULTIVOS, todos);
    window.location.href = "cultivos.html?mensaje=inhabilitado";
  });
}

// Cuando un cultivo termina (se inhabilita), su terreno guarda que lo tuvo: cultivo, desde y hasta
function anotarUsoAnterior(cultivo) {
  let terrenos = leerLista("terrenos");
  let terreno = terrenos.find(function (t) { return t.nombre === cultivo.terreno; });

  if (terreno === undefined) {
    return;
  }

  terreno.cultivosAnteriores = terreno.cultivosAnteriores || [];
  terreno.cultivosAnteriores.unshift({ cultivo: cultivo.nombre, desde: cultivo.fechaSiembra, hasta: fechaDeHoy(0) });
  guardarLista("terrenos", terrenos);
}

// ================== FASE FENOLÓGICA ==================
// Recomendaciones y próxima etapa según la etapa del cultivo
const FASES = {
  "Siembra": { siguiente: "Germinación", dias: 10, consejos: ["Mantener el suelo húmedo para la germinación", "Revisar que no haya hormigas ni pájaros en el lote", "Evitar encharcamientos", "Aplicar fertilización de arranque"] },
  "Germinación": { siguiente: "Crecimiento", dias: 15, consejos: ["Riego ligero y frecuente", "Vigilar plagas de plántulas", "Controlar malezas alrededor", "Reponer las plantas que no nacieron"] },
  "Crecimiento": { siguiente: "Floración", dias: 30, consejos: ["Aumentar el riego según el clima", "Vigilar plagas del follaje", "Aporcar las plantas", "Aplicar fertilización nitrogenada"] },
  "Floración": { siguiente: "Fructificación", dias: 18, consejos: ["Mantener un riego constante, la floración es sensible al estrés hídrico", "Vigilar aparición de plagas del follaje durante esta etapa", "Evitar labores mecánicas cerca de la raíz", "Aplicar fertilización de refuerzo"] },
  "Fructificación": { siguiente: "Maduración", dias: 20, consejos: ["Mantener el riego parejo para que los frutos no se rajen", "Aplicar potasio para mejorar el llenado y el sabor", "Revisar frutos dañados por insectos y retirarlos", "Tutorar o sostener las ramas cargadas"] },
  "Maduración": { siguiente: "Cosecha", dias: 25, consejos: ["Reducir el riego poco a poco", "Vigilar hongos en frutos", "Preparar herramientas de cosecha", "Revisar el punto de madurez"] }
};

function activarFaseFenologica() {
  let selector = document.getElementById("detalleCultivoFase");

  if (selector === null) {
    return;
  }

  let lista = cultivosHabilitados();
  let caja = selector.querySelector(".lista");

  // armamos las opciones con los cultivos guardados
  let html = "";
  for (let i = 0; i < lista.length; i++) {
    html += `<div class="opcion" data-id="${lista[i].id}">${textoSeguro(lista[i].nombre)}</div>`;
  }
  caja.innerHTML = html;

  let opciones = caja.querySelectorAll(".opcion");
  for (let i = 0; i < opciones.length; i++) {
    opciones[i].addEventListener("click", function () {
      mostrarFase(buscarPorId(lista, Number(opciones[i].dataset.id)));
      selector.removeAttribute("open");
    });
  }

  let cultivo = cultivoDeLaPagina(lista);

  if (cultivo !== null) {
    mostrarFase(cultivo);
  }
}

function mostrarFase(cultivo) {
  let fase = FASES[cultivo.etapa] || FASES["Siembra"];
  let colores = ["punto-verde", "punto-rojo", "punto-amarillo", "punto-azul"];

  ponerTexto("cultivoActualFase", cultivo.nombre);
  ponerTexto("faseEtapa", cultivo.etapa.toUpperCase());
  ponerTexto("faseSiguiente", fase.siguiente);
  ponerTexto("faseDias", "en " + fase.dias + " Días");

  let html = "";
  for (let i = 0; i < fase.consejos.length; i++) {
    html += `
      <div class="recomendacion">
        <span class="punto ${colores[i]}"></span>
        <span>${fase.consejos[i]}</span>
      </div>`;
  }
  document.getElementById("faseConsejos").innerHTML = html;

  let opciones = document.querySelectorAll("#detalleCultivoFase .opcion");
  for (let i = 0; i < opciones.length; i++) {
    opciones[i].classList.toggle("opcion-activa", Number(opciones[i].dataset.id) === cultivo.id);
  }
}

// ================== DÍA DE COSECHA ==================
// Días que tarda cada tipo de cultivo desde la siembra hasta la cosecha
const CICLOS = { fruta: 180, verdura: 70, hortaliza: 100, cereal: 120, leguminosa: 90, tuberculo: 150, permanente: 240 };

// Cultivos guardados con los tipos viejos (café, maíz...) pasan a su categoría
const TIPOS_VIEJOS = { cafe: "permanente", maiz: "cereal", platano: "fruta", yuca: "tuberculo" };

function tipoDelCultivo(cultivo) {
  return TIPOS_VIEJOS[cultivo.tipo] || cultivo.tipo;
}

function mostrarDiaCosecha() {
  if (document.getElementById("cosechaFecha") === null) {
    return;
  }

  let c = cultivoDeLaPagina(cultivosHabilitados());

  if (c === null) {
    return;
  }

  // la fecha de cosecha escrita a mano manda; si no hay, se calcula
  let ciclo = Math.max(1, Math.round((new Date(fechaCosechaDe(c) + "T00:00:00") - new Date(c.fechaSiembra + "T00:00:00")) / 86400000));
  let meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  let siembra = new Date(c.fechaSiembra + "T00:00:00");
  let cosecha = new Date(siembra);
  cosecha.setDate(cosecha.getDate() + ciclo);

  // días que lleva sembrado (entre 0 y el ciclo completo)
  let dias = Math.floor((new Date() - siembra) / 86400000);
  dias = Math.max(0, Math.min(dias, ciclo));
  let avance = Math.round((dias / ciclo) * 100);

  ponerTexto("cosechaNombre", c.nombre);
  ponerTexto("cosechaSiembra", "Sembrado: " + siembra.getDate() + " " + meses[siembra.getMonth()] + " " + siembra.getFullYear());
  ponerTexto("cosechaFecha", cosecha.getDate() + " " + meses[cosecha.getMonth()] + " " + cosecha.getFullYear());
  ponerTexto("cosechaDia", "Día " + dias + " de " + ciclo);

  let barra = document.getElementById("cosechaBarra");
  barra.style.width = avance + "%";
  barra.parentElement.setAttribute("aria-valuenow", avance);
}

// Notificación de las cosechas que llegan en los próximos días (según Configuración de alertas)
function revisarCosechasProximas() {
  if (!alertaActiva("alertaCosecha")) {
    return;
  }

  let aviso = valorDeAlerta("diasCosecha", 7);
  let lista = cultivosHabilitados();

  for (let i = 0; i < lista.length; i++) {
    let c = lista[i];
    let fechaCosecha = fechaCosechaDe(c);
    let faltan = Math.ceil((new Date(fechaCosecha + "T00:00:00") - new Date(fechaDeHoy(0) + "T00:00:00")) / 86400000);

    if (faltan >= 0 && faltan <= aviso) {
      crearNotificacion("Cosecha próxima", c.nombre + " se cosecha en " + faltan + " día(s) (" + fechaBonita(fechaCosecha) + ")", "cosecha_" + idPropiedadActual() + "_" + c.id);
    }

    // riego: el día que toca (o si ya pasó)
    if (proximoRiego(c) <= fechaDeHoy(0)) {
      crearNotificacion("Toca regar", c.nombre + ": riego cada " + guiaDelCultivo(c).riegoCada + " días. Márcalo en el detalle del cultivo cuando riegues.", "riego_" + idPropiedadActual() + "_" + c.id + "_" + fechaDeHoy(0));
    }

    // fertilización: 3 días antes
    let fertilizacion = proximaFertilizacion(c);
    if (fertilizacion !== null && fertilizacion <= sumarDias(fechaDeHoy(0), 3)) {
      crearNotificacion("Fertilización próxima", c.nombre + " el " + fechaBonita(fertilizacion) + ": " + guiaDelCultivo(c).abono, "fertilizacion_" + idPropiedadActual() + "_" + c.id + "_" + fertilizacion);
    }
  }
}

revisarCosechasProximas();
mostrarListaCultivos();
activarCrearCultivo();
mostrarCultivo();
activarEditarCultivo();
activarInhabilitarCultivo();
activarFaseFenologica();
mostrarDiaCosecha();
