// inicio.js
// Pantalla principal: saludo, número de notificaciones y historial reciente

// Crea una tarjetica del historial reciente.
// Usamos textContent (y no innerHTML) para que si alguien escribe
// código raro en su nombre, no se ejecute.
function crearTarjetaReciente(evento) {
  let enlace = document.createElement("a");
  enlace.href = "../historial/historial.html";
  enlace.className = "tarjeta d-flex mb-2 p-2 rounded-3 text-decoration-none";

  let punto = document.createElement("div");
  punto.className = "punto_rojo me-2";

  let cajaTextos = document.createElement("div");

  let titulo = document.createElement("p");
  titulo.className = "m-0 fw-bold";
  titulo.textContent = evento.titulo;

  let detalle = document.createElement("p");
  detalle.className = "m-0 small texto_gris";
  detalle.textContent = evento.detalle;

  cajaTextos.appendChild(titulo);
  cajaTextos.appendChild(detalle);
  enlace.appendChild(punto);
  enlace.appendChild(cajaTextos);

  return enlace;
}

function mostrarInicio() {
  // si no hay sesión, protegerPagina nos manda al login y paramos aquí
  if (protegerPagina() === false) {
    return;
  }

  let usuario = obtenerUsuarioActual();

  // ----- saludo con el nombre y el rol -----
  let saludo = document.getElementById("saludo");
  saludo.textContent = "Hola, " + usuario.nombre + " (" + usuario.rol + ")";

  // ----- numerito rojo de la campanita -----
  let sinLeer = contarSinLeer();
  let contador = document.getElementById("contador-notificaciones");

  if (sinLeer > 0) {
    contador.textContent = sinLeer;
    contador.classList.remove("d-none");
  }

  // ----- historial reciente: solo los 2 eventos más nuevos -----
  let historial = obtenerHistorial();
  let contenedor = document.getElementById("historial-reciente");

  // vaciamos lo que había en el HTML y ponemos los eventos guardados
  contenedor.innerHTML = "";

  for (let i = 0; i < historial.length && i < 2; i++) {
    contenedor.appendChild(crearTarjetaReciente(historial[i]));
  }
}

// Tarjetas de resumen con los datos reales de los módulos
async function mostrarResumen() {
  let cultivos = obtenerCultivos().filter(function (c) { return c.habilitado; });
  document.getElementById("inicioCultivos").textContent = cultivos.length;

  let activas = obtener_plagas().filter(function (p) { return p.habilitada && p.estado !== "Controlada"; });
  document.getElementById("inicioPlagas").textContent = activas.length;

  let clima = await obtenerClima();

  // sin coordenadas o sin internet (y sin nada guardado): no se inventan datos
  if (clima === null || !clima.current) {
    document.getElementById("inicioClima").textContent = coordenadasDeLaPropiedad() === null ? "Agrega las coordenadas de la propiedad" : "Sin datos de clima";
    document.getElementById("inicioHumedad").textContent = "--";
    document.getElementById("inicioRiesgo").textContent = "--";
    return;
  }

  revisarAlertasDeClima(clima);
  let actual = describirClima(clima.current.weather_code);
  document.getElementById("inicioClima").textContent = Math.round(clima.current.temperature_2m) + "°C - " + actual.texto;
  document.getElementById("inicioHumedad").textContent = clima.current.relative_humidity_2m + "%";

  // riesgo de hoy: alto cuenta 100, medio 50 y bajo 10, y se saca el promedio
  let puntos = { rojo: 100, amarillo: 50, verde: 10 };
  let riesgos = calcularRiesgos(clima);
  let total = 0;
  for (let i = 0; i < riesgos.length; i++) {
    total += puntos[riesgos[i].nivel.color];
  }
  document.getElementById("inicioRiesgo").textContent = Math.round(total / riesgos.length) + "%";
}

// Menú del nombre de la finca: lista las propiedades para cambiar de una a otra
function mostrarMenuPropiedades() {
  let menu = document.getElementById("menuPropiedades");
  // las propiedades vienen de propiedad.js
  let propiedades = propiedadesHabilitadas();

  let html = '<li><h6 class="dropdown-header">Cambiar de propiedad</h6></li>';

  for (let i = 0; i < propiedades.length; i++) {
    let actual = propiedades[i].id === idPropiedadActual();
    html += `
      <li>
        <button type="button" class="dropdown-item d-flex justify-content-between gap-3${actual ? " active" : ""}" data-id="${propiedades[i].id}">
          <span>${textoSeguro(propiedades[i].nombre)} <small class="texto_gris">${textoSeguro(propiedades[i].tipo || "")}</small></span>
          ${actual ? '<i class="bi bi-check-lg"></i>' : ""}
        </button>
      </li>`;
  }

  html += '<li><hr class="dropdown-divider"></li><li><a class="dropdown-item" href="../propiedad/ver-propiedad.html"><i class="bi bi-gear me-2"></i>Administrar propiedades</a></li>';
  menu.innerHTML = html;

  menu.addEventListener("click", function (evento) {
    let opcion = evento.target.closest("button[data-id]");

    if (opcion === null || Number(opcion.dataset.id) === idPropiedadActual()) {
      return;
    }

    cambiarPropiedad(Number(opcion.dataset.id));
    registrarEvento("Cambio de propiedad", "Ahora se trabaja en " + nombrePropiedadActual(), "sistema", "bi-house", "info");
    window.location.reload();
  });
}

mostrarInicio();
mostrarMenuPropiedades();
mostrarResumen();