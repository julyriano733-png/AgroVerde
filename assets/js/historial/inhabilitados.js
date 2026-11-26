// inhabilitados.js
// Todo lo que se inhabilitó en la propiedad actual, separado por sección,
// con la fecha y quién lo hizo. Cada cosa se puede restaurar (si hay permiso).

// Cada sección: de dónde salen los datos, cómo se muestra y qué permiso pide para restaurar
const SECCIONES = [
  { clave: "cultivos", vacio: "No hay cultivos inhabilitados.", titulo: "Cultivos", icono: "bi-flower1", permiso: "cultivos", lista: "cultivos",
    detalle: function (c) { return "Etapa: " + c.etapa + " • " + c.terreno; } },
  { clave: "terrenos", vacio: "No hay terrenos inhabilitados.", titulo: "Terrenos", icono: "bi-geo-alt", permiso: "terreno", lista: "terrenos",
    detalle: function (t) { return t.area + " ha • Zona " + t.zona; } },
  { clave: "insumos", vacio: "No hay insumos inhabilitados.", titulo: "Insumos", icono: "bi-box-seam", permiso: "insumos", lista: "insumos",
    detalle: function (i) { return i.cantidad + " " + i.unidad + " en stock"; } },
  { clave: "proveedores", vacio: "No hay proveedores eliminados.", titulo: "Proveedores", icono: "bi-truck", permiso: "insumos", lista: "proveedores",
    detalle: function (p) { return p.insumos || "Sin insumos"; } },
  { clave: "plagas", vacio: "No hay plagas inhabilitadas.", titulo: "Plagas", icono: "bi-bug", permiso: "plagas", lista: "plagas", campo: "habilitada",
    detalle: function (p) { return p.ubicacion + " • " + p.estado; } },
  { clave: "reportes", vacio: "No hay reportes inhabilitados.", titulo: "Reportes", icono: "bi-file-earmark-text", permiso: "reportes", lista: "reportes",
    detalle: function (r) { return "Generado " + fechaBonita(r.fecha); } },
  { clave: "propiedades", vacio: "No hay propiedades inhabilitadas.", titulo: "Propiedades", icono: "bi-house", permiso: "propiedad", lista: "propiedades",
    detalle: function (p) { return p.tipo + " • " + p.ubicacion; } }
];

// Llave de localStorage de cada lista (las plagas usan su propia llave)
function claveDeLista(seccion) {
  if (seccion.lista === "plagas") return "agroverde_plagas_prop" + idPropiedadActual();
  if (seccion.lista === "propiedades") return "propiedades";
  return claveDePropiedad(seccion.lista);
}

function leerSeccion(seccion) {
  let guardado = localStorage.getItem(claveDeLista(seccion));
  return guardado === null ? [] : JSON.parse(guardado);
}

function inhabilitadosDe(seccion) {
  let campo = seccion.campo || "habilitado";
  let correo = localStorage.getItem("usuarioActual");

  return leerSeccion(seccion).filter(function (item) {
    // las propiedades: solo las que eran de la persona
    if (seccion.lista === "propiedades" && !(item.miembros || []).includes(correo)) {
      return false;
    }
    return item[campo] === false;
  });
}

function puedeRestaurar(seccion) {
  return typeof puedeModificar !== "function" || puedeModificar(seccion.permiso);
}

function mostrarInhabilitados() {
  if (protegerPagina() === false) {
    return;
  }

  let texto = document.getElementById("buscarInhabilitado").value.trim().toLowerCase();
  let html = "";

  for (let s = 0; s < SECCIONES.length; s++) {
    let seccion = SECCIONES[s];
    let items = inhabilitadosDe(seccion).filter(function (item) {
      return texto === "" || (item.nombre + " " + seccion.detalle(item)).toLowerCase().includes(texto);
    });
    let filas = "";

    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      let cuando = item.fechaInhabilitado ? "Inhabilitado el " + fechaBonita(item.fechaInhabilitado) + (item.inhabilitadoPor ? " por " + item.inhabilitadoPor : "") : "Inhabilitado";
      let boton = puedeRestaurar(seccion)
        ? `<button type="button" class="btn btn-sm btn-outline-success restaurar flex-shrink-0" data-seccion="${seccion.clave}" data-id="${item.id}"><i class="bi bi-arrow-counterclockwise me-1"></i>Restaurar</button>`
        : '<span class="texto_gris small flex-shrink-0">Sin permiso</span>';

      filas += `
        <div class="tarjeta p-3 rounded-4 d-flex justify-content-between align-items-center gap-2">
          <div>
            <strong class="d-block">${textoSeguro(item.nombre)}</strong>
            <span class="texto_gris small d-block">${textoSeguro(seccion.detalle(item))}</span>
            <span class="texto_gris" style="font-size: 0.75rem;">${textoSeguro(cuando)}</span>
          </div>
          ${boton}
        </div>`;
    }

    // cada sección es un desplegable con su cantidad; las que tienen cosas empiezan abiertas
    html += `
      <details class="tarjeta p-3 rounded-4"${items.length > 0 ? " open" : ""}>
        <summary class="d-flex justify-content-between align-items-center" style="list-style: none; cursor: pointer;">
          <span class="fw-bold text-white"><i class="bi ${seccion.icono} text-success me-2"></i>${seccion.titulo}</span>
          <span class="d-flex align-items-center gap-2">
            <span class="badge rounded-pill ${items.length > 0 ? "text-bg-danger" : "text-bg-secondary"}">${items.length}</span>
            <i class="bi bi-chevron-down texto_gris"></i>
          </span>
        </summary>
        <div class="d-flex flex-column gap-2 mt-3">
          ${filas || '<p class="texto_gris small m-0">' + seccion.vacio + "</p>"}
        </div>
      </details>`;
  }

  document.getElementById("seccionesInhabilitados").innerHTML = html;
}

// Restaurar: vuelve a habilitar el elemento (con algunas revisiones)
async function restaurar(claveSeccion, id) {
  let seccion = SECCIONES.find(function (s) { return s.clave === claveSeccion; });
  let lista = leerSeccion(seccion);
  let item = buscarPorId(lista, id);
  let campo = seccion.campo || "habilitado";

  // un cultivo no puede volver a un terreno que ya está ocupado
  if (seccion.lista === "cultivos") {
    let ocupado = lista.some(function (c) { return c.id !== item.id && c.habilitado && c.terreno === item.terreno; });
    if (ocupado) {
      alert(item.terreno + " ya tiene otro cultivo sembrado. Libera el terreno antes de restaurar " + item.nombre + ".");
      return;
    }
  }

  if (await preguntar("¿Restaurar?", item.nombre + " volverá a aparecer en " + seccion.titulo + ".", "Restaurar") === false) {
    return;
  }

  item[campo] = true;
  delete item.fechaInhabilitado;
  delete item.inhabilitadoPor;
  localStorage.setItem(claveDeLista(seccion), JSON.stringify(lista));
  registrarEvento(seccion.titulo + ": restaurado", item.nombre + " se volvió a habilitar", "sistema", "bi-arrow-counterclockwise", "success");
  window.location.href = "inhabilitados.html?mensaje=guardado";
}

document.getElementById("seccionesInhabilitados").addEventListener("click", function (evento) {
  let boton = evento.target.closest(".restaurar");

  if (boton !== null) {
    restaurar(boton.dataset.seccion, Number(boton.dataset.id));
  }
});

document.getElementById("buscarInhabilitado").addEventListener("input", mostrarInhabilitados);

mostrarInhabilitados();
