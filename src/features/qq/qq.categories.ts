import type { QqGenreKey } from "./qq.genres";

// Lista cerrada de categorias conocidas (con su genero y su color en
// qq.theme.ts) -- el selector de "Categoria" en el alta/edicion de
// producto sale de aca, para que SIEMPRE quede bien clasificado en el
// filtro de Cine/Musica/Juegos (pedido explicito, 15/09/2026: "si pone
// musica, claramente va para la musica"). Agregar un servicio nuevo es
// sumar una linea aca + su color en qq.theme.ts.
export type QqCategoryOption = {
  value: string;
  label: string;
  genre: QqGenreKey;
};

export const QQ_CATEGORY_OPTIONS: QqCategoryOption[] = [
  { value: "netflix", label: "Netflix", genre: "cine" },
  { value: "disney+", label: "Disney+", genre: "cine" },
  { value: "hbo max", label: "HBO Max", genre: "cine" },
  { value: "prime video", label: "Amazon Prime Video", genre: "cine" },
  { value: "paramount+", label: "Paramount+", genre: "cine" },
  { value: "apple tv+", label: "Apple TV+", genre: "cine" },
  { value: "star+", label: "Star+", genre: "cine" },
  { value: "crunchyroll", label: "Crunchyroll", genre: "cine" },
  { value: "youtube premium", label: "YouTube Premium", genre: "cine" },
  { value: "spotify", label: "Spotify", genre: "musica" },
  { value: "youtube music", label: "YouTube Music", genre: "musica" },
  { value: "xbox game pass", label: "Xbox Game Pass", genre: "juegos" },
  { value: "playstation plus", label: "PlayStation Plus", genre: "juegos" },
  { value: "steam", label: "Steam", genre: "juegos" },
  { value: "nintendo online", label: "Nintendo Switch Online", genre: "juegos" }
];

export const QQ_GENRE_LABELS: Record<QqGenreKey, string> = {
  cine: "Cine",
  musica: "Música",
  juegos: "Juegos"
};
