// confirmacion.js
// Ventana de "Guardado correctamente" / "Inhabilitado correctamente" que comparten todos los módulos.
// Se muestra cuando la página se abre con ?mensaje=... en la dirección, por ejemplo:
//   cultivos.html?mensaje=guardado
//   plagas.html?mensaje=inhabilitada
// No necesita Bootstrap: la ventana se crea aquí mismo.

// Textos según el mensaje que llega en la dirección
function textoDelMensaje(mensaje) {
  if (mensaje === "guardado" || mensaje === "guardada" || mensaje === "modificada") {
    return "Guardado correctamente";
  }

  if (mensaje === "inhabilitado" || mensaje === "inhabilitada") {
    return "Inhabilitado correctamente";
  }

  return null;
}

function mostrarConfirmacion() {
  let parametros = new URLSearchParams(window.location.search);
  let texto = textoDelMensaje(parametros.get("mensaje"));

  if (texto === null) {
    return;
  }

  // si la página no tiene global.css, los estilos los pone comun.js
  if (typeof ponerEstilosVentana === "function") {
    ponerEstilosVentana();
  }

  // fondo oscuro que tapa la pantalla
  let fondo = document.createElement("div");
  fondo.className = "confirmacion-fondo";

  // caja verde con el chulo, el texto y el botón OK
  let caja = document.createElement("div");
  caja.className = "confirmacion-caja";
  caja.setAttribute("role", "dialog");
  caja.setAttribute("aria-modal", "true");

  let icono = document.createElement("div");
  icono.className = "confirmacion-icono";
  icono.textContent = "✔";

  let titulo = document.createElement("h4");
  titulo.className = "confirmacion-titulo";
  titulo.textContent = texto;

  let boton = document.createElement("button");
  boton.type = "button";
  boton.className = "confirmacion-ok";
  boton.textContent = "OK";

  caja.appendChild(icono);
  caja.appendChild(titulo);
  caja.appendChild(boton);
  fondo.appendChild(caja);
  document.body.appendChild(fondo);
  boton.focus();

  // al cerrar quitamos el ?mensaje de la dirección para que no salga otra vez al recargar
  function cerrar() {
    fondo.remove();
    window.history.replaceState(null, "", window.location.pathname);
  }

  boton.addEventListener("click", cerrar);

  fondo.addEventListener("click", function (evento) {
    if (evento.target === fondo) {
      cerrar();
    }
  });
}

mostrarConfirmacion();
