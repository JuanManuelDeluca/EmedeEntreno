import json
import os

DATA_FILE = os.path.join(os.path.dirname(__file__), "data.json")


def _load_raw():
    if not os.path.exists(DATA_FILE):
        return None
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return None


def _save_raw(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_signups(fecha, horarios):
    raw = _load_raw()

    if not raw or raw.get("fecha") != fecha:
        raw = {"fecha": fecha, "signups": {h: [] for h in horarios}}
        _save_raw(raw)
        return raw["signups"]

    signups = raw.get("signups", {})
    for h in horarios:
        signups.setdefault(h, [])
    return signups


def add_signup(fecha, horarios, horario, nombre, cupo_maximo):
    raw = _load_raw()

    if not raw or raw.get("fecha") != fecha:
        raw = {"fecha": fecha, "signups": {h: [] for h in horarios}}

    signups = raw.setdefault("signups", {})
    signups.setdefault(horario, [])

    if len(signups[horario]) < cupo_maximo and nombre not in signups[horario]:
        signups[horario].append(nombre)

    _save_raw(raw)
