// permisos.js
// Qué puede modificar cada miembro de una propiedad.
// El dueño (quien creó la propiedad o hizo la primera invitación) puede todo;
// a los invitados el dueño les elige, módulo por módulo, si pueden modificar o solo ver.
// Se carga después de comun.js en las pantallas de los módulos.

const MODULOS_PERMISO = [
  { clave: "cultivos", nombre: "Cultivos", detalle: "Crear, editar e inhabilitar cultivos" },
  { clave: "terreno", nombre: "Terrenos", detalle: "Crear, editar e inhabilitar terrenos" },
  { clave: "insumos", nombre: "Insumos y proveedores", detalle: "Crear insumos, usarlos, cambiar el stock y los proveedores" },
  { clave: "plagas", nombre: "Plagas", detalle: "Registrar, modificar e inhabilitar plagas" },
  { clave: "reportes", nombre: "Reportes", detalle: "Crear e inhabilitar reportes" },
  { clave: "clima", nombre: "Calendario agrícola", detalle: "Agregar eventos al calendario" },
  { clave: "propiedad", nombre: "Propiedad", detalle: "Editar e inhabilitar la propiedad" }
];

// Pantallas que sirven para modificar algo, por módulo (carpeta de pages/)
const PANTALLAS_DE_MODIFICAR = {
  cultivos: ["crear-cultivo", "editar-cultivo", "inhabilitar-cultivo"],
  terreno: ["nuevo-terreno", "editar-terreno"],
  insumos: ["crear-insumo", "editar-insumo", "inhabilitar-insumo", "uso-insumo", "actualizar-stock", "codigo-barras", "registrar-proveedor", "nuevo-proveedor"],
  plagas: ["nueva-plaga", "modificar-plaga", "inhabilitar-plaga"],
  reportes: ["crear-reportes", "inhabilitar-reporte"],
  propiedad: ["editar-propiedad", "inhabilitar-propiedad"]
};

// La propiedad en la que se está trabajando (o null)
function propiedadDeTrabajo() {
  let propiedades = leerListaGeneral("propiedades");

  for (let i = 0; i < propiedades.length; i++) {
    if (propiedades[i].id === idPropiedadActual()) {
      return propiedades[i];
    }
  }

  return null;
}

// Correo del dueño de una propiedad (null si la propiedad no tiene miembros propios)
function dueñoDe(propiedad) {
  if (propiedad === null || !propiedad.miembros || propiedad.miembros.length === 0) {
    return null;
  }

  return propiedad.dueno || propiedad.miembros[0];
}

function esDueño(propiedad) {
  let correo = localStorage.getItem("usuarioActual");
  let dueño = dueñoDe(propiedad);
  return dueño === null || dueño === correo;
}

// ¿La persona con sesión puede modificar este módulo en la propiedad actual?
function puedeModificar(modulo) {
  let propiedad = propiedadDeTrabajo();
  let correo = localStorage.getItem("usuarioActual");

  if (correo === null || esDueño(propiedad)) {
    return true;
  }

  let permisos = propiedad.permisos ? propiedad.permisos[correo] : undefined;

  // quien se unió antes de que existieran los permisos puede todo
  if (permisos === undefined) {
    return true;
  }

  return permisos[modulo] === true;
}

// ================== APLICAR EN LA PANTALLA ==================
function moduloDeLaPagina() {
  let partes = window.location.pathname.split("/");
  return partes[partes.length - 2];
}

function nombreDeLaPagina() {
  let partes = window.location.pathname.split("/");
  return partes[partes.length - 1].replace(".html", "");
}

function aplicarPermisos() {
  let modulo = moduloDeLaPagina();

  // en Insumos también está Opciones/Proveedores; en Inicio los botones de acceso no se tocan
  let pantallas = PANTALLAS_DE_MODIFICAR[modulo];

  if (pantallas === undefined || puedeModificar(modulo)) {
    return;
  }

  let nombreModulo = MODULOS_PERMISO.find(function (m) { return m.clave === modulo; }).nombre;

  // 1) si entró directo a una pantalla de modificar, se le avisa y se devuelve
  if (pantallas.includes(nombreDeLaPagina())) {
    document.body.style.visibility = "hidden";
    preguntarSinPermiso(nombreModulo);
    return;
  }

  // 2) en las demás pantallas se esconden los botones y enlaces para modificar
  let selectores = pantallas.map(function (p) { return 'a[href^="' + p + '.html"]'; });
  selectores.push("#proveedorEliminar");
  let estilos = document.createElement("style");
  estilos.textContent = selectores.join(", ") + " { display: none !important; }";
  document.head.appendChild(estilos);

  // 3) franja que explica por qué no se ven
  let franja = document.createElement("div");
  franja.className = "franja-solo-lectura";
  franja.innerHTML = '<i class="bi bi-eye me-2"></i>Solo puedes ver ' + nombreModulo + ': el dueño de la propiedad no te dio permiso para modificar.';
  franja.style.cssText = "background-color: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.5); color: #eab308; border-radius: 12px; padding: 10px 14px; font-size: 0.85rem; margin-bottom: 16px;";
  let principal = document.querySelector("main");
  if (principal !== null) {
    let encabezado = principal.querySelector("header");
    if (encabezado !== null) {
      encabezado.after(franja);
    } else {
      principal.prepend(franja);
    }
  }
}

async function preguntarSinPermiso(nombreModulo) {
  // usa la misma ventana de "¿Estás seguro?", con un solo camino: volver
  ponerEstilosVentana();
  let fondo = document.createElement("div");
  fondo.className = "confirmacion-fondo";
  fondo.innerHTML = `
    <div class="confirmacion-caja confirmacion-caja--pregunta" role="dialog" aria-modal="true" style="visibility: visible;">
      <div class="confirmacion-icono confirmacion-icono--pregunta">!</div>
      <h4 class="confirmacion-titulo">Sin permiso</h4>
      <p class="confirmacion-detalle">El dueño de la propiedad no te dio permiso para modificar ${nombreModulo}.</p>
      <button type="button" class="confirmacion-ok">Volver</button>
    </div>`;
  fondo.style.visibility = "visible";
  document.body.appendChild(fondo);
  fondo.querySelector("button").addEventListener("click", function () {
    window.history.length > 1 ? window.history.back() : window.location.href = "../inicio/inicio.html";
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", aplicarPermisos);
} else {
  aplicarPermisos();
}
