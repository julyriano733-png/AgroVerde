// historial.js
// Historial de acciones: todo lo que se hace en la propiedad actual (y en la cuenta),
// agrupado por día, con quién lo hizo y a qué hora. Se puede filtrar por módulo y buscar.

// Color de fondo del circulito de cada evento
let fondos = {
  success: "rgba(34, 197, 94, 0.15)",
  danger: "rgba(239, 68, 68, 0.15)",
  info: "rgba(6, 182, 212, 0.15)"
};

const NOMBRES_MODULO = { cultivos: "Cultivos", terrenos: "Terrenos", insumos: "Insumos", plagas: "Plagas", reportes: "Reportes", propiedades: "Propiedades", clima: "Clima", cuenta: "Cuenta" };
const MESES_HISTORIAL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// Filtro que está elegido ahora
let filtroActual = "todos";

// Los eventos viejos no tenían "modulo": se deduce de su tipo
function moduloDe(evento) {
  if (evento.modulo) return evento.modulo;
  if (evento.tipo === "insumos") return "insumos";
  if (evento.tipo === "cultivos") return "cultivos";
  if (evento.tipo === "inventario") return "terrenos";
  return "cuenta";
}

// "Hoy", "Ayer" o "15 de agosto de 2026"
function tituloDelDia(fecha) {
  if (fecha === fechaDeHoy(0)) return "Hoy";
  if (fecha === fechaDeHoy(1)) return "Ayer";

  let partes = fecha.split("-");
  return Number(partes[2]) + " de " + MESES_HISTORIAL[Number(partes[1]) - 1] + " de " + partes[0];
}

// Solo se muestra lo de la propiedad actual y lo de la propia cuenta
function eventoVisible(evento) {
  let correo = localStorage.getItem("usuarioActual");

  if (evento.propiedadId === undefined) {
    return true;
  }

  return evento.propiedadId === idPropiedadActual() || (evento.propiedadId === 0 && evento.correo === correo);
}

function crearTarjetaEvento(evento) {
  let modulo = moduloDe(evento);
  let quien = evento.usuario ? "por " + evento.usuario : "";
  let cuando = evento.hora ? evento.hora : "";

  return `
    <div class="tarjeta p-3 rounded-4 d-flex align-items-center gap-3">
      <div class="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style="background-color: ${fondos[evento.color] || fondos.info}; width: 42px; height: 42px;">
        <i class="bi ${textoSeguro(evento.icono)} fs-5 text-${textoSeguro(evento.color)}"></i>
      </div>
      <div class="flex-grow-1">
        <p class="m-0 fw-bold text-white">${textoSeguro(evento.titulo)}</p>
        <p class="m-0 small texto_gris">${textoSeguro(evento.detalle)}</p>
        <p class="m-0 texto_gris" style="font-size: 0.75rem;">${textoSeguro(NOMBRES_MODULO[modulo])}${quien ? " • " + textoSeguro(quien) : ""}</p>
      </div>
      <span class="texto_gris small flex-shrink-0">${cuando}</span>
    </div>`;
}

function mostrarHistorial() {
  if (protegerPagina() === false) {
    return;
  }

  let texto = document.getElementById("buscarEvento").value.trim().toLowerCase();
  let eventos = obtenerHistorial().filter(function (evento) {
    if (!eventoVisible(evento)) return false;
    if (filtroActual !== "todos" && moduloDe(evento) !== filtroActual) return false;
    if (texto === "") return true;
    return (evento.titulo + " " + evento.detalle + " " + (evento.usuario || "")).toLowerCase().includes(texto);
  });

  // agrupados por día (el historial ya viene del más nuevo al más viejo)
  let html = "";
  let diaAnterior = "";

  for (let i = 0; i < eventos.length; i++) {
    if (eventos[i].fecha !== diaAnterior) {
      if (diaAnterior !== "") {
        html += "</div>";
      }
      diaAnterior = eventos[i].fecha;
      html += `<p class="mb-2 mt-3 text-white fw-bold small">${tituloDelDia(diaAnterior)}</p><div class="d-flex flex-column gap-2">`;
    }
    html += crearTarjetaEvento(eventos[i]);
  }

  if (diaAnterior !== "") {
    html += "</div>";
  }

  document.getElementById("listaHistorial").innerHTML = html || '<p class="texto_gris">Todavía no hay acciones registradas' + (filtroActual !== "todos" ? " en " + NOMBRES_MODULO[filtroActual] : "") + ".</p>";
}

// ----- filtros por módulo -----
let botones = document.querySelectorAll("button[data-filtro]");

for (let i = 0; i < botones.length; i++) {
  botones[i].addEventListener("click", function () {
    filtroActual = this.getAttribute("data-filtro");

    for (let j = 0; j < botones.length; j++) {
      botones[j].className = "boton_acceso border-0 py-1 px-3 rounded-4";
    }
    this.className = "btn_nuevo border-0 py-1 px-3";

    mostrarHistorial();
  });
}

document.getElementById("buscarEvento").addEventListener("input", mostrarHistorial);

mostrarHistorial();
