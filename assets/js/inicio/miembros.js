// miembros.js
// Invitar usuarios a la propiedad actual y unirse a una propiedad con un código.
// Las invitaciones se guardan en localStorage ("invitaciones"), así que por ahora
// funcionan entre cuentas del mismo navegador; con la API funcionarán entre equipos.

function obtenerInvitaciones() {
  return obtenerLista("invitaciones", []);
}

// Código corto y fácil de dictar: AV-7K2Q (sin letras que se confunden como O/0 o I/1)
function crearCodigo(invitaciones) {
  let letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "";

  do {
    codigo = "AV-";
    for (let i = 0; i < 4; i++) {
      codigo += letras.charAt(Math.floor(Math.random() * letras.length));
    }
  } while (invitaciones.some(function (inv) { return inv.codigo === codigo; }));

  return codigo;
}

// La propiedad en la que se trabaja (con todos sus datos)
function propiedadActualCompleta(todas) {
  return buscarPorId(todas, idPropiedadActual()) || todas[0];
}

function nombreDeUsuario(correo) {
  let usuario = buscarUsuario(correo);
  return usuario !== null ? usuario.nombre : correo;
}

// Interruptores de permisos (uno por módulo). "prefijo" separa los del formulario de los de cada miembro.
function htmlPermisos(prefijo, permisos, desactivados) {
  let html = "";

  for (let i = 0; i < MODULOS_PERMISO.length; i++) {
    let m = MODULOS_PERMISO[i];
    let activo = permisos ? permisos[m.clave] === true : m.clave !== "propiedad";
    html += `
      <label class="tarjeta_con_borde p-2 px-3 rounded-4 d-flex justify-content-between align-items-center gap-2" style="cursor: pointer;">
        <span>
          <span class="texto_blanco d-block small fw-semibold">${m.nombre}</span>
          <span class="texto_gris" style="font-size: 0.75rem;">${m.detalle}</span>
        </span>
        <span class="form-check form-switch m-0">
          <input class="form-check-input" type="checkbox" role="switch" data-modulo="${m.clave}" id="${prefijo}-${m.clave}"${activo ? " checked" : ""}${desactivados ? " disabled" : ""}>
        </span>
      </label>`;
  }

  return html;
}

// Lee los interruptores dentro de un contenedor: { cultivos: true, terreno: false, ... }
function leerPermisos(contenedor) {
  let permisos = {};
  let casillas = contenedor.querySelectorAll("input[data-modulo]");

  for (let i = 0; i < casillas.length; i++) {
    permisos[casillas[i].dataset.modulo] = casillas[i].checked;
  }

  return permisos;
}

// ================== INVITAR ==================
function activarInvitar() {
  let formulario = document.getElementById("formInvitar");

  if (formulario === null) {
    return;
  }

  // solo el dueño invita; los demás ven los miembros pero no el formulario
  let actual = propiedadActualCompleta(obtenerLista(CLAVE_PROPIEDADES, propiedadesDeEjemplo()));
  if (!esDueño(actual)) {
    formulario.classList.add("d-none");
    document.getElementById("avisoNoDueno").classList.remove("d-none");
    document.getElementById("textoNoDueno").textContent = "Solo el dueño de " + actual.nombre + " (" + nombreDeUsuario(dueñoDe(actual)) + ") puede invitar usuarios y cambiar permisos.";
  }

  document.getElementById("opcionesPermisos").innerHTML = htmlPermisos("nuevo", null, false);
  mostrarMiembros();

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let correo = document.getElementById("correoInvitado").value.trim().toLowerCase();
    let usuario = obtenerUsuarioActual();
    let todas = obtenerLista(CLAVE_PROPIEDADES, propiedadesDeEjemplo());
    let propiedad = propiedadActualCompleta(todas);

    if (correo !== "" && correoValido(correo) === false) {
      alert("Escribe un correo válido, por ejemplo ana@correo.com");
      return;
    }

    if (correo === usuario.correo) {
      alert("No te puedes invitar a ti mismo");
      return;
    }

    if (propiedad.miembros && propiedad.miembros.includes(correo)) {
      alert(nombreDeUsuario(correo) + " ya es miembro de " + propiedad.nombre);
      return;
    }

    // una propiedad que todavía no tenía miembros pasa a tener como dueño a quien invita
    if (!propiedad.miembros) {
      propiedad.miembros = [usuario.correo];
    }
    if (!propiedad.dueno) {
      propiedad.dueno = propiedad.miembros[0];
    }
    guardarLista(CLAVE_PROPIEDADES, todas);

    let invitaciones = obtenerInvitaciones();
    let invitacion = {
      codigo: crearCodigo(invitaciones),
      propiedadId: propiedad.id,
      propiedadNombre: propiedad.nombre,
      invitadoPor: usuario.correo,
      correo: correo,
      permisos: leerPermisos(document.getElementById("opcionesPermisos")),
      fecha: fechaDeHoy(0),
      usada: false
    };
    invitaciones.push(invitacion);
    guardarLista("invitaciones", invitaciones);
    registrarEvento("Invitación creada", usuario.nombre + " invitó a " + (correo || "un usuario") + " a " + propiedad.nombre, "sistema", "bi-person-plus", "info");

    // se muestra el código para copiarlo o mandarlo por WhatsApp
    document.getElementById("codigoInvitacion").textContent = invitacion.codigo;
    document.getElementById("detalleInvitacion").textContent = "Para unirse a " + propiedad.nombre + (correo ? " • solo para " + correo : " • cualquier usuario");
    let mensaje = "Hola, te invito a trabajar en " + propiedad.nombre + " en Agro Verde. Entra a \"Unirse a una propiedad\" y escribe este código: " + invitacion.codigo;
    document.getElementById("compartirWhatsapp").href = "https://wa.me/?text=" + encodeURIComponent(mensaje);
    document.getElementById("invitacionCreada").classList.remove("d-none");
    formulario.reset();
    document.getElementById("opcionesPermisos").innerHTML = htmlPermisos("nuevo", null, false);
    mostrarMiembros();
  });

  document.getElementById("copiarCodigo").addEventListener("click", function () {
    let codigo = document.getElementById("codigoInvitacion").textContent;
    let boton = this;

    // si el navegador no deja copiar, se muestra el código para copiarlo a mano
    if (!navigator.clipboard) {
      prompt("Copia el código:", codigo);
      return;
    }

    navigator.clipboard.writeText(codigo).then(function () {
      boton.innerHTML = '<i class="bi bi-check2 me-1"></i> Copiado';
    }, function () {
      prompt("Copia el código:", codigo);
    });
  });
}

function filaPersona(icono, titulo, detalle, derecha) {
  return `
    <div class="tarjeta p-3 rounded-4 d-flex justify-content-between align-items-center gap-2">
      <div class="d-flex align-items-center gap-3">
        <i class="bi ${icono} fs-4 text-success"></i>
        <div>
          <strong class="d-block small">${titulo}</strong>
          <span class="texto_gris small">${detalle}</span>
        </div>
      </div>
      ${derecha || ""}
    </div>`;
}

function mostrarMiembros() {
  let propiedad = propiedadActualCompleta(obtenerLista(CLAVE_PROPIEDADES, propiedadesDeEjemplo()));
  let usuario = obtenerUsuarioActual();
  let html = "";

  let soyDueño = esDueño(propiedad);
  let dueño = dueñoDe(propiedad);

  if (!propiedad.miembros) {
    html = filaPersona("bi-people", "Todos los usuarios", "Esta propiedad todavía no tiene miembros propios. Al invitar a alguien quedas tú como dueño.");
  } else {
    for (let i = 0; i < propiedad.miembros.length; i++) {
      let correo = propiedad.miembros[i];
      let titulo = textoSeguro(nombreDeUsuario(correo)) + (correo === usuario.correo ? " (tú)" : "");

      if (correo === dueño) {
        html += filaPersona("bi-person-badge", titulo, textoSeguro(correo) + " • Dueño: puede modificar todo");
        continue;
      }

      let permisos = propiedad.permisos && propiedad.permisos[correo] ? propiedad.permisos[correo] : null;
      let resumen = permisos === null ? "Puede modificar todo" : "Puede modificar: " + (MODULOS_PERMISO.filter(function (m) { return permisos[m.clave]; }).map(function (m) { return m.nombre; }).join(", ") || "nada (solo ver)");

      html += `
        <details class="tarjeta p-3 rounded-4 miembro" data-correo="${textoSeguro(correo)}">
          <summary class="d-flex justify-content-between align-items-center gap-2" style="list-style: none; cursor: pointer;">
            <span class="d-flex align-items-center gap-3">
              <i class="bi bi-person-circle fs-4 text-success"></i>
              <span>
                <strong class="d-block small">${titulo}</strong>
                <span class="texto_gris small">${textoSeguro(correo)} • ${resumen}</span>
              </span>
            </span>
            <i class="bi bi-chevron-down texto_gris"></i>
          </summary>
          <div class="d-flex flex-column gap-2 mt-3">${htmlPermisos("m" + i, permisos || { cultivos: true, terreno: true, insumos: true, plagas: true, reportes: true, clima: true, propiedad: true }, !soyDueño)}</div>
          ${soyDueño ? '<div class="row g-2 mt-2"><div class="col-6"><button type="button" class="btn-agro-primary guardar-permisos">Guardar permisos</button></div><div class="col-6"><button type="button" class="btn-agro-danger quitar-miembro">Quitar de la propiedad</button></div></div>' : ""}
        </details>`;
    }
  }
  let listaMiembros = document.getElementById("listaMiembros");
  listaMiembros.innerHTML = html;

  // el dueño guarda los permisos de un miembro o lo quita de la propiedad
  let tarjetas = listaMiembros.querySelectorAll(".miembro");
  for (let i = 0; i < tarjetas.length; i++) {
    let guardar = tarjetas[i].querySelector(".guardar-permisos");
    let quitar = tarjetas[i].querySelector(".quitar-miembro");
    let correo = tarjetas[i].dataset.correo;

    if (guardar !== null) {
      guardar.addEventListener("click", function () {
        let todas = obtenerLista(CLAVE_PROPIEDADES, propiedadesDeEjemplo());
        let prop = propiedadActualCompleta(todas);
        prop.permisos = prop.permisos || {};
        prop.permisos[correo] = leerPermisos(tarjetas[i]);
        guardarLista(CLAVE_PROPIEDADES, todas);
        registrarEvento("Permisos cambiados", "Se actualizaron los permisos de " + nombreDeUsuario(correo) + " en " + prop.nombre, "sistema", "bi-shield-check", "info");
        window.location.href = "invitar-usuario.html?mensaje=guardado";
      });
    }

    if (quitar !== null) {
      quitar.addEventListener("click", async function () {
        if (await preguntar("¿Estás seguro?", nombreDeUsuario(correo) + " ya no podrá entrar a " + propiedad.nombre + ".", "Quitar") === false) {
          return;
        }

        let todas = obtenerLista(CLAVE_PROPIEDADES, propiedadesDeEjemplo());
        let prop = propiedadActualCompleta(todas);
        prop.miembros = prop.miembros.filter(function (c) { return c !== correo; });
        if (prop.permisos) {
          delete prop.permisos[correo];
        }
        guardarLista(CLAVE_PROPIEDADES, todas);
        registrarEvento("Miembro quitado", nombreDeUsuario(correo) + " salió de " + prop.nombre, "sistema", "bi-person-dash", "danger");
        window.location.href = "invitar-usuario.html?mensaje=inhabilitado";
      });
    }
  }

  let pendientes = obtenerInvitaciones().filter(function (inv) { return inv.propiedadId === propiedad.id && !inv.usada; });
  html = "";
  for (let i = 0; i < pendientes.length; i++) {
    html += filaPersona("bi-envelope", pendientes[i].codigo, (pendientes[i].correo ? textoSeguro(pendientes[i].correo) : "Cualquier usuario") + " • " + fechaBonita(pendientes[i].fecha),
      soyDueño ? `<button type="button" class="btn btn-sm btn-outline-danger anular-invitacion" data-codigo="${pendientes[i].codigo}">Anular</button>` : "");
  }
  let lista = document.getElementById("listaInvitaciones");
  lista.innerHTML = html || '<p class="texto_gris small">No hay invitaciones pendientes.</p>';

  let botones = lista.querySelectorAll(".anular-invitacion");
  for (let i = 0; i < botones.length; i++) {
    botones[i].addEventListener("click", async function () {
      if (await preguntar("¿Estás seguro?", "El código " + botones[i].dataset.codigo + " dejará de funcionar.", "Anular") === false) {
        return;
      }

      let restantes = obtenerInvitaciones().filter(function (inv) { return inv.codigo !== botones[i].dataset.codigo; });
      guardarLista("invitaciones", restantes);
      mostrarMiembros();
    });
  }
}

// ================== UNIRSE ==================
function activarUnirse() {
  let formulario = document.getElementById("formUnirse");

  if (formulario === null) {
    return;
  }

  if (propiedadesDelUsuario().length === 0) {
    document.querySelector('a[aria-label="Volver"]').href = "../propiedad/crear-propiedad.html?primera=1";
  }

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    let codigo = document.getElementById("codigoUnirse").value.trim().toUpperCase();
    let usuario = obtenerUsuarioActual();
    let invitaciones = obtenerInvitaciones();
    let invitacion = null;

    for (let i = 0; i < invitaciones.length; i++) {
      if (invitaciones[i].codigo === codigo) {
        invitacion = invitaciones[i];
      }
    }

    if (invitacion === null) {
      alert("Ese código no existe. Revisa que esté bien escrito (ej. AV-7K2Q).");
      return;
    }

    if (invitacion.usada) {
      alert("Ese código ya se usó. Pide una invitación nueva.");
      return;
    }

    if (invitacion.correo && invitacion.correo !== usuario.correo) {
      alert("Esta invitación es para otra persona (" + invitacion.correo + ").");
      return;
    }

    let todas = obtenerLista(CLAVE_PROPIEDADES, propiedadesDeEjemplo());
    let propiedad = buscarPorId(todas, invitacion.propiedadId);

    if (propiedad === null || !propiedad.habilitado) {
      alert("La propiedad de esta invitación ya no está disponible.");
      return;
    }

    if (!propiedad.miembros) {
      propiedad.miembros = [invitacion.invitadoPor];
    }

    if (!propiedad.dueno) {
      propiedad.dueno = invitacion.invitadoPor;
    }

    if (!propiedad.miembros.includes(usuario.correo)) {
      propiedad.miembros.push(usuario.correo);
    }

    // lo que el dueño eligió que puede modificar
    if (invitacion.permisos) {
      propiedad.permisos = propiedad.permisos || {};
      propiedad.permisos[usuario.correo] = invitacion.permisos;
    }

    invitacion.usada = true;
    guardarLista(CLAVE_PROPIEDADES, todas);
    guardarLista("invitaciones", invitaciones);

    // se pasa a trabajar en la propiedad nueva
    cambiarPropiedad(propiedad.id);
    registrarEvento("Nuevo miembro", usuario.nombre + " se unió a " + propiedad.nombre, "sistema", "bi-people", "success");
    crearNotificacion("Nuevo miembro", usuario.nombre + " se unió a " + propiedad.nombre, "miembro_" + propiedad.id + "_" + usuario.correo);
    window.location.href = "inicio.html?mensaje=guardado";
  });
}

if (protegerPagina() !== false) {
  activarInvitar();
  activarUnirse();
}
