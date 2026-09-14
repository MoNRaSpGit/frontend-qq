import type { QqUser } from "./qq.types";

// Sesion guardada en localStorage -- token + datos del usuario, para no
// tener que volver a loguearse en cada recarga.
const STORAGE_KEY = "qq.session.v1";

export type QqSession = {
  token: string;
  user: QqUser;
};

export function loadSession(): QqSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QqSession;
    if (!parsed?.token || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: QqSession) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Si localStorage no esta disponible, la sesion no persiste entre
    // recargas pero la app sigue funcionando en la pestaña actual.
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // sin efecto si localStorage no esta disponible
  }
}
