// preferencias.js
// Pantallas de configuración: idioma, unidades de medida, alertas y soporte.
// Todo se guarda en localStorage como un objeto por pantalla.

// Lee un objeto guardado (o el de ejemplo si todavía no hay nada)
function obtenerPreferencia(clave, ejemplo) {
  let guardado = localStorage.getItem(clave);
  return guardado === null ? ejemplo : JSON.parse(guardado);
}

function guardarPreferencia(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
}

// Marca el radio que tenga ese valor
function marcarRadio(nombre, valor) {
  let radio = document.querySelector('input[name="' + nombre + '"][value="' + valor + '"]');

  if (radio !== null) {
    radio.checked = true;
  }
}

// ================== IDIOMA ==================
function activarIdioma() {
  let formulario = document.getElementById("formIdioma");

  if (formulario === null) {
    return;
  }

  let datos = obtenerPreferencia("idiomaRegion", { idioma: "Español (CO)", zonaHoraria: "America/Bogota", formatoFecha: "dd/mm/aaaa", moneda: "COP" });

  marcarRadio("idioma", datos.idioma);
  document.getElementById("zonaHoraria").value = datos.zonaHoraria;
  document.getElementById("formatoFecha").value = datos.formatoFecha;
  document.getElementById("moneda").value = datos.moneda;

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    guardarPreferencia("idiomaRegion", {
      idioma: formulario.querySelector('input[name="idioma"]:checked').value,
      zonaHoraria: document.getElementById("zonaHoraria").value,
      formatoFecha: document.getElementById("formatoFecha").value,
      moneda: document.getElementById("moneda").value
    });

    registrarEvento("Idioma y región actualizados", "Se cambiaron las preferencias", "sistema", "bi-gear", "info");
    window.location.href = "configuracion.html?mensaje=guardado";
  });
}

// ================== UNIDADES ==================
const SISTEMAS = {
  "Métrico": { unidadArea: "ha", unidadPeso: "kg", unidadVolumen: "L", unidadTemperatura: "C" },
  "Imperial": { unidadArea: "acre", unidadPeso: "lb", unidadVolumen: "gal", unidadTemperatura: "F" }
};

function activarUnidades() {
  let formulario = document.getElementById("formUnidades");

  if (formulario === null) {
    return;
  }

  let sistema = localStorage.getItem("unidades") || "Métrico";
  let detalle = obtenerPreferencia("unidadesDetalle", SISTEMAS["Métrico"]);
  let campos = ["unidadArea", "unidadPeso", "unidadVolumen", "unidadTemperatura"];

  marcarRadio("sistema", sistema);
  for (let i = 0; i < campos.length; i++) {
    document.getElementById(campos[i]).value = detalle[campos[i]];
  }

  // al elegir Métrico o Imperial se cambian todas las unidades de una vez
  formulario.addEventListener("change", function (evento) {
    if (evento.target.name === "sistema" && SISTEMAS[evento.target.value]) {
      let elegido = SISTEMAS[evento.target.value];
      for (let i = 0; i < campos.length; i++) {
        document.getElementById(campos[i]).value = elegido[campos[i]];
      }
    }

    // si se cambia una unidad suelta, el sistema pasa a "Personalizado"
    if (evento.target.tagName === "SELECT") {
      marcarRadio("sistema", "Personalizado");
    }
  });

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let nuevo = {};
    for (let i = 0; i < campos.length; i++) {
      nuevo[campos[i]] = document.getElementById(campos[i]).value;
    }

    localStorage.setItem("unidades", formulario.querySelector('input[name="sistema"]:checked').value);
    guardarPreferencia("unidadesDetalle", nuevo);
    registrarEvento("Unidades de medida actualizadas", "Se cambiaron las preferencias", "sistema", "bi-gear", "info");
    window.location.href = "configuracion.html?mensaje=guardado";
  });
}

// ================== ALERTAS ==================
function activarAlertas() {
  let formulario = document.getElementById("formAlertas");

  if (formulario === null) {
    return;
  }

  let interruptores = ["alertaPlagas", "alertaClima", "alertaStock", "alertaCosecha", "alertaReportes"];
  let datos = obtenerPreferencia("configAlertas", { alertaPlagas: true, alertaClima: true, alertaStock: true, alertaCosecha: true, alertaReportes: false, diasCosecha: 7, humedadMaxima: 80, horaResumen: "07:00" });

  for (let i = 0; i < interruptores.length; i++) {
    document.getElementById(interruptores[i]).checked = datos[interruptores[i]];
  }
  document.getElementById("diasCosecha").value = datos.diasCosecha;
  document.getElementById("humedadMaxima").value = datos.humedadMaxima;
  document.getElementById("horaResumen").value = datos.horaResumen;

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let dias = Number(document.getElementById("diasCosecha").value);
    let humedad = Number(document.getElementById("humedadMaxima").value);

    if (dias < 1 || dias > 60) {
      alert("Los días de aviso de cosecha deben estar entre 1 y 60");
      return;
    }

    if (humedad < 50 || humedad > 100) {
      alert("La humedad debe estar entre 50% y 100%");
      return;
    }

    let nuevo = { diasCosecha: dias, humedadMaxima: humedad, horaResumen: document.getElementById("horaResumen").value };
    for (let i = 0; i < interruptores.length; i++) {
      nuevo[interruptores[i]] = document.getElementById(interruptores[i]).checked;
    }

    guardarPreferencia("configAlertas", nuevo);
    registrarEvento("Configuración de alertas actualizada", "Se cambiaron las preferencias", "sistema", "bi-gear", "info");
    window.location.href = "configuracion.html?mensaje=guardado";
  });
}

// ================== SOPORTE ==================
// WhatsApp de soporte de Agro Verde
const NUMERO_SOPORTE = "https://wa.me/573204154049";
function activarSoporte() {
  let formulario = document.getElementById("formSoporte");

  if (formulario === null) {
    return;
  }

  activarBuscadorDeLista("buscarPregunta", ".pregunta");

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let asunto = document.getElementById("asuntoSoporte").value;
    let mensaje = document.getElementById("mensajeSoporte").value.trim();

    if (asunto === "") {
      alert("Selecciona el asunto de tu mensaje");
      return;
    }

    if (mensaje.length < 10) {
      alert("Cuéntanos un poco más (mínimo 10 letras)");
      return;
    }

    // el mensaje se guarda y se abre WhatsApp de soporte con el texto ya escrito
    let mensajes = obtenerLista("mensajesSoporte", []);
    let usuario = obtenerUsuarioActual();
    mensajes.push({ asunto: asunto, mensaje: mensaje, correo: usuario ? usuario.correo : "", fecha: fechaDeHoy(0) });
    guardarLista("mensajesSoporte", mensajes);

    let texto = "Hola, soy " + (usuario ? usuario.nombre + " (" + usuario.correo + ")" : "un usuario de Agro Verde") +
      ".\nAsunto: " + asunto + "\n" + mensaje;
    window.open(NUMERO_SOPORTE + "?text=" + encodeURIComponent(texto), "_blank", "noopener");
    formulario.reset();
  });
}

// las pantallas de configuración son privadas
if (protegerPagina() !== false) {
  activarIdioma();
  activarUnidades();
  activarAlertas();
  activarSoporte();
}
