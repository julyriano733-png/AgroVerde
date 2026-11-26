const formulario = document.getElementById("formulario_plaga");
const campo_fecha = document.getElementById("fecha");
const aviso_error = document.getElementById("aviso_error");

// la fecha de inicio no puede ser mayor a la de hoy
const hoy = new Date();
const anio = hoy.getFullYear();
const mes = String(hoy.getMonth() + 1).padStart(2, "0");
const dia = String(hoy.getDate()).padStart(2, "0");
campo_fecha.max = anio + "-" + mes + "-" + dia;

// cuando se toca "Guardar plaga"
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

    // se agrega la nueva plaga a la lista guardada
    const lista = obtener_plagas();

    lista.push({
        id: crear_id(lista),
        nombre: nombre,
        fecha: campo_fecha.value,
        ubicacion: ubicacion,
        estado: document.getElementById("estado").value,
        notas: document.getElementById("notas").value.trim(),
        habilitada: true
    });

    guardar_plagas(lista);
    registrarEvento("Plaga registrada", nombre + " en " + ubicacion, "cultivos", "bi-bug", "danger");

    // se vuelve a la lista con el mensaje de confirmacion
    window.location.href = "plagas.html?mensaje=guardada";
});
// si se llega desde el catalogo, el nombre y el cultivo ya vienen escritos
const parametros = new URLSearchParams(window.location.search);

if (parametros.get("nombre")) {
    document.getElementById("nombre").value = parametros.get("nombre");
}
if (parametros.get("cultivo")) {
    elegir_cultivo(parametros.get("cultivo"));
}