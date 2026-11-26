// pantalla principal de plagas: resumen de alertas y tarjetas de las plagas habilitadas
const resumen_plagas = document.getElementById("resumen_plagas");
const lista_plagas = document.getElementById("lista_plagas");
const modal_notas = new bootstrap.Modal(document.getElementById("modal_notas"));

const plagas = obtener_plagas().filter(function (plaga) { return plaga.habilitada; });

// el punto del resumen depende del estado de la plaga
function punto_estado(estado) {
    if (estado === "Avanzada") return "punto_rojo";
    if (estado === "Controlada") return "punto_verde_pequeno";
    return "punto_amarillo_pequeno";
}

function texto_estado(plaga) {
    if (plaga.estado === "Avanzada") return "Plaga detectada en " + plaga.ubicacion;
    if (plaga.estado === "Controlada") return plaga.ubicacion + " libre de amenaza";
    return "Control de plaga en proceso - " + plaga.ubicacion;
}

function mostrar_plagas() {
    if (plagas.length === 0) {
        resumen_plagas.innerHTML = '<span class="small">No hay plagas registradas. ¡Todo en orden!</span>';
        lista_plagas.innerHTML = "";
        return;
    }

    // resumen de arriba: una línea por plaga
    resumen_plagas.innerHTML = plagas.map(function (plaga, i) {
        const margen = i < plagas.length - 1 ? " mb-2" : "";
        return `
      <div class="d-flex align-items-center${margen}">
        <div class="${punto_estado(plaga.estado)} me-2"></div>
        <span class="small">${escapar_html(texto_estado(plaga))}</span>
      </div>`;
    }).join("");

    // tarjetas de cada plaga
    lista_plagas.innerHTML = plagas.map(function (plaga) {
        return `
      <div class="col-12 col-md-6">
        <div class="tarjeta p-3 rounded-4 d-flex flex-column justify-content-between h-100">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 class="m-0 text-white fw-bold">${escapar_html(plaga.ubicacion)}</h5>
              <span class="insignia ${clase_insignia(plaga.estado)} mt-2 d-inline-block">${plaga.estado}</span>
            </div>
            <div class="text-end">
              <p class="m-0 fw-bold">${escapar_html(plaga.nombre)}</p>
              <p class="m-0 small texto_gris">${formatear_fecha(plaga.fecha)}</p>
            </div>
          </div>
          <div class="d-flex gap-2 mt-3">
            <button type="button" class="btn_notas text-center flex-fill border-0" data-id="${plaga.id}">Notas</button>
            <a href="modificar-plaga.html?id=${plaga.id}" class="btn_nuevo text-center text-decoration-none flex-fill">Modificar</a>
          </div>
        </div>
      </div>`;
    }).join("");
}

// el boton "Notas" abre la ventana con las notas de esa plaga
lista_plagas.addEventListener("click", function (evento) {
    const boton = evento.target.closest(".btn_notas");

    if (!boton) {
        return;
    }

    const plaga = plagas.find(function (p) { return p.id === Number(boton.dataset.id); });
    document.getElementById("titulo_notas").textContent = "Notas - " + plaga.nombre;
    document.getElementById("texto_notas").textContent = plaga.notas || "Sin notas.";
    modal_notas.show();
});

// las plagas en estado "Avanzada" llegan como notificación (si la alerta está activa)
if (alertaActiva("alertaPlagas")) {
    plagas.filter(function (plaga) { return plaga.estado === "Avanzada"; }).forEach(function (plaga) {
        crearNotificacion("Plaga avanzada", plaga.nombre + " en " + plaga.ubicacion + " necesita control", "plaga_" + idPropiedadActual() + "_" + plaga.id);
    });
}

mostrar_plagas();

// buscador: esconde las tarjetas que no coinciden con lo escrito
const buscador_plagas = document.getElementById("buscador_plagas");
buscador_plagas.addEventListener("input", function () {
    const texto = buscador_plagas.value.trim().toLowerCase();
    lista_plagas.querySelectorAll(".col-12").forEach(function (tarjeta) {
        tarjeta.classList.toggle("d-none", !tarjeta.textContent.toLowerCase().includes(texto));
    });
});
