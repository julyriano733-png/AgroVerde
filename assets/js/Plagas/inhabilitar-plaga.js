const lista_opciones = document.getElementById("lista_opciones");
const buscador = document.getElementById("buscador");
const formulario = document.getElementById("formulario_inhabilitar");
const aviso_error = document.getElementById("aviso_error");
const boton_inhabilitar = document.getElementById("boton_inhabilitar");
const texto_confirmar = document.getElementById("texto_confirmar");
const boton_confirmar = document.getElementById("boton_confirmar");
const modal_confirmar = new bootstrap.Modal(document.getElementById("modal_confirmar"));

// lista completa guardada y la plaga k el usuario va eligiendo
const lista = obtener_plagas();
let id_seleccionado = null;

// dibuja las opciones, filtradas por lo k se escribio en el buscador
function mostrar_opciones() {
    const habilitadas = lista.filter(function (plaga) { return plaga.habilitada; });

    // si no queda ninguna plaga se avisa y se bloquea el boton
    if (habilitadas.length === 0) {
        lista_opciones.innerHTML = '<p class="texto_gris text-center my-3">No hay plagas para inhabilitar.</p>';
        boton_inhabilitar.disabled = true;
        return;
    }

    const texto = buscador.value.trim().toLowerCase();
    const coincidencias = habilitadas.filter(function (plaga) {
        return plaga.nombre.toLowerCase().includes(texto) || plaga.ubicacion.toLowerCase().includes(texto);
    });

    if (coincidencias.length === 0) {
        lista_opciones.innerHTML = '<p class="texto_gris text-center my-3">No hay plagas que coincidan con la búsqueda.</p>';
        return;
    }

    lista_opciones.innerHTML = coincidencias.map(function (plaga) {
        const marcada = plaga.id === id_seleccionado ? "checked" : "";
        return `
      <label class="tarjeta opcion_plaga p-3 rounded-4 d-flex align-items-center gap-3 cursor-pointer">
        <input type="radio" class="form-check-input radio_custom m-0" name="plaga" value="${plaga.id}" ${marcada}>
        <div class="flex-grow-1">
          <div class="fw-bold text-white">${escapar_html(plaga.nombre)}</div>
          <small class="texto_gris">${escapar_html(plaga.ubicacion)}</small>
        </div>
        <span class="insignia ${clase_insignia(plaga.estado)}">${plaga.estado}</span>
      </label>`;
    }).join("");
}

// cuando se elige una plaga se guarda cual es
lista_opciones.addEventListener("change", function (evento) {
    id_seleccionado = Number(evento.target.value);
    aviso_error.classList.add("d-none");
});

// mientras se escribe en el buscador se filtra la lista
buscador.addEventListener("input", mostrar_opciones);

// cuando se toca "Inhabilitar Plaga" se pide confirmacion
formulario.addEventListener("submit", function (evento) {
    // se evita k la pagina se recargue sola
    evento.preventDefault();

    if (id_seleccionado === null) {
        aviso_error.textContent = "Selecciona la plaga que quieres inhabilitar.";
        aviso_error.classList.remove("d-none");
        return;
    }

    const plaga = lista.find(function (p) { return p.id === id_seleccionado; });
    texto_confirmar.textContent = "¿Seguro que quieres inhabilitar la plaga \"" + plaga.nombre + "\" de " + plaga.ubicacion + "?";
    modal_confirmar.show();
});

// cuando se confirma, la plaga queda inhabilitada (no se borra)
boton_confirmar.addEventListener("click", function () {
    const plaga = lista.find(function (p) { return p.id === id_seleccionado; });
    marcarInhabilitado(plaga, "habilitada");
    registrarEvento("Plaga inhabilitada", plaga.nombre + " en " + plaga.ubicacion, "cultivos", "bi-slash-circle", "danger");

    guardar_plagas(lista);

    // se vuelve a la lista con el mensaje de confirmacion
    window.location.href = "plagas.html?mensaje=inhabilitada";
});

mostrar_opciones();