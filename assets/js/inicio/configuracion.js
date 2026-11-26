// configuracion.js
// Pantalla de configuración: unidades de medida, opciones pendientes y cerrar sesión

function iniciarConfiguracion() {
  // si no hay sesión, protegerPagina nos manda al login y paramos aquí
  if (protegerPagina() === false) {
    return;
  }

  // ----- unidades de medida (se eligen en unidades.html) -----
  let opcionUnidades = document.getElementById("opcion-unidades");
  let textoUnidades = document.getElementById("texto-unidades");

  let unidades = localStorage.getItem("unidades");
  if (unidades === null) {
    unidades = "Métrico";
  }
  textoUnidades.textContent = unidades;

  // el idioma elegido en "Idioma y regionalización"
  let idioma = JSON.parse(localStorage.getItem("idiomaRegion") || "null");
  if (idioma !== null) {
    document.getElementById("texto-idioma").textContent = idioma.idioma;
  }

  // ----- opciones que todavía no tienen pantalla (por ahora ninguna) -----
  let pendientes = document.querySelectorAll(".pendiente");

  for (let i = 0; i < pendientes.length; i++) {
    pendientes[i].addEventListener("click", function (evento) {
      evento.preventDefault();
      alert("Esta opción estará disponible pronto");
    });
  }

  // ----- cerrar sesión -----
  let botonCerrar = document.getElementById("boton-cerrar-sesion");
  botonCerrar.addEventListener("click", preguntarCerrarSesion);
}

iniciarConfiguracion();