const contenido = document.getElementById("contenido_modificar");
const formulario = document.getElementById("formulario_plaga");
const campo_fecha = document.getElementById("fecha");
const aviso_error = document.getElementById("aviso_error");

// el id de la plaga llega en la direccion: modificar-plaga.html?id=2
const parametros = new URLSearchParams(window.location.search);
const id_plaga = Number(parametros.get("id"));

// se busca la plaga en la lista guardada
const lista = obtener_plagas();
const habilitadas_mod = lista.filter(function (p) { return p.habilitada; });

// si no viene el id y hay varias, se pide elegir cuál modificar (si hay una sola, se usa esa)
const pidio_elegir = !parametros.get("id") && typeof pedirElegir === "function" &&
    pedirElegir("¿Qué plaga quieres modificar?", habilitadas_mod.map(function (p) { return { id: p.id, nombre: p.nombre, detalle: p.ubicacion + " • " + p.estado }; }), "plagas.html");

const plaga = parametros.get("id") ? lista.find(function (p) { return p.id === id_plaga && p.habilitada; }) : habilitadas_mod[0];

if (pidio_elegir) {
    // la ventana para elegir ya está en pantalla
} else if (!plaga) {
    // si no existe (o ya esta inhabilitada) se avisa y se ofrece volver
    contenido.innerHTML = `
    <p class="text-center mb-3">No se encontró la plaga que quieres modificar.</p>
    <a href="plagas.html" class="btn_nuevo d-block text-center text-decoration-none py-2">Volver a plagas</a>`;
} else {
    iniciar_pantalla();
}

function iniciar_pantalla() {
    // la fecha de inicio no puede ser mayor a la de hoy
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    campo_fecha.max = anio + "-" + mes + "-" + dia;

    mostrar_datos_actuales();

    // cuando se toca "Actualizar Información"
    formulario.addEventListener("submit", function (evento) {
        // se evita k la pagina se recargue sola
        evento.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const ubicacion = document.getElementById("ubicacion").value.trim();

        // no se aceptan campos con solo espacios
        if (nombre === "" || ubicacion === "") {
            aviso_error.textContent = "El nombre y la ubicación no pueden estar vacíos.";
            aviso_error.classList.remove("d-none");
            return;
        }

        // se actualizan los datos de la plaga y se guarda la lista completa
        plaga.nombre = nombre;
        plaga.fecha = campo_fecha.value;
        plaga.ubicacion = ubicacion;
        plaga.estado = document.getElementById("estado").value;
        plaga.notas = document.getElementById("notas").value.trim();

        guardar_plagas(lista);
        registrarEvento("Plaga modificada", plaga.nombre + " en " + plaga.ubicacion + " (" + plaga.estado + ")", "cultivos", "bi-pencil-square", "info");

        // se vuelve a la lista con el mensaje de confirmacion
        window.location.href = "plagas.html?mensaje=modificada";
    });
}

// llena el resumen de arriba y el formulario con los datos actuales
function mostrar_datos_actuales() {
    // resumen
    document.getElementById("resumen_ubicacion").textContent = plaga.ubicacion;
    document.getElementById("resumen_nombre").textContent = plaga.nombre;
    document.getElementById("resumen_estado").textContent = plaga.estado;
    document.getElementById("resumen_estado").className = "insignia " + clase_insignia(plaga.estado);
    document.getElementById("resumen_fecha").textContent = formatear_fecha(plaga.fecha);

    // formulario
    document.getElementById("nombre").value = plaga.nombre;
    campo_fecha.value = plaga.fecha;
    document.getElementById("ubicacion").value = plaga.ubicacion;
    document.getElementById("estado").value = plaga.estado;
    document.getElementById("notas").value = plaga.notas;
}