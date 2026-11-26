// insumos.js
// Lógica de todas las pantallas de Insumos. Los datos vienen de datos-insumos.js
// y se guardan en localStorage. Cada parte solo se ejecuta si su pantalla está abierta.

// Colores de los puntos en orden (se repiten si hay más insumos)
const COLORES_PUNTO = ["verde", "azul", "amarillo", "rojo"];

function colorDelPunto(posicion) {
  return COLORES_PUNTO[posicion % COLORES_PUNTO.length];
}

function ponerTexto(id, texto) {
  let elemento = document.getElementById(id);

  if (elemento !== null) {
    elemento.textContent = texto;
  }
}

// Llena un <select> con una lista de textos (deja la primera opción "Seleccionar...")
function llenarSelect(select, textos) {
  let primera = select.options[0];
  select.innerHTML = "";
  select.appendChild(primera);

  for (let i = 0; i < textos.length; i++) {
    select.add(new Option(textos[i], textos[i]));
  }
}

// ================== CONTADOR ( - cantidad + ) ==================
// Cada contador tiene: un botón "-", un <span> con el número, un botón "+" y un input oculto.
function activarContadores() {
  let contadores = document.querySelectorAll(".contador");

  for (let i = 0; i < contadores.length; i++) {
    let contador = contadores[i];
    let texto = contador.querySelector("span");
    let campo = contador.querySelector("input");
    let botones = contador.querySelectorAll("button");

    botones[0].addEventListener("click", function () {
      cambiarCantidad(texto, campo, contador.dataset.unidad, -1);
    });

    botones[1].addEventListener("click", function () {
      cambiarCantidad(texto, campo, contador.dataset.unidad, 1);
    });
  }
}

function cambiarCantidad(texto, campo, unidad, cambio) {
  let cantidad = parseInt(campo.value) + cambio;

  // no dejamos que baje de 1
  if (cantidad < 1) {
    cantidad = 1;
  }

  campo.value = cantidad;
  texto.textContent = cantidad + " " + unidad;
}

// ================== BUSCADOR ==================
// Buscador (por nombre, categoría o parte del código de barras) y filtro por categoría, juntos
function activarBuscador() {
  let buscador = document.getElementById("buscador");

  if (buscador === null) {
    return;
  }

  let categoriaElegida = "Todas";
  let cajaFiltros = document.getElementById("filtroCategorias");

  function aplicar() {
    let texto = buscador.value.trim().toLowerCase();
    let items = document.querySelectorAll(".item-buscable");

    for (let i = 0; i < items.length; i++) {
      let contenido = (items[i].textContent + " " + (items[i].dataset.codigo || "")).toLowerCase();
      let coincideCategoria = categoriaElegida === "Todas" || items[i].dataset.categoria === categoriaElegida;
      items[i].classList.toggle("d-none", !(contenido.includes(texto) && coincideCategoria));
    }
  }

  buscador.addEventListener("input", aplicar);

  if (cajaFiltros !== null) {
    // solo las categorías que tienen insumos
    let presentes = [];
    document.querySelectorAll(".item-buscable").forEach(function (item) {
      if (item.dataset.categoria && !presentes.includes(item.dataset.categoria)) {
        presentes.push(item.dataset.categoria);
      }
    });

    let html = '<button type="button" class="chip-activo" data-categoria="Todas">Todas</button>';
    for (let i = 0; i < presentes.length; i++) {
      html += `<button type="button" class="chip" data-categoria="${presentes[i]}">${presentes[i]}</button>`;
    }
    cajaFiltros.innerHTML = presentes.length > 1 ? html : "";

    cajaFiltros.addEventListener("click", function (evento) {
      let boton = evento.target.closest("button[data-categoria]");
      if (boton === null) {
        return;
      }
      categoriaElegida = boton.dataset.categoria;
      cajaFiltros.querySelectorAll("button").forEach(function (b) {
        b.className = b === boton ? "chip-activo" : "chip";
      });
      aplicar();
    });
  }
}

// ================== INSUMOS (pantalla principal) ==================
function mostrarInventario() {
  if (document.getElementById("dato1") === null || document.getElementById("listaPrincipal") === null || document.title.indexOf("Insumos -") !== 0) {
    return;
  }

  let lista = insumosHabilitados();
  let agotarse = lista.filter(porAgotarse).length;

  ponerTexto("dato1", lista.length);
  ponerTexto("dato2", agotarse);

  let html = "";

  for (let i = 0; i < lista.length; i++) {
    let insumo = lista[i];
    let bajo = porAgotarse(insumo);
    let estado = bajo ? "bajo stock" : "disponible";

    html += `
      <details class="insumo-desplegable item-buscable" data-categoria="${textoSeguro(insumo.categoria || "Otro")}" data-codigo="${textoSeguro(insumo.codigo || "")}"${i === 0 ? " open" : ""}>
        <summary>
          <div class="d-flex align-items-center gap-3">
            <span class="punto-insumo punto-insumo--${bajo ? "rojo" : colorDelPunto(i)}"></span>
            <div>
              <strong class="d-block">${textoSeguro(insumo.nombre)}</strong>
              <span class="${bajo ? "texto-bajo-stock" : "texto_gris"} small">${textoSeguro(textoCantidad(insumo))} ${bajo ? "- bajo stock" : "disponibles"}</span>
            </div>
          </div>
          <div class="d-flex align-items-center gap-3">
            <a href="editar-insumo.html?id=${insumo.id}" class="btn-agro-sm">Editar</a>
            <i class="bi bi-chevron-down"></i>
          </div>
        </summary>
        <div class="descripcion">
          <p class="titulo-seccion mb-1">${textoSeguro(insumo.categoria || "Sin categoría")} • Código ${textoSeguro(insumo.codigo || "----")}</p>
          ${textoSeguro(insumo.descripcion || "Sin descripción.")} Proveedor: ${textoSeguro(insumo.proveedor || "No especifica")}. Cantidad disponible: ${textoSeguro(textoCantidad(insumo))}. Estado: ${estado}.
        </div>
      </details>`;
  }

  if (lista.length === 0) {
    html = '<p class="texto_gris">No hay insumos registrados. Crea uno con "+ Nuevo".</p>';
  }

  document.getElementById("listaPrincipal").innerHTML = html;
}

// ================== CREAR / EDITAR INSUMO ==================
// Lee el formulario de insumo. Devuelve null si algo está mal.
function leerFormularioInsumo() {
  let nombre = document.getElementById("nombre").value.trim();
  let cantidad = Number(document.getElementById("cantidad").value);
  let unidad = document.getElementById("medida").value;
  let precio = Number(document.getElementById("precio").value);
  let categoria = document.getElementById("categoria").value;
  let codigo = document.getElementById("codigoBarras").value.trim();
  let pesoUnidad = Number(document.getElementById("pesoUnidad").value);
  let contenidoCantidad = Number(document.getElementById("contenidoCantidad").value);
  let minimo = Number(document.getElementById("minimo").value);
  let llegada = document.getElementById("llegada").value;
  let caducidad = document.getElementById("caducidad").value;

  if (nombre.length < 3) {
    alert("El nombre del insumo debe tener mínimo 3 letras");
    return null;
  }

  if (isNaN(cantidad) || cantidad < 0) {
    alert("Escribe una cantidad válida");
    return null;
  }

  if (unidad === "") {
    alert("Selecciona la medida del insumo");
    return null;
  }

  if (MEDIDAS_CON_PESO.includes(unidad) && (isNaN(pesoUnidad) || pesoUnidad <= 0)) {
    alert("Escribe cuánto pesa aproximadamente cada " + unidad.replace(/s$/, "") + " (en kg)");
    return null;
  }

  if (unidad === "und" && (isNaN(contenidoCantidad) || contenidoCantidad <= 0)) {
    alert("Escribe cuánto trae cada unidad, por ejemplo una caja de 500 g");
    return null;
  }

  if (categoria === "") {
    alert("Selecciona la categoría del insumo (fertilizante, semilla, herbicida...)");
    return null;
  }

  if (codigo !== "" && !/^[0-9A-Za-z-]{4,20}$/.test(codigo)) {
    alert("El código de barras solo puede tener números, letras o guiones (entre 4 y 20)");
    return null;
  }

  if (isNaN(precio) || precio <= 0) {
    alert("Escribe el precio por unidad (sirve para calcular los costos)");
    return null;
  }

  if (isNaN(minimo) || minimo < 0) {
    alert("Escribe el stock mínimo (0 si no quieres aviso)");
    return null;
  }

  if (llegada > fechaDeHoy(0)) {
    alert("La fecha de llegada no puede ser después de hoy");
    return null;
  }

  if (llegada !== "" && caducidad !== "" && caducidad < llegada) {
    alert("La fecha de caducidad no puede ser antes de la fecha de llegada");
    return null;
  }

  return { nombre: nombre, cantidad: cantidad, unidad: unidad, pesoUnidad: MEDIDAS_CON_PESO.includes(unidad) ? pesoUnidad : 0,
    contenido: unidad === "und" ? { cantidad: contenidoCantidad, medida: document.getElementById("contenidoMedida").value } : null,
    proveedor: document.getElementById("proveedorInsumo").value, precio: precio,
    categoria: categoria, codigo: codigo, minimo: minimo, llegada: llegada, caducidad: caducidad };
}

// Muestra el campo de peso solo para bultos y sacos y propone el peso según el nombre.
// Si la persona cambia el peso a mano, ya no se le cambia solo.
function activarPesoAproximado() {
  let medida = document.getElementById("medida");
  let nombre = document.getElementById("nombre");
  let peso = document.getElementById("pesoUnidad");
  let grupo = document.getElementById("grupoPeso");
  let ayuda = document.getElementById("ayudaPeso");
  let escritoAMano = peso.value !== "";

  function actualizar() {
    document.getElementById("grupoContenido").classList.toggle("d-none", medida.value !== "und");
    let conPeso = MEDIDAS_CON_PESO.includes(medida.value);
    grupo.classList.toggle("d-none", !conPeso);

    if (!conPeso) {
      return;
    }

    let sugerido = pesoSugerido(nombre.value, medida.value);
    if (!escritoAMano) {
      peso.value = sugerido;
    }
    ayuda.textContent = "Un " + medida.value.replace(/s$/, "") + " de " + (nombre.value.trim() || "este insumo") + " pesa aprox. " + sugerido + " kg. Puedes cambiarlo.";
  }

  peso.addEventListener("input", function () {
    escritoAMano = peso.value !== "";
  });
  medida.addEventListener("change", actualizar);
  nombre.addEventListener("input", actualizar);
  actualizar();
}

// Llena el select de proveedor. Siempre está "No especifica"; si no hay proveedores es la única opción.
function llenarProveedores(elegido) {
  let select = document.getElementById("proveedorInsumo");
  let proveedores = obtenerProveedores();

  select.innerHTML = '<option value="No especifica">No especifica</option>';
  for (let i = 0; i < proveedores.length; i++) {
    select.add(new Option(proveedores[i].nombre, proveedores[i].nombre));
  }

  if (elegido) {
    select.value = elegido;
    if (select.value !== elegido) {
      select.add(new Option(elegido, elegido, true, true));
    }
  }
}

function activarCrearInsumo() {
  let formulario = document.getElementById("formCrearInsumo");

  if (formulario === null) {
    return;
  }

  let selectCultivo = document.getElementById("cultivo");
  llenarSelect(selectCultivo, nombresDeCultivos());
  llenarProveedores();
  activarPesoAproximado();

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let datos = leerFormularioInsumo();

    if (datos === null) {
      return;
    }

    let lista = obtenerInsumos();

    if (insumoPorNombre(lista, datos.nombre) !== null) {
      alert("Ya existe un insumo con ese nombre. Usa \"Actualizar stock\" para sumarle cantidad.");
      return;
    }

    // el código de barras no se puede repetir; si no se escribió, se crea uno
    if (datos.codigo !== "" && insumoPorCodigo(lista, datos.codigo, null) !== null) {
      alert("Ese código de barras ya es de " + insumoPorCodigo(lista, datos.codigo, null).nombre + ". Revisa el código.");
      return;
    }

    datos.id = nuevoId(lista);
    if (datos.codigo === "") {
      datos.codigo = "770" + String(idPropiedadActual()).padStart(3, "0") + String(datos.id).padStart(7, "0");
    }
    datos.cultivo = selectCultivo.value;
    datos.descripcion = "";
    datos.habilitado = true;
    lista.push(datos);

    guardarLista(CLAVE_INSUMOS, lista);
    registrarEvento("Insumo registrado", datos.nombre + " (" + datos.cantidad + " " + datos.unidad + ")", "insumos", "bi-box-seam", "success");
    window.location.href = "insumos.html?mensaje=guardado";
  });
}

function activarEditarInsumo() {
  let formulario = document.getElementById("formEditarInsumo");

  if (formulario === null) {
    return;
  }

  let lista = obtenerInsumos();

  if (pedirElegir("¿Qué insumo quieres editar?", insumosHabilitados().map(function (i) { return { id: i.id, nombre: i.nombre, detalle: textoCantidad(i) }; }), "insumos.html")) {
    return;
  }

  let insumo = buscarPorId(lista, idDeLaDireccion()) || insumosHabilitados()[0];

  if (insumo === undefined) {
    alert("No hay insumos registrados todavía");
    window.location.href = "insumos.html";
    return;
  }

  document.getElementById("nombre").value = insumo.nombre;
  document.getElementById("cantidad").value = insumo.cantidad;
  document.getElementById("precio").value = insumo.precio;
  document.getElementById("minimo").value = insumo.minimo;

  // si la unidad guardada no está en la lista, se agrega para no perderla
  let medida = document.getElementById("medida");
  medida.value = insumo.unidad;
  if (medida.value !== insumo.unidad) {
    medida.add(new Option(insumo.unidad, insumo.unidad, true, true));
  }
  if (insumo.pesoUnidad) {
    document.getElementById("pesoUnidad").value = insumo.pesoUnidad;
  }
  if (insumo.contenido) {
    document.getElementById("contenidoCantidad").value = insumo.contenido.cantidad;
    document.getElementById("contenidoMedida").value = insumo.contenido.medida;
  }
  llenarProveedores(insumo.proveedor);
  activarPesoAproximado();
  document.getElementById("llegada").value = insumo.llegada;
  document.getElementById("caducidad").value = insumo.caducidad;
  document.getElementById("codigoBarras").value = insumo.codigo || "";

  // categoría: si era una de antes que no está en la lista, se agrega
  let categoria = document.getElementById("categoria");
  categoria.value = insumo.categoria;
  if (categoria.value !== insumo.categoria && insumo.categoria) {
    categoria.add(new Option(insumo.categoria, insumo.categoria, true, true));
  }

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let datos = leerFormularioInsumo();

    if (datos === null) {
      return;
    }

    if (datos.codigo === "") {
      datos.codigo = insumo.codigo;
    }

    if (insumoPorCodigo(lista, datos.codigo, insumo.id) !== null) {
      alert("Ese código de barras ya es de " + insumoPorCodigo(lista, datos.codigo, insumo.id).nombre + ". Revisa el código.");
      return;
    }

    // si cambia el nombre, los usos de este insumo se actualizan (el historial no se pierde)
    let nombreAntes = insumo.nombre;
    if (datos.nombre !== nombreAntes) {
      let usos = obtenerUsosInsumos();
      for (let i = 0; i < usos.length; i++) {
        if (usoDelInsumo(usos[i], insumo)) {
          usos[i].insumo = datos.nombre;
          usos[i].insumoId = insumo.id;
        }
      }
      guardarLista(CLAVE_USOS, usos);
    }

    Object.assign(insumo, datos);
    guardarLista(CLAVE_INSUMOS, lista);
    registrarEvento("Insumo actualizado", "Se editó " + insumo.nombre, "insumos", "bi-file-earmark-text", "success");
    window.location.href = "insumos.html?mensaje=guardado";
  });
}

// ================== INHABILITAR INSUMO ==================
function activarInhabilitarInsumo() {
  let formulario = document.getElementById("formInhabilitarInsumo");

  if (formulario === null) {
    return;
  }

  let lista = insumosHabilitados();
  let html = "";

  for (let i = 0; i < lista.length; i++) {
    let insumo = lista[i];
    let bajo = porAgotarse(insumo);
    html += `
      <div class="opcion-insumo opcion-insumo--peligro">
        <input type="radio" name="insumo" id="i-${insumo.id}" value="${insumo.id}">
        <label for="i-${insumo.id}" class="tarjeta p-3 rounded-4">
          <div>
            <strong class="d-block">${textoSeguro(insumo.nombre)}</strong>
            <span class="${bajo ? "texto-bajo-stock" : "texto_gris"} small">${textoSeguro(textoCantidad(insumo))} ${bajo ? "- bajo stock" : "disponibles"}</span>
          </div>
          <i class="bi bi-circle"></i>
        </label>
      </div>`;
  }

  document.getElementById("listaPrincipal").innerHTML = html;

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    let elegido = formulario.querySelector('input[name="insumo"]:checked');

    if (elegido === null) {
      alert("Selecciona el insumo que quieres inhabilitar");
      return;
    }

    let todos = obtenerInsumos();
    let insumo = buscarPorId(todos, Number(elegido.value));

    // no se inhabilita si está asociado a una siembra activa (cultivo habilitado)
    let activos = leerLista("cultivos").filter(function (c) { return c.habilitado; }).map(function (c) { return c.nombre; });
    let siembras = [];
    obtenerUsosInsumos().forEach(function (u) {
      if (usoDelInsumo(u, insumo) && activos.includes(u.cultivo) && !siembras.includes(u.cultivo)) {
        siembras.push(u.cultivo);
      }
    });
    if (insumo.cultivo && activos.includes(insumo.cultivo) && !siembras.includes(insumo.cultivo)) {
      siembras.push(insumo.cultivo);
    }

    if (siembras.length > 0) {
      alert(insumo.nombre + " está asociado a siembras activas (" + siembras.join(", ") + "). Se puede inhabilitar cuando esas siembras terminen.");
      return;
    }

    if (await preguntar("¿Estás seguro?", "Se va a inhabilitar " + insumo.nombre + ".", "Inhabilitar") === false) {
      return;
    }

    marcarInhabilitado(insumo);
    guardarLista(CLAVE_INSUMOS, todos);
    registrarEvento("Insumo inhabilitado", insumo.nombre, "insumos", "bi-slash-circle", "danger");
    window.location.href = "insumos.html?mensaje=inhabilitado";
  });
}

// ================== MOVIMIENTOS DE STOCK ==================
// Suma (entrada) o resta (salida) cantidad a un insumo. Devuelve false si no alcanza.
function moverStock(insumoId, tipo, cantidad, motivo, extra) {
  let lista = obtenerInsumos();
  let insumo = buscarPorId(lista, insumoId);
  extra = extra || {};

  if (tipo === "salida" && cantidad > insumo.cantidad) {
    alert("No hay suficiente " + insumo.nombre + ". Solo quedan " + insumo.cantidad + " " + insumo.unidad);
    return false;
  }

  insumo.cantidad = tipo === "entrada" ? insumo.cantidad + cantidad : insumo.cantidad - cantidad;

  // en una compra, el costo nuevo pasa a ser el precio del insumo
  if (tipo === "entrada" && extra.costo > 0) {
    insumo.precio = extra.costo;
  }
  guardarLista(CLAVE_INSUMOS, lista);

  // queda el movimiento con proveedor, costo y fecha (historial de entradas)
  let movimientos = obtenerMovimientos();
  movimientos.unshift({
    id: nuevoId(movimientos),
    insumoId: insumo.id,
    insumo: insumo.nombre,
    tipo: tipo,
    cantidad: cantidad,
    unidad: insumo.unidad,
    proveedor: extra.proveedor || "",
    costo: extra.costo || 0,
    fecha: extra.fecha || fechaDeHoy(0),
    motivo: motivo || ""
  });
  guardarLista(CLAVE_MOVIMIENTOS, movimientos);

  let signo = tipo === "entrada" ? "+" : "-";
  registrarEvento("Stock actualizado", insumo.nombre + " " + signo + cantidad + " " + insumo.unidad + (motivo ? " (" + motivo + ")" : ""), "insumos", "bi-arrow-repeat", "success");
  return true;
}

// ================== ACTUALIZAR STOCK ==================
function activarActualizarStock() {
  let formulario = document.getElementById("formStock");

  if (formulario === null) {
    return;
  }

  let lista = insumosHabilitados();
  let elegido = buscarPorId(lista, idDeLaDireccion()) || lista[0];
  let html = "";

  if (elegido === undefined) {
    document.getElementById("listaPrincipal").innerHTML = '<p class="texto_gris">No hay insumos registrados. Crea uno en Insumos con "+ Nuevo".</p>';
    return;
  }

  for (let i = 0; i < lista.length; i++) {
    let insumo = lista[i];
    let bajo = porAgotarse(insumo);
    html += `
      <details class="insumo-desplegable" data-id="${insumo.id}"${insumo === elegido ? " open" : ""}>
        <summary>
          <div class="d-flex align-items-center gap-3">
            <span class="punto-insumo punto-insumo--${bajo ? "rojo" : "verde"}"></span>
            <div>
              <strong class="d-block">${textoSeguro(insumo.nombre)}</strong>
              <span class="${bajo ? "texto-bajo-stock" : "texto_gris"} small">${textoSeguro(textoCantidad(insumo))} ${bajo ? "- bajo stock" : "disponibles"}</span>
            </div>
          </div>
          <i class="bi bi-chevron-down"></i>
        </summary>
      </details>`;
  }

  document.getElementById("listaPrincipal").innerHTML = html;

  // el bloque "Ajustar stock" se mueve dentro del insumo que esté abierto
  let ajuste = document.createElement("div");
  ajuste.className = "descripcion";
  ajuste.innerHTML = `
    <p class="titulo-seccion text-success mb-2">Ajustar stock</p>
    <span class="agro-label">Tipo de movimiento</span>
    <div class="pastillas">
      <input type="radio" name="movimiento" id="s-entrada" value="entrada" checked>
      <label for="s-entrada">Entrada</label>
      <input type="radio" name="movimiento" id="s-salida" value="salida">
      <label for="s-salida">Salida</label>
    </div>
    <span class="agro-label">Cantidad</span>
    <div class="contador" data-unidad="${textoSeguro(elegido.unidad)}">
      <button type="button" aria-label="Restar">-</button>
      <span>5 ${textoSeguro(elegido.unidad)}</span>
      <button type="button" aria-label="Sumar">+</button>
      <input type="hidden" name="cantidad" value="5">
    </div>
    <div id="datosEntrada">
      <label for="proveedorEntrada" class="agro-label">Proveedor</label>
      <select id="proveedorEntrada" class="agro-select"></select>
      <div class="row g-2">
        <div class="col-6">
          <label for="costoEntrada" class="agro-label">Costo unitario ($)</label>
          <input type="number" id="costoEntrada" class="agro-input" min="0" step="100" placeholder="Ej. 63000">
        </div>
        <div class="col-6">
          <label for="fechaEntrada" class="agro-label">Fecha de recepción</label>
          <input type="date" id="fechaEntrada" class="agro-input">
        </div>
      </div>
    </div>
    <label for="motivo" class="agro-label">Motivo</label>
    <input type="text" id="motivo" name="motivo" class="agro-input" placeholder="Ej. Compra a proveedor">
    <button type="submit" class="btn-agro-primary">Actualizar stock</button>`;

  let paneles = formulario.querySelectorAll("details");
  let abierto = formulario.querySelector("details[open]");
  abierto.appendChild(ajuste);

  for (let i = 0; i < paneles.length; i++) {
    paneles[i].addEventListener("toggle", function () {
      if (paneles[i].open) {
        // solo uno abierto a la vez
        for (let j = 0; j < paneles.length; j++) {
          if (j !== i) {
            paneles[j].open = false;
          }
        }

        let insumo = buscarPorId(lista, Number(paneles[i].dataset.id));
        let contador = ajuste.querySelector(".contador");
        contador.dataset.unidad = insumo.unidad;
        contador.querySelector("span").textContent = contador.querySelector("input").value + " " + insumo.unidad;
        paneles[i].appendChild(ajuste);
      }
    });
  }

  // datos de la compra (solo para entradas): proveedores registrados, costo y fecha
  let selectProveedor = document.getElementById("proveedorEntrada");
  selectProveedor.innerHTML = '<option value="No especifica">No especifica</option>' + obtenerProveedores().map(function (p) {
    return '<option value="' + textoSeguro(p.nombre) + '">' + textoSeguro(p.nombre) + "</option>";
  }).join("");
  document.getElementById("fechaEntrada").value = fechaDeHoy(0);
  document.getElementById("fechaEntrada").max = fechaDeHoy(0);

  function mostrarDatosEntrada() {
    let tipoElegido = formulario.querySelector('input[name="movimiento"]:checked').value;
    document.getElementById("datosEntrada").classList.toggle("d-none", tipoElegido !== "entrada");
  }
  formulario.addEventListener("change", mostrarDatosEntrada);
  mostrarDatosEntrada();

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let panel = ajuste.parentElement;
    let tipo = formulario.querySelector('input[name="movimiento"]:checked').value;
    let cantidad = Number(formulario.elements["cantidad"].value);
    let motivo = document.getElementById("motivo").value.trim();

    let extra = {};
    if (tipo === "entrada") {
      extra = {
        proveedor: selectProveedor.value,
        costo: Number(document.getElementById("costoEntrada").value) || 0,
        fecha: document.getElementById("fechaEntrada").value || fechaDeHoy(0)
      };

      if (extra.fecha > fechaDeHoy(0)) {
        alert("La fecha de recepción no puede ser después de hoy");
        return;
      }
    }

    if (moverStock(Number(panel.dataset.id), tipo, cantidad, motivo, extra)) {
      window.location.href = "insumos.html?mensaje=guardado";
    }
  });
}

// ================== USO DE INSUMO ==================
function activarUsoInsumo() {
  let formulario = document.getElementById("formUsoInsumo");

  if (formulario === null) {
    return;
  }

  let lista = insumosHabilitados();
  let selectInsumo = document.getElementById("insumo");
  llenarSelect(selectInsumo, lista.map(function (i) { return i.nombre; }));
  llenarSelect(document.getElementById("cultivo"), nombresDeCultivos());

  // al elegir el insumo se pone su unidad
  selectInsumo.addEventListener("change", function () {
    let elegido = insumoPorNombre(lista, selectInsumo.value);
    document.getElementById("unidad").value = elegido.unidad;
    document.getElementById("cantidad").max = elegido.cantidad;
    document.getElementById("cantidad").placeholder = "Hay " + elegido.cantidad + " " + elegido.unidad;
  });

  document.getElementById("fecha").value = fechaDeHoy(0);

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let nombreInsumo = selectInsumo.value;
    let cultivo = document.getElementById("cultivo").value;
    let cantidad = Number(document.getElementById("cantidad").value);
    let fecha = document.getElementById("fecha").value;

    if (nombreInsumo === "" || cultivo === "") {
      alert("Selecciona el insumo y el cultivo");
      return;
    }

    if (isNaN(cantidad) || cantidad <= 0) {
      alert("Escribe cuánto usaste del insumo");
      return;
    }

    if (fecha === "" || fecha > fechaDeHoy(0)) {
      alert("Elige una fecha de uso válida (no puede ser después de hoy)");
      return;
    }

    let insumo = insumoPorNombre(lista, nombreInsumo);

    // primero se descuenta del stock; si no alcanza no se registra el uso
    if (moverStock(insumo.id, "salida", cantidad, "uso en " + cultivo) === false) {
      return;
    }

    let usos = obtenerUsosInsumos();
    usos.unshift({
      id: nuevoId(usos),
      insumo: nombreInsumo,
      insumoId: insumo.id,
      cultivo: cultivo,
      cantidad: cantidad,
      unidad: insumo.unidad,
      fecha: fecha,
      observaciones: document.getElementById("observaciones").value.trim()
    });
    guardarLista(CLAVE_USOS, usos);

    window.location.href = "insumos.html?mensaje=guardado";
  });
}

// ================== CÓDIGO DE BARRAS ==================
function activarCodigoBarras() {
  let formulario = document.getElementById("formCodigo");

  if (formulario === null) {
    return;
  }

  let campo = document.getElementById("codigo");
  let tarjeta = document.getElementById("tarjetaEncontrado");
  let encontrado = null;

  // busca el insumo cada vez que cambia el código
  function buscarCodigo() {
    let codigo = campo.value.trim();
    encontrado = null;

    let lista = insumosHabilitados();
    for (let i = 0; i < lista.length; i++) {
      if (lista[i].codigo === codigo) {
        encontrado = lista[i];
      }
    }

    if (encontrado === null) {
      tarjeta.classList.add("d-none");
      return;
    }

    tarjeta.innerHTML = `
      <strong class="d-block">${textoSeguro(encontrado.nombre)}</strong>
      <span class="texto_gris small d-block">Código: ${textoSeguro(encontrado.codigo)}</span>
      <span class="precio small">Insumo encontrado - ${encontrado.cantidad} ${textoSeguro(encontrado.unidad)} en stock</span>`;
    tarjeta.classList.remove("d-none");

    let contador = formulario.querySelector(".contador");
    contador.dataset.unidad = encontrado.unidad;
    contador.querySelector("span").textContent = contador.querySelector("input").value + " " + encontrado.unidad;
  }

  campo.addEventListener("input", buscarCodigo);
  activarCamara(campo, buscarCodigo);

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    if (encontrado === null) {
      alert("No hay ningún insumo con ese código");
      return;
    }

    let tipo = formulario.querySelector('input[name="movimiento"]:checked').value;
    let cantidad = Number(formulario.elements["cantidad"].value);

    if (moverStock(encontrado.id, tipo, cantidad, "código de barras")) {
      window.location.href = "insumos.html?mensaje=guardado";
    }
  });
}

// Lee el código con la cámara si el navegador tiene BarcodeDetector (Chrome en Android).
// Si no lo tiene, la persona escribe el código a mano.
function activarCamara(campo, alEncontrar) {
  let caja = document.querySelector(".escaner");

  caja.style.cursor = "pointer";
  caja.addEventListener("click", async function () {
    if (!("BarcodeDetector" in window) || !navigator.mediaDevices) {
      alert("Tu navegador no puede leer códigos con la cámara. Escribe el código a mano.");
      campo.focus();
      return;
    }

    try {
      let video = document.createElement("video");
      video.setAttribute("playsinline", "");
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      video.style.borderRadius = "16px";

      let camara = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = camara;
      caja.innerHTML = "";
      caja.appendChild(video);
      await video.play();

      let detector = new BarcodeDetector();
      let revisar = setInterval(async function () {
        let codigos = await detector.detect(video);

        if (codigos.length > 0) {
          clearInterval(revisar);
          camara.getTracks().forEach(function (pista) { pista.stop(); });
          caja.innerHTML = '<i class="bi bi-check-circle"></i><span class="small">Código leído</span>';
          campo.value = codigos[0].rawValue;
          alEncontrar();
        }
      }, 500);
    } catch (error) {
      alert("No se pudo abrir la cámara. Revisa los permisos o escribe el código a mano.");
    }
  });
}

// Botón de la cámara junto al campo "Código de barras" (crear y editar insumo)
function activarLectorDeCodigo() {
  let boton = document.getElementById("botonEscanearCodigo");

  if (boton === null) {
    return;
  }

  boton.addEventListener("click", async function () {
    let campo = document.getElementById("codigoBarras");

    if (!("BarcodeDetector" in window) || !navigator.mediaDevices) {
      alert("Tu navegador no puede leer códigos con la cámara (funciona en Chrome para Android). Escribe el código a mano.");
      campo.focus();
      return;
    }

    let fondo = document.createElement("div");
    fondo.className = "confirmacion-fondo";
    fondo.innerHTML = '<div class="confirmacion-caja confirmacion-caja--pregunta"><h4 class="confirmacion-titulo">Apunta al código</h4><video playsinline style="width: 100%; border-radius: 12px;"></video><button type="button" class="confirmacion-cancelar mt-3">Cancelar</button></div>';
    ponerEstilosVentana();
    document.body.appendChild(fondo);

    let video = fondo.querySelector("video");
    let camara = null;
    let revisar = null;

    function cerrar() {
      clearInterval(revisar);
      if (camara) camara.getTracks().forEach(function (pista) { pista.stop(); });
      fondo.remove();
    }

    fondo.querySelector("button").addEventListener("click", cerrar);

    try {
      camara = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = camara;
      await video.play();
      let detector = new BarcodeDetector();
      revisar = setInterval(async function () {
        let codigos = await detector.detect(video);
        if (codigos.length > 0) {
          campo.value = codigos[0].rawValue;
          cerrar();
        }
      }, 400);
    } catch (error) {
      cerrar();
      alert("No se pudo abrir la cámara. Revisa los permisos o escribe el código a mano.");
    }
  });
}

// ================== CATÁLOGO ==================
function mostrarCatalogo() {
  if (document.title.indexOf("Catálogo") !== 0) {
    return;
  }

  let lista = insumosHabilitados();
  let html = "";

  for (let i = 0; i < lista.length; i++) {
    let insumo = lista[i];
    let bajo = porAgotarse(insumo);
    html += `
      <div class="tarjeta p-3 rounded-4 d-flex justify-content-between align-items-center item-buscable" data-categoria="${textoSeguro(insumo.categoria || "Otro")}" data-codigo="${textoSeguro(insumo.codigo || "")}">
        <div class="d-flex align-items-center gap-3">
          <span class="punto-insumo punto-insumo--${bajo ? "rojo" : colorDelPunto(i)}"></span>
          <div>
            <strong class="d-block">${textoSeguro(insumo.nombre)}</strong>
            <span class="${bajo ? "texto-bajo-stock" : "texto_gris"} small">${textoSeguro(insumo.categoria)} · ${bajo ? "Bajo stock" : "Inventario"}</span>
          </div>
        </div>
        <div class="text-end">
          <strong class="d-block">${insumo.cantidad} ${textoSeguro(insumo.unidad)}</strong>
          <span class="precio small">${pesos(insumo.cantidad * insumo.precio)}</span>
        </div>
      </div>`;
  }

  document.getElementById("listaPrincipal").innerHTML = html;
}

// ================== COSTOS Y USOS ==================
// Costo de un uso = cantidad usada x precio por unidad del insumo
function costoDelUso(uso, insumos) {
  let insumo = insumoPorNombre(insumos, uso.insumo);
  return insumo === null ? 0 : uso.cantidad * insumo.precio;
}

function filaSimple(nombre, detalle, derecha, color) {
  return `
    <div class="tarjeta p-3 rounded-4 d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-3">
        <span class="punto-insumo punto-insumo--${color}"></span>
        <div>
          <strong class="d-block">${textoSeguro(nombre)}</strong>
          <span class="texto_gris small">${textoSeguro(detalle)}</span>
        </div>
      </div>
      ${derecha}
    </div>`;
}

function mostrarCostosPorInsumo() {
  if (document.title.indexOf("Costos por insumo") !== 0) {
    return;
  }

  let insumos = insumosHabilitados();
  let mes = fechaDeHoy(0).slice(0, 7);
  let usos = obtenerUsosInsumos().filter(function (u) { return u.fecha.slice(0, 7) === mes; });
  let totalMes = 0;
  let totalStock = 0;
  let html = "";

  for (let i = 0; i < insumos.length; i++) {
    let insumo = insumos[i];

    // lo que se usó de este insumo en el mes
    let usado = 0;
    for (let j = 0; j < usos.length; j++) {
      if (usoDelInsumo(usos[j], insumo)) {
        usado += usos[j].cantidad;
      }
    }

    let valorStock = insumo.cantidad * insumo.precio;
    let costoUsado = usado * insumo.precio;
    totalStock += valorStock;
    totalMes += costoUsado;

    html += `
      <div class="tarjeta p-3 rounded-4">
        <div class="d-flex align-items-center gap-3 mb-2">
          <span class="punto-insumo punto-insumo--${colorDelPunto(i)}"></span>
          <div>
            <strong class="d-block">${textoSeguro(insumo.nombre)}</strong>
            <span class="texto_gris small">Precio individual: <span class="text-white">${pesos(insumo.precio)}</span> c/u</span>
          </div>
        </div>
        <div class="d-flex justify-content-between small border-top pt-2" style="border-color: var(--border-subtle) !important;">
          <span class="texto_gris">En stock: ${textoSeguro(textoCantidad(insumo))} × ${pesos(insumo.precio)}</span>
          <strong class="precio">${pesos(valorStock)}</strong>
        </div>
        <div class="d-flex justify-content-between small mt-1">
          <span class="texto_gris">Usado este mes: ${textoSeguro(textoCantidad(insumo, usado))} × ${pesos(insumo.precio)}</span>
          <strong>${pesos(costoUsado)}</strong>
        </div>
      </div>`;
  }

  ponerTexto("montoTotal", pesos(totalMes));
  ponerTexto("montoStock", pesos(totalStock));
  document.getElementById("listaPrincipal").innerHTML = html || '<p class="texto_gris">No hay insumos registrados.</p>';
}

// Renglón de costo: precio individual por unidad, cantidad usada y total
function filaDeCosto(nombre, cantidad, unidad, insumo, costo, color) {
  let precio = insumo === null ? 0 : insumo.precio;

  return `
    <div class="tarjeta p-3 rounded-4 d-flex justify-content-between align-items-center gap-2">
      <div class="d-flex align-items-center gap-3">
        <span class="punto-insumo punto-insumo--${color}"></span>
        <div>
          <strong class="d-block">${textoSeguro(nombre)}</strong>
          <span class="texto_gris small d-block">Precio individual: <span class="text-white">${pesos(precio)}</span> c/u</span>
          <span class="texto_gris small">Usado: ${cantidad} ${textoSeguro(unidad)} × ${pesos(precio)}</span>
        </div>
      </div>
      <div class="text-end">
        <span class="texto_gris small d-block">Total</span>
        <span class="precio">${pesos(costo)}</span>
      </div>
    </div>`;
}

// Botones de siembra (Maíz - Lote 1, Café - Lote 2...) de "por siembra"
function crearBotonesSiembra(alElegir) {
  let caja = document.getElementById("pillsSiembra");
  let nombres = nombresDeCultivos();
  let html = "";

  for (let i = 0; i < nombres.length; i++) {
    html += `
      <input type="radio" name="siembra" id="siembra-${i}" value="${textoSeguro(nombres[i])}"${i === 0 ? " checked" : ""}>
      <label for="siembra-${i}">${textoSeguro(nombres[i])}</label>`;
  }

  caja.innerHTML = html;
  caja.addEventListener("change", function (evento) {
    alElegir(evento.target.value);
  });

  if (nombres.length > 0) {
    alElegir(nombres[0]);
  }
}

function mostrarCostosPorSiembra() {
  if (document.title.indexOf("Costos por siembra") !== 0) {
    return;
  }

  let insumos = obtenerInsumos();

  crearBotonesSiembra(function (cultivo) {
    let usos = obtenerUsosInsumos().filter(function (u) { return u.cultivo === cultivo; });
    let total = 0;
    let html = "";

    for (let i = 0; i < usos.length; i++) {
      let costo = costoDelUso(usos[i], insumos);
      total += costo;
      html += filaDeCosto(usos[i].insumo, usos[i].cantidad, usos[i].unidad, insumoPorNombre(insumos, usos[i].insumo), costo, colorDelPunto(i));
    }

    ponerTexto("montoTotal", pesos(total));
    ponerTexto("cantidadRegistros", usos.length + " insumos registrados");
    document.getElementById("listaPrincipal").innerHTML = html || '<p class="texto_gris">Esta siembra no tiene insumos usados.</p>';
  });
}

function mostrarInsumosPorSiembra() {
  if (document.title.indexOf("Insumos por siembra") !== 0) {
    return;
  }

  let insumos = obtenerInsumos();

  crearBotonesSiembra(function (cultivo) {
    let usos = obtenerUsosInsumos().filter(function (u) { return u.cultivo === cultivo; });
    let nombres = [];
    let cantidadTotal = 0;
    let agotarse = 0;
    let html = "";

    for (let i = 0; i < usos.length; i++) {
      cantidadTotal += usos[i].cantidad;

      if (!nombres.includes(usos[i].insumo)) {
        nombres.push(usos[i].insumo);
        let insumo = insumoPorNombre(insumos, usos[i].insumo);
        if (insumo !== null && porAgotarse(insumo)) {
          agotarse++;
        }
      }

      html += `
        <details class="insumo-desplegable">
          <summary>
            <div class="d-flex align-items-center gap-3">
              <span class="punto-insumo punto-insumo--${colorDelPunto(i)}"></span>
              <div>
                <strong class="d-block">${textoSeguro(usos[i].insumo)}</strong>
                <span class="texto_gris small">${textoSeguro(usos[i].observaciones || "Sin observaciones")}</span>
              </div>
            </div>
            <i class="bi bi-chevron-down"></i>
          </summary>
          <div class="descripcion">Se usaron ${usos[i].cantidad} ${textoSeguro(usos[i].unidad)} el ${fechaBonita(usos[i].fecha)}.</div>
        </details>`;
    }

    ponerTexto("dato1", nombres.length);
    ponerTexto("dato2", cantidadTotal);
    ponerTexto("dato3", agotarse);
    ponerTexto("tituloSiembra", "Insumos - " + cultivo);
    document.getElementById("listaPrincipal").innerHTML = html || '<p class="texto_gris">Esta siembra no tiene insumos usados.</p>';
  });
}

function mostrarInsumosUsados() {
  if (document.title.indexOf("Insumos usados") !== 0) {
    return;
  }

  // se suman los usos del mismo insumo en el mismo cultivo
  let usos = obtenerUsosInsumos();
  let grupos = {};

  for (let i = 0; i < usos.length; i++) {
    let llave = usos[i].insumo + "|" + usos[i].cultivo;

    if (grupos[llave] === undefined) {
      grupos[llave] = { insumo: usos[i].insumo, cultivo: usos[i].cultivo, cantidad: 0, unidad: usos[i].unidad };
    }
    grupos[llave].cantidad += usos[i].cantidad;
  }

  let html = "";
  let posicion = 0;
  for (let llave in grupos) {
    let g = grupos[llave];
    html += filaSimple(g.insumo, g.cultivo, `<strong class="small">${g.cantidad} ${textoSeguro(g.unidad)}</strong>`, colorDelPunto(posicion));
    posicion++;
  }

  document.getElementById("listaPrincipal").innerHTML = html || '<p class="texto_gris">Todavía no se ha usado ningún insumo.</p>';
}

// ================== GRÁFICA ==================
function mostrarGrafica() {
  let barras = document.getElementById("graficaBarras");

  if (barras === null) {
    return;
  }

  // cantidad usada de cada insumo en los últimos 30 días
  let desde = fechaDeHoy(30);
  let usos = obtenerUsosInsumos().filter(function (u) { return u.fecha >= desde; });
  let totales = {};

  for (let i = 0; i < usos.length; i++) {
    totales[usos[i].insumo] = (totales[usos[i].insumo] || 0) + usos[i].cantidad;
  }

  let nombres = Object.keys(totales);
  let mayor = Math.max.apply(null, Object.values(totales).concat([1]));
  let htmlBarras = "";
  let htmlEtiquetas = "";

  for (let i = 0; i < nombres.length; i++) {
    let alto = Math.round((totales[nombres[i]] / mayor) * 90);
    htmlBarras += `
      <div class="barra-col" title="${textoSeguro(nombres[i])}: ${totales[nombres[i]]}">
        <span class="valor">${totales[nombres[i]]}</span>
        <div class="barra barra--${colorDelPunto(i)}" style="height: ${alto}%;"></div>
      </div>`;
    // en la etiqueta va solo la primera palabra para que quepa
    htmlEtiquetas += `<span>${textoSeguro(nombres[i].split(" ")[0])}</span>`;
  }

  barras.innerHTML = htmlBarras || '<p class="texto_gris small m-auto">No hay usos en el último mes.</p>';
  document.getElementById("graficaEtiquetas").innerHTML = htmlEtiquetas;
}

// ================== PROVEEDORES ==================
function mostrarProveedores() {
  if (document.title.indexOf("Proveedores de insumo") !== 0) {
    return;
  }

  let lista = obtenerProveedores();
  let html = "";

  for (let i = 0; i < lista.length; i++) {
    let p = lista[i];
    html += filaSimple(p.nombre, p.insumos, `<a href="ver-proveedor.html?id=${p.id}" class="link-editar">Ver</a>`, "azul");
  }

  document.getElementById("listaPrincipal").innerHTML = html;
}

// ================== VER PROVEEDOR ==================
function mostrarProveedor() {
  if (document.getElementById("proveedorNombre") === null) {
    return;
  }

  let lista = todosLosProveedores();
  if (pedirElegir("¿Qué proveedor?", obtenerProveedores().map(function (p) { return { id: p.id, nombre: p.nombre, detalle: p.insumos }; }), "proveedores-insumos.html")) {
    return;
  }

  let proveedor = buscarPorId(obtenerProveedores(), idDeLaDireccion()) || obtenerProveedores()[0];

  if (proveedor === undefined) {
    window.location.href = "proveedores-insumos.html";
    return;
  }

  ponerTexto("proveedorNombre", proveedor.nombre);
  ponerTexto("proveedorInsumos", "Provee: " + proveedor.insumos);
  ponerTexto("proveedorTelefono", proveedor.telefono || "----");
  ponerTexto("proveedorCorreo", proveedor.correo || "----");
  ponerTexto("proveedorLlegada", proveedor.llegada ? fechaBonita(proveedor.llegada) : "----");

  let llamar = document.getElementById("proveedorLlamar");
  let escribir = document.getElementById("proveedorEscribir");
  llamar.href = proveedor.telefono ? "tel:" + proveedor.telefono.replace(/\s/g, "") : "#";
  escribir.href = proveedor.correo ? "mailto:" + proveedor.correo : "#";

  // si no tiene teléfono o correo, el botón avisa en vez de no hacer nada
  llamar.addEventListener("click", function (evento) {
    if (!proveedor.telefono) {
      evento.preventDefault();
      alert("Este proveedor no tiene teléfono registrado");
    }
  });
  escribir.addEventListener("click", function (evento) {
    if (!proveedor.correo) {
      evento.preventDefault();
      alert("Este proveedor no tiene correo registrado");
    }
  });

  document.getElementById("proveedorEliminar").addEventListener("click", async function () {
    if (await preguntar("¿Estás seguro?", "Se va a eliminar a " + proveedor.nombre + ".", "Eliminar") === false) {
      return;
    }

    // no se borra: queda en "Inhabilitados" por si se quiere recuperar
    marcarInhabilitado(buscarPorId(lista, proveedor.id));
    guardarLista(CLAVE_PROVEEDORES, lista);
    registrarEvento("Proveedor eliminado", proveedor.nombre, "insumos", "bi-truck", "danger");
    window.location.href = "proveedores-insumos.html?mensaje=inhabilitado";
  });
}

function activarFormularioProveedor() {
  let formulario = document.getElementById("formProveedor");

  if (formulario === null) {
    return;
  }

  let selectInsumo = document.getElementById("insumo");
  if (selectInsumo !== null) {
    // además de los insumos registrados, siempre se puede elegir "Varios insumos"
    llenarSelect(selectInsumo, insumosHabilitados().map(function (i) { return i.nombre; }).concat(["Varios insumos"]));
  }

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let nombre = document.getElementById("proveedor").value.trim();
    let telefono = document.getElementById("telefono");
    let correo = document.getElementById("correo");
    let insumos = selectInsumo !== null ? selectInsumo.value : document.getElementById("entregados").value.trim();

    if (nombre.length < 3) {
      alert("El nombre del proveedor debe tener mínimo 3 letras");
      return;
    }

    if (telefono !== null && telefono.value.replace(/\D/g, "").length < 7) {
      alert("Escribe un teléfono válido, por ejemplo 310 000 0000");
      return;
    }

    if (correo !== null && correoValido(correo.value.trim()) === false) {
      alert("Escribe un correo válido, por ejemplo contacto@agro.com");
      return;
    }

    if (insumos === "") {
      alert("Indica qué insumo entrega el proveedor");
      return;
    }

    let lista = todosLosProveedores();
    lista.push({
      id: nuevoId(lista),
      nombre: nombre,
      telefono: telefono !== null ? telefono.value.trim() : "",
      correo: correo !== null ? correo.value.trim() : "",
      insumos: insumos,
      llegada: document.getElementById("llegada") !== null ? document.getElementById("llegada").value : ""
    });

    guardarLista(CLAVE_PROVEEDORES, lista);
    registrarEvento("Proveedor registrado", nombre, "insumos", "bi-truck", "success");
    window.location.href = "proveedores-insumos.html?mensaje=guardado";
  });
}

// ================== HISTORIAL DE USO ==================
function mostrarHistorialInsumos() {
  if (document.title.indexOf("Historial uso") !== 0) {
    return;
  }

  let usos = obtenerUsosInsumos();
  let insumos = obtenerInsumos();
  let html = "";

  // un renglón por cada insumo, con el último cultivo donde se usó
  for (let i = 0; i < insumos.length; i++) {
    let ultimo = null;
    for (let j = 0; j < usos.length; j++) {
      if (usoDelInsumo(usos[j], insumos[i]) && (ultimo === null || usos[j].fecha > ultimo.fecha)) {
        ultimo = usos[j];
      }
    }

    html += `
      <a href="historial-uso.html?id=${insumos[i].id}" class="tarjeta p-3 rounded-4 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <span class="punto-insumo punto-insumo--${ultimo === null ? "gris" : "verde"}"></span>
          <div>
            <strong class="d-block">${textoSeguro(insumos[i].nombre)}</strong>
            <span class="texto_gris small">${ultimo === null ? "Sin asociar" : textoSeguro(ultimo.cultivo)}</span>
          </div>
        </div>
        <i class="bi bi-chevron-right text-success"></i>
      </a>`;
  }

  document.getElementById("listaPrincipal").innerHTML = html;
}

function mostrarHistorialDeUnInsumo() {
  if (document.getElementById("tituloPagina") === null) {
    return;
  }

  let insumos = obtenerInsumos();

  if (pedirElegir("¿Historial de qué insumo?", insumos.map(function (i) { return { id: i.id, nombre: i.nombre, detalle: textoCantidad(i) }; }), "historial-insumo.html")) {
    return;
  }

  let insumo = buscarPorId(insumos, idDeLaDireccion()) || insumos[0];

  if (insumo === undefined) {
    document.getElementById("listaPrincipal").innerHTML = '<p class="texto_gris">No hay insumos registrados.</p>';
    return;
  }

  let usos = obtenerUsosInsumos().filter(function (u) { return usoDelInsumo(u, insumo); });
  let meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  let html = "";

  usos.sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });

  for (let i = 0; i < usos.length; i++) {
    let p = usos[i].fecha.split("-");
    let fecha = p[2] + " " + meses[Number(p[1]) - 1] + " " + p[0];
    html += filaSimple(fecha, usos[i].cultivo, `<strong class="small">${usos[i].cantidad} ${textoSeguro(usos[i].unidad)}</strong>`, "verde");
  }

  ponerTexto("tituloPagina", "Historial de uso - " + insumo.nombre);
  document.getElementById("listaPrincipal").innerHTML = html || '<p class="texto_gris">Este insumo todavía no se ha usado.</p>';
}

// Primero se revisa el stock bajo, se dibujan las pantallas y después se activan los botones
revisarStockBajo();
mostrarInventario();
activarCrearInsumo();
activarEditarInsumo();
activarInhabilitarInsumo();
activarActualizarStock();
activarUsoInsumo();
activarCodigoBarras();
mostrarCatalogo();
mostrarCostosPorInsumo();
mostrarCostosPorSiembra();
mostrarInsumosPorSiembra();
mostrarInsumosUsados();
mostrarGrafica();
mostrarProveedores();
mostrarProveedor();
activarFormularioProveedor();
mostrarHistorialInsumos();
mostrarHistorialDeUnInsumo();
activarContadores();
activarBuscador();
activarLectorDeCodigo();
