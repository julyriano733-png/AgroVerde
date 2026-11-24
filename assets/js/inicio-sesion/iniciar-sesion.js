// iniciar-sesion.js
// Revisa el correo y la contraseña y deja entrar a la persona

let formulario = document.querySelector(".formulario_login");

formulario.addEventListener("submit", function (evento) {
  // primero revisamos los datos, por eso frenamos el envío normal
  evento.preventDefault();

  let correo = document.getElementById("email").value.trim().toLowerCase();
  let contrasena = document.getElementById("password").value;

  let usuario = buscarUsuario(correo);

  // Damos el mismo mensaje si falla el correo o la contraseña,
  // así nadie puede averiguar qué correos están registrados.
  if (usuario === null || usuario.contrasena !== contrasena) {
    alert("Correo o contraseña incorrectos");
    return;
  }

  // guardamos quién inició sesión y lo anotamos en el historial
  localStorage.setItem("usuarioActual", usuario.correo);
  registrarEvento("Inicio de sesión", usuario.nombre + " accedió al sistema", "sistema", "bi-box-arrow-in-right", "info");

  window.location.href = "../inicio/inicio.html";
});