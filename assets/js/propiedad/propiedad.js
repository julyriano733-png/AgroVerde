// propiedad.js
// Lógica de las pantallas de Propiedad. Los datos se guardan en localStorage (comun.js).

const CLAVE_PROPIEDADES = "propiedades";

// Ya no hay propiedades de ejemplo: cada cuenta crea las suyas
function propiedadesDeEjemplo() {
  return [];
}

// La lista de propiedades es de toda la cuenta (no cambia con la propiedad actual)
function propiedadesHabilitadas() {
  return obtenerLista(CLAVE_PROPIEDADES, propiedadesDeEjemplo()).filter(function (p) { return p.habilitado && esMiembro(p); });
}

// La persona con sesión ve una propiedad solo si es miembro de ella
function esMiembro(propiedad) {
  let usuario = typeof obtenerUsuarioActual === "function" ? obtenerUsuarioActual() : null;
  return usuario !== null && Array.isArray(propiedad.miembros) && propiedad.miembros.includes(usuario.correo);
}

// "sur" -> "badge-sur", "Casa" -> "badge-casa"
function claseZona(zona) {
  return "badge-" + zona.toLowerCase();
}

// Los botones de volver de estas pantallas son <button>: regresan a la página anterior
function activarBotonesComunes() {
  // A dónde lleva la flecha de cada pantalla si no hay una página anterior
  let destinos = {
    "crear-propiedad": "ver-propiedad.html",
    "editar-propiedad": "ver-propiedad.html",
    "inhabilitar-propiedad": "ver-propiedad.html",
    "ver-etapa": "ver-propiedad.html",
    "ver-propiedad": "../inicio/inicio.html"
  };

  let volver = document.querySelector(".boton-volver");
  if (volver !== null) {
    volver.addEventListener("click", async function () {
      // primera propiedad: sin ella no se puede usar la app, así que volver es salir de la cuenta
      if (esPrimeraPropiedad()) {
        let salir = await preguntar("¿Estás seguro?", "Sin una propiedad no puedes usar Agro Verde. Vas a salir de tu cuenta; puedes crearla cuando vuelvas a entrar.", "Salir");

        if (salir) {
          localStorage.removeItem("usuarioActual");
          window.location.href = "../inicio-sesion/iniciar-sesion.html";
        }
        return;
      }

      let pagina = window.location.pathname.split("/").pop().replace(".html", "");
      let vieneDeLaApp = document.referrer !== "" && window.history.length > 1;

      if (vieneDeLaApp) {
        window.history.back();
      } else {
        window.location.href = destinos[pagina] || "../inicio/inicio.html";
      }
    });
  }

  let nuevo = document.querySelector(".boton-nuevo");
  if (nuevo !== null) {
    nuevo.addEventListener("click", function () {
      window.location.href = "crear-propiedad.html";
    });
  }

  activarBuscadorDeLista("inputBuscar", ".tarjeta-propiedad");
}

// ================== LISTA DE PROPIEDADES ==================
function mostrarPropiedades() {
  let contenedor = document.getElementById("listaPropiedades");

  // en inhabilitar-propiedad la lista lleva radios, por eso se revisa el título
  if (contenedor === null || document.getElementById("botonInhabilitarPropiedad") !== null) {
    return;
  }

  let lista = propiedadesHabilitadas();
  let html = "";

  for (let i = 0; i < lista.length; i++) {
    let p = lista[i];
    html += `
      <div class="tarjeta-propiedad d-flex align-items-center justify-content-between gap-3 p-3 px-md-4 py-md-3">
        <a href="ver-etapa.html?id=${p.id}" class="flex-grow-1 text-decoration-none">
          <h2 class="nombre-propiedad m-0 fs-5">${textoSeguro(p.nombre)}</h2>
          <span class="tipo-propiedad">${textoSeguro(p.tipo)}${p.id === idPropiedadActual() ? ' • <strong class="text-success">Propiedad actual</strong>' : ""}</span>
        </a>
        <span class="badge-ubicacion ${claseZona(p.zona)} px-4 py-1">${textoSeguro(p.zona)}</span>
        <a href="editar-propiedad.html?id=${p.id}" class="text-success fs-5" aria-label="Editar ${textoSeguro(p.nombre)}" title="Editar propiedad">
          <i class="bi bi-pencil-square"></i>
        </a>
      </div>`;
  }

  contenedor.innerHTML = html || '<p class="texto_gris">No hay propiedades registradas.</p>';

  // el botón rojo de esta pantalla lleva a la pantalla de inhabilitar
  let botonRojo = document.querySelector(".boton-inhabilitar");
  botonRojo.addEventListener("click", function () {
    window.location.href = "inhabilitar-propiedad.html";
  });
}

// ================== COORDENADAS ==================
// Botones para llenar latitud y longitud: buscando la ubicación escrita (Open-Meteo, gratis)
// o con el GPS del dispositivo
function activarCoordenadas() {
  let latitud = document.getElementById("latitudPropiedad");
  let longitud = document.getElementById("longitudPropiedad");
  let ayuda = document.getElementById("ayudaCoordenadas");

  if (latitud === null) {
    return;
  }

  function poner(lat, lon, texto) {
    latitud.value = Number(lat).toFixed(5);
    longitud.value = Number(lon).toFixed(5);
    ayuda.textContent = texto;
    ayuda.style.color = "#22c55e";
  }

  document.getElementById("botonBuscarCoordenadas").addEventListener("click", async function () {
    let ubicacion = document.getElementById("ubicacionPropiedad").value.trim();

    if (ubicacion === "") {
      alert("Primero escribe la ubicación (municipio o vereda), por ejemplo: Sogamoso, Boyacá");
      return;
    }

    ayuda.textContent = "Buscando coordenadas...";
    let resultado = await buscarCoordenadas(ubicacion);

    if (resultado === null) {
      ayuda.textContent = "No se encontró esa ubicación (o no hay internet). Escribe solo el municipio o pon las coordenadas a mano.";
      ayuda.style.color = "#f87171";
      return;
    }

    poner(resultado.latitud, resultado.longitud, "Encontrado: " + resultado.nombre);
  });

  document.getElementById("botonMiUbicacion").addEventListener("click", function () {
    if (!navigator.geolocation) {
      alert("Tu navegador no permite obtener la ubicación");
      return;
    }

    ayuda.textContent = "Obteniendo tu ubicación...";
    navigator.geolocation.getCurrentPosition(function (posicion) {
      poner(posicion.coords.latitude, posicion.coords.longitude, "Ubicación tomada del dispositivo");
    }, function () {
      ayuda.textContent = "No se pudo obtener la ubicación. Revisa los permisos del navegador.";
      ayuda.style.color = "#f87171";
    });
  });
}

// Busca las coordenadas de un lugar escrito ("Sogamoso, Boyacá"). Devuelve null si no lo encuentra.
async function buscarCoordenadas(texto) {
  // la búsqueda funciona mejor solo con el primer nombre (el municipio)
  let nombre = texto.split(",")[0].trim();

  try {
    let respuesta = await fetch("https://geocoding-api.open-meteo.com/v1/search?count=5&language=es&name=" + encodeURIComponent(nombre));
    let datos = await respuesta.json();

    if (!datos.results || datos.results.length === 0) {
      return null;
    }

    // si hay varios con el mismo nombre, se prefiere el de Colombia
    let lugar = datos.results.find(function (r) { return r.country_code === "CO"; }) || datos.results[0];
    return { latitud: lugar.latitude, longitud: lugar.longitude, nombre: lugar.name + (lugar.admin1 ? ", " + lugar.admin1 : "") + ", " + lugar.country };
  } catch (error) {
    return null;
  }
}

// Lee y revisa las coordenadas del formulario. Devuelve null (y avisa) si están mal.
function leerCoordenadas() {
  let latitud = parseFloat(document.getElementById("latitudPropiedad").value);
  let longitud = parseFloat(document.getElementById("longitudPropiedad").value);

  if (isNaN(latitud) || isNaN(longitud)) {
    alert("Faltan las coordenadas. Toca \"Buscar por la ubicación\" o \"Usar mi ubicación actual\".");
    return null;
  }

  if (latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) {
    alert("Las coordenadas no son válidas (latitud entre -90 y 90, longitud entre -180 y 180).");
    return null;
  }

  return { latitud: latitud, longitud: longitud };
}

// ================== CREAR PROPIEDAD ==================
// Viene de crear la cuenta (o no tiene ninguna propiedad todavía)
function esPrimeraPropiedad() {
  return new URLSearchParams(window.location.search).get("primera") === "1";
}

function activarCrearPropiedad() {
  let formulario = document.getElementById("formNuevaPropiedad");

  if (formulario === null) {
    return;
  }

  // primera propiedad: no hay a dónde volver, y se ofrece unirse con un código
  if (esPrimeraPropiedad()) {
    document.querySelector(".titulo-pagina").textContent = "Crea tu propiedad";
    let aviso = document.createElement("p");
    aviso.className = "texto_gris small";
    aviso.style.color = "#9ca3af";
    aviso.innerHTML = 'Para empezar a usar Agro Verde necesitas una propiedad (finca, lote o parcela). ¿Te invitaron? <a href="../inicio/unirse-propiedad.html" style="color: #22c55e;">Únete con un código</a>.';
    formulario.prepend(aviso);
  }

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let nombre = document.getElementById("nombrePropiedad").value.trim();
    let ubicacion = document.getElementById("ubicacionPropiedad").value.trim();

    if (nombre.length < 3) {
      alert("El nombre de la propiedad debe tener mínimo 3 letras");
      return;
    }

    if (ubicacion === "") {
      alert("Escribe la ubicación de la propiedad");
      return;
    }

    let area = Number(document.getElementById("areaPropiedad").value);

    if (isNaN(area) || area <= 0) {
      alert("Escribe el área de la propiedad en hectáreas");
      return;
    }

    let coordenadas = leerCoordenadas();

    if (coordenadas === null) {
      return;
    }

    let lista = obtenerLista(CLAVE_PROPIEDADES, propiedadesDeEjemplo());
    lista.push({
      id: nuevoId(lista),
      nombre: nombre,
      tipo: document.getElementById("tipoPropiedad").value,
      zona: document.getElementById("zonaPropiedad").value,
      ubicacion: ubicacion,
      latitud: coordenadas.latitud,
      longitud: coordenadas.longitud,
      area: area,
      notas: document.getElementById("notasPropiedad").value.trim(),
      miembros: obtenerUsuarioActual() ? [obtenerUsuarioActual().correo] : [],
      dueno: obtenerUsuarioActual() ? obtenerUsuarioActual().correo : "",
      habilitado: true
    });

    guardarLista(CLAVE_PROPIEDADES, lista);
    registrarEvento("Propiedad creada", nombre + " en " + ubicacion, "inventario", "bi-house-add", "success");

    // la propiedad nueva pasa a ser en la que se trabaja
    cambiarPropiedad(lista[lista.length - 1].id);
    window.location.href = esPrimeraPropiedad() ? "../inicio/inicio.html?mensaje=guardado" : "../perfil/perfil.html?mensaje=guardado";
  });
}

// ================== EDITAR PROPIEDAD ==================
function activarEditarPropiedad() {
  let formulario = document.getElementById("formEditarPropiedad");

  if (formulario === null) {
    return;
  }

  let todas = obtenerLista(CLAVE_PROPIEDADES, propiedadesDeEjemplo());
  let visibles = propiedadesHabilitadas();
  if (pedirElegir("¿Qué propiedad quieres editar?", visibles.map(function (p) { return { id: p.id, nombre: p.nombre, detalle: p.tipo + " • " + p.ubicacion }; }), "ver-propiedad.html")) {
    return;
  }

  let propiedad = buscarPorId(visibles, idDeLaDireccion()) || buscarPorId(visibles, idPropiedadActual());

  if (propiedad === null || propiedad === undefined) {
    alert("No se encontró la propiedad");
    window.location.href = "ver-propiedad.html";
    return;
  }

  // se llena el formulario con lo guardado
  document.getElementById("nombrePropiedad").value = propiedad.nombre;
  document.getElementById("tipoPropiedad").value = propiedad.tipo;
  document.getElementById("zonaPropiedad").value = propiedad.zona;
  document.getElementById("areaPropiedad").value = propiedad.area || "";
  document.getElementById("ubicacionPropiedad").value = propiedad.ubicacion;
  document.getElementById("notasPropiedad").value = propiedad.notas || "";
  if (propiedad.latitud !== undefined) {
    document.getElementById("latitudPropiedad").value = propiedad.latitud;
    document.getElementById("longitudPropiedad").value = propiedad.longitud;
  }

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let nombre = document.getElementById("nombrePropiedad").value.trim();
    let ubicacion = document.getElementById("ubicacionPropiedad").value.trim();
    let area = Number(document.getElementById("areaPropiedad").value);

    if (nombre.length < 3) {
      alert("El nombre de la propiedad debe tener mínimo 3 letras");
      return;
    }

    if (ubicacion === "") {
      alert("Escribe la ubicación de la propiedad");
      return;
    }

    if (isNaN(area) || area <= 0) {
      alert("Escribe el área de la propiedad en hectáreas");
      return;
    }

    let coordenadas = leerCoordenadas();

    if (coordenadas === null) {
      return;
    }

    let guardada = buscarPorId(todas, propiedad.id);
    guardada.latitud = coordenadas.latitud;
    guardada.longitud = coordenadas.longitud;
    guardada.nombre = nombre;
    guardada.tipo = document.getElementById("tipoPropiedad").value;
    guardada.zona = document.getElementById("zonaPropiedad").value;
    guardada.area = area;
    guardada.ubicacion = ubicacion;
    guardada.notas = document.getElementById("notasPropiedad").value.trim();

    guardarLista(CLAVE_PROPIEDADES, todas);
    registrarEvento("Propiedad editada", nombre + " en " + ubicacion, "inventario", "bi-pencil-square", "info");
    window.location.href = "ver-propiedad.html?mensaje=guardado";
  });
}

// ================== INHABILITAR PROPIEDAD ==================
function activarInhabilitarPropiedad() {
  let boton = document.getElementById("botonInhabilitarPropiedad");

  if (boton === null) {
    return;
  }

  let lista = propiedadesHabilitadas();
  let html = "";

  for (let i = 0; i < lista.length; i++) {
    let p = lista[i];
    html += `
      <label class="tarjeta-propiedad d-flex align-items-center justify-content-between p-3 px-md-4 py-md-3">
        <div class="d-flex align-items-center gap-3">
          <input type="radio" name="propiedadSeleccionada" value="${p.id}" class="radio-seleccion">
          <div>
            <h2 class="nombre-propiedad m-0 fs-5">${textoSeguro(p.nombre)}</h2>
            <span class="tipo-propiedad">${textoSeguro(p.tipo)}</span>
          </div>
        </div>
        <span class="badge-ubicacion ${claseZona(p.zona)} px-4 py-1">${textoSeguro(p.zona)}</span>
      </label>`;
  }

  document.getElementById("listaPropiedades").innerHTML = html;

  boton.addEventListener("click", async function (evento) {
    evento.preventDefault();

    let elegida = document.querySelector('input[name="propiedadSeleccionada"]:checked');

    if (elegida === null) {
      alert("Selecciona la propiedad que quieres inhabilitar");
      return;
    }

    let todas = obtenerLista(CLAVE_PROPIEDADES, propiedadesDeEjemplo());
    let propiedad = buscarPorId(todas, Number(elegida.value));

    if (propiedad.id === idPropiedadActual()) {
      alert("No puedes inhabilitar la propiedad en la que estás trabajando. Cambia primero a otra propiedad.");
      return;
    }

    if (await preguntar("¿Estás seguro?", "Se va a inhabilitar " + propiedad.nombre + ".", "Inhabilitar") === false) {
      return;
    }

    marcarInhabilitado(propiedad);
    guardarLista(CLAVE_PROPIEDADES, todas);
    registrarEvento("Propiedad inhabilitada", propiedad.nombre, "inventario", "bi-slash-circle", "danger");
    window.location.href = "ver-propiedad.html?mensaje=inhabilitado";
  });
}

// ================== VER ETAPA DE UNA PROPIEDAD ==================
function mostrarEtapa() {
  let titulo = document.getElementById("etapaPropiedad");

  if (titulo === null) {
    return;
  }

  let lista = propiedadesHabilitadas();
  if (pedirElegir("¿Qué propiedad?", lista.map(function (p) { return { id: p.id, nombre: p.nombre, detalle: p.tipo + " • " + p.ubicacion }; }), "ver-propiedad.html")) {
    return;
  }

  let propiedad = buscarPorId(lista, idDeLaDireccion()) || lista[0];

  titulo.textContent = propiedad.nombre;
  document.getElementById("etapaRegion").textContent = propiedad.ubicacion;
  document.getElementById("etapaArea").textContent = propiedad.area ? String(propiedad.area).replace(".", ",") + " ha" : "----";
  document.getElementById("etapaNotas").textContent = propiedad.notas || "Sin descripción.";

  // el primer cultivo sembrado en esa propiedad
  let cultivos = leerListaGeneral(claveDePropiedad("cultivos", propiedad.id)).filter(function (c) { return c.habilitado; });
  let primero = cultivos[0];
  document.getElementById("etapaCultivo").textContent = primero ? primero.nombre : "Sin cultivos";
  document.getElementById("etapaEstado").textContent = primero ? primero.estado : "----";
  document.getElementById("etapaEtapa").textContent = primero ? primero.etapa : "----";

  document.getElementById("botonEditarPropiedad").href = "editar-propiedad.html?id=" + propiedad.id;

  // botón para trabajar en esta propiedad
  let boton = document.getElementById("botonUsarPropiedad");

  if (propiedad.id === idPropiedadActual()) {
    boton.textContent = "Estás trabajando en esta propiedad";
    boton.disabled = true;
    return;
  }

  boton.addEventListener("click", function () {
    cambiarPropiedad(propiedad.id);
    registrarEvento("Cambio de propiedad", "Ahora se trabaja en " + propiedad.nombre, "sistema", "bi-house", "info");
    window.location.href = "../inicio/inicio.html";
  });
}

activarBotonesComunes();
mostrarPropiedades();
activarCoordenadas();
activarCrearPropiedad();
activarEditarPropiedad();
activarInhabilitarPropiedad();
mostrarEtapa();
