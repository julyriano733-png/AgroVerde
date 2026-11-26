// comun.js
// Funciones que comparten varias pantallas: usuarios, sesión, historial y notificaciones.
// Todo se guarda en localStorage (en el navegador) mientras no esté lista la API.
// Este archivo se carga SIEMPRE antes del .js de cada pantalla.

// ================== USUARIOS ==================

// Usuarios de prueba que traía la app antes. Ya no se crean, y si quedaron
// guardados en el navegador se borran: solo quedan las cuentas creadas de verdad.
const USUARIOS_DE_PRUEBA = ["july@agroverde.com", "dayan@agroverde.com", "derlin@agroverde.com", "helian@agroverde.com"];

function esUsuarioDePrueba(usuario) {
  return USUARIOS_DE_PRUEBA.includes(usuario.correo) && usuario.contrasena === "123456";
}

// Trae la lista de usuarios guardados (sin los de prueba)
function obtenerUsuarios() {
  let guardado = localStorage.getItem("usuarios");

  if (guardado === null) {
    return [];
  }

  let usuarios = JSON.parse(guardado);
  let reales = usuarios.filter(function (usuario) { return !esUsuarioDePrueba(usuario); });

  // si había usuarios de prueba guardados se borran (y su sesión también)
  if (reales.length !== usuarios.length) {
    guardarUsuarios(reales);

    let actual = localStorage.getItem("usuarioActual");
    if (actual !== null && USUARIOS_DE_PRUEBA.includes(actual) && !reales.some(function (u) { return u.correo === actual; })) {
      localStorage.removeItem("usuarioActual");
    }
  }

  // ya no hay roles distintos: todas las cuentas son "Usuario"
  for (let i = 0; i < reales.length; i++) {
    reales[i].rol = "Usuario";
  }

  return reales;
}

function guardarUsuarios(usuarios) {
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

// ================== CONTRASEÑAS CIFRADAS ==================
// Las contraseñas no se guardan tal cual: se guarda su huella SHA-256 con una "sal"
// (texto al azar distinto para cada usuario). Para revisar una contraseña se calcula
// la huella de lo escrito y se compara. Así nadie puede leerla en el navegador.

// SHA-256 escrito en JavaScript (funciona igual en cualquier navegador, aun sin HTTPS)
function sha256(texto) {
  function rotar(n, x) { return (x >>> n) | (x << (32 - n)); }

  let k = [];
  let h = [];
  let primo = 2;
  let encontrados = 0;

  // constantes: partes fraccionarias de raíces de los primeros números primos
  while (encontrados < 64) {
    let esPrimo = true;
    for (let d = 2; d * d <= primo; d++) {
      if (primo % d === 0) { esPrimo = false; break; }
    }
    if (esPrimo) {
      if (encontrados < 8) h[encontrados] = (Math.pow(primo, 1 / 2) * 4294967296) | 0;
      k[encontrados] = (Math.pow(primo, 1 / 3) * 4294967296) | 0;
      encontrados++;
    }
    primo++;
  }

  let bytes = unescape(encodeURIComponent(texto));
  let palabras = [];
  let largoBits = bytes.length * 8;

  for (let i = 0; i < bytes.length; i++) {
    palabras[i >> 2] |= bytes.charCodeAt(i) << ((3 - i) % 4) * 8;
  }
  palabras[largoBits >> 5] |= 0x80 << (24 - largoBits % 32);
  palabras[((largoBits + 64 >> 9) << 4) + 15] = largoBits;

  for (let j = 0; j < palabras.length; j += 16) {
    let w = [];
    let a = h.slice(0);

    for (let i = 0; i < 64; i++) {
      if (i < 16) {
        w[i] = palabras[j + i] | 0;
      } else {
        let s0 = rotar(7, w[i - 15]) ^ rotar(18, w[i - 15]) ^ (w[i - 15] >>> 3);
        let s1 = rotar(17, w[i - 2]) ^ rotar(19, w[i - 2]) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }

      let t1 = a[7] + (rotar(6, a[4]) ^ rotar(11, a[4]) ^ rotar(25, a[4])) + ((a[4] & a[5]) ^ (~a[4] & a[6])) + k[i] + w[i];
      let t2 = (rotar(2, a[0]) ^ rotar(13, a[0]) ^ rotar(22, a[0])) + ((a[0] & a[1]) ^ (a[0] & a[2]) ^ (a[1] & a[2]));
      a = [(t1 + t2) | 0].concat(a);
      a[4] = (a[4] + t1) | 0;
      a.pop();
    }

    for (let i = 0; i < 8; i++) {
      h[i] = (h[i] + a[i]) | 0;
    }
  }

  let resultado = "";
  for (let i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      resultado += ((h[i] >>> (b * 8)) & 255).toString(16).padStart(2, "0");
    }
  }
  return resultado;
}

// Sal al azar para un usuario nuevo
function crearSal() {
  let letras = "abcdefghijklmnopqrstuvwxyz0123456789";
  let sal = "";
  for (let i = 0; i < 16; i++) {
    sal += letras.charAt(Math.floor(Math.random() * letras.length));
  }
  return sal;
}

// Pone la contraseña cifrada en el usuario (y borra la que estuviera sin cifrar)
function ponerContrasena(usuario, contrasena) {
  usuario.sal = crearSal();
  usuario.contrasenaHash = sha256(usuario.sal + contrasena);
  delete usuario.contrasena;
}

// ¿La contraseña escrita es la del usuario?
function contrasenaCorrecta(usuario, contrasena) {
  if (usuario.contrasenaHash) {
    return sha256(usuario.sal + contrasena) === usuario.contrasenaHash;
  }

  // cuentas de antes (contraseña sin cifrar): se comparan y luego se cifran al entrar
  return usuario.contrasena === contrasena;
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
async function preguntarCerrarSesion(evento) {
  evento.preventDefault();

  let salir = await preguntar("¿Estás seguro?", "Vas a cerrar sesión en Agro Verde.", "Cerrar sesión", "bi-box-arrow-right");

  if (salir === true) {
    localStorage.removeItem("usuarioActual");
    window.location.href = "../inicio-sesion/iniciar-sesion.html";
  }
}

// ================== VENTANA DE PREGUNTA ==================
// Igual a la de "Guardado correctamente" pero con dos botones: Cancelar y el de la acción.
// Devuelve una promesa: true si la persona acepta, false si cancela.
// Uso: if (await preguntar("¿Estás seguro?", "Se inhabilitará el Lote 1") === false) { return; }
function preguntar(titulo, detalle, textoBoton, icono) {
  ponerEstilosVentana();

  return new Promise(function (responder) {
    let fondo = document.createElement("div");
    fondo.className = "confirmacion-fondo";

    let caja = document.createElement("div");
    caja.className = "confirmacion-caja confirmacion-caja--pregunta";
    caja.setAttribute("role", "dialog");
    caja.setAttribute("aria-modal", "true");

    let circulo = document.createElement("div");
    circulo.className = "confirmacion-icono confirmacion-icono--pregunta";
    circulo.textContent = "?";

    let textoTitulo = document.createElement("h4");
    textoTitulo.className = "confirmacion-titulo";
    textoTitulo.textContent = titulo;

    let textoDetalle = document.createElement("p");
    textoDetalle.className = "confirmacion-detalle";
    textoDetalle.textContent = detalle || "";

    let botones = document.createElement("div");
    botones.className = "confirmacion-botones";

    let cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.className = "confirmacion-cancelar";
    cancelar.textContent = "Cancelar";

    let aceptar = document.createElement("button");
    aceptar.type = "button";
    aceptar.className = "confirmacion-aceptar";
    aceptar.textContent = textoBoton || "Sí, continuar";

    botones.appendChild(cancelar);
    botones.appendChild(aceptar);
    caja.appendChild(circulo);
    caja.appendChild(textoTitulo);
    caja.appendChild(textoDetalle);
    caja.appendChild(botones);
    fondo.appendChild(caja);
    document.body.appendChild(fondo);
    cancelar.focus();

    function cerrar(respuesta) {
      fondo.remove();
      document.removeEventListener("keydown", conTeclado);
      responder(respuesta);
    }

    function conTeclado(evento) {
      if (evento.key === "Escape") {
        cerrar(false);
      }
    }

    cancelar.addEventListener("click", function () { cerrar(false); });
    aceptar.addEventListener("click", function () { cerrar(true); });
    fondo.addEventListener("click", function (evento) {
      if (evento.target === fondo) {
        cerrar(false);
      }
    });
    document.addEventListener("keydown", conTeclado);
  });
}

// ================== ELEGIR CUÁL ==================
// Si una pantalla de editar o ver se abre sin decir cuál (sin ?id=) y hay varios,
// muestra una ventana con la lista para que la persona elija.
// Devuelve true si mostró la ventana (la pantalla no debe seguir cargando).
// opciones: [{ id, nombre, detalle }]
function pedirElegir(titulo, opciones, volverA) {
  if (idDeLaDireccion() !== null || opciones.length <= 1) {
    return false;
  }

  ponerEstilosVentana();

  let lista = "";
  for (let i = 0; i < opciones.length; i++) {
    lista += `
      <a href="?id=${opciones[i].id}" class="elegir-opcion">
        <span><strong>${textoSeguro(opciones[i].nombre)}</strong>${opciones[i].detalle ? '<small>' + textoSeguro(opciones[i].detalle) + "</small>" : ""}</span>
        <i class="bi bi-chevron-right"></i>
      </a>`;
  }

  let fondo = document.createElement("div");
  fondo.className = "confirmacion-fondo";
  fondo.innerHTML = `
    <div class="confirmacion-caja confirmacion-caja--pregunta" role="dialog" aria-modal="true">
      <h4 class="confirmacion-titulo">${textoSeguro(titulo)}</h4>
      <p class="confirmacion-detalle">Elige uno de la lista</p>
      <div class="elegir-lista">${lista}</div>
      <button type="button" class="confirmacion-cancelar mt-3">Cancelar</button>
    </div>`;
  document.body.appendChild(fondo);

  fondo.querySelector(".confirmacion-cancelar").addEventListener("click", function () {
    window.location.href = volverA;
  });

  return true;
}

// Algunas pantallas no cargan global.css: los estilos de las ventanas se agregan desde aquí
function ponerEstilosVentana() {
  if (document.getElementById("estilos-ventana") !== null) {
    return;
  }

  let estilos = document.createElement("style");
  estilos.id = "estilos-ventana";
  estilos.textContent = `
    .confirmacion-fondo { position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.55); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 2000; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
    .confirmacion-caja { width: 100%; max-width: 340px; background-color: #2f9e5b; border-radius: 18px; padding: 28px 20px 20px 20px; text-align: center; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4); }
    .confirmacion-caja--pregunta { background-color: #163b29; border: 1px solid #1d734e; }
    .confirmacion-icono { width: 90px; height: 90px; margin: 0 auto 10px auto; border-radius: 50%; border: 6px solid #22c55e; color: #22c55e; background-color: rgba(255, 255, 255, 0.12); display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 800; }
    .confirmacion-icono--pregunta { border-color: #eab308; color: #eab308; }
    .confirmacion-titulo { color: #091c12; font-weight: 800; font-size: 1.5rem; margin: 0 0 18px 0; }
    .confirmacion-caja--pregunta .confirmacion-titulo { color: #ffffff; margin-bottom: 6px; }
    .confirmacion-detalle { color: #9ca3af; font-size: 0.9rem; margin: 0 0 18px 0; }
    .confirmacion-botones { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .confirmacion-ok, .confirmacion-aceptar { width: 100%; background-color: #b5835a; color: #091c12; font-weight: 700; border: none; border-radius: 10px; padding: 10px 20px; cursor: pointer; }
    .confirmacion-cancelar { width: 100%; background-color: rgba(255, 255, 255, 0.1); color: #ffffff; font-weight: 700; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 10px; padding: 10px 12px; cursor: pointer; }
    .confirmacion-aceptar { background-color: #9c4a46; color: #ffffff; padding: 10px 12px; }
    .confirmacion-ok:hover { background-color: #a27350; }
    .confirmacion-aceptar:hover { background-color: #853c38; }
    .confirmacion-cancelar:hover { background-color: rgba(255, 255, 255, 0.18); }
    .elegir-lista { display: flex; flex-direction: column; gap: 8px; max-height: 50vh; overflow-y: auto; text-align: left; }
    .elegir-opcion { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 12px; background-color: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.12); color: #ffffff; text-decoration: none; }
    .elegir-opcion:hover { border-color: #22c55e; color: #ffffff; }
    .elegir-opcion small { display: block; color: #9ca3af; font-size: 0.8rem; }
    .elegir-opcion .bi { color: #22c55e; }
  `;
  document.head.appendChild(estilos);
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
// El historial empieza vacío: solo guarda lo que de verdad hace cada persona
function eventosDeEjemplo() {
  return [];
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
  let correo = localStorage.getItem("usuarioActual");
  let usuario = correo !== null ? buscarUsuario(correo) : null;
  let ahora = new Date();

  let evento = {
    titulo: titulo,
    detalle: detalle,
    tipo: tipo,
    modulo: moduloDelEvento(),
    icono: icono,
    color: color,
    fecha: fechaDeHoy(0),
    hora: String(ahora.getHours()).padStart(2, "0") + ":" + String(ahora.getMinutes()).padStart(2, "0"),
    usuario: usuario !== null ? usuario.nombre : "",
    correo: correo || "",
    propiedadId: typeof idPropiedadActual === "function" ? idPropiedadActual() : 0
  };

  historial.unshift(evento);
  localStorage.setItem("historial", JSON.stringify(historial));
}

// Módulo donde pasó la acción, según la carpeta de la página (cultivos, terreno, insumos...)
function moduloDelEvento() {
  let partes = window.location.pathname.split("/");
  let carpeta = partes[partes.length - 2];
  let modulos = { cultivos: "cultivos", terreno: "terrenos", insumos: "insumos", plagas: "plagas", reportes: "reportes", propiedad: "propiedades", clima: "clima" };
  return modulos[carpeta] || "cuenta";
}

// Marca algo como inhabilitado guardando cuándo y quién lo hizo
// (sirve para la pantalla "Inhabilitados")
function marcarInhabilitado(objeto, campo) {
  let correo = localStorage.getItem("usuarioActual");
  let usuario = correo !== null ? buscarUsuario(correo) : null;

  objeto[campo || "habilitado"] = false;
  objeto.fechaInhabilitado = fechaDeHoy(0);
  objeto.inhabilitadoPor = usuario !== null ? usuario.nombre : "";
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

// Revisa si la persona dejó activado ese tipo de alerta en "Configuración de alertas"
// tipo: alertaPlagas, alertaClima, alertaStock, alertaCosecha o alertaReportes
function alertaActiva(tipo) {
  let config = JSON.parse(localStorage.getItem("configAlertas") || "null");
  return config === null || config[tipo] !== false;
}

// Lee un número de "Configuración de alertas" (o el valor por defecto)
function valorDeAlerta(nombre, porDefecto) {
  let config = JSON.parse(localStorage.getItem("configAlertas") || "null");
  return config !== null && config[nombre] !== undefined ? config[nombre] : porDefecto;
}

// Agrega una notificación arriba de la lista.
// "llave" evita repetirla: si ya hay una sin leer con la misma llave no se agrega otra.
function crearNotificacion(titulo, detalle, llave) {
  let lista = obtenerNotificaciones();

  for (let i = 0; i < lista.length; i++) {
    if (lista[i].llave === llave && lista[i].leida === false) {
      return;
    }
  }

  lista.unshift({ titulo: titulo, detalle: detalle, leida: false, llave: llave, fecha: fechaDeHoy(0) });
  guardarNotificaciones(lista);
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
// ================== PROPIEDAD ACTUAL ==================
// La persona trabaja en una propiedad a la vez.
// Cada propiedad tiene sus propios cultivos, terrenos, insumos, reportes y plagas,
// y solo la ven sus miembros (quien la creó y quienes se unieron con un código).

// Listas que son de toda la cuenta y no de una propiedad
const LISTAS_GENERALES = ["propiedades", "usuarios", "mensajesSoporte", "invitaciones"];

// Cada usuario recuerda su propia propiedad actual
function clavePropiedadActual() {
  let correo = localStorage.getItem("usuarioActual");
  return correo === null ? "propiedadActual" : "propiedadActual_" + correo;
}

// Propiedades habilitadas de las que la persona con sesión es miembro
function propiedadesDelUsuario() {
  let correo = localStorage.getItem("usuarioActual");

  return leerListaGeneral("propiedades").filter(function (p) {
    return p.habilitado && p.miembros && p.miembros.includes(correo);
  });
}

// Id de la propiedad actual (0 si la persona todavía no tiene ninguna)
function idPropiedadActual() {
  let propias = propiedadesDelUsuario();
  let guardado = Number(localStorage.getItem(clavePropiedadActual()));

  if (propias.some(function (p) { return p.id === guardado; })) {
    return guardado;
  }

  return propias.length > 0 ? propias[0].id : 0;
}

function cambiarPropiedad(id) {
  localStorage.setItem(clavePropiedadActual(), id);
}

// Nombre de la propiedad en la que se está trabajando
function nombrePropiedadActual() {
  let propias = propiedadesDelUsuario();

  for (let i = 0; i < propias.length; i++) {
    if (propias[i].id === idPropiedadActual()) {
      return propias[i].nombre;
    }
  }

  return "Sin propiedad";
}

// Cada propiedad guarda sus listas con su id: "cultivos_prop4"
function claveDePropiedad(clave, idPropiedad) {
  let id = idPropiedad === undefined ? idPropiedadActual() : idPropiedad;

  if (LISTAS_GENERALES.includes(clave)) {
    return clave;
  }

  return clave + "_prop" + id;
}

function leerListaGeneral(clave) {
  let guardado = localStorage.getItem(clave);
  return guardado === null ? [] : JSON.parse(guardado);
}

// Pone el nombre de la propiedad actual en los elementos con la clase "nombre-propiedad-actual"
function mostrarNombrePropiedad() {
  let elementos = document.querySelectorAll(".nombre-propiedad-actual");

  for (let i = 0; i < elementos.length; i++) {
    elementos[i].textContent = nombrePropiedadActual();
  }
}

document.addEventListener("DOMContentLoaded", mostrarNombrePropiedad);

// ================== DATOS DE LOS MÓDULOS ==================
// Cada módulo (cultivos, terrenos, reportes...) guarda su lista en localStorage
// con estas funciones. Cuando esté la API solo hay que cambiar estas dos primeras.

// Trae una lista guardada de la propiedad actual. Si todavía no existe empieza vacía:
// cada propiedad se llena con lo que registra la persona (no hay datos de ejemplo).
function obtenerLista(clave, ejemplo) {
  let guardado = localStorage.getItem(claveDePropiedad(clave));

  if (guardado === null) {
    let inicial = [];
    guardarLista(clave, inicial);
    return inicial;
  }

  return JSON.parse(guardado);
}

// Lee una lista sin crearla (para mirar los datos de otro módulo). Si no existe devuelve [].
function leerLista(clave) {
  let guardado = localStorage.getItem(claveDePropiedad(clave));
  return guardado === null ? [] : JSON.parse(guardado);
}

function guardarLista(clave, lista) {
  localStorage.setItem(claveDePropiedad(clave), JSON.stringify(lista));
}

// Busca un elemento por su id. Si no existe devuelve null.
function buscarPorId(lista, id) {
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].id === id) {
      return lista[i];
    }
  }

  return null;
}

// Da el siguiente id libre de una lista
function nuevoId(lista) {
  let mayor = 0;

  for (let i = 0; i < lista.length; i++) {
    if (lista[i].id > mayor) {
      mayor = lista[i].id;
    }
  }

  return mayor + 1;
}

// Lee el ?id=3 de la dirección de la página (devuelve null si no hay)
function idDeLaDireccion() {
  let parametros = new URLSearchParams(window.location.search);
  let id = parametros.get("id");

  if (id === null) {
    return null;
  }

  return Number(id);
}

// Evita que lo que escribe la persona dañe el HTML de la página
function textoSeguro(texto) {
  let caja = document.createElement("div");
  caja.textContent = texto;
  return caja.innerHTML;
}

// Muestra "2026-08-15" como "15/08/2026"
function fechaBonita(fecha) {
  if (!fecha) {
    return "----";
  }

  let partes = fecha.split("-");
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

// Filtra las tarjetas mientras se escribe en un buscador.
// selectorTarjetas: qué elementos se esconden o se muestran (ej. ".tarjeta-cultivo")
function activarBuscadorDeLista(idBuscador, selectorTarjetas) {
  let buscador = document.getElementById(idBuscador);

  if (buscador === null) {
    return;
  }

  buscador.addEventListener("input", function () {
    let texto = buscador.value.toLowerCase();
    let tarjetas = document.querySelectorAll(selectorTarjetas);

    for (let i = 0; i < tarjetas.length; i++) {
      if (tarjetas[i].textContent.toLowerCase().includes(texto)) {
        tarjetas[i].classList.remove("d-none");
      } else {
        tarjetas[i].classList.add("d-none");
      }
    }
  });
}

// ================== PRIMERA PROPIEDAD ==================
// Toda cuenta necesita una propiedad para trabajar. Si la persona no tiene ninguna,
// se le lleva a crearla (o a unirse con un código de invitación).
function exigirPropiedad() {
  let correo = localStorage.getItem("usuarioActual");
  let ruta = window.location.pathname;
  let permitidas = ["/inicio-sesion/", "crear-propiedad.html", "unirse-propiedad.html", "index.html"];

  if (correo === null || buscarUsuario(correo) === null || permitidas.some(function (p) { return ruta.includes(p); }) || !ruta.includes("/pages/")) {
    return;
  }

  if (propiedadesDelUsuario().length === 0) {
    window.location.replace("../propiedad/crear-propiedad.html?primera=1");
  }
}

exigirPropiedad();
