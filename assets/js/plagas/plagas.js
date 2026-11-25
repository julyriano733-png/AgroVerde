// pantalla principal de plagas: muestra el aviso, el resumen y la lista

const aviso_plagas = document.getElementById("aviso_plagas");
const resumen_alertas = document.getElementById("resumen_alertas");
const lista_plagas = document.getElementById("lista_plagas");
const texto_notas = document.getElementById("texto_notas");
const modal_notas = new bootstrap.Modal(document.getElementById("modal_notas"));

// muestra el mensaje que llega por la url (guardada, modificada, inhabilitada)
function mostrar_aviso() {
    const parametros = new URLSearchParams(window.location.search);
    const mensaje = parametros.get("mensaje");

    const textos = {
        guardada: "Plaga guardada correctamente.",
        modificada: "Plaga modificada correctamente.",
        inhabilitada: "Plaga inhabilitada correctamente."
    };

    if (textos[mensaje] === undefined) return;

    aviso_plagas.innerHTML =
        '<div class="alert alert-success" role="alert">' + textos[mensaje] + "</div>";
}

// tarjeta de resumen: una línea por plaga (punto rojo si está avanzada)
function mostrar_resumen(lista) {
    if (lista.length === 0) {
        resumen_alertas.innerHTML =
            '<div class="d-flex align-items-center">' +
            '<div class="punto_verde_pequeno me-2"></div>' +
            '<span class="small">No hay plagas activas</span>' +
            "</div>";
        return;
    }

    let html = "";
    lista.forEach(function (plaga, posicion) {
        const punto = plaga.estado === "Avanzada" ? "punto_rojo" : "punto_verde_pequeno";
        const margen = posicion < lista.length - 1 ? " mb-2" : "";

        html +=
            '<div class="d-flex align-items-center' + margen + '">' +
            '<div class="' + punto + ' me-2"></div>' +
            '<span class="small">' + escapar_html(plaga.nombre) + " - " + escapar_html(plaga.ubicacion) + "</span>" +
            "</div>";
    });
    resumen_alertas.innerHTML = html;
}

// una tarjeta por cada plaga habilitada
function mostrar_lista(lista) {
    if (lista.length === 0) {
        lista_plagas.innerHTML = '<p class="text-white">No hay plagas registradas.</p>';
        return;
    }

    let html = "";
    lista.forEach(function (plaga) {
        html +=
            '<div class="col-12 col-md-6">' +
            '<div class="tarjeta p-3 rounded-4 d-flex flex-column justify-content-between h-100">' +
            '<div class="d-flex justify-content-between align-items-start mb-2">' +
            "<div>" +
            '<h5 class="m-0 text-white fw-bold">' + escapar_html(plaga.ubicacion) + "</h5>" +
            '<span class="insignia ' + clase_insignia(plaga.estado) + ' mt-2 d-inline-block">' + escapar_html(plaga.estado) + "</span>" +
            "</div>" +
            '<div class="text-end">' +
            '<p class="m-0 fw-bold">' + escapar_html(plaga.nombre) + "</p>" +
            '<p class="m-0 small texto_gris">' + formatear_fecha(plaga.fecha) + "</p>" +
            "</div>" +
            "</div>" +
            '<div class="d-flex gap-2 mt-3">' +
            '<button type="button" class="btn_notas boton_notas text-center flex-fill" data-id="' + plaga.id + '">Notas</button>' +
            '<a href="modificar-plaga.html?id=' + plaga.id + '" class="btn_nuevo text-center text-decoration-none flex-fill">Modificar</a>' +
            "</div>" +
            "</div>" +
            "</div>";
    });
    lista_plagas.innerHTML = html;
}

// abre la ventana con las notas de la plaga
lista_plagas.addEventListener("click", function (evento) {
    const boton = evento.target.closest(".boton_notas");
    if (boton === null) return;

    const id = Number(boton.dataset.id);
    const plaga = obtener_plagas().find(function (p) { return p.id === id; });

    texto_notas.textContent = plaga ? plaga.notas : "Sin notas.";
    modal_notas.show();
});

// inicio: solo se muestran las plagas habilitadas
const plagas_activas = obtener_plagas().filter(function (plaga) { return plaga.habilitada; });
mostrar_aviso();
mostrar_resumen(plagas_activas);
mostrar_lista(plagas_activas);