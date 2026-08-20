// Pegá acá los datos de tu proyecto Firebase (Configuración del proyecto > Tus apps > SDK).
// Estos valores NO son secretos, está bien que queden en el código público.
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  databaseURL: "https://TU_PROYECTO-default-rtdb.firebaseio.com",
  projectId: "TU_PROYECTO",
};

firebase.initializeApp(firebaseConfig);
