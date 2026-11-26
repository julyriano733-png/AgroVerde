// editar-perfil.js
// Cambia el nombre, el correo y (si se quiere) la contraseña del usuario con sesión

function iniciales(nombre) {
  let partes = nombre.trim().split(" ");
  let letras = partes[0].charAt(0);

  if (partes.length > 1) {
    letras += partes[partes.length - 1].charAt(0);
  }

  return letras.toUpperCase();
}

function activarEditarPerfil() {
  if (protegerPagina() === false) {
    return;
  }

  let usuario = obtenerUsuarioActual();
  let formulario = document.getElementById("formEditarPerfil");

  document.getElementById("nombrePerfil").value = usuario.nombre;
  document.getElementById("correoPerfil").value = usuario.correo;
  document.getElementById("rolPerfil").value = usuario.rol;
  document.getElementById("avatarEditar").textContent = iniciales(usuario.nombre);

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let nombre = document.getElementById("nombrePerfil").value.trim();
    let correo = document.getElementById("correoPerfil").value.trim().toLowerCase();
    let actual = document.getElementById("contrasenaActual").value;
    let nueva = document.getElementById("contrasenaNueva").value;
    let repetir = document.getElementById("contrasenaRepetir").value;

    if (nombre.length < 3) {
      alert("El nombre debe tener mínimo 3 letras");
      return;
    }

    if (correoValido(correo) === false) {
      alert("Escribe un correo válido, por ejemplo tu@correo.com");
      return;
    }

    // el correo nuevo no puede ser de otra persona
    if (correo !== usuario.correo && buscarUsuario(correo) !== null) {
      alert("Ese correo ya está registrado");
      return;
    }

    // la contraseña solo se cambia si se escribió una nueva
    if (nueva !== "" || actual !== "") {
      if (contrasenaCorrecta(usuario, actual) === false) {
        alert("La contraseña actual no es correcta");
        return;
      }

      if (nueva.length < 6) {
        alert("La contraseña nueva debe tener mínimo 6 caracteres");
        return;
      }

      if (nueva !== repetir) {
        alert("Las contraseñas nuevas no coinciden");
        return;
      }
    }

    let usuarios = obtenerUsuarios();
    for (let i = 0; i < usuarios.length; i++) {
      if (usuarios[i].correo === usuario.correo) {
        usuarios[i].nombre = nombre;
        usuarios[i].correo = correo;
        if (nueva !== "") {
          ponerContrasena(usuarios[i], nueva);
        }
      }
    }

    guardarUsuarios(usuarios);
    localStorage.setItem("usuarioActual", correo);
    registrarEvento("Perfil actualizado", nombre + " editó sus datos", "sistema", "bi-person-check", "info");
    window.location.href = "perfil.html?mensaje=guardado";
  });
}

activarEditarPerfil();
