const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

export const expectedEnvironment = loopbackHosts.has(window.location.hostname)
  ? "development"
  : "production";

const backendOrigin = expectedEnvironment === "development"
  ? "http://127.0.0.1:8787"
  : "https://api.sanfranciscoysantaclara.es";

export function apiFetch(path, options) {
  return fetch(backendOrigin + path, { ...options, redirect: "error" });
}

export async function checkBackend() {
  const response = await apiFetch("/api/status", {
    cache: "no-store",
    signal: AbortSignal.timeout(4000)
  });
  if (!response.ok) {
    throw new Error("El Worker no respondió correctamente.");
  }
  const status = await response.json();
  return status.environment;
}
