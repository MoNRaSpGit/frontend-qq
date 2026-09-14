import type { QqGenreKey } from "./qq.genres";

// Lista cerrada de categorias -- pedido explicito (15/09/2026): "son solo
// esas categorias". El selector de "Categoria" en el alta/edicion de
// producto sale de aca; como ahora la categoria ya ES el genero (ver
// qq.genres.ts), queda todo sincronizado sin ningun mapeo aparte.
export type QqCategoryOption = {
  value: string;
  label: string;
  genre: QqGenreKey;
};

export const QQ_CATEGORY_OPTIONS: QqCategoryOption[] = [
  { value: "musica", label: "Música", genre: "musica" },
  { value: "cine", label: "Cine", genre: "cine" },
  { value: "videojuegos", label: "Video juegos", genre: "videojuegos" },
  { value: "pagina-web", label: "Página web", genre: "pagina-web" }
];

export const QQ_GENRE_LABELS: Record<QqGenreKey, string> = {
  musica: "Música",
  cine: "Cine",
  videojuegos: "Video juegos",
  "pagina-web": "Página web"
};
