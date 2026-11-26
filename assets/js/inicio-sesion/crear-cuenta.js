// crear-cuenta.js
// Valida los datos del registro y guarda el usuario nuevo

let formulario = document.querySelector(".formulario_cuenta");

formulario.addEventListener("submit", function (evento) {
  // primero revisamos los datos, por eso frenamos el envío normal
  evento.preventDefault();

  // traemos lo que escribió la persona
  let nombre = document.getElementById("usuario").value.trim();
  let correo = document.getElementById("correo").value.trim().toLowerCase();
  let contrasena = document.getElementById("contrasena").value;
  // todas las cuentas tienen el mismo rol
  let rol = "Usuario";

  // ----- validaciones -----
  if (nombre.length < 3) {
    alert("El nombre debe tener mínimo 3 letras");
    return;
  }

  if (correoValido(correo) === false) {
    alert("Escribe un correo válido, por ejemplo tu@correo.com");
    return;
  }

  if (contrasena.length < 6) {
    alert("La contraseña debe tener mínimo 6 caracteres");
    return;
  }

  // el correo no puede estar repetido
  if (buscarUsuario(correo) !== null) {
    alert("Ese correo ya está registrado");
    return;
  }

  // ----- guardar el usuario nuevo -----
  let usuarios = obtenerUsuarios();

  let usuarioNuevo = {
    nombre: nombre,
    correo: correo,
    rol: rol
  };

  // la contraseña se guarda cifrada, nunca tal cual
  ponerContrasena(usuarioNuevo, contrasena);

  usuarios.push(usuarioNuevo);
  guardarUsuarios(usuarios);

  // lo dejamos con la sesión iniciada y anotamos el evento en el historial
  localStorage.setItem("usuarioActual", correo);
  registrarEvento("Usuario creado", nombre + " creó su cuenta", "sistema", "bi-plus-circle", "success");

  alert("¡Cuenta creada con éxito!");
  // toda cuenta nueva debe crear su propiedad (o unirse a una con un código)
  window.location.href = "../propiedad/crear-propiedad.html?primera=1";
});