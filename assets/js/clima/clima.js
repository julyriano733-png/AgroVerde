// clima.js
// Clima real de la finca con la API gratuita de Open-Meteo (no necesita clave).
// El último clima descargado se guarda en localStorage para mostrarlo si no hay internet.

// El clima se busca con las coordenadas de la propiedad actual (se ponen al crearla o editarla)
const CLAVE_CLIMA = "climaGuardado";

// La propiedad actual con sus coordenadas (null si no tiene)
function coordenadasDeLaPropiedad() {
  let propiedades = leerListaGeneral("propiedades");
  let propiedad = propiedades.find(function (p) { return p.id === idPropiedadActual(); });

  if (!propiedad || propiedad.latitud === undefined || propiedad.latitud === null || propiedad.latitud === "") {
    return null;
  }

  return { latitud: Number(propiedad.latitud), longitud: Number(propiedad.longitud), propiedadId: propiedad.id };
}
const CLAVE_EVENTOS_CAL = "eventosCalendario";
const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Convierte el código del clima de Open-Meteo en un ícono y una palabra.
// Se usan los íconos de Bootstrap (los emojis de clima salen como cuadros blancos en Windows).
// "deNoche" cambia el sol por la luna.
function describirClima(codigo, deNoche) {
  let clima;

  if (codigo === 0) clima = { clase: deNoche ? "bi-moon-stars-fill" : "bi-sun-fill", color: deNoche ? "#cbd5e1" : "#facc15", texto: deNoche ? "Despejado" : "Soleado" };
  else if (codigo <= 2) clima = { clase: deNoche ? "bi-cloud-moon-fill" : "bi-cloud-sun-fill", color: deNoche ? "#cbd5e1" : "#facc15", texto: "Parcialmente nublado" };
  else if (codigo === 3) clima = { clase: "bi-cloud-fill", color: "#cbd5e1", texto: "Nublado" };
  else if (codigo <= 48) clima = { clase: "bi-cloud-fog2-fill", color: "#94a3b8", texto: "Niebla" };
  else if (codigo <= 57) clima = { clase: "bi-cloud-drizzle-fill", color: "#38bdf8", texto: "Llovizna" };
  else if (codigo <= 67) clima = { clase: "bi-cloud-rain-fill", color: "#38bdf8", texto: "Lluvia" };
  else if (codigo <= 77) clima = { clase: "bi-snow", color: "#e0f2fe", texto: "Nieve" };
  else if (codigo <= 82) clima = { clase: "bi-cloud-rain-heavy-fill", color: "#0ea5e9", texto: "Aguaceros" };
  else clima = { clase: "bi-cloud-lightning-rain-fill", color: "#a78bfa", texto: "Tormenta" };

  clima.icono = '<i class="bi ' + clima.clase + '" style="color: ' + clima.color + ';" title="' + clima.texto + '" aria-label="' + clima.texto + '"></i>';
  return clima;
}

// Trae el clima. Usa lo guardado si tiene menos de 30 minutos o si falla internet.
async function obtenerClima() {
  let coordenadas = coordenadasDeLaPropiedad();

  // sin coordenadas no se sabe de dónde pedir el clima
  if (coordenadas === null) {
    return null;
  }

  // lo guardado es de esta propiedad y de estas coordenadas
  let clave = CLAVE_CLIMA + "_prop" + coordenadas.propiedadId;
  let guardado = JSON.parse(localStorage.getItem(clave) || "null");
  let mismoLugar = guardado !== null && guardado.latitud === coordenadas.latitud && guardado.longitud === coordenadas.longitud;

  if (mismoLugar && Date.now() - guardado.hora < 30 * 60 * 1000) {
    return guardado.datos;
  }

  let direccion = "https://api.open-meteo.com/v1/forecast?latitude=" + coordenadas.latitud + "&longitude=" + coordenadas.longitud +
    "&current=temperature_2m,relative_humidity_2m,weather_code" +
    "&hourly=temperature_2m,weather_code" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean" +
    "&past_days=31&forecast_days=6&timezone=America%2FBogota";

  try {
    let respuesta = await fetch(direccion);
    let datos = await respuesta.json();
    localStorage.setItem(clave, JSON.stringify({ hora: Date.now(), latitud: coordenadas.latitud, longitud: coordenadas.longitud, datos: datos }));
    return datos;
  } catch (error) {
    // sin internet: usamos lo último que se guardó de este lugar (aunque sea viejo)
    return mismoLugar ? guardado.datos : null;
  }
}

// Posición de "hoy" dentro de los días (los primeros 7 son días pasados)
function posicionDeHoy(clima) {
  return clima.daily.time.indexOf(fechaDeHoy(0));
}

function nombresDeLotes() {
  let cultivos = leerLista("cultivos");
  let nombres = cultivos.filter(function (c) { return c.habilitado; }).map(function (c) { return c.nombre; });
  return nombres.length > 0 ? nombres : ["Lote 1", "Lote 2", "Lote 3"];
}

function filaClima(color, titulo, detalle, derecha) {
  return `
    <div class="tarjeta p-3 rounded-4 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-3">
        <span class="punto_${color}_pequeno"></span>
        <div>
          <strong class="d-block">${titulo}</strong>
          <span class="texto_gris small">${detalle}</span>
        </div>
      </div>
      ${derecha}
    </div>`;
}

// ================== RIESGO DE PLAGAS ==================
// Cada plaga se ve favorecida por cierto clima (según la humedad y temperatura de hoy)
function calcularRiesgos(clima) {
  let hoy = posicionDeHoy(clima);
  let humedad = clima.daily.relative_humidity_2m_mean[hoy];
  let maxima = clima.daily.temperature_2m_max[hoy];
  let lluvia = clima.daily.precipitation_sum[hoy];
  let lotes = nombresDeLotes();

  function nivel(puntos) {
    if (puntos >= 2) return { texto: "Riesgo alto", color: "rojo", clase: "text-danger" };
    if (puntos === 1) return { texto: "Riesgo medio", color: "amarillo", clase: "text-warning" };
    return { texto: "Riesgo bajo", color: "verde", clase: "text-success" };
  }

  return [
    { plaga: "Roya del café", causa: "Humedad " + Math.round(humedad) + "%", lote: lotes[0], nivel: nivel((humedad > 70 ? 1 : 0) + (humedad > 85 ? 1 : 0)) },
    { plaga: "Gusano cogollero", causa: "Máxima de " + Math.round(maxima) + "°C", lote: lotes[2 % lotes.length], nivel: nivel((maxima >= 22 ? 1 : 0) + (maxima >= 27 ? 1 : 0)) },
    { plaga: "Pulgón", causa: lluvia < 1 ? "Clima seco" : "Lluvia " + lluvia + "mm", lote: lotes[1 % lotes.length], nivel: nivel((lluvia < 1 ? 1 : 0) + (lluvia < 1 && maxima >= 25 ? 1 : 0)) }
  ];
}

// ================== ALERTAS DE TEMPORADA ==================
// Temporadas de Colombia: lluvias en abril-mayo y octubre-noviembre, secas el resto
function calcularTemporadas(clima) {
  let mes = new Date().getMonth();
  let lluvias = [3, 4, 9, 10].includes(mes);
  let proximasLluvias = [2, 8].includes(mes);
  let hoy = posicionDeHoy(clima);
  let minimaSemana = Math.min.apply(null, clima.daily.temperature_2m_min.slice(hoy, hoy + 5));

  return [
    { titulo: "Temporada de lluvias", detalle: "Riesgo de encharcamiento • revisar drenajes", estado: lluvias ? "Activa" : (proximasLluvias ? "Próxima" : "Inactiva"), color: lluvias ? "verde" : "amarillo", clase: lluvias ? "text-success" : "text-warning" },
    { titulo: "Temporada seca", detalle: "Reducir pérdidas de agua y ajustar el riego", estado: lluvias ? "Próxima" : "Activa", color: lluvias ? "amarillo" : "verde", clase: lluvias ? "text-warning" : "text-success" },
    { titulo: "Heladas", detalle: "Mínima de la semana: " + Math.round(minimaSemana) + "°C", estado: minimaSemana <= 3 ? "Alerta" : "Vigilancia", color: "rojo", clase: "text-danger" }
  ];
}

// ================== PANTALLA PRINCIPAL ==================
function mostrarClimaPrincipal(clima) {
  let actual = describirClima(clima.current.weather_code);
  let hora = new Date().getHours();
  let ahoraClima = describirClima(clima.current.weather_code, hora < 6 || hora >= 18);
  document.getElementById("climaTemp").innerHTML = ahoraClima.icono + " " + Math.round(clima.current.temperature_2m) + "°C";
  document.getElementById("climaDesc").textContent = actual.texto + " • Humedad " + clima.current.relative_humidity_2m + "%";

  // las próximas 5 horas desde la hora actual
  let ahora = new Date().getHours();
  let inicio = clima.hourly.time.indexOf(fechaDeHoy(0) + "T" + String(ahora).padStart(2, "0") + ":00");
  let html = "";

  for (let i = inicio + 1; i <= inicio + 5; i++) {
    let hora = Number(clima.hourly.time[i].slice(11, 13));
    let texto = hora === 0 ? "12am" : hora < 12 ? hora + "am" : hora === 12 ? "12pm" : (hora - 12) + "pm";
    html += `
      <div class="hora-item">
        <span class="texto_gris small">${texto}</span>
        <span class="fs-4">${describirClima(clima.hourly.weather_code[i], hora < 6 || hora >= 18).icono}</span>
        <span class="fw-semibold small">${Math.round(clima.hourly.temperature_2m[i])}°</span>
      </div>`;
  }
  document.getElementById("climaHoras").innerHTML = html;

  // pronóstico de 5 días desde hoy
  let hoy = posicionDeHoy(clima);
  html = "";
  for (let i = hoy; i < hoy + 5; i++) {
    let fecha = new Date(clima.daily.time[i] + "T00:00:00");
    let nombre = i === hoy ? "Hoy" : i === hoy + 1 ? "Mañana" : DIAS_SEMANA[fecha.getDay()];
    html += `
      <div class="dia-row">
        <span class="dia-nombre">${nombre}</span>
        <span class="fs-5">${describirClima(clima.daily.weather_code[i]).icono}</span>
        <span><small class="texto_gris me-2">${Math.round(clima.daily.temperature_2m_min[i])}°</small><strong>${Math.round(clima.daily.temperature_2m_max[i])}°</strong></span>
      </div>`;
  }
  document.getElementById("climaDias").innerHTML = html;

  // alertas rápidas de los próximos días
  let alertas = [];
  let lotes = nombresDeLotes();
  for (let i = hoy; i < hoy + 3; i++) {
    if (clima.daily.precipitation_sum[i] >= 10) {
      alertas.push("Lluvia fuerte (" + Math.round(clima.daily.precipitation_sum[i]) + "mm) prevista " + (i === hoy ? "hoy" : "el " + DIAS_SEMANA[new Date(clima.daily.time[i] + "T00:00:00").getDay()].toLowerCase()));
    }
  }
  if (clima.current.relative_humidity_2m >= 80) {
    alertas.push("Humedad alta en " + lotes[0]);
  }
  if (alertas.length === 0) {
    alertas.push("Sin alertas para los próximos días");
  }
  document.getElementById("climaAlertas").innerHTML = alertas.map(function (a) {
    return '<p class="mb-1">• ' + a + "</p>";
  }).join("");

  // contadores de los accesos
  let amenazas = calcularRiesgos(clima).filter(function (r) { return r.nivel.color !== "verde"; }).length;
  document.getElementById("contadorAmenazas").textContent = amenazas + " amenazas activas";
  document.getElementById("contadorEventos").textContent = eventosProximos().length + " eventos próximos";
}

// ================== CALENDARIO ==================
function eventosCalendarioDeEjemplo() {
  return [
    { fecha: fechaDeHoy(-5), titulo: "Fumigación Lote 2" },
    { fecha: fechaDeHoy(-10), titulo: "Cosecha Lote 1" }
  ];
}

function eventosProximos() {
  return obtenerLista(CLAVE_EVENTOS_CAL, eventosCalendarioDeEjemplo())
    .filter(function (e) { return e.fecha >= fechaDeHoy(0); })
    .sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
}

function mostrarCalendario() {
  let hoy = new Date();
  let anio = hoy.getFullYear();
  let mes = hoy.getMonth();
  let eventos = obtenerLista(CLAVE_EVENTOS_CAL, eventosCalendarioDeEjemplo());

  document.getElementById("calMes").textContent = MESES[mes] + " " + anio + " • toca un día para agregar un evento";

  // el calendario empieza en lunes: se dejan casillas vacías antes del día 1
  let primerDia = (new Date(anio, mes, 1).getDay() + 6) % 7;
  let diasDelMes = new Date(anio, mes + 1, 0).getDate();
  let html = "";

  for (let i = 0; i < primerDia; i++) {
    html += "<span></span>";
  }

  for (let dia = 1; dia <= diasDelMes; dia++) {
    let fecha = anio + "-" + String(mes + 1).padStart(2, "0") + "-" + String(dia).padStart(2, "0");
    let tieneEvento = eventos.some(function (e) { return e.fecha === fecha; });
    let clase = "cal-day" + (tieneEvento ? " cal-day--event" : "");
    let estilo = dia === hoy.getDate() ? ' style="outline: 2px solid var(--green-primary);"' : "";
    html += `<span class="${clase}" data-fecha="${fecha}"${estilo} role="button">${dia}</span>`;
  }

  let grilla = document.getElementById("calDias");
  grilla.innerHTML = html;

  // la lista de próximos eventos
  let proximos = eventosProximos();
  let lista = "";
  for (let i = 0; i < proximos.length; i++) {
    let partes = proximos[i].fecha.split("-");
    lista += `
      <div class="tarjeta p-3 rounded-4 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <span class="punto_azul_pequeno"></span>
          <strong>${textoSeguro(proximos[i].titulo)}</strong>
        </div>
        <span class="texto_gris small">${Number(partes[2])} ${MESES[Number(partes[1]) - 1].slice(0, 3)}</span>
      </div>`;
  }
  document.getElementById("listaEventos").innerHTML = lista || '<p class="texto_gris small">No hay eventos próximos.</p>';
}

function activarCalendario() {
  if (document.getElementById("calDias") === null) {
    return;
  }

  mostrarCalendario();

  // al tocar un día se puede agregar un evento
  document.getElementById("calDias").addEventListener("click", function (evento) {
    let dia = evento.target.closest(".cal-day");

    if (dia === null) {
      return;
    }

    if (typeof puedeModificar === "function" && !puedeModificar("clima")) {
      alert("El dueño de la propiedad no te dio permiso para agregar eventos al calendario.");
      return;
    }

    let titulo = prompt("Evento para el " + fechaBonita(dia.dataset.fecha) + " (ej. Fumigación Lote 2):");

    if (titulo === null || titulo.trim() === "") {
      return;
    }

    let eventos = obtenerLista(CLAVE_EVENTOS_CAL, eventosCalendarioDeEjemplo());
    eventos.push({ fecha: dia.dataset.fecha, titulo: titulo.trim() });
    guardarLista(CLAVE_EVENTOS_CAL, eventos);
    registrarEvento("Evento agendado", titulo.trim() + " - " + fechaBonita(dia.dataset.fecha), "cultivos", "bi-calendar-event", "info");
    mostrarCalendario();
  });
}

// Notificaciones del clima de hoy: humedad alta (según Configuración de alertas) y heladas
function revisarAlertasDeClima(clima) {
  if (!alertaActiva("alertaClima") || !clima.current) {
    return;
  }

  let humedadMaxima = valorDeAlerta("humedadMaxima", 80);
  let hoy = posicionDeHoy(clima);

  if (clima.current.relative_humidity_2m > humedadMaxima) {
    crearNotificacion("Alerta climática", "Humedad de " + clima.current.relative_humidity_2m + "% en " + nombrePropiedadActual() + " (tu límite es " + humedadMaxima + "%)", "humedad_" + fechaDeHoy(0));
  }

  if (clima.daily.temperature_2m_min[hoy] <= 3) {
    crearNotificacion("Alerta climática", "Se espera helada hoy: mínima de " + Math.round(clima.daily.temperature_2m_min[hoy]) + "°C", "helada_" + fechaDeHoy(0));
  }
}

// Aviso arriba del contenido cuando la propiedad no tiene coordenadas
function avisoSinCoordenadas() {
  let principal = document.querySelector("main");
  let encabezado = principal ? principal.querySelector("header") : null;

  if (encabezado === null) {
    return;
  }

  let aviso = document.createElement("div");
  aviso.className = "tarjeta p-3 rounded-4 mb-3";
  aviso.style.borderColor = "rgba(234, 179, 8, 0.6)";
  aviso.innerHTML = '<strong class="d-block text-warning"><i class="bi bi-geo-alt me-1"></i>Falta la ubicación de ' + textoSeguro(nombrePropiedadActual()) + '</strong>' +
    '<span class="small texto_gris d-block mb-2">Para mostrar el clima real necesitamos las coordenadas de la propiedad. Lo que ves abajo es solo de ejemplo.</span>' +
    '<a href="../propiedad/editar-propiedad.html?id=' + idPropiedadActual() + '" class="btn-agro-sm">Agregar coordenadas</a>';
  encabezado.after(aviso);
}

// ================== PLAGAS POR TEMPORADA Y TIPO DE CULTIVO ==================
// En lluvias se favorecen hongos y bacterias; en tiempo seco, insectos y ácaros.
const PLAGAS_DE_TEMPORADA = { lluviosa: ["Hongo", "Bacteria"], seca: ["Insecto", "Ácaro"] };

function mostrarPlagasDeTemporada() {
  let caja = document.getElementById("listaPlagasTemporada");

  if (caja === null || typeof catalogo === "undefined" || typeof guiaDelCultivo !== "function") {
    return;
  }

  let temporada = temporadaActual();
  let favorecidas = PLAGAS_DE_TEMPORADA[temporada];
  let cultivos = leerLista("cultivos").filter(function (c) { return c.habilitado; });
  let html = "";

  document.getElementById("tituloPlagasTemporada").textContent = "Plagas a vigilar en " + NOMBRES_TEMPORADA[temporada].toLowerCase();

  for (let i = 0; i < cultivos.length; i++) {
    let guia = guiaDelCultivo(cultivos[i]);

    // plagas del cultivo (según la guía y el catálogo) que la temporada favorece
    let plagas = catalogo.filter(function (p) {
      let delCultivo = guia.plagas.includes(p.nombre) || textoSinTildes(p.cultivo).includes(textoSinTildes(guia.nombre));
      return delCultivo && favorecidas.includes(p.tipo);
    });

    for (let j = 0; j < plagas.length; j++) {
      let color = plagas[j].riesgo === "Alto" ? "rojo" : plagas[j].riesgo === "Medio" ? "amarillo" : "verde";
      html += filaClima(color, textoSeguro(plagas[j].nombre) + " • " + textoSeguro(cultivos[i].nombre),
        plagas[j].tipo + " favorecido por la " + NOMBRES_TEMPORADA[temporada].toLowerCase() + ". " + textoSeguro(plagas[j].control),
        `<span class="${color === "rojo" ? "text-danger" : color === "amarillo" ? "text-warning" : "text-success"} fw-semibold small text-nowrap">Riesgo ${plagas[j].riesgo.toLowerCase()}</span>`);

      if (alertaActiva("alertaPlagas")) {
        crearNotificacion("Plaga de temporada", "Vigila " + plagas[j].nombre + " en " + cultivos[i].nombre + " (" + NOMBRES_TEMPORADA[temporada].toLowerCase() + ")", "temporada_" + idPropiedadActual() + "_" + cultivos[i].id + "_" + plagas[j].nombre + "_" + temporada);
      }
    }
  }

  caja.innerHTML = html || '<p class="texto_gris small">' + (cultivos.length === 0 ? "Registra cultivos para ver qué plagas vigilar en esta temporada." : "Ninguno de tus cultivos tiene plagas favorecidas por esta temporada.") + "</p>";
}

// ================== ARRANQUE ==================
async function iniciarClima() {
  activarCalendario();
  mostrarPlagasDeTemporada();

  let necesitaClima = document.getElementById("climaTemp") || document.getElementById("listaRiesgos") ||
    document.getElementById("listaTemporadas") || document.getElementById("listaHistorialClima");

  if (!necesitaClima) {
    return;
  }

  let clima = await obtenerClima();

  // la propiedad no tiene coordenadas: se pide agregarlas
  if (coordenadasDeLaPropiedad() === null) {
    avisoSinCoordenadas();
    return;
  }

  // sin internet y sin nada guardado: se deja lo que trae el HTML
  if (clima === null || !clima.daily) {
    return;
  }

  revisarAlertasDeClima(clima);

  if (document.getElementById("climaTemp") !== null) {
    mostrarClimaPrincipal(clima);
  }

  let riesgos = document.getElementById("listaRiesgos");
  if (riesgos !== null) {
    riesgos.innerHTML = calcularRiesgos(clima).map(function (r) {
      return filaClima(r.nivel.color, r.plaga, r.causa + " • " + textoSeguro(r.lote), `<span class="${r.nivel.clase} fw-semibold small">${r.nivel.texto}</span>`);
    }).join("");
  }

  let temporadas = document.getElementById("listaTemporadas");
  if (temporadas !== null) {
    temporadas.innerHTML = calcularTemporadas(clima).map(function (t) {
      return filaClima(t.color, t.titulo, t.detalle, `<span class="${t.clase} fw-semibold small">${t.estado}</span>`);
    }).join("");
  }

  // historial: los 7 días anteriores a hoy, del más reciente al más viejo
  let historial = document.getElementById("listaHistorialClima");
  if (historial !== null) {
    activarGraficasClima(clima);
  }
}

// ================== GRÁFICAS DE TENDENCIA ==================
// Dibuja con SVG (sin librerías) la temperatura, la humedad y la lluvia de los últimos días
const ANCHO_GRAFICA = 600;
const ALTO_GRAFICA = 180;

// Gráfica de líneas. series: [{ valores, color }]
function graficaDeLineas(fechas, series, unidad) {
  let todos = [];
  series.forEach(function (s) { todos = todos.concat(s.valores.filter(function (v) { return v !== null; })); });
  let minimo = Math.floor(Math.min.apply(null, todos)) - 1;
  let maximo = Math.ceil(Math.max.apply(null, todos)) + 1;
  let x = function (i) { return 40 + i * (ANCHO_GRAFICA - 50) / Math.max(1, fechas.length - 1); };
  let y = function (v) { return 10 + (maximo - v) * (ALTO_GRAFICA - 40) / Math.max(1, maximo - minimo); };

  let svg = '<svg viewBox="0 0 ' + ANCHO_GRAFICA + " " + ALTO_GRAFICA + '" width="100%" role="img" aria-label="Gráfica">';

  // líneas guía con su valor
  for (let k = 0; k <= 3; k++) {
    let valor = minimo + (maximo - minimo) * k / 3;
    svg += '<line x1="40" x2="' + (ANCHO_GRAFICA - 10) + '" y1="' + y(valor) + '" y2="' + y(valor) + '" stroke="rgba(255,255,255,0.1)"/>';
    svg += '<text x="34" y="' + (y(valor) + 4) + '" fill="#9ca3af" font-size="11" text-anchor="end">' + Math.round(valor) + unidad + "</text>";
  }

  // fechas abajo (algunas, para que no se amontonen)
  let paso = Math.ceil(fechas.length / 7);
  for (let i = 0; i < fechas.length; i += paso) {
    svg += '<text x="' + x(i) + '" y="' + (ALTO_GRAFICA - 8) + '" fill="#9ca3af" font-size="11" text-anchor="middle">' + fechas[i] + "</text>";
  }

  series.forEach(function (s) {
    let puntos = s.valores.map(function (v, i) { return v === null ? null : x(i) + "," + y(v); }).filter(Boolean).join(" ");
    svg += '<polyline points="' + puntos + '" fill="none" stroke="' + s.color + '" stroke-width="2.5" stroke-linejoin="round"/>';
    s.valores.forEach(function (v, i) {
      if (v !== null) {
        svg += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3" fill="' + s.color + '"><title>' + fechas[i] + ": " + v + unidad + "</title></circle>";
      }
    });
  });

  return svg + "</svg>";
}

// Gráfica de barras (lluvia)
function graficaDeBarras(fechas, valores, color) {
  let maximo = Math.max.apply(null, valores.concat([5]));
  let ancho = (ANCHO_GRAFICA - 50) / fechas.length;
  let svg = '<svg viewBox="0 0 ' + ANCHO_GRAFICA + " " + ALTO_GRAFICA + '" width="100%" role="img" aria-label="Lluvia por día">';

  for (let k = 0; k <= 3; k++) {
    let valor = maximo * k / 3;
    let yv = ALTO_GRAFICA - 30 - (valor / maximo) * (ALTO_GRAFICA - 40);
    svg += '<line x1="40" x2="' + (ANCHO_GRAFICA - 10) + '" y1="' + yv + '" y2="' + yv + '" stroke="rgba(255,255,255,0.1)"/>';
    svg += '<text x="34" y="' + (yv + 4) + '" fill="#9ca3af" font-size="11" text-anchor="end">' + Math.round(valor) + "</text>";
  }

  let paso = Math.ceil(fechas.length / 7);
  for (let i = 0; i < fechas.length; i++) {
    let alto = (valores[i] / maximo) * (ALTO_GRAFICA - 40);
    let xb = 40 + i * ancho + ancho * 0.15;
    svg += '<rect x="' + xb + '" y="' + (ALTO_GRAFICA - 30 - alto) + '" width="' + (ancho * 0.7) + '" height="' + alto + '" rx="2" fill="' + color + '"><title>' + fechas[i] + ": " + valores[i] + " mm</title></rect>";
    if (i % paso === 0) {
      svg += '<text x="' + (xb + ancho * 0.35) + '" y="' + (ALTO_GRAFICA - 8) + '" fill="#9ca3af" font-size="11" text-anchor="middle">' + fechas[i] + "</text>";
    }
  }

  return svg + "</svg>";
}

function activarGraficasClima(clima) {
  let botones = document.querySelectorAll("#rangoClima button");

  function dibujar(dias) {
    let hoy = posicionDeHoy(clima);
    let desde = Math.max(0, hoy - dias);
    let indices = [];
    for (let i = desde; i < hoy; i++) {
      indices.push(i);
    }

    let fechas = indices.map(function (i) {
      let f = new Date(clima.daily.time[i] + "T00:00:00");
      return f.getDate() + "/" + (f.getMonth() + 1);
    });
    let tomar = function (lista) { return indices.map(function (i) { return lista[i] === null ? null : Math.round(lista[i] * 10) / 10; }); };
    let lluvia = tomar(clima.daily.precipitation_sum).map(function (v) { return v || 0; });

    document.getElementById("graficaTemperatura").innerHTML = graficaDeLineas(fechas, [
      { valores: tomar(clima.daily.temperature_2m_max), color: "#f97316" },
      { valores: tomar(clima.daily.temperature_2m_min), color: "#38bdf8" }
    ], "°");
    document.getElementById("graficaHumedad").innerHTML = graficaDeLineas(fechas, [{ valores: tomar(clima.daily.relative_humidity_2m_mean), color: "#22c55e" }], "%");
    document.getElementById("graficaLluvia").innerHTML = graficaDeBarras(fechas, lluvia, "#38bdf8");

    let total = Math.round(lluvia.reduce(function (a, b) { return a + b; }, 0));
    let conLluvia = lluvia.filter(function (v) { return v > 0; }).length;
    document.getElementById("resumenLluvia").textContent = "Total: " + total + " mm en los últimos " + dias + " días • llovió " + conLluvia + " día(s)";

    // la lista de días también sigue el rango elegido (del más reciente al más viejo)
    let html = "";
    for (let i = hoy - 1; i >= desde; i--) {
      let fecha = new Date(clima.daily.time[i] + "T00:00:00");
      let mm = clima.daily.precipitation_sum[i];
      let detalle = describirClima(clima.daily.weather_code[i]).texto + " • " + (mm > 0 ? "Lluvia " + mm + "mm" : "Sin lluvia");
      html += filaClima(mm > 10 ? "azul" : "verde", fecha.getDate() + " " + MESES[fecha.getMonth()].slice(0, 3) + " " + fecha.getFullYear(), detalle, '<span class="fw-bold">' + Math.round(clima.daily.temperature_2m_max[i]) + "°C</span>");
    }
    document.getElementById("listaHistorialClima").innerHTML = html;
  }

  for (let i = 0; i < botones.length; i++) {
    botones[i].addEventListener("click", function () {
      for (let j = 0; j < botones.length; j++) {
        botones[j].className = "chip";
      }
      botones[i].className = "chip-activo";
      dibujar(Number(botones[i].dataset.dias));
    });
  }

  dibujar(7);
}

iniciarClima();
