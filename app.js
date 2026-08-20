const CUPO_MAXIMO = 8;
const HORA_APERTURA_DIA_SIGUIENTE = 21; // desde las 21hs se muestra el horario del día siguiente

const HORARIOS = {
  "Lunes": ["17:00", "18:00", "19:00"],
  "Martes": ["9:00", "17:30", "18:30", "19:00", "19:30"],
  "Miércoles": ["18:00", "19:00"],
  "Jueves": ["9:00", "17:30", "18:30", "19:30"],
  "Viernes": ["8:30", "17:00", "18:00", "19:00"],
};

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const horariosDiv = document.getElementById("horarios");
const diaEl = document.getElementById("dia");
const vacioEl = document.getElementById("vacio");

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
  return { fecha: formatFechaLocal(objetivo), dia: DIAS[objetivo.getDay()] };
}

function render(fecha, dia, horariosHoy, signupsData) {
  diaEl.textContent = dia;

  if (horariosHoy.length === 0) {
    horariosDiv.style.display = "none";
    vacioEl.style.display = "block";
    return;
  }
  vacioEl.style.display = "none";
  horariosDiv.innerHTML = "";

  horariosHoy.forEach((hora) => {
    const entradas = signupsData[hora] || {};
    const nombres = Object.entries(entradas);
    const lleno = nombres.length >= CUPO_MAXIMO;

    const card = document.createElement("div");
    card.className = "horario";

    const header = document.createElement("div");
    header.className = "horario-header";
    header.innerHTML = `
      <span class="hora">${hora}</span>
      <span class="cupo ${lleno ? "lleno" : ""}">${nombres.length}/${CUPO_MAXIMO}${lleno ? " · COMPLETO" : ""}</span>
    `;
    card.appendChild(header);

    if (nombres.length > 0) {
      const ul = document.createElement("ul");
      ul.className = "nombres";
      nombres.forEach(([, nombre]) => {
        const li = document.createElement("li");
        li.textContent = nombre;
        ul.appendChild(li);
      });
      card.appendChild(ul);
    } else {
      const p = document.createElement("p");
      p.className = "sin-anotados";
      p.textContent = "Todavía nadie se anotó.";
      card.appendChild(p);
    }

    if (!lleno) {
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
        anotarse(fecha, hora, nombre, nombres.length);
        input.value = "";
      });
      card.appendChild(form);
    }

    horariosDiv.appendChild(card);
  });
}

function anotarse(fecha, hora, nombre, cantidadActual) {
  if (cantidadActual >= CUPO_MAXIMO) return;
  firebase.database().ref(`signups/${fecha}/${hora}`).push(nombre);
}

function init() {
  if (typeof firebaseConfig === "undefined" || firebaseConfig.apiKey === "TU_API_KEY") {
    diaEl.textContent = "";
    horariosDiv.style.display = "none";
    vacioEl.style.display = "block";
    vacioEl.textContent = "Falta configurar Firebase en firebase-config.js para que la página funcione.";
    return;
  }

  const { fecha, dia } = fechaYDiaAMostrar();
  const horariosHoy = HORARIOS[dia] || [];

  if (horariosHoy.length === 0) {
    render(fecha, dia, horariosHoy, {});
    return;
  }

  firebase
    .database()
    .ref(`signups/${fecha}`)
    .on("value", (snapshot) => {
      render(fecha, dia, horariosHoy, snapshot.val() || {});
    });
}

init();
