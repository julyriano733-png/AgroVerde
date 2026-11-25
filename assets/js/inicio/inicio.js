// inicio.js
// Pantalla principal: saludo, número de notificaciones y historial reciente

// Crea una tarjetica del historial reciente.
// Usamos textContent (y no innerHTML) para que si alguien escribe
// código raro en su nombre, no se ejecute.
function crearTarjetaReciente(evento) {
  let enlace = document.createElement("a");
  enlace.href = "../historial/historial.html";
  enlace.className = "tarjeta d-flex align-items-center mb-2 p-3 rounded-3 text-decoration-none";

  let punto = document.createElement("div");
  punto.className = "punto_rojo me-3";

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

  for (let i = 0; i < historial.length && i < 2; i++) {
    contenedor.appendChild(crearTarjetaReciente(historial[i]));
  }
}

mostrarInicio();