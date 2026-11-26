// terreno.js
// Lógica de las pantallas de Terreno. Los datos se guardan en localStorage (comun.js).

const CLAVE_TERRENOS = "terrenos";
const CLAVE_HISTORIAL_TERRENOS = "historialTerrenos";

function terrenosDeEjemplo() {
  return [
    { id: 1, nombre: "Terreno 1", etapa: "Floración", zona: "Sur", ubicacion: "Finca el Manantial", area: 2.4, suelo: "limoso", fuente: "rio", caudal: 120, habilitado: true },
    { id: 2, nombre: "Terreno de Café", etapa: "Maduración", zona: "Casa", ubicacion: "Finca el Manantial", area: 1.8, suelo: "arcilloso", fuente: "pozo", caudal: 80, habilitado: true },
    { id: 3, nombre: "Terreno loma", etapa: "Siembra", zona: "Norte", ubicacion: "Finca el Manantial", area: 1.2, suelo: "mixto", fuente: "acueducto", caudal: 60, habilitado: true },
    { id: 4, nombre: "Vacío", etapa: "----", zona: "Norte", ubicacion: "Finca el Manantial", area: 0.5, suelo: "arenoso", fuente: "rio", caudal: 0, habilitado: true },
    { id: 5, nombre: "Terreno huerta", etapa: "Crecimiento", zona: "Casa", ubicacion: "Finca el Manantial", area: 1, suelo: "arcilloso", fuente: "acueducto", caudal: 40, habilitado: true }
  ];
}

function historialTerrenosDeEjemplo() {
  return [
    { nombre: "Lote 2 - Maíz", detalle: "Área actualizada: 2.4 ha", color: "verde", fecha: "2026-08-15" },
    { nombre: "Lote 1 - Café", detalle: "Fuente de agua asociada", color: "azul", fecha: "2026-08-03" },
    { nombre: "Lote 3 - Fríjol", detalle: "Tipo de suelo registrado: Franco", color: "amarillo", fecha: "2026-07-28" },
    { nombre: "Lote 2 - Maíz", detalle: "Parcela creada", color: "verde", fecha: "2026-01-12" }
  ];
}

function obtenerTerrenos() {
  return obtenerLista(CLAVE_TERRENOS, terrenosDeEjemplo());
}

// Anota un cambio en el historial de terrenos (y en el historial general)
function anotarCambioTerreno(nombre, detalle, color) {
  let historial = obtenerLista(CLAVE_HISTORIAL_TERRENOS, historialTerrenosDeEjemplo());
  historial.unshift({ nombre: nombre, detalle: detalle, color: color, fecha: fechaDeHoy(0) });
  guardarLista(CLAVE_HISTORIAL_TERRENOS, historial);

  let colores = { verde: "success", azul: "info", amarillo: "success", rojo: "danger" };
  registrarEvento("Terreno: " + nombre, detalle, "inventario", "bi-geo-alt", colores[color]);
}

// La etapa de un terreno es la del cultivo que tenga sembrado.
// Si todavía no se han registrado cultivos se usa la etapa guardada en el terreno.
function etapaDelTerreno(terreno, cultivos) {
  if (cultivos.length === 0) {
    return terreno.etapa;
  }

  for (let i = 0; i < cultivos.length; i++) {
    if (cultivos[i].habilitado && cultivos[i].terreno === terreno.nombre) {
      return cultivos[i].etapa;
    }
  }

  return "Sin cultivo";
}

// ================== LISTA DE TERRENOS ==================
function mostrarTerrenos() {
  let contenedor = document.getElementById("listaTerrenos");

  if (contenedor === null) {
    return;
  }

  let lista = obtenerTerrenos().filter(function (t) { return t.habilitado; });
  let cultivos = leerLista("cultivos");
  let html = "";

  for (let i = 0; i < lista.length; i++) {
    let t = lista[i];
    let etapa = etapaDelTerreno(t, cultivos);
    html += `
      <div class="tarjeta p-3 rounded-4 d-flex justify-content-between align-items-center tarjeta-buscable">
        <div>
          <strong class="d-block">${textoSeguro(t.nombre)}</strong>
          <span class="texto_gris small">Etapa: ${textoSeguro(etapa)}</span>
        </div>
        <div class="d-flex align-items-center gap-3">
          <span class="badge-zona badge-zona--${t.zona.toLowerCase()}">${textoSeguro(t.zona)}</span>
          <a href="editar-terreno.html?id=${t.id}" class="text-success fs-5" aria-label="Editar ${textoSeguro(t.nombre)}">
            <i class="bi bi-pencil-square"></i>
          </a>
        </div>
      </div>`;
  }

  if (lista.length === 0) {
    html = '<p class="texto_gris">No hay terrenos registrados.</p>';
  }

  contenedor.innerHTML = html;
  activarBuscadorDeLista("buscadorTerrenos", ".tarjeta-buscable");
}

// ================== FORMULARIO (nuevo y editar) ==================

// Botones "Actual" y "Usar mi ubicación actual": piden la ubicación al navegador
function activarUbicacion(idCampo) {
  let campo = document.getElementById(idCampo);
  let botones = document.querySelectorAll(".boton-ubicacion");

  for (let i = 0; i < botones.length; i++) {
    botones[i].addEventListener("click", function () {
      if (!navigator.geolocation) {
        alert("Tu navegador no permite obtener la ubicación");
        return;
      }

      campo.value = "Buscando ubicación...";

      navigator.geolocation.getCurrentPosition(function (posicion) {
        campo.value = posicion.coords.latitude.toFixed(5) + ", " + posicion.coords.longitude.toFixed(5);
      }, function () {
        campo.value = "";
        alert("No se pudo obtener la ubicación. Revisa los permisos del navegador.");
      });
    });
  }
}

// Botón "Asociar fuente": solo confirma qué fuente quedó elegida
function activarAsociarFuente(formulario, idCaudal) {
  let boton = formulario.querySelector(".boton-asociar");

  boton.addEventListener("click", function () {
    let fuente = formulario.querySelector('input[name="fuenteHidrica"]:checked');
    let nombre = formulario.querySelector('label[for="' + fuente.id + '"]').textContent;
    let caudal = document.getElementById(idCaudal).value;

    boton.textContent = "Fuente asociada: " + nombre + " (" + caudal + " L/min)";
  });
}

// Lee los datos del formulario. Devuelve null si algo está mal.
function leerTerreno(formulario, ids) {
  let nombre = document.getElementById(ids.nombre).value.trim();
  let area = parseFloat(document.getElementById(ids.area).value);
  let suelo = document.getElementById(ids.suelo).value;

  if (nombre.length < 3) {
    alert("El nombre del terreno debe tener mínimo 3 letras");
    return null;
  }

  if (isNaN(area) || area <= 0) {
    alert("Escribe el área en hectáreas, por ejemplo 2.5");
    return null;
  }

  if (suelo === "") {
    alert("Selecciona el tipo de suelo");
    return null;
  }

  return {
    nombre: nombre,
    ubicacion: document.getElementById(ids.ubicacion).value.trim(),
    area: area,
    suelo: suelo,
    usoAnterior: document.getElementById(ids.usoAnterior).value.trim(),
    zona: document.getElementById(ids.zona).value,
    fuente: formulario.querySelector('input[name="fuenteHidrica"]:checked').value,
    caudal: Number(document.getElementById(ids.caudal).value)
  };
}

function activarNuevoTerreno() {
  let formulario = document.getElementById("formNuevoTerreno");

  if (formulario === null) {
    return;
  }

  let ids = { nombre: "nombreTerreno", ubicacion: "ubicacionTerreno", area: "areaTerreno", suelo: "tipoSuelo", caudal: "caudalEstimado", zona: "zonaTerreno", usoAnterior: "usoAnterior" };
  activarUbicacion(ids.ubicacion);
  activarAsociarFuente(formulario, ids.caudal);

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let datos = leerTerreno(formulario, ids);

    if (datos === null) {
      return;
    }

    let lista = obtenerTerrenos();
    datos.id = nuevoId(lista);
    datos.etapa = "Sin cultivo";
    datos.habilitado = true;
    lista.push(datos);

    guardarLista(CLAVE_TERRENOS, lista);
    anotarCambioTerreno(datos.nombre, "Parcela creada", "verde");
    window.location.href = "terreno.html?mensaje=guardado";
  });
}

function activarEditarTerreno() {
  let formulario = document.getElementById("formEditarTerreno");

  if (formulario === null) {
    return;
  }

  let lista = obtenerTerrenos();
  let habilitados = lista.filter(function (t) { return t.habilitado; });

  if (pedirElegir("¿Qué terreno quieres editar?", habilitados.map(function (t) { return { id: t.id, nombre: t.nombre, detalle: t.area + " ha • Zona " + t.zona }; }), "terreno.html")) {
    return;
  }

  let terreno = buscarPorId(habilitados, idDeLaDireccion()) || habilitados[0];

  if (terreno === undefined) {
    alert("No hay terrenos registrados todavía");
    window.location.href = "terreno.html";
    return;
  }
  let ids = { nombre: "nombreTerrenoEdit", ubicacion: "ubicacionTerrenoEdit", area: "areaTerrenoEdit", suelo: "tipoSueloEdit", caudal: "caudalEstimadoEdit", zona: "zonaTerrenoEdit", usoAnterior: "usoAnteriorEdit" };

  // llenamos el formulario con lo guardado
  document.getElementById(ids.nombre).value = terreno.nombre;
  document.getElementById(ids.ubicacion).value = terreno.ubicacion;
  document.getElementById(ids.area).value = terreno.area;
  document.getElementById(ids.suelo).value = terreno.suelo;
  document.getElementById(ids.caudal).value = terreno.caudal;
  document.getElementById(ids.zona).value = terreno.zona;
  document.getElementById(ids.usoAnterior).value = terreno.usoAnterior || "";

  // cultivos que ya tuvo este terreno (se anotan solos)
  let anteriores = terreno.cultivosAnteriores || [];
  document.getElementById("cultivosAnteriores").innerHTML = anteriores.length === 0 ? "" :
    '<p class="agro-label mb-1">Cultivos que tuvo este terreno</p>' + anteriores.map(function (c) {
      return '<div class="tarjeta p-2 px-3 rounded-3 mb-1 small"><strong>' + textoSeguro(c.cultivo) + "</strong> <span class=\"texto_gris\">• " + fechaBonita(c.desde) + " a " + fechaBonita(c.hasta) + "</span></div>";
    }).join("");
  formulario.querySelector('input[name="fuenteHidrica"][value="' + terreno.fuente + '"]').checked = true;

  activarUbicacion(ids.ubicacion);
  activarAsociarFuente(formulario, ids.caudal);

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let datos = leerTerreno(formulario, ids);

    if (datos === null) {
      return;
    }

    let sembrado = 0;
    let cultivos = leerLista("cultivos");
    for (let i = 0; i < cultivos.length; i++) {
      if (cultivos[i].habilitado && cultivos[i].terreno === terreno.nombre) {
        sembrado += cultivos[i].area;
      }
    }

    if (datos.area < sembrado) {
      alert("El terreno tiene " + sembrado + " ha sembradas: el área no puede ser menor que eso");
      return;
    }

    // si cambia el nombre, los cultivos sembrados siguen apuntando a este terreno
    if (datos.nombre !== terreno.nombre && cultivos.length > 0) {
      for (let i = 0; i < cultivos.length; i++) {
        if (cultivos[i].terreno === terreno.nombre) {
          cultivos[i].terreno = datos.nombre;
        }
      }
      guardarLista("cultivos", cultivos);
    }

    let areaAntes = terreno.area;
    Object.assign(terreno, datos);
    guardarLista(CLAVE_TERRENOS, lista);

    let detalle = areaAntes !== datos.area ? "Área actualizada: " + datos.area + " ha" : "Datos actualizados";
    anotarCambioTerreno(terreno.nombre, detalle, "azul");
    window.location.href = "terreno.html?mensaje=guardado";
  });

  document.getElementById("botonInhabilitarTerreno").addEventListener("click", async function (evento) {
    evento.preventDefault();

    let ocupado = leerLista("cultivos").some(function (c) { return c.habilitado && c.terreno === terreno.nombre; });

    if (ocupado) {
      alert(terreno.nombre + " tiene un cultivo sembrado. Inhabilita primero el cultivo.");
      return;
    }

    if (await preguntar("¿Estás seguro?", "Se va a inhabilitar " + terreno.nombre + ".", "Inhabilitar") === false) {
      return;
    }

    marcarInhabilitado(terreno);
    guardarLista(CLAVE_TERRENOS, lista);
    anotarCambioTerreno(terreno.nombre, "Terreno inhabilitado", "rojo");
    window.location.href = "terreno.html?mensaje=inhabilitado";
  });
}

// ================== HISTORIAL DE TERRENOS ==================
function mostrarHistorialTerrenos() {
  let contenedor = document.getElementById("listaHistorialTerrenos");

  if (contenedor === null) {
    return;
  }

  let meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  let historial = obtenerLista(CLAVE_HISTORIAL_TERRENOS, historialTerrenosDeEjemplo());
  let html = "";

  for (let i = 0; i < historial.length; i++) {
    let h = historial[i];
    let partes = h.fecha.split("-");
    let fecha = partes[2] + " " + meses[Number(partes[1]) - 1] + " " + partes[0];

    html += `
      <div class="tarjeta p-3 rounded-4 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <span class="punto_${h.color}_pequeno"></span>
          <div>
            <strong class="d-block small">${textoSeguro(h.nombre)}</strong>
            <span class="texto_gris" style="font-size: 0.78rem;">${textoSeguro(h.detalle)}</span>
          </div>
        </div>
        <span class="texto_gris small">${fecha}</span>
      </div>`;
  }

  contenedor.innerHTML = html;
}

mostrarTerrenos();
activarNuevoTerreno();
activarEditarTerreno();
mostrarHistorialTerrenos();
