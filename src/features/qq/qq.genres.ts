import { useSyncExternalStore } from "react";

// Categorias del catalogo (16/11/2026): desde hoy la lista REAL la edita el
// administrador y se carga del servidor (setQqGenres). La key es lo que se
// guarda en cada producto y NUNCA cambia: solo se cambia el nombre visible.
export type QqGenreKey = string;
export type QqGenre = { id?: number; key: QqGenreKey; label: string };

// Respaldo mientras el servidor no responde (lista original del 15/09/2026).
export const DEFAULT_QQ_GENRES: QqGenre[] = [
  { key: "musica", label: "Música" },
  { key: "cine", label: "Cine" },
  { key: "videojuegos", label: "Video juegos" },
  { key: "pagina-web", label: "Página web" },
  { key: "anime", label: "Anime" },
  { key: "herramientas", label: "Herramientas" },
  { key: "tv", label: "TV" }
];

let currentGenres: QqGenre[] = DEFAULT_QQ_GENRES;
const listeners = new Set<() => void>();

export function getQqGenres(): QqGenre[] {
  return currentGenres;
}

export function setQqGenres(genres: QqGenre[]) {
  currentGenres = genres;
  listeners.forEach((listener) => listener());
}

export function useQqGenres(): QqGenre[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getQqGenres
  );
}

export function getGenreForCategory(category: string | null): QqGenreKey | null {
  if (!category) return null;
  const normalized = category.trim().toLowerCase();
  return currentGenres.some((genre) => genre.key === normalized) ? normalized : null;
}
