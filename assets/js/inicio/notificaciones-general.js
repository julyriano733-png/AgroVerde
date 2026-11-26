// notificaciones-general.js
// Lista de notificaciones: se marcan como leídas al darles click

// Crea la tarjeta de una notificación.
// "posicion" es el lugar que ocupa en la lista, así sabemos cuál marcar.
function crearTarjetaNotificacion(notificacion, posicion) {
  let tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta p-3 rounded-4";

  // si ya la leyó se ve apagada, si no, lleva la rayita verde
  if (notificacion.leida === true) {
    tarjeta.className = tarjeta.className + " leida";
  } else {
    tarjeta.className = tarjeta.className + " no_leida";
  }

  let titulo = document.createElement("p");
  titulo.className = "m-0 fw-bold text-white";
  titulo.textContent = notificacion.titulo;

  let detalle = document.createElement("p");
  detalle.className = "m-0 small texto_gris";
  detalle.textContent = notificacion.detalle;

  tarjeta.appendChild(titulo);
  tarjeta.appendChild(detalle);

  // al hacer click se marca como leída
  tarjeta.addEventListener("click", function () {
    let lista = obtenerNotificaciones();
    lista[posicion].leida = true;
    guardarNotificaciones(lista);
    mostrarNotificaciones();
  });

  return tarjeta;
}

// Dibuja toda la lista en la pantalla
function mostrarNotificaciones() {
  // si no hay sesión, protegerPagina nos manda al login y paramos aquí
  if (protegerPagina() === false) {
    return;
  }

  let lista = obtenerNotificaciones();
  let contenedor = document.getElementById("lista-notificaciones");

  // borramos lo que había y la volvemos a dibujar
  contenedor.innerHTML = "";

  for (let i = 0; i < lista.length; i++) {
    contenedor.appendChild(crearTarjetaNotificacion(lista[i], i));
  }

  // texto de arriba que dice cuántas faltan por leer
  let sinLeer = contarSinLeer();
  let resumen = document.getElementById("resumen");

  if (sinLeer === 0) {
    resumen.textContent = "Estás al día";
  } else {
    resumen.textContent = "Tienes " + sinLeer + " sin leer";
  }
}

// ----- botón "Marcar todas como leídas" -----
let botonMarcarTodas = document.getElementById("marcar-todas");

botonMarcarTodas.addEventListener("click", function () {
  let lista = obtenerNotificaciones();

  for (let i = 0; i < lista.length; i++) {
    lista[i].leida = true;
  }

  guardarNotificaciones(lista);
  mostrarNotificaciones();
});

mostrarNotificaciones();