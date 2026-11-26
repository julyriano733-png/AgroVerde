// iniciar-sesion.js
// Revisa el correo y la contraseña contra los usuarios guardados (comun.js)

let formulario = document.querySelector(".formulario_login");

formulario.addEventListener("submit", function (evento) {
  // primero revisamos los datos, por eso frenamos el envío normal
  evento.preventDefault();

  let correo = document.getElementById("email").value.trim().toLowerCase();
  let contrasena = document.getElementById("password").value;

  if (correoValido(correo) === false) {
    alert("Escribe un correo válido, por ejemplo tu@correo.com");
    return;
  }

  let usuario = buscarUsuario(correo);

  // no decimos cuál de los dos está mal para no dar pistas
  if (usuario === null || contrasenaCorrecta(usuario, contrasena) === false) {
    alert("Correo o contraseña incorrectos");
    return;
  }

  // si era una cuenta de antes con la contraseña sin cifrar, se cifra ahora
  if (!usuario.contrasenaHash) {
    let usuarios = obtenerUsuarios();
    let guardado = usuarios.find(function (u) { return u.correo === usuario.correo; });
    ponerContrasena(guardado, contrasena);
    guardarUsuarios(usuarios);
  }

  // dejamos la sesión iniciada y lo anotamos en el historial
  localStorage.setItem("usuarioActual", correo);
  registrarEvento("Inicio de sesión", usuario.nombre + " accedió al sistema", "sistema", "bi-box-arrow-in-right", "info");

  window.location.href = "../inicio/inicio.html";
});
