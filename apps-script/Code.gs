// Pegá este código en Extensiones > Apps Script de tu Google Sheet.
// La hoja va a ir guardando filas: fecha | hora | nombre
// (no hace falta borrarlas: la página solo muestra las de hoy, así que el resto queda como historial)

const CUPO_MAXIMO_DEFECTO = 8;

function getSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  // Fuerza a que las columnas fecha y hora siempre se guarden como texto plano,
  // para que Sheets no las convierta solo en una fecha/hora real.
  sheet.getRange("A:B").setNumberFormat("@");
  return sheet;
}

// Por si alguna fila vieja ya quedó guardada como fecha/hora real en vez de texto.
function normalizarFecha_(valor) {
  if (Object.prototype.toString.call(valor) === "[object Date]") {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(valor);
}

function normalizarHora_(valor) {
  if (Object.prototype.toString.call(valor) === "[object Date]") {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), "H:mm");
  }
  return String(valor);
}

function doGet(e) {
  const fecha = e.parameter.fecha;
  const sheet = getSheet_();
  const filas = sheet.getDataRange().getValues();
  const resultado = {};

  filas.forEach(([f, hora, nombre]) => {
    if (normalizarFecha_(f) === fecha) {
      const h = normalizarHora_(hora);
      if (!resultado[h]) resultado[h] = [];
      resultado[h].push(nombre);
    }
  });

  return ContentService.createTextOutput(JSON.stringify(resultado)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const fecha = body.fecha;
  const hora = body.hora;
  const nombre = body.nombre;
  const cupoMaximo = body.cupoMaximo || CUPO_MAXIMO_DEFECTO;

  const sheet = getSheet_();
  const filas = sheet.getDataRange().getValues();

  const yaAnotado = filas.some(
    ([f, h, n]) => normalizarFecha_(f) === fecha && normalizarHora_(h) === hora && n === nombre
  );
  const cantidad = filas.filter(
    ([f, h]) => normalizarFecha_(f) === fecha && normalizarHora_(h) === hora
  ).length;

  if (!yaAnotado && cantidad < cupoMaximo) {
    sheet.appendRow([fecha, hora, nombre]);
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
    ContentService.MimeType.JSON
  );
}
