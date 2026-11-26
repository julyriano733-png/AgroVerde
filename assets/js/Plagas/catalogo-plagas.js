// las plagas del catálogo ahora están en datos-plagas.js (las usan también Nueva y Modificar plaga)

// elementos de la pagina
const lista_catalogo = document.getElementById("lista_catalogo");
const buscador = document.getElementById("buscador");
const botones_filtro = document.querySelectorAll(".filtro_tipo");
const modal_detalle = document.getElementById("modal_detalle");

// filtro k esta activo ahora
let tipo_activo = "Todas";

// quita las tildes y pasa a minusculas para k "cafe" encuentre "café"
function limpiar_texto(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// el color de la insignia depende del riesgo
function clase_riesgo(riesgo) {
    if (riesgo === "Alto") return "insignia_alerta";
    if (riesgo === "Medio") return "insignia_revisar";
    return "insignia_optimo";
}

// dibuja las tarjetas segun la busqueda y el filtro
function mostrar_catalogo() {
    const texto = limpiar_texto(buscador.value.trim());

    const resultado = catalogo.filter(function (plaga) {
        const coincide_tipo = tipo_activo === "Todas" || plaga.tipo === tipo_activo;
        const coincide_texto = limpiar_texto(plaga.nombre).includes(texto)
            || limpiar_texto(plaga.cultivo).includes(texto)
            || limpiar_texto(plaga.tipo).includes(texto);
        return coincide_tipo && coincide_texto;
    });

    if (resultado.length === 0) {
        lista_catalogo.innerHTML = '<p class="texto_gris text-center my-4">No hay plagas que coincidan con la búsqueda.</p>';
        return;
    }

    lista_catalogo.innerHTML = resultado.map(function (plaga) {
        return `
      <div class="col-12 col-md-6 col-lg-4">
        <button type="button" class="tarjeta tarjeta_catalogo p-3 rounded-4 d-flex justify-content-between align-items-center h-100"
          data-bs-toggle="modal" data-bs-target="#modal_detalle" data-indice="${catalogo.indexOf(plaga)}">
          <div>
            <div class="fw-bold text-white">${plaga.nombre}</div>
            <small class="texto_gris">${plaga.tipo} - ${plaga.cultivo}</small>
          </div>
          <span class="insignia ${clase_riesgo(plaga.riesgo)}">${plaga.riesgo}</span>
        </button>
      </div>`;
    }).join("");
}

// cuando se toca un filtro
botones_filtro.forEach(function (boton) {
    boton.addEventListener("click", function () {
        tipo_activo = boton.dataset.tipo;

        // el filtro activo se ve verde y los demas normales
        botones_filtro.forEach(function (otro) {
            otro.className = otro.dataset.tipo === tipo_activo
                ? "filtro_tipo btn_nuevo border-0 py-1 px-3"
                : "filtro_tipo boton_acceso border-0 py-1 px-3 rounded-4";
        });

        mostrar_catalogo();
    });
});

// mientras se escribe en el buscador se filtra la lista
buscador.addEventListener("input", mostrar_catalogo);

// cuando se abre la ficha se llena con los datos de la plaga k se toco
modal_detalle.addEventListener("show.bs.modal", function (evento) {
    const plaga = catalogo[Number(evento.relatedTarget.dataset.indice)];

    document.getElementById("titulo_detalle").textContent = plaga.nombre;
    document.getElementById("subtitulo_detalle").textContent = plaga.tipo + " - " + plaga.cultivo;
    document.getElementById("descripcion_detalle").textContent = plaga.descripcion;
    document.getElementById("control_detalle").textContent = plaga.control;

    const riesgo = document.getElementById("riesgo_detalle");
    riesgo.textContent = "Riesgo " + plaga.riesgo.toLowerCase();
    riesgo.className = "insignia " + clase_riesgo(plaga.riesgo);

    // el boton lleva a "Nueva plaga" con el nombre y el cultivo ya escritos
    document.getElementById("enlace_registrar").href =
        "nueva-plaga.html?nombre=" + encodeURIComponent(plaga.nombre) + "&cultivo=" + encodeURIComponent(plaga.cultivo);
});

// filtro "plagas por cultivo": los cultivos que aparecen en el catálogo
const filtro_cultivo = document.getElementById("filtro_cultivo");
const cultivos_catalogo = [];
catalogo.forEach(function (plaga) {
    plaga.cultivo.split("/").forEach(function (c) {
        if (!cultivos_catalogo.includes(c.trim())) {
            cultivos_catalogo.push(c.trim());
        }
    });
});
filtro_cultivo.innerHTML += cultivos_catalogo.map(function (c) {
    return '<option value="' + c + '">Plagas de ' + c + '</option>';
}).join("");

// al elegir un cultivo se busca por su nombre (el buscador ya filtra por cultivo afectado)
filtro_cultivo.addEventListener("change", function () {
    buscador.value = filtro_cultivo.value;
    mostrar_catalogo();
});

mostrar_catalogo();
