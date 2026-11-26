// conexion.js
// Muestra un aviso arriba de la pantalla cuando no hay internet
// y otro cuando la conexión vuelve. Se carga en todas las páginas.

// Los estilos van aquí mismo para que el aviso se vea aunque no carguen Bootstrap ni los CSS
function ponerEstilosConexion() {
  let estilos = document.createElement("style");
  estilos.textContent = `
    .aviso-conexion { position: fixed; top: 0; left: 0; right: 0; z-index: 3000; display: flex; align-items: flex-start; gap: 12px;
      padding: 12px 16px; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-size: 0.9rem; line-height: 1.35;
      color: #ffffff; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35); transform: translateY(-110%); transition: transform 0.3s ease; }
    .aviso-conexion--visible { transform: translateY(0); }
    .aviso-conexion--sin { background-color: #9c4a46; }
    .aviso-conexion--con { background-color: #1ea850; color: #091c12; }
    .aviso-conexion__icono { font-size: 1.3rem; line-height: 1; }
    .aviso-conexion__texto { flex: 1; }
    .aviso-conexion__texto strong { display: block; }
    .aviso-conexion__cerrar { background: none; border: none; color: inherit; font-size: 1.4rem; line-height: 1; cursor: pointer; min-width: 40px; min-height: 40px; }
  `;
  document.head.appendChild(estilos);
}

function crearAvisoConexion() {
  let aviso = document.createElement("div");
  aviso.className = "aviso-conexion";
  aviso.setAttribute("role", "status");
  aviso.setAttribute("aria-live", "polite");
  aviso.innerHTML = `
    <span class="aviso-conexion__icono" aria-hidden="true"></span>
    <div class="aviso-conexion__texto"><strong></strong><span></span></div>
    <button type="button" class="aviso-conexion__cerrar" aria-label="Cerrar aviso">&times;</button>`;
  document.body.appendChild(aviso);

  aviso.querySelector(".aviso-conexion__cerrar").addEventListener("click", function () {
    aviso.classList.remove("aviso-conexion--visible");
  });

  return aviso;
}

function iniciarAvisoConexion() {
  ponerEstilosConexion();

  let aviso = crearAvisoConexion();
  let temporizador = null;

  function mostrar(conInternet) {
    clearTimeout(temporizador);

    aviso.classList.remove("aviso-conexion--sin", "aviso-conexion--con");
    aviso.classList.add(conInternet ? "aviso-conexion--con" : "aviso-conexion--sin");

    aviso.querySelector(".aviso-conexion__icono").textContent = conInternet ? "✓" : "⚠";
    aviso.querySelector("strong").textContent = conInternet ? "Conexión restablecida" : "Sin conexión a internet";
    aviso.querySelector(".aviso-conexion__texto span").textContent = conInternet
      ? "Ya tienes internet otra vez. El clima se volverá a actualizar."
      : "Puedes seguir trabajando: lo que guardes queda en este dispositivo. El clima muestra el último dato guardado.";

    aviso.classList.add("aviso-conexion--visible");

    // el aviso de "restablecida" se va solo; el de "sin conexión" se queda hasta que vuelva o lo cierren
    if (conInternet) {
      temporizador = setTimeout(function () {
        aviso.classList.remove("aviso-conexion--visible");
      }, 4000);
    }
  }

  window.addEventListener("offline", function () { mostrar(false); });
  window.addEventListener("online", function () { mostrar(true); });

  // si la página se abre ya sin internet
  if (navigator.onLine === false) {
    mostrar(false);
  }
}

iniciarAvisoConexion();
