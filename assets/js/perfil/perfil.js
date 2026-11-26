// perfil.js
// Muestra los datos del usuario que inició sesión.
// Todos tienen el mismo rol ("Usuario") y pueden ver y quitar a los demás usuarios.

// Crea la tarjeta de un usuario de la lista (con botón "Quitar" si no es uno mismo)
function crearTarjetaUsuario(usuario, esUnoMismo) {
  let tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta p-3 rounded-4 d-flex align-items-center gap-3";

  let punto = document.createElement("div");
  punto.className = "punto_verde_pequeno me-1";
  punto.style.width = "24px";
  punto.style.height = "24px";

  let cajaTextos = document.createElement("div");

  let nombre = document.createElement("p");
  nombre.className = "m-0 fw-bold text-white small";
  nombre.textContent = usuario.nombre;

  let rol = document.createElement("p");
  rol.className = "m-0 small texto_gris";
  rol.style.fontSize = "11px";
  rol.textContent = usuario.correo + (esUnoMismo ? " • tú" : "");

  cajaTextos.appendChild(nombre);
  cajaTextos.appendChild(rol);
  tarjeta.appendChild(punto);
  tarjeta.appendChild(cajaTextos);

  if (!esUnoMismo) {
    let quitar = document.createElement("button");
    quitar.type = "button";
    quitar.className = "btn btn-sm btn-outline-danger ms-auto";
    quitar.innerHTML = '<i class="bi bi-person-dash me-1"></i>Quitar';
    quitar.addEventListener("click", function () {
      quitarUsuario(usuario);
    });
    tarjeta.appendChild(quitar);
  }

  return tarjeta;
}

// Quita un usuario del sistema y de las propiedades donde era miembro
async function quitarUsuario(usuario) {
  let seguro = await preguntar("¿Estás seguro?", "Se va a quitar a " + usuario.nombre + " (" + usuario.correo + ") del sistema. Ya no podrá iniciar sesión.", "Quitar");

  if (seguro === false) {
    return;
  }

  let restantes = obtenerUsuarios().filter(function (u) { return u.correo !== usuario.correo; });
  guardarUsuarios(restantes);

  let propiedades = leerListaGeneral("propiedades");
  for (let i = 0; i < propiedades.length; i++) {
    if (propiedades[i].miembros) {
      propiedades[i].miembros = propiedades[i].miembros.filter(function (correo) { return correo !== usuario.correo; });
    }
  }
  localStorage.setItem("propiedades", JSON.stringify(propiedades));

  registrarEvento("Usuario quitado", usuario.nombre + " fue quitado del sistema", "sistema", "bi-person-dash", "danger");
  window.location.href = "perfil.html?mensaje=inhabilitado";
}

function mostrarPerfil() {
  // si no hay sesión, protegerPagina nos manda al login y paramos aquí
  if (protegerPagina() === false) {
    return;
  }

  let usuario = obtenerUsuarioActual();

  // ----- tarjeta grande con el nombre y el rol -----
  document.getElementById("nombre-usuario").textContent = usuario.nombre;
  document.getElementById("rol-usuario").textContent = usuario.rol + " - " + nombrePropiedadActual();

  // ----- iniciales del nombre en el círculo -----
  let partes = usuario.nombre.trim().split(" ");
  let iniciales = partes[0].charAt(0) + (partes.length > 1 ? partes[partes.length - 1].charAt(0) : "");
  document.getElementById("avatar-usuario").textContent = iniciales.toUpperCase();

  // ----- lista de usuarios del sistema -----
  let usuarios = obtenerUsuarios();
  let lista = document.getElementById("lista-usuarios");
  lista.innerHTML = "";

  for (let i = 0; i < usuarios.length; i++) {
    lista.appendChild(crearTarjetaUsuario(usuarios[i], usuarios[i].correo === usuario.correo));
  }
}

// ----- cerrar sesión -----
let botonCerrar = document.getElementById("cerrar-sesion");
botonCerrar.addEventListener("click", preguntarCerrarSesion);

mostrarPerfil();