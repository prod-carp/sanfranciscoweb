import { checkBackend, expectedEnvironment } from "./backend.js";

const environmentIndicator = document.getElementById("admin-environment");
const isLocal = expectedEnvironment === "development";
const environmentLabel = isLocal ? "Desarrollo local" : "Producción";

async function refreshEnvironmentIndicator() {
  let message;
  let state;

  try {
    const environment = await checkBackend();
    const matches = environment === expectedEnvironment;
    state = matches ? environment : "warning";
    message = matches
      ? "Worker conectado"
      : "El Worker responde con un entorno distinto o desconocido";
  } catch {
    state = "warning";
    message = isLocal
      ? "Worker local desconectado. Ejecuta iniciar-desarrollo.ps1."
      : "No se pudo comprobar el estado del Worker de producción";
  }

  const label = `${environmentLabel} · ${message}`;
  if (environmentIndicator.textContent !== label) {
    environmentIndicator.textContent = label;
    environmentIndicator.dataset.state = state;
  }
}

environmentIndicator.textContent = `${environmentLabel} · comprobando conexión`;
void refreshEnvironmentIndicator();
window.setInterval(refreshEnvironmentIndicator, 10000);
