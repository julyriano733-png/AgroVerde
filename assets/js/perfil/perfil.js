// perfil.js
// Muestra los datos del usuario que inició sesión.
// El rol decide qué ve: solo el Administrador ve la lista de usuarios del sistema.

// Crea la tarjeta de un usuario de la lista
function crearTarjetaUsuario(usuario) {
  let tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta p-3 rounded-4 d-flex align-items-center gap-3";

  let punto = document.createElement("div");
  punto.className = "punto_verde_pequeno me-1";
  punto.style.width = "24px";
  punto.style.height = "24px";

  // los administradores llevan el circulito azul, los demás verde
  if (usuario.rol === "Administrador") {
    punto.style.backgroundColor = "#06b6d4";
  }

  let cajaTextos = document.createElement("div");

  let nombre = document.createElement("p");
  nombre.className = "m-0 fw-bold text-white small";
  nombre.textContent = usuario.nombre;

  let rol = document.createElement("p");
  rol.className = "m-0 small texto_gris";
  rol.style.fontSize = "11px";
  rol.textContent = usuario.rol;

  cajaTextos.appendChild(nombre);
  cajaTextos.appendChild(rol);
  tarjeta.appendChild(punto);
  tarjeta.appendChild(cajaTextos);

  return tarjeta;
}

// Saca las iniciales de un nombre: "Helian Moreno" -> "HM"
function sacarIniciales(nombre) {
  let palabras = nombre.split(" ");
  let iniciales = palabras[0].charAt(0);

  if (palabras.length > 1) {
    iniciales = iniciales + palabras[1].charAt(0);
  }

  return iniciales.toUpperCase();
}

function mostrarPerfil() {
  // si no hay sesión, protegerPagina nos manda al login y paramos aquí
  if (protegerPagina() === false) {
    return;
  }

  let usuario = obtenerUsuarioActual();

  // ----- tarjeta grande con el nombre y el rol -----
  document.getElementById("nombre-usuario").textContent = usuario.nombre;
  document.getElementById("avatar-usuario").textContent = sacarIniciales(usuario.nombre);
  document.getElementById("rol-usuario").textContent = usuario.rol + " - Finca El Manantial";

  // ----- lista de usuarios: solo para el Administrador -----
  if (usuario.rol !== "Administrador") {
    // d-none es una clase de Bootstrap que esconde el elemento
    document.getElementById("columna-usuarios").classList.add("d-none");
    return;
  }

  let usuarios = obtenerUsuarios();
  let lista = document.getElementById("lista-usuarios");
  lista.innerHTML = "";

  for (let i = 0; i < usuarios.length; i++) {
    lista.appendChild(crearTarjetaUsuario(usuarios[i]));
  }
}

// ----- cerrar sesión -----
let botonCerrar = document.getElementById("cerrar-sesion");
botonCerrar.addEventListener("click", preguntarCerrarSesion);

mostrarPerfil();