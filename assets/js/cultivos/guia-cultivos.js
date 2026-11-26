// guia-cultivos.js
// Información agronómica de referencia de los cultivos más comunes en Colombia:
// temporada de siembra, ciclo, abono recomendado, riego y plagas frecuentes.
// Se usa en el detalle del cultivo, los recordatorios, las recomendaciones por temporada y el PDF.
// Los valores son orientativos (promedios generales); cada finca debe ajustarlos con un agrónomo.

const GUIA_CULTIVOS = [
  { nombre: "Maíz", palabras: ["maiz", "maíz"], tipo: "cereal", temporada: "lluviosa", ciclo: 120, rendimiento: 5000,
    abono: "Fertilizante NPK 15-15-15 (300 kg/ha) a la siembra y Urea 46% (150 kg/ha) a los 30 días",
    fertilizacion: [0, 30], riegoCada: 4,
    plagas: ["Gusano cogollero", "Antracnosis"] },
  { nombre: "Café", palabras: ["cafe", "café"], tipo: "permanente", temporada: "lluviosa", ciclo: 240, rendimiento: 1500,
    abono: "Fertilizante 17-6-18-2 (250 g por planta al año, repartido en 2 aplicaciones) y cal dolomita según análisis de suelo",
    fertilizacion: [0, 120], riegoCada: 7,
    plagas: ["Roya del café"] },
  { nombre: "Fríjol", palabras: ["frijol", "fríjol"], tipo: "leguminosa", temporada: "lluviosa", ciclo: 90, rendimiento: 1500,
    abono: "Fertilizante 10-30-10 (200 kg/ha) a la siembra; no necesita mucho nitrógeno porque lo fija del aire",
    fertilizacion: [0, 25], riegoCada: 3,
    plagas: ["Áfido verde", "Antracnosis"] },
  { nombre: "Papa", palabras: ["papa"], tipo: "tuberculo", temporada: "lluviosa", ciclo: 150, rendimiento: 20000,
    abono: "Fertilizante 10-30-10 (800 kg/ha) a la siembra y 15-15-15 (300 kg/ha) en el aporque",
    fertilizacion: [0, 45], riegoCada: 5,
    plagas: ["Gusano cogollero"] },
  { nombre: "Tomate", palabras: ["tomate"], tipo: "hortaliza", temporada: "seca", ciclo: 100, rendimiento: 40000,
    abono: "Gallinaza compostada (5 t/ha) antes de sembrar y fertilizante 13-26-6 (300 kg/ha) repartido cada 15 días",
    fertilizacion: [0, 15, 30, 45, 60], riegoCada: 2,
    plagas: ["Ácaro rojo", "Marchitez bacteriana"] },
  { nombre: "Cebolla", palabras: ["cebolla"], tipo: "hortaliza", temporada: "seca", ciclo: 120, rendimiento: 25000,
    abono: "Compost (10 t/ha) y fertilizante 15-15-15 (400 kg/ha) en dos partes: a la siembra y a los 45 días",
    fertilizacion: [0, 45], riegoCada: 3,
    plagas: ["Áfido verde"] },
  { nombre: "Zanahoria", palabras: ["zanahoria"], tipo: "hortaliza", temporada: "todo", ciclo: 100, rendimiento: 30000,
    abono: "Fertilizante 10-20-20 (400 kg/ha) a la siembra; evitar estiércol fresco porque deforma la raíz",
    fertilizacion: [0, 40], riegoCada: 3,
    plagas: ["Áfido verde"] },
  { nombre: "Lechuga", palabras: ["lechuga"], tipo: "verdura", temporada: "todo", ciclo: 60, rendimiento: 20000,
    abono: "Compost o humus (3 t/ha) y fertilizante 15-15-15 (200 kg/ha) a los 15 días del trasplante",
    fertilizacion: [0, 15], riegoCada: 2,
    plagas: ["Áfido verde"] },
  { nombre: "Plátano", palabras: ["platano", "plátano", "banano"], tipo: "fruta", temporada: "lluviosa", ciclo: 365, rendimiento: 15000,
    abono: "Fertilizante 15-4-23 (200 g por planta cada 3 meses) y materia orgánica en la siembra",
    fertilizacion: [0, 90, 180, 270], riegoCada: 5,
    plagas: ["Marchitez bacteriana"] },
  { nombre: "Yuca", palabras: ["yuca"], tipo: "tuberculo", temporada: "lluviosa", ciclo: 300, rendimiento: 15000,
    abono: "Fertilizante 10-20-20 (300 kg/ha) a los 30 días; tolera suelos pobres",
    fertilizacion: [30], riegoCada: 10,
    plagas: ["Ácaro rojo"] },
  { nombre: "Arroz", palabras: ["arroz"], tipo: "cereal", temporada: "lluviosa", ciclo: 130, rendimiento: 6000,
    abono: "Urea 46% (200 kg/ha) repartida en 3 aplicaciones y fertilizante 10-30-10 (150 kg/ha) a la siembra",
    fertilizacion: [0, 25, 50], riegoCada: 2,
    plagas: ["Gusano cogollero"] },
  { nombre: "Mora", palabras: ["mora"], tipo: "fruta", temporada: "todo", ciclo: 240, rendimiento: 12000,
    abono: "Gallinaza (2 kg por planta) y fertilizante 15-15-15 (100 g por planta cada 2 meses)",
    fertilizacion: [0, 60, 120, 180], riegoCada: 4,
    plagas: ["Áfido verde", "Ácaro rojo"] },
  { nombre: "Aguacate", palabras: ["aguacate"], tipo: "fruta", temporada: "lluviosa", ciclo: 365, rendimiento: 10000,
    abono: "Fertilizante 15-15-15 (500 g por árbol joven, 2 veces al año) y cal según análisis de suelo",
    fertilizacion: [0, 180], riegoCada: 7,
    plagas: ["Ácaro rojo"] },
  { nombre: "Cacao", palabras: ["cacao"], tipo: "permanente", temporada: "lluviosa", ciclo: 240, rendimiento: 800,
    abono: "Fertilizante 17-6-18-2 (300 g por árbol al año) y abono orgánico",
    fertilizacion: [0, 120], riegoCada: 7,
    plagas: ["Antracnosis"] },
  { nombre: "Arveja", palabras: ["arveja"], tipo: "leguminosa", temporada: "lluviosa", ciclo: 100, rendimiento: 3000,
    abono: "Fertilizante 10-30-10 (250 kg/ha) a la siembra",
    fertilizacion: [0], riegoCada: 3,
    plagas: ["Áfido verde"] }
];

// Si el cultivo no está en la guía, se usan valores generales según su tipo
const GUIA_POR_TIPO = {
  fruta: { temporada: "lluviosa", ciclo: 180, rendimiento: 10000, abono: "Abono orgánico (2 kg por planta) y fertilizante 15-15-15 cada 3 meses", fertilizacion: [0, 90], riegoCada: 5, plagas: ["Ácaro rojo"] },
  verdura: { temporada: "todo", ciclo: 70, rendimiento: 15000, abono: "Compost (3 t/ha) y fertilizante 15-15-15 (200 kg/ha) a los 15 días", fertilizacion: [0, 15], riegoCada: 2, plagas: ["Áfido verde"] },
  hortaliza: { temporada: "seca", ciclo: 100, rendimiento: 20000, abono: "Compost (5 t/ha) y fertilizante 15-15-15 (300 kg/ha) repartido en 2 aplicaciones", fertilizacion: [0, 30], riegoCada: 3, plagas: ["Áfido verde", "Ácaro rojo"] },
  cereal: { temporada: "lluviosa", ciclo: 120, rendimiento: 5000, abono: "Fertilizante NPK 15-15-15 (300 kg/ha) y Urea (150 kg/ha) a los 30 días", fertilizacion: [0, 30], riegoCada: 4, plagas: ["Gusano cogollero"] },
  leguminosa: { temporada: "lluviosa", ciclo: 90, rendimiento: 1500, abono: "Fertilizante 10-30-10 (200 kg/ha) a la siembra", fertilizacion: [0], riegoCada: 3, plagas: ["Áfido verde"] },
  tuberculo: { temporada: "lluviosa", ciclo: 150, rendimiento: 15000, abono: "Fertilizante 10-30-10 (500 kg/ha) a la siembra", fertilizacion: [0, 45], riegoCada: 5, plagas: ["Gusano cogollero"] },
  permanente: { temporada: "lluviosa", ciclo: 240, rendimiento: 1500, abono: "Fertilizante 17-6-18-2 al año, repartido en 2 aplicaciones", fertilizacion: [0, 120], riegoCada: 7, plagas: ["Roya del café"] }
};

const NOMBRES_TEMPORADA = { lluviosa: "Temporada lluviosa", seca: "Temporada seca", todo: "Todo el año" };

// Quita tildes y pasa a minúsculas ("Fríjol" -> "frijol")
function textoSinTildes(texto) {
  return String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Busca la guía del cultivo por su nombre ("Papa criolla - Lote 1" -> Papa) o, si no, por su tipo
function guiaDelCultivo(cultivo) {
  let nombre = textoSinTildes(cultivo.nombre);

  for (let i = 0; i < GUIA_CULTIVOS.length; i++) {
    let palabras = GUIA_CULTIVOS[i].palabras;
    for (let j = 0; j < palabras.length; j++) {
      if (nombre.includes(textoSinTildes(palabras[j]))) {
        return GUIA_CULTIVOS[i];
      }
    }
  }

  let porTipo = GUIA_POR_TIPO[cultivo.tipo] || GUIA_POR_TIPO.hortaliza;
  return Object.assign({ nombre: cultivo.nombre }, porTipo);
}

// Temporada en Colombia según el mes: lluvias en marzo-mayo y septiembre-noviembre
function temporadaActual(fecha) {
  let mes = (fecha || new Date()).getMonth();
  return [2, 3, 4, 8, 9, 10].includes(mes) ? "lluviosa" : "seca";
}

// Cultivos recomendados para sembrar en la temporada actual
function cultivosRecomendados() {
  let temporada = temporadaActual();
  return GUIA_CULTIVOS.filter(function (g) { return g.temporada === temporada || g.temporada === "todo"; });
}
