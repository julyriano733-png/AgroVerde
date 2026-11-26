// recuperar-contrasena.js
// Pide el correo y simula el envío del enlace para cambiar la contraseña

let campoCorreo = document.getElementById("correo");
let botonEnviar = document.getElementById("boton-enviar");

botonEnviar.addEventListener("click", function () {
  let correo = campoCorreo.value.trim().toLowerCase();

  // revisamos que haya escrito un correo que tenga forma de correo
  if (correoValido(correo) === false) {
    alert("Escribe un correo válido, por ejemplo tu@correo.com");
    return;
  }

  // Todavía no se envía ningún correo de verdad (eso lo hará la API).
  // Mostramos el mismo mensaje exista o no el correo, así nadie puede
  // averiguar qué correos están registrados.
  alert("Si el correo está registrado, te enviaremos un enlace para restablecer tu contraseña");

  campoCorreo.value = "";
  window.location.href = "iniciar-sesion.html";
});