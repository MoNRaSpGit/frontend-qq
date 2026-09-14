// Agrupa cada categoria especifica (netflix, spotify, etc.) en un genero
// mas general -- lo que se muestra como chip al lado del buscador. Nuevo
// producto con categoria no mapeada = no aparece en ningun genero puntual
// (solo en "Todos"), no rompe nada.
export type QqGenreKey = "cine" | "musica" | "juegos";

export const QQ_GENRES: Array<{ key: QqGenreKey; label: string }> = [
  { key: "cine", label: "Cine" },
  { key: "musica", label: "Música" },
  { key: "juegos", label: "Juegos" }
];

const GENRE_BY_CATEGORY: Record<string, QqGenreKey> = {
  netflix: "cine",
  "disney+": "cine",
  "disney plus": "cine",
  "hbo max": "cine",
  max: "cine",
  "prime video": "cine",
  "amazon prime video": "cine",
  "paramount+": "cine",
  "apple tv+": "cine",
  "star+": "cine",
  crunchyroll: "cine",
  "youtube premium": "cine",
  spotify: "musica",
  "youtube music": "musica",
  "xbox game pass": "juegos",
  "playstation plus": "juegos",
  steam: "juegos",
  "nintendo online": "juegos"
};

export function getGenreForCategory(category: string | null): QqGenreKey | null {
  if (!category) return null;
  return GENRE_BY_CATEGORY[category.trim().toLowerCase()] ?? null;
}
