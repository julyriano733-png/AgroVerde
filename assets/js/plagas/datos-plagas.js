// datos de las plagas k se comparten entre todas las pantallas
const CLAVE_PLAGAS = "agroverde_plagas";

// plagas de ejemplo para la primera vez k se abre el proyecto
const plagas_iniciales = [
    {
        id: 1,
        nombre: "Gusano",
        fecha: "2026-06-14",
        ubicacion: "Maíz - Lote 1",
        estado: "Avanzada",
        notas: "Se observan hojas dañadas en el borde del lote. Aplicar control biológico.",
        habilitada: true
    },
    {
        id: 2,
        nombre: "Broca del café",
        fecha: "2026-06-14",
        ubicacion: "Café - Lote 2",
        estado: "Iniciada",
        notas: "Primeros frutos afectados. Revisar de nuevo en una semana.",
        habilitada: true
    }
];

// lee las plagas guardadas (si no hay ninguna, deja las de ejemplo)
function obtener_plagas() {
    const guardado = localStorage.getItem(CLAVE_PLAGAS);

    if (guardado === null) {
        guardar_plagas(plagas_iniciales);
        return plagas_iniciales;
    }

    try {
        return JSON.parse(guardado);
    } catch (error) {
        return [];
    }
}

// guarda la lista completa de plagas
function guardar_plagas(lista) {
    localStorage.setItem(CLAVE_PLAGAS, JSON.stringify(lista));
}

// busca el siguiente id k esta libre
function crear_id(lista) {
    if (lista.length === 0) return 1;
    return Math.max.apply(null, lista.map(function (plaga) { return plaga.id; })) + 1;
}

// pasa la fecha de aaaa-mm-dd a dd/mm/aaaa
function formatear_fecha(fecha) {
    const partes = fecha.split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

// evita que lo que escriba el usuario dañe el html de la pagina
function escapar_html(texto) {
    const caja = document.createElement("div");
    caja.textContent = texto;
    return caja.innerHTML;
}
// el color de la insignia depende del estado de la plaga
function clase_insignia(estado) {
    if (estado === "Avanzada") return "insignia_alerta";
    if (estado === "Controlada") return "insignia_controlada";
    return "insignia_revisar";
}