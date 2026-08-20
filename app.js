const CUPO_MAXIMO = 8;
const HORA_APERTURA_DIA_SIGUIENTE = 21; // desde las 21hs se muestra el horario del día siguiente
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxLKP-5KiehkEJ4J81lb76TG_Ahdb1lU1x9yIMX9RBfS1yGZ07Tnx35J2Z-QeLrNDZ8/exec";

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

function render(dia, horariosHoy, signups) {
  diaEl.textContent = dia;

  if (horariosHoy.length === 0) {
    horariosDiv.style.display = "none";
    vacioEl.style.display = "block";
    vacioEl.textContent = "Hoy no hay clases. ¡Nos vemos el próximo día hábil!";
    return;
  }
  vacioEl.style.display = "none";
  horariosDiv.innerHTML = "";

  horariosHoy.forEach((hora) => {
    const nombres = signups[hora] || [];
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
      nombres.forEach((nombre) => {
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
        const boton = form.querySelector("button");
        const nombre = input.value.trim();
        if (!nombre) return;
        boton.disabled = true;
        boton.textContent = "Anotando...";
        anotarse(hora, nombre).finally(() => {
          boton.disabled = false;
          boton.textContent = "Anotarme";
        });
      });
      card.appendChild(form);
    }

    horariosDiv.appendChild(card);
  });
}

async function cargarYRenderizar() {
  const { fecha, dia } = fechaYDiaAMostrar();
  const horariosHoy = HORARIOS[dia] || [];

  if (horariosHoy.length === 0) {
    render(dia, horariosHoy, {});
    return;
  }

  const resp = await fetch(`${APPS_SCRIPT_URL}?fecha=${fecha}`);
  const signups = await resp.json();
  render(dia, horariosHoy, signups);
}

async function anotarse(hora, nombre) {
  const { fecha } = fechaYDiaAMostrar();

  await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ fecha, hora, nombre, cupoMaximo: CUPO_MAXIMO }),
  });

  await cargarYRenderizar();
}

function init() {
  cargarYRenderizar();
}

init();
