import { API_BASE_URL } from "../../shared/config/api";

// Contador de visitas y recorrido (30/10/2026, pedido explicito: "algo
// invisible, que no pida una cookie ni nada... si es el administrador, ni lo
// cuentes"). No se guarda NADA en el telefono del visitante: el id es un
// numero al azar que vive solo mientras la pagina esta abierta (recargar =
// visita nueva). Para nosotros: se consulta con
// backend/scripts/inspect-qq-visits.js. Nunca frena ni muestra errores.

export type QqTrackEvent = "visit" | "view_product" | "add_to_cart" | "open_cart" | "whatsapp_click";

function randomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

const visitorId = randomId();
let enabled = true;

// Si entra el administrador, no se cuenta nada (ni la visita ni lo que toque).
export function setTrackingEnabled(value: boolean) {
  enabled = value;
}

export function trackEvent(event: QqTrackEvent, extra?: { productId?: number; label?: string }) {
  if (!enabled) return;
  try {
    void fetch(`${API_BASE_URL}/api/v1/qq/events/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, event, productId: extra?.productId, label: extra?.label?.slice(0, 120) }),
      keepalive: true
    }).catch(() => {});
  } catch {
    // Nunca frena al visitante.
  }
}
