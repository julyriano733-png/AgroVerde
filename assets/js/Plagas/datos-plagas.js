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

// plagas del catalogo (datos de ejemplo)
const catalogo = [
    {
        nombre: "Gusano cogollero",
        tipo: "Insecto",
        cultivo: "Maíz",
        riesgo: "Alto",
        descripcion: "Larvas k se comen las hojas jóvenes y el cogollo de la planta, dejando hojas agujereadas y excrementos.",
        control: "Revisar el lote cada semana, usar control biológico y eliminar las malezas k le sirven de refugio."
    },
    {
        nombre: "Roya del café",
        tipo: "Hongo",
        cultivo: "Café",
        riesgo: "Alto",
        descripcion: "Manchas amarillas o anaranjadas en el envés de las hojas, k terminan en caída de hojas.",
        control: "Sembrar variedades resistentes, podar, mantener buena sombra y nutrición y aplicar fungicida solo si hace falta."
    },
    {
        nombre: "Áfido verde",
        tipo: "Insecto",
        cultivo: "Frijol",
        riesgo: "Medio",
        descripcion: "Insectos pequeños verdes k se juntan en los brotes tiernos y chupan la savia de la planta.",
        control: "Revisar los brotes con frecuencia, usar jabón potásico y favorecer a sus enemigos naturales, como las mariquitas."
    },
    {
        nombre: "Ácaro rojo",
        tipo: "Ácaro",
        cultivo: "Tomate",
        riesgo: "Medio",
        descripcion: "Puntos amarillos en las hojas y telarañas muy finas en el envés, sobre todo en clima seco y caliente.",
        control: "Mantener humedad en el cultivo, evitar el polvo y usar aceites o acaricidas suaves."
    },
    {
        nombre: "Antracnosis",
        tipo: "Hongo",
        cultivo: "Frijol/Maíz",
        riesgo: "Bajo",
        descripcion: "Manchas oscuras y hundidas en hojas, tallos y vainas, favorecidas por la humedad.",
        control: "Usar semilla sana, rotar cultivos y evitar mojar demasiado las hojas al regar."
    },
    {
        nombre: "Marchitez bacteriana",
        tipo: "Bacteria",
        cultivo: "Tomate",
        riesgo: "Alto",
        descripcion: "La planta se marchita de repente aunque el suelo tenga agua, y el tallo por dentro se ve café.",
        control: "Rotar cultivos, mejorar el drenaje, retirar las plantas enfermas y desinfectar las herramientas."
    }
];

// lee las plagas guardadas (si no hay ninguna, deja las de ejemplo)
// cada propiedad tiene sus plagas: la principal (id 3) usa la llave normal
// la propiedad actual se guarda por usuario: "propiedadActual_correo"
function id_propiedad_actual() {
    const correo = localStorage.getItem("usuarioActual");
    return localStorage.getItem(correo === null ? "propiedadActual" : "propiedadActual_" + correo);
}

function clave_plagas() {
    const id = typeof idPropiedadActual === "function" ? String(idPropiedadActual()) : id_propiedad_actual();
    return CLAVE_PLAGAS + "_prop" + id;
}

function obtener_plagas() {
    const guardado = localStorage.getItem(clave_plagas());

    if (guardado === null) {
        // cada propiedad empieza sin plagas registradas
        const iniciales = [];
        guardar_plagas(iniciales);
        return iniciales;
    }

    try {
        return JSON.parse(guardado);
    } catch (error) {
        return [];
    }
}

// guarda la lista completa de plagas
function guardar_plagas(lista) {
    localStorage.setItem(clave_plagas(), JSON.stringify(lista));
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

// evita k lo k escriba el usuario dañe el html de la pagina
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

// llena el select de "Ubicación / Cultivo" con los cultivos registrados
// (y con las ubicaciones que ya tengan las plagas, para no perder ninguna)
function llenar_select_cultivos() {
    const select = document.getElementById("ubicacion");

    if (!select || select.tagName !== "SELECT") {
        return;
    }

    const id = typeof idPropiedadActual === "function" ? String(idPropiedadActual()) : id_propiedad_actual();
    const llave = "cultivos_prop" + id;
    const guardados = JSON.parse(localStorage.getItem(llave) || "[]");
    let nombres = guardados.filter(function (c) { return c.habilitado; }).map(function (c) { return c.nombre; });

    if (nombres.length === 0) {
        nombres = ["Sin cultivos registrados"];
    }

    obtener_plagas().forEach(function (plaga) {
        if (!nombres.includes(plaga.ubicacion)) {
            nombres.push(plaga.ubicacion);
        }
    });

    select.innerHTML = nombres.map(function (nombre) {
        return `<option value="${escapar_html(nombre)}">${escapar_html(nombre)}</option>`;
    }).join("");
}

// elige en el select el cultivo que contenga el texto (ej. "Café" -> "Café - Lote 2")
function elegir_cultivo(texto) {
    const select = document.getElementById("ubicacion");
    // sin tildes para que "Frijol" encuentre "Fríjol"
    const limpiar = function (t) { return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };
    const buscado = limpiar(texto.split("/")[0]);

    for (let i = 0; i < select.options.length; i++) {
        if (limpiar(select.options[i].value).includes(buscado)) {
            select.selectedIndex = i;
            return;
        }
    }
}

llenar_select_cultivos();

// llena el select "Elegir del catálogo" de Nueva y Modificar plaga.
// Al elegir una plaga se escribe su nombre (y si no hay notas, cómo controlarla).
function llenar_select_catalogo() {
    const select = document.getElementById("plaga_catalogo");

    if (!select) {
        return;
    }

    // las opciones se agrupan por tipo (Insecto, Hongo, Ácaro...)
    const tipos = [];
    catalogo.forEach(function (plaga) {
        if (!tipos.includes(plaga.tipo)) {
            tipos.push(plaga.tipo);
        }
    });

    select.innerHTML = '<option value="">Otra plaga (escribirla a mano)</option>' + tipos.map(function (tipo) {
        const opciones = catalogo.filter(function (p) { return p.tipo === tipo; }).map(function (p) {
            return `<option value="${escapar_html(p.nombre)}">${escapar_html(p.nombre)} - ${escapar_html(p.cultivo)} (riesgo ${p.riesgo.toLowerCase()})</option>`;
        }).join("");
        return `<optgroup label="${escapar_html(tipo)}">${opciones}</optgroup>`;
    }).join("");

    const campo_nombre = document.getElementById("nombre");
    const campo_notas = document.getElementById("notas");

    select.addEventListener("change", function () {
        const plaga = catalogo.find(function (p) { return p.nombre === select.value; });

        if (!plaga) {
            campo_nombre.focus();
            return;
        }

        campo_nombre.value = plaga.nombre;
        if (campo_notas.value.trim() === "") {
            campo_notas.value = "Control recomendado: " + plaga.control;
        }
    });

    // si escriben un nombre a mano, el select se pone en la plaga que coincida (o en "Otra")
    campo_nombre.addEventListener("input", function () {
        marcar_en_catalogo(select, campo_nombre.value);
    });

    // cuando la página termina de cargar (Modificar ya puso el nombre) se marca la plaga
    document.addEventListener("DOMContentLoaded", function () {
        marcar_en_catalogo(select, campo_nombre.value);
    });
}

function marcar_en_catalogo(select, nombre) {
    const plaga = catalogo.find(function (p) { return p.nombre.toLowerCase() === nombre.trim().toLowerCase(); });
    select.value = plaga ? plaga.nombre : "";
}

llenar_select_catalogo();
