// historial.js
// Muestra los eventos del historial (Hoy / Ayer) y filtra por tipo

// Clase de historial.css que le toca al circulito según el color del evento
let clasesColor = {
  success: "icono-verde",
  danger: "icono-rojo",
  info: "icono-cyan"
};

// Filtro que está elegido ahora: todos, cultivos, insumos o inventario
let filtroActual = "todos";

// Crea la tarjeta de un evento
function crearTarjetaEvento(evento) {
  let tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta p-3 rounded-4 d-flex align-items-center gap-3";

  // circulito con el icono (su tamaño y colores salen de historial.css)
  let circulo = document.createElement("div");
  circulo.className = "icono-evento " + clasesColor[evento.color];

  let icono = document.createElement("i");
  icono.className = "bi " + evento.icono + " fs-5";
  circulo.appendChild(icono);

  // textos del evento (textContent para que no se ejecute código raro)
  let cajaTextos = document.createElement("div");

  let titulo = document.createElement("p");
  titulo.className = "m-0 fw-bold text-white";
  titulo.textContent = evento.titulo;

  let detalle = document.createElement("p");
  detalle.className = "m-0 small texto_gris";
  detalle.textContent = evento.detalle;

  cajaTextos.appendChild(titulo);
  cajaTextos.appendChild(detalle);
  tarjeta.appendChild(circulo);
  tarjeta.appendChild(cajaTextos);

  return tarjeta;
}

// Si una columna se quedó sin eventos, ponemos un texto de aviso
function avisarSiEstaVacia(columna) {
  if (columna.children.length === 0) {
    let aviso = document.createElement("p");
    aviso.className = "small texto_gris";
    aviso.textContent = "Sin eventos";
    columna.appendChild(aviso);
  }
}

// Dibuja el historial en las dos columnas
function mostrarHistorial() {
  // si no hay sesión, protegerPagina nos manda al login y paramos aquí
  if (protegerPagina() === false) {
    return;
  }

  let historial = obtenerHistorial();
  let hoy = fechaDeHoy(0);

  let columnaHoy = document.getElementById("eventos-hoy");
  let columnaAyer = document.getElementById("eventos-ayer");
  columnaHoy.innerHTML = "";
  columnaAyer.innerHTML = "";

  for (let i = 0; i < historial.length; i++) {
    let evento = historial[i];

    // solo dibujamos el evento si coincide con el filtro elegido
    if (filtroActual === "todos" || evento.tipo === filtroActual) {
      let tarjeta = crearTarjetaEvento(evento);

      // lo de hoy va a la izquierda; todo lo demás lo mandamos a "Ayer"
      if (evento.fecha === hoy) {
        columnaHoy.appendChild(tarjeta);
      } else {
        columnaAyer.appendChild(tarjeta);
      }
    }
  }

  avisarSiEstaVacia(columnaHoy);
  avisarSiEstaVacia(columnaAyer);
}

// ----- botones de filtro -----
let botones = document.querySelectorAll("button[data-filtro]");

for (let i = 0; i < botones.length; i++) {
  botones[i].addEventListener("click", function () {
    // guardamos cuál filtro eligió (viene en el atributo data-filtro del botón)
    filtroActual = this.getAttribute("data-filtro");

    // dejamos todos los botones "apagados"...
    for (let j = 0; j < botones.length; j++) {
      botones[j].className = "boton_acceso border-0 py-1 px-3 rounded-4";
    }

    // ...y prendemos solo el que eligió
    this.className = "btn_nuevo border-0 py-1 px-3";

    mostrarHistorial();
  });
}

mostrarHistorial();