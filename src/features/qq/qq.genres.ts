// Categorias cerradas -- pedido explicito (15/09/2026): "son solo esas
// categorias" (Musica, Cine, Video juegos, Pagina web). Antes el genero
// agrupaba varias categorias especificas (netflix, spotify, etc.); ahora
// la categoria QUE ELIGE EL ADMIN (ver qq.categories.ts) ya es
// directamente el genero -- no hace falta ningun mapeo intermedio.
export type QqGenreKey = "musica" | "cine" | "videojuegos" | "pagina-web";

export const QQ_GENRES: Array<{ key: QqGenreKey; label: string }> = [
  { key: "musica", label: "Música" },
  { key: "cine", label: "Cine" },
  { key: "videojuegos", label: "Video juegos" },
  { key: "pagina-web", label: "Página web" }
];

const VALID_GENRES = new Set<string>(QQ_GENRES.map((genre) => genre.key));

export function getGenreForCategory(category: string | null): QqGenreKey | null {
  if (!category) return null;
  const normalized = category.trim().toLowerCase();
  return VALID_GENRES.has(normalized) ? (normalized as QqGenreKey) : null;
}
