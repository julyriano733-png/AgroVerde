// logo.js
// Pone el logo de Agro Verde en el encabezado de cada pantalla:
// a la izquierda, justo después de la flecha de volver (o al principio si no hay flecha).

function ubicarLogo() {
  let logo = document.querySelector(".logo-app");

  if (logo === null) {
    return;
  }

  // el encabezado de la pantalla
  let encabezado = document.querySelector("main header, .pantalla header, header, .encabezado-logo");

  if (encabezado === null) {
    return;
  }

  let flecha = encabezado.querySelector('[aria-label="Volver"], .btn-back, .btn-volver, .boton_atras, .boton-volver');

  if (flecha !== null) {
    flecha.after(logo);
    return;
  }

  // sin flecha (por ejemplo Inicio): al principio del grupo de la izquierda
  let izquierda = encabezado.firstElementChild;

  if (izquierda !== null && izquierda.tagName === "DIV") {
    izquierda.prepend(logo);
  } else {
    encabezado.prepend(logo);
  }
}

ubicarLogo();
