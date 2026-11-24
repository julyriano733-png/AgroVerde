// comun.js
// Funciones que comparten varias pantallas: usuarios, sesión, historial y notificaciones.
// Todo se guarda en localStorage (en el navegador) mientras no esté lista la API.
// Este archivo se carga SIEMPRE antes del .js de cada pantalla.

// ================== USUARIOS ==================

// Usuarios que ya existen la primera vez que se abre la página (solo para probar)
function usuariosDeEjemplo() {
  return [
    { nombre: "July Riaño", correo: "july@agroverde.com", contrasena: "123456", rol: "Administrador" },
    { nombre: "Dayan Combita", correo: "dayan@agroverde.com", contrasena: "123456", rol: "Administrador" },
    { nombre: "Derlin Caro", correo: "derlin@agroverde.com", contrasena: "123456", rol: "Administrador" },
    { nombre: "Helian Moreno", correo: "helian@agroverde.com", contrasena: "123456", rol: "Agricultor" }
  ];
}

// Trae la lista de usuarios guardados.
// Si todavía no hay ninguna, guarda los de ejemplo.
function obtenerUsuarios() {
  let guardado = localStorage.getItem("usuarios");

  if (guardado === null) {
    let ejemplo = usuariosDeEjemplo();
    guardarUsuarios(ejemplo);
    return ejemplo;
  }

  return JSON.parse(guardado);
}

function guardarUsuarios(usuarios) {
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

// Busca un usuario por su correo. Si no existe devuelve null.
function buscarUsuario(correo) {
  let usuarios = obtenerUsuarios();

  for (let i = 0; i < usuarios.length; i++) {
    if (usuarios[i].correo === correo) {
      return usuarios[i];
    }
  }

  return null;
}

// Revisa que el texto tenga forma de correo: algo@algo.algo
function correoValido(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

// ================== SESIÓN ==================

// Devuelve el usuario que tiene la sesión iniciada (o null si no hay nadie)
function obtenerUsuarioActual() {
  let correo = localStorage.getItem("usuarioActual");

  if (correo === null) {
    return null;
  }

  return buscarUsuario(correo);
}

// Se pone al principio de cada pantalla privada.
// Si no hay sesión manda al login y devuelve false.
function protegerPagina() {
  if (obtenerUsuarioActual() === null) {
    window.location.href = "../inicio-sesion/iniciar-sesion.html";
    return false;
  }

  return true;
}

// Los botones de cerrar sesión son enlaces <a>, por eso primero frenamos
// el enlace (preventDefault) y solo salimos si la persona confirma.
function preguntarCerrarSesion(evento) {
  evento.preventDefault();

  if (confirm("¿Seguro que quieres cerrar sesión?") === true) {
    localStorage.removeItem("usuarioActual");
    window.location.href = "../inicio-sesion/iniciar-sesion.html";
  }
}

// ================== HISTORIAL ==================

// Devuelve la fecha como texto: "2026-11-23". Con 0 es hoy, con 1 es ayer.
// No usamos toISOString() porque da la fecha en hora UTC y en Colombia,
// pasadas las 7 pm, ya nos daría la de mañana.
function fechaDeHoy(diasAtras) {
  let fecha = new Date();
  fecha.setDate(fecha.getDate() - diasAtras);

  let anio = fecha.getFullYear();
  let mes = fecha.getMonth() + 1;
  let dia = fecha.getDate();

  if (mes < 10) {
    mes = "0" + mes;
  }
  if (dia < 10) {
    dia = "0" + dia;
  }

  return anio + "-" + mes + "-" + dia;
}

// Eventos que ya existen la primera vez (son los mismos de la pantalla de Figma)
function eventosDeEjemplo() {
  return [
    { titulo: "Cultivo registrado", detalle: "Helian Moreno agregó un nuevo lote", tipo: "cultivos", icono: "bi-plus-circle", color: "success", fecha: fechaDeHoy(0) },
    { titulo: "Plaga reportada", detalle: "Helian marcó \"Roya\" en Finca El Manantial", tipo: "cultivos", icono: "bi-exclamation-triangle", color: "danger", fecha: fechaDeHoy(0) },
    { titulo: "Inicio de sesión", detalle: "Dayan Combita accedió al sistema", tipo: "sistema", icono: "bi-box-arrow-in-right", color: "info", fecha: fechaDeHoy(0) },
    { titulo: "Insumo actualizado", detalle: "Derlin cambió stock de \"Fertilizante\"", tipo: "insumos", icono: "bi-file-earmark-text", color: "success", fecha: fechaDeHoy(1) },
    { titulo: "Terreno inhabilitado", detalle: "Daniela inhabilitó el Lote 1", tipo: "inventario", icono: "bi-slash-circle", color: "danger", fecha: fechaDeHoy(1) },
    { titulo: "Usuario creado", detalle: "Fue creado un nuevo usuario", tipo: "sistema", icono: "bi-person-plus", color: "success", fecha: fechaDeHoy(1) }
  ];
}

// Trae el historial (el más nuevo va primero)
function obtenerHistorial() {
  let guardado = localStorage.getItem("historial");

  if (guardado === null) {
    let ejemplo = eventosDeEjemplo();
    localStorage.setItem("historial", JSON.stringify(ejemplo));
    return ejemplo;
  }

  return JSON.parse(guardado);
}

// Anota un evento nuevo al principio del historial.
// tipo: cultivos, insumos, inventario o sistema
// icono: nombre del icono de Bootstrap Icons (ej. "bi-plus-circle")
// color: success (verde), danger (rojo) o info (azul)
function registrarEvento(titulo, detalle, tipo, icono, color) {
  let historial = obtenerHistorial();

  let evento = {
    titulo: titulo,
    detalle: detalle,
    tipo: tipo,
    icono: icono,
    color: color,
    fecha: fechaDeHoy(0)
  };

  historial.unshift(evento);
  localStorage.setItem("historial", JSON.stringify(historial));
}

// ================== NOTIFICACIONES ==================

function notificacionesDeEjemplo() {
  return [
    { titulo: "Alerta climática", detalle: "Se espera helada esta noche en Finca El Manantial", leida: false },
    { titulo: "Stock mínimo", detalle: "El fertilizante NPK está por debajo del mínimo", leida: false },
    { titulo: "Plaga reportada", detalle: "Helian marcó \"Roya\" en el Lote 2", leida: false },
    { titulo: "Reporte semanal", detalle: "Ya está listo el resumen de la semana", leida: true }
  ];
}

// Trae la lista de notificaciones (si no hay ninguna, guarda las de ejemplo)
function obtenerNotificaciones() {
  let guardado = localStorage.getItem("notificaciones");

  if (guardado === null) {
    let ejemplo = notificacionesDeEjemplo();
    guardarNotificaciones(ejemplo);
    return ejemplo;
  }

  return JSON.parse(guardado);
}

function guardarNotificaciones(lista) {
  localStorage.setItem("notificaciones", JSON.stringify(lista));
}

// Cuenta cuántas notificaciones faltan por leer
function contarSinLeer() {
  let lista = obtenerNotificaciones();
  let total = 0;

  for (let i = 0; i < lista.length; i++) {
    if (lista[i].leida === false) {
      total = total + 1;
    }
  }

  return total;
}