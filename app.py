from datetime import datetime, timedelta

from flask import Flask, redirect, render_template, request, url_for

from storage import get_signups, add_signup

app = Flask(__name__)

CUPO_MAXIMO = 8
HORA_APERTURA_DIA_SIGUIENTE = 21  # 21:00 -> ya se muestra el horario del día siguiente

WHATSAPP_NUMERO = "5491138014930"
INSTAGRAM_URL = "https://www.instagram.com/emede.entrenamientos/"

HORARIOS = {
    "Lunes": ["17:00", "18:00", "19:00"],
    "Martes": ["9:00", "17:30", "18:30", "19:00", "19:30"],
    "Miércoles": ["18:00", "19:00"],
    "Jueves": ["9:00", "17:30", "18:30", "19:30"],
    "Viernes": ["8:30", "17:00", "18:00", "19:00"],
}

DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]


def fecha_y_dia_a_mostrar():
    ahora = datetime.now()
    objetivo = ahora + timedelta(days=1) if ahora.hour >= HORA_APERTURA_DIA_SIGUIENTE else ahora
    return objetivo.date().isoformat(), DIAS[objetivo.weekday()]


@app.route("/")
def index():
    fecha, dia = fecha_y_dia_a_mostrar()
    horarios_dia = HORARIOS.get(dia, [])
    signups = get_signups(fecha, horarios_dia)
    return render_template(
        "index.html",
        dia=dia,
        horarios=horarios_dia,
        signups=signups,
        cupo_maximo=CUPO_MAXIMO,
        whatsapp_url=f"https://wa.me/{WHATSAPP_NUMERO}",
        instagram_url=INSTAGRAM_URL,
    )


@app.route("/anotarse", methods=["POST"])
def anotarse():
    fecha, dia = fecha_y_dia_a_mostrar()
    horarios_dia = HORARIOS.get(dia, [])
    horario = request.form.get("horario", "")
    nombre = request.form.get("nombre", "").strip()

    if nombre and horario in horarios_dia:
        add_signup(fecha, horarios_dia, horario, nombre, CUPO_MAXIMO)

    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True)
