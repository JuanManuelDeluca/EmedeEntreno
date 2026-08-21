const HORA_APERTURA_DIA_SIGUIENTE = 21; // desde las 21hs se muestra el horario del día siguiente

// Se usan solo si todavía no hay nada guardado en Firebase (primera vez).
const HORARIOS_DEFECTO = {
  "Lunes": ["17:00", "18:00", "19:00"],
  "Martes": ["9:00", "17:30", "18:30", "19:00", "19:30"],
  "Miércoles": ["18:00", "19:00"],
  "Jueves": ["9:00", "17:30", "18:30", "19:30"],
  "Viernes": ["8:30", "17:00", "18:00", "19:00"],
};
const CUPO_MAXIMO_DEFECTO = 11;

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DIAS_ORDEN_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const horariosDiv = document.getElementById("horarios");
const diaEl = document.getElementById("dia");
const vacioEl = document.getElementById("vacio");

const modalOverlay = document.getElementById("modal-overlay");
const modalMensaje = document.getElementById("modal-mensaje");
const modalCancelar = document.getElementById("modal-cancelar");
const modalAceptar = document.getElementById("modal-aceptar");

const adminIcon = document.getElementById("admin-icon");
const adminOverlay = document.getElementById("admin-overlay");
const adminCerrar = document.getElementById("admin-cerrar");
const adminLogin = document.getElementById("admin-login");
const adminPanel = document.getElementById("admin-panel");
const adminEmail = document.getElementById("admin-email");
const adminPassword = document.getElementById("admin-password");
const adminError = document.getElementById("admin-error");
const adminEntrar = document.getElementById("admin-entrar");
const adminCupo = document.getElementById("admin-cupo");
const adminDias = document.getElementById("admin-dias");
const adminGuardar = document.getElementById("admin-guardar");
const adminSalir = document.getElementById("admin-salir");
const adminGuardado = document.getElementById("admin-guardado");
const adminOlvide = document.getElementById("admin-olvide");
const adminRecuperar = document.getElementById("admin-recuperar");
const adminRecuperarEmail = document.getElementById("admin-recuperar-email");
const adminRecuperarMsg = document.getElementById("admin-recuperar-msg");
const adminRecuperarEnviar = document.getElementById("admin-recuperar-enviar");
const adminRecuperarVolver = document.getElementById("admin-recuperar-volver");
const adminMostrarClave = document.getElementById("admin-mostrar-clave");
const adminCambiarClave = document.getElementById("admin-cambiar-clave");
const adminClaveNueva = document.getElementById("admin-clave-nueva");
const adminClaveRepetir = document.getElementById("admin-clave-repetir");
const adminClaveError = document.getElementById("admin-clave-error");
const adminClaveGuardar = document.getElementById("admin-clave-guardar");

let configActual = { horarios: HORARIOS_DEFECTO, cupoMaximo: CUPO_MAXIMO_DEFECTO };
let signupsActuales = {};

function formatFechaLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fechaYDiaAMostrar() {
  const ahora = new Date();
  const objetivo = new Date(ahora);
  if (ahora.getHours() >= HORA_APERTURA_DIA_SIGUIENTE) {
    objetivo.setDate(objetivo.getDate() + 1);
  }
  return {
    fecha: formatFechaLocal(objetivo),
    dia: DIAS[objetivo.getDay()],
    objetivoDate: objetivo,
    esHoyReal: formatFechaLocal(objetivo) === formatFechaLocal(ahora),
  };
}

function proximoDiaConClases(horarios, desdeDate) {
  const d = new Date(desdeDate);
  for (let i = 0; i < 7; i++) {
    d.setDate(d.getDate() + 1);
    const diaCandidato = DIAS[d.getDay()];
    if ((horarios[diaCandidato] || []).length > 0) return diaCandidato;
  }
  return null;
}

function confirmarPersonalizado(mensaje) {
  return new Promise((resolve) => {
    modalMensaje.textContent = mensaje;
    modalOverlay.style.display = "flex";

    function limpiar(resultado) {
      modalOverlay.style.display = "none";
      modalAceptar.removeEventListener("click", onAceptar);
      modalCancelar.removeEventListener("click", onCancelar);
      resolve(resultado);
    }
    function onAceptar() {
      limpiar(true);
    }
    function onCancelar() {
      limpiar(false);
    }

    modalAceptar.addEventListener("click", onAceptar);
    modalCancelar.addEventListener("click", onCancelar);
  });
}

function renderPagina() {
  const { dia, objetivoDate, esHoyReal } = fechaYDiaAMostrar();
  const horarios = configActual.horarios || HORARIOS_DEFECTO;
  const cupoMaximo = configActual.cupoMaximo || CUPO_MAXIMO_DEFECTO;
  const horariosHoy = horarios[dia] || [];

  diaEl.textContent = dia;

  if (horariosHoy.length === 0) {
    horariosDiv.style.display = "none";
    vacioEl.style.display = "block";
    const proximoDia = proximoDiaConClases(horarios, objetivoDate);
    vacioEl.textContent = proximoDia
      ? `Hoy no hay clases. ¡Nos vemos el ${proximoDia}!`
      : "Por ahora no hay horarios cargados.";
    return;
  }
  vacioEl.style.display = "none";
  horariosDiv.innerHTML = "";

  const ahora = new Date();

  horariosHoy.forEach((hora) => {
    const entradas = signupsActuales[hora] || {}; // { pushId: nombre }
    const items = Object.entries(entradas);
    const lleno = items.length >= cupoMaximo;

    let yaPaso = false;
    if (esHoyReal) {
      const [h, m] = hora.split(":").map(Number);
      const horaDate = new Date(ahora);
      horaDate.setHours(h, m, 0, 0);
      yaPaso = horaDate.getTime() <= ahora.getTime();
    }

    const noDisponible = lleno || yaPaso;
    let etiqueta = "";
    if (lleno) etiqueta = " · COMPLETO";
    else if (yaPaso) etiqueta = " · FINALIZADO";

    const card = document.createElement("div");
    card.className = "horario";

    const header = document.createElement("div");
    header.className = "horario-header";
    header.innerHTML = `
      <span class="hora">${hora}</span>
      <span class="cupo ${noDisponible ? "lleno" : ""}">${items.length}/${cupoMaximo}${etiqueta}</span>
    `;
    card.appendChild(header);

    if (items.length > 0) {
      const ul = document.createElement("ul");
      ul.className = "nombres";
      items.forEach(([pushId, nombre]) => {
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.textContent = nombre;
        const quitar = document.createElement("button");
        quitar.type = "button";
        quitar.className = "quitar";
        quitar.textContent = "✕";
        quitar.setAttribute("aria-label", `Sacar a ${nombre}`);
        quitar.addEventListener("click", async () => {
          const ok = await confirmarPersonalizado(`¿Sacar a "${nombre}" de las ${hora}?`);
          if (!ok) return;
          eliminar(hora, pushId);
        });
        li.appendChild(span);
        li.appendChild(quitar);
        ul.appendChild(li);
      });
      card.appendChild(ul);
    } else {
      const p = document.createElement("p");
      p.className = "sin-anotados";
      p.textContent = "Todavía nadie se anotó.";
      card.appendChild(p);
    }

    if (!noDisponible) {
      const form = document.createElement("form");
      form.innerHTML = `
        <input type="text" name="nombre" placeholder="Tu nombre" required maxlength="40">
        <button type="submit">Anotarme</button>
      `;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = form.querySelector('input[name="nombre"]');
        const nombre = input.value.trim();
        if (!nombre) return;
        anotarse(hora, nombre);
        input.value = "";
      });
      card.appendChild(form);
    }

    horariosDiv.appendChild(card);
  });
}

function anotarse(hora, nombre) {
  const { fecha } = fechaYDiaAMostrar();
  const cupoMaximo = configActual.cupoMaximo || CUPO_MAXIMO_DEFECTO;
  const entradas = signupsActuales[hora] || {};
  const nombres = Object.values(entradas);

  if (nombres.length >= cupoMaximo || nombres.includes(nombre)) return;

  firebase.database().ref(`signups/${fecha}/${hora}`).push(nombre);
}

function eliminar(hora, pushId) {
  const { fecha } = fechaYDiaAMostrar();
  firebase.database().ref(`signups/${fecha}/${hora}/${pushId}`).remove();
}

function escucharDatos() {
  const { fecha, dia } = fechaYDiaAMostrar();

  firebase
    .database()
    .ref("config")
    .on("value", (snap) => {
      const data = snap.val();
      configActual = {
        horarios: (data && data.horarios) || HORARIOS_DEFECTO,
        cupoMaximo: (data && data.cupoMaximo) || CUPO_MAXIMO_DEFECTO,
      };
      renderPagina();
      if (adminPanel.style.display !== "none") poblarPanelAdmin();
    });

  firebase
    .database()
    .ref(`signups/${fecha}`)
    .on("value", (snap) => {
      signupsActuales = snap.val() || {};
      renderPagina();
    });
}

// --- Panel del dueño ---

function abrirAdmin() {
  adminOverlay.style.display = "flex";
  adminError.textContent = "";
  adminError.style.color = "";
  adminGuardado.textContent = "";
  if (firebase.auth().currentUser) {
    mostrarPanelAdmin();
  } else {
    mostrarLoginAdmin();
  }
}

function cerrarAdmin() {
  adminOverlay.style.display = "none";
}

function mostrarLoginAdmin() {
  adminLogin.style.display = "block";
  adminRecuperar.style.display = "none";
  adminPanel.style.display = "none";
  adminEmail.value = "";
  adminPassword.value = "";
}

function mostrarRecuperarClave() {
  adminLogin.style.display = "none";
  adminRecuperar.style.display = "block";
  adminRecuperarEmail.value = "";
  adminRecuperarMsg.textContent = "";
  adminRecuperarMsg.style.color = "";
}

function mostrarPanelAdmin() {
  adminLogin.style.display = "none";
  adminPanel.style.display = "block";
  adminCambiarClave.style.display = "none";
  adminClaveNueva.value = "";
  adminClaveRepetir.value = "";
  adminClaveError.textContent = "";
  poblarPanelAdmin();
}

function poblarPanelAdmin() {
  adminCupo.value = configActual.cupoMaximo || CUPO_MAXIMO_DEFECTO;
  const horarios = configActual.horarios || HORARIOS_DEFECTO;

  adminDias.innerHTML = "";
  DIAS_ORDEN_SEMANA.forEach((dia) => {
    const div = document.createElement("div");
    div.className = "admin-dia";

    const label = document.createElement("label");
    label.textContent = dia;
    div.appendChild(label);

    const input = document.createElement("input");
    input.type = "text";
    input.dataset.dia = dia;
    input.placeholder = "ej: 9:00, 17:30, 18:30 (vacío = sin clase)";
    input.value = (horarios[dia] || []).join(", ");
    div.appendChild(input);

    adminDias.appendChild(div);
  });
}

async function guardarConfigAdmin() {
  const cupoMaximo = parseInt(adminCupo.value, 10);
  if (!cupoMaximo || cupoMaximo < 1) {
    adminGuardado.textContent = "";
    adminError.textContent = "Poné un cupo máximo válido.";
    return;
  }

  const nuevosHorarios = {};
  adminDias.querySelectorAll("input").forEach((input) => {
    const dia = input.dataset.dia;
    const horas = input.value
      .split(",")
      .map((h) => h.trim())
      .filter((h) => h.length > 0);
    if (horas.length > 0) nuevosHorarios[dia] = horas;
  });

  adminError.textContent = "";
  adminGuardar.disabled = true;
  adminGuardar.textContent = "Guardando...";

  try {
    await firebase.database().ref("config").set({ horarios: nuevosHorarios, cupoMaximo });
    adminGuardado.textContent = "¡Guardado!";
  } catch (err) {
    adminError.textContent = "No se pudo guardar. Probá de nuevo.";
  } finally {
    adminGuardar.disabled = false;
    adminGuardar.textContent = "Guardar cambios";
  }
}

async function iniciarSesionAdmin() {
  adminError.textContent = "";
  const email = adminEmail.value.trim();
  const password = adminPassword.value;

  if (!email || !password) {
    adminError.textContent = "Completá email y contraseña.";
    return;
  }

  adminEntrar.disabled = true;
  adminEntrar.textContent = "Entrando...";

  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    mostrarPanelAdmin();
  } catch (err) {
    adminError.textContent = "Email o contraseña incorrectos.";
  } finally {
    adminEntrar.disabled = false;
    adminEntrar.textContent = "Entrar";
  }
}

async function enviarResetClave() {
  adminRecuperarMsg.textContent = "";
  adminRecuperarMsg.style.color = "";
  const email = adminRecuperarEmail.value.trim();

  if (!email) {
    adminRecuperarMsg.textContent = "Poné tu email.";
    return;
  }

  adminRecuperarEnviar.disabled = true;
  try {
    await firebase.auth().sendPasswordResetEmail(email);
    adminRecuperarMsg.style.color = "#7ed17e";
    adminRecuperarMsg.textContent = "Te enviamos un mail para elegir una nueva contraseña.";
  } catch (err) {
    adminRecuperarMsg.textContent = "No se pudo enviar el mail. Revisá que el email sea correcto.";
  } finally {
    adminRecuperarEnviar.disabled = false;
  }
}

async function cambiarClave() {
  adminClaveError.textContent = "";
  const nueva = adminClaveNueva.value;
  const repetir = adminClaveRepetir.value;

  if (nueva.length < 6) {
    adminClaveError.textContent = "La contraseña debe tener al menos 6 caracteres.";
    return;
  }
  if (nueva !== repetir) {
    adminClaveError.textContent = "Las contraseñas no coinciden.";
    return;
  }

  adminClaveGuardar.disabled = true;
  adminClaveGuardar.textContent = "Guardando...";

  try {
    await firebase.auth().currentUser.updatePassword(nueva);
    adminClaveNueva.value = "";
    adminClaveRepetir.value = "";
    adminCambiarClave.style.display = "none";
    adminGuardado.textContent = "¡Contraseña actualizada!";
  } catch (err) {
    if (err.code === "auth/requires-recent-login") {
      adminClaveError.textContent = "Por seguridad, cerrá sesión, entrá de nuevo y probá otra vez.";
    } else {
      adminClaveError.textContent = "No se pudo cambiar. Probá de nuevo.";
    }
  } finally {
    adminClaveGuardar.disabled = false;
    adminClaveGuardar.textContent = "Confirmar nueva contraseña";
  }
}

function init() {
  if (typeof firebaseConfig === "undefined" || firebaseConfig.apiKey === "TU_API_KEY") {
    diaEl.textContent = "";
    horariosDiv.style.display = "none";
    vacioEl.style.display = "block";
    vacioEl.textContent = "Falta configurar Firebase en firebase-config.js para que la página funcione.";
    adminIcon.style.display = "none";
    return;
  }

  escucharDatos();
  setInterval(renderPagina, 60000);

  adminIcon.addEventListener("click", abrirAdmin);
  adminCerrar.addEventListener("click", cerrarAdmin);
  adminOverlay.addEventListener("click", (e) => {
    if (e.target === adminOverlay) cerrarAdmin();
  });
  adminEntrar.addEventListener("click", iniciarSesionAdmin);
  adminPassword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") iniciarSesionAdmin();
  });
  adminGuardar.addEventListener("click", guardarConfigAdmin);
  adminOlvide.addEventListener("click", mostrarRecuperarClave);
  adminRecuperarEnviar.addEventListener("click", enviarResetClave);
  adminRecuperarVolver.addEventListener("click", mostrarLoginAdmin);
  adminMostrarClave.addEventListener("click", () => {
    const visible = adminCambiarClave.style.display !== "none";
    adminCambiarClave.style.display = visible ? "none" : "block";
  });
  adminClaveGuardar.addEventListener("click", cambiarClave);
  adminSalir.addEventListener("click", async () => {
    await firebase.auth().signOut();
    mostrarLoginAdmin();
  });
}

init();
