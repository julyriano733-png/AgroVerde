// datos-insumos.js
// Datos de insumos, proveedores y usos que comparten las pantallas de Insumos
// (y el reporte de consumo). Se guardan en localStorage con las funciones de comun.js.

const CLAVE_INSUMOS = "insumos";
const CLAVE_PROVEEDORES = "proveedores";
const CLAVE_USOS = "usosInsumos";

function insumosDeEjemplo() {
  return [
    { id: 1, nombre: "Fertilizante NPK", categoria: "Fertilizante", cantidad: 18, unidad: "sacos", minimo: 5, precio: 63000, codigo: "7501234567890", llegada: "2026-03-10", caducidad: "2027-03-10", cultivo: "Maíz - Lote 1", descripcion: "Fertilizante NPK de uso agrícola que aporta nitrógeno, fósforo y potasio, esenciales para el crecimiento, desarrollo y producción de los cultivos. Recomendado para mejorar la nutrición del suelo y favorecer un desarrollo saludable de las plantas.", habilitado: true },
    { id: 2, nombre: "Herbicida selectivo", categoria: "Herbicida", cantidad: 9, unidad: "L", minimo: 3, precio: 45000, codigo: "7501234567891", llegada: "2026-04-02", caducidad: "2027-04-02", cultivo: "Maíz - Lote 1", descripcion: "Herbicida selectivo para el control de malezas sin afectar el cultivo.", habilitado: true },
    { id: 3, nombre: "Fungicida orgánico", categoria: "Fungicida", cantidad: 3, unidad: "und", minimo: 5, precio: 35000, codigo: "7501234567892", llegada: "2026-05-20", caducidad: "2026-12-20", cultivo: "Café - Lote 2", descripcion: "Fungicida orgánico para la prevención de hongos en hojas y tallos.", habilitado: true },
    { id: 4, nombre: "Semilla de maíz", categoria: "Semilla", cantidad: 50, unidad: "kg", minimo: 10, precio: 12000, codigo: "7501234567893", llegada: "2026-01-15", caducidad: "2027-01-15", cultivo: "Maíz - Lote 1", descripcion: "Semilla de maíz certificada para siembra.", habilitado: true }
  ];
}

function proveedoresDeEjemplo() {
  return [
    { id: 1, nombre: "Agroinsumos del Valle", telefono: "310 000 0001", correo: "ventas@agrovalle.com", insumos: "Urea, NPK", llegada: "" },
    { id: 2, nombre: "Fertisanos S.A.S", telefono: "310 000 0002", correo: "contacto@fertisanos.com", insumos: "Fungicidas", llegada: "" },
    { id: 3, nombre: "Campo Verde Ltda", telefono: "310 000 0003", correo: "info@campoverde.com", insumos: "Cal, Abonos", llegada: "" }
  ];
}

// Cada vez que se usa un insumo en un cultivo queda un registro aquí
function usosDeEjemplo() {
  return [
    { id: 1, insumo: "Fertilizante NPK", cultivo: "Maíz - Lote 1", cantidad: 4, unidad: "sacos", fecha: fechaDeHoy(3), observaciones: "Aplicado en floración" },
    { id: 2, insumo: "Herbicida selectivo", cultivo: "Maíz - Lote 1", cantidad: 3, unidad: "L", fecha: fechaDeHoy(5), observaciones: "Control de maleza" },
    { id: 3, insumo: "Fungicida orgánico", cultivo: "Café - Lote 2", cantidad: 1, unidad: "und", fecha: fechaDeHoy(9), observaciones: "Prevención de hongos" },
    { id: 4, insumo: "Semilla de maíz", cultivo: "Maíz - Lote 1", cantidad: 25, unidad: "kg", fecha: fechaDeHoy(20), observaciones: "Siembra" },
    { id: 5, insumo: "Fertilizante NPK", cultivo: "Fríjol - Lote 3", cantidad: 2, unidad: "sacos", fecha: fechaDeHoy(12), observaciones: "Fertilización de arranque" }
  ];
}

function obtenerInsumos() {
  return obtenerLista(CLAVE_INSUMOS, insumosDeEjemplo());
}

function insumosHabilitados() {
  return obtenerInsumos().filter(function (insumo) { return insumo.habilitado; });
}

// Solo los proveedores activos (los eliminados quedan en "Inhabilitados")
function obtenerProveedores() {
  return todosLosProveedores().filter(function (p) { return p.habilitado !== false; });
}

function todosLosProveedores() {
  return obtenerLista(CLAVE_PROVEEDORES, proveedoresDeEjemplo());
}

// Cada uso guarda el id del insumo (insumoId). Los usos viejos solo tenían el nombre:
// se les pone el id buscando por nombre, así cambiar el nombre no borra el historial.
function obtenerUsosInsumos() {
  let usos = obtenerLista(CLAVE_USOS, usosDeEjemplo());
  let insumos = obtenerInsumos();
  let cambio = false;

  for (let i = 0; i < usos.length; i++) {
    if (usos[i].insumoId === undefined) {
      let insumo = insumoPorNombre(insumos, usos[i].insumo);
      usos[i].insumoId = insumo !== null ? insumo.id : null;
      cambio = true;
    }
  }

  if (cambio) {
    guardarLista(CLAVE_USOS, usos);
  }

  return usos;
}

// ¿Este uso es de este insumo? (por id; si no tiene id, por nombre)
function usoDelInsumo(uso, insumo) {
  return uso.insumoId !== undefined && uso.insumoId !== null ? uso.insumoId === insumo.id : uso.insumo === insumo.nombre;
}

// Categorías de insumos (se eligen al crear y sirven para filtrar)
const CATEGORIAS_INSUMO = ["Fertilizante", "Abono orgánico", "Herbicida", "Fungicida", "Insecticida", "Semilla", "Herramienta", "Otro"];

// Entradas de stock (compras a proveedores y ajustes)
const CLAVE_MOVIMIENTOS = "movimientosInsumos";

function obtenerMovimientos() {
  return obtenerLista(CLAVE_MOVIMIENTOS, []);
}

// Busca un insumo por su código de barras (null si no hay)
function insumoPorCodigo(lista, codigo, idQueNoCuenta) {
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].codigo === codigo && lista[i].id !== idQueNoCuenta) {
      return lista[i];
    }
  }

  return null;
}

// Busca un insumo por su nombre (los usos guardan el nombre)
function insumoPorNombre(lista, nombre) {
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].nombre === nombre) {
      return lista[i];
    }
  }

  return null;
}

// ================== MEDIDAS Y PESO APROXIMADO ==================
// Medidas que se cuentan por bulto o saco: necesitan saber cuánto pesa cada uno
const MEDIDAS_CON_PESO = ["bultos", "sacos"];

// Peso aproximado (kg) de un bulto o saco según el producto. Se busca por palabras del nombre.
const PESOS_APROXIMADOS = [
  { palabras: ["cal", "dolomita", "yeso"], kg: 25 },
  { palabras: ["gallinaza", "pollinaza", "compost", "humus", "lombricompuesto", "bocashi"], kg: 40 },
  { palabras: ["urea", "npk", "fertilizante", "triple", "dap", "kcl", "abono"], kg: 50 },
  { palabras: ["semilla"], kg: 25 },
  { palabras: ["concentrado", "sal mineralizada"], kg: 40 }
];

function pesoSugerido(nombre, unidad) {
  if (!MEDIDAS_CON_PESO.includes(unidad)) {
    return 0;
  }

  let texto = nombre.toLowerCase();

  for (let i = 0; i < PESOS_APROXIMADOS.length; i++) {
    for (let j = 0; j < PESOS_APROXIMADOS[i].palabras.length; j++) {
      if (texto.includes(PESOS_APROXIMADOS[i].palabras[j])) {
        return PESOS_APROXIMADOS[i].kg;
      }
    }
  }

  // si no lo reconocemos: un saco suele ser de 50 kg y un bulto de 40 kg
  return unidad === "sacos" ? 50 : 40;
}

// Contenido de cada unidad pasado a kilos o litros: { valor, medida: "kg" | "L" }
function contenidoNormalizado(insumo) {
  let c = insumo.contenido;

  if (!c || !c.cantidad) return null;
  if (c.medida === "g") return { valor: c.cantidad / 1000, medida: "kg" };
  if (c.medida === "mL") return { valor: c.cantidad / 1000, medida: "L" };
  return { valor: c.cantidad, medida: c.medida };
}

// Cuántos kilos son "cantidad" de un insumo (0 si es líquido)
function kilosDe(insumo, cantidad) {
  if (insumo.unidad === "kg") return cantidad;
  if (insumo.unidad === "g") return cantidad / 1000;
  if (insumo.unidad === "und") {
    let contenido = contenidoNormalizado(insumo);
    return contenido !== null && contenido.medida === "kg" ? cantidad * contenido.valor : 0;
  }
  if (MEDIDAS_CON_PESO.includes(insumo.unidad)) {
    return cantidad * (insumo.pesoUnidad || pesoSugerido(insumo.nombre, insumo.unidad));
  }
  return 0;
}

// "3 bultos (≈ 75 kg)" o "9 L"
function textoCantidad(insumo, cantidad) {
  let numero = cantidad === undefined ? insumo.cantidad : cantidad;
  let texto = numero + " " + insumo.unidad;

  if (MEDIDAS_CON_PESO.includes(insumo.unidad)) {
    texto += " (≈ " + Math.round(kilosDe(insumo, numero)) + " kg)";
  }

  // por unidad: "3 und (500 g c/u ≈ 1.5 kg)"
  let contenido = contenidoNormalizado(insumo);
  if (insumo.unidad === "und" && contenido !== null) {
    let total = Math.round(numero * contenido.valor * 100) / 100;
    texto += " (" + insumo.contenido.cantidad + " " + insumo.contenido.medida + " c/u ≈ " + total + " " + contenido.medida + ")";
  }

  return texto;
}

// Un insumo está por agotarse cuando le queda lo mínimo o menos
function porAgotarse(insumo) {
  return insumo.cantidad <= insumo.minimo;
}

// Crea la notificación de "Stock mínimo" de cada insumo que esté por agotarse
function revisarStockBajo() {
  if (!alertaActiva("alertaStock")) {
    return;
  }

  let lista = insumosHabilitados();

  for (let i = 0; i < lista.length; i++) {
    if (porAgotarse(lista[i])) {
      crearNotificacion(
        "Stock mínimo",
        lista[i].nombre + " quedó en " + lista[i].cantidad + " " + lista[i].unidad + " (mínimo " + lista[i].minimo + ") en " + nombrePropiedadActual(),
        "stock_" + idPropiedadActual() + "_" + lista[i].id + "_" + lista[i].cantidad
      );
    }
  }
}

// 63000 -> "$63.000"
function pesos(valor) {
  return "$" + Math.round(valor).toLocaleString("es-CO");
}

// Nombres de los cultivos que se pueden elegir (los del módulo de Cultivos si existen)
function nombresDeCultivos() {
  let cultivos = leerLista("cultivos");
  let nombres = [];

  for (let i = 0; i < cultivos.length; i++) {
    if (cultivos[i].habilitado) {
      nombres.push(cultivos[i].nombre);
    }
  }

  // también los que aparecen en los usos guardados
  let usos = obtenerUsosInsumos();
  for (let i = 0; i < usos.length; i++) {
    if (!nombres.includes(usos[i].cultivo)) {
      nombres.push(usos[i].cultivo);
    }
  }

  return nombres;
}
