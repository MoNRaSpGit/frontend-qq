// Sin fotos/logos reales todavia (el cliente vende cuentas/perfiles de
// streaming -- Netflix, Disney+, etc.), asi que cada tarjeta se identifica
// por un degrade de color propio segun la categoria, en vez de una imagen.
// Los colores estan inspirados en cada marca (para que se reconozca de un
// vistazo cual es cual) pero no son una copia exacta de su identidad --
// esto es una tarjeta de catalogo de un revendedor, no un uso de marca.
type CategoryTheme = {
  gradient: string;
  textColor: string;
};

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  netflix: { gradient: "linear-gradient(160deg, #7a0d16, #2b0509)", textColor: "#ffffff" },
  "disney+": { gradient: "linear-gradient(160deg, #0d3f9e, #06153f)", textColor: "#ffffff" },
  "disney plus": { gradient: "linear-gradient(160deg, #0d3f9e, #06153f)", textColor: "#ffffff" },
  "hbo max": { gradient: "linear-gradient(160deg, #5b21b6, #1c0a35)", textColor: "#ffffff" },
  max: { gradient: "linear-gradient(160deg, #5b21b6, #1c0a35)", textColor: "#ffffff" },
  "youtube premium": { gradient: "linear-gradient(160deg, #a11f1f, #1a0505)", textColor: "#ffffff" },
  "youtube music": { gradient: "linear-gradient(160deg, #a11f1f, #1a0505)", textColor: "#ffffff" },
  spotify: { gradient: "linear-gradient(160deg, #14834a, #06210f)", textColor: "#ffffff" },
  "amazon prime video": { gradient: "linear-gradient(160deg, #0a5f77, #052733)", textColor: "#ffffff" },
  "prime video": { gradient: "linear-gradient(160deg, #0a5f77, #052733)", textColor: "#ffffff" },
  "paramount+": { gradient: "linear-gradient(160deg, #123fae, #050f38)", textColor: "#ffffff" },
  "apple tv+": { gradient: "linear-gradient(160deg, #2b2b2e, #050505)", textColor: "#ffffff" },
  "star+": { gradient: "linear-gradient(160deg, #0a2a4a, #041018)", textColor: "#ffffff" },
  crunchyroll: { gradient: "linear-gradient(160deg, #d4590f, #401a04)", textColor: "#ffffff" }
};

// Paleta de respaldo para categorias sin tema propio -- se elige siempre
// la misma segun el nombre (hash simple), para que un mismo producto no
// cambie de color entre una carga y otra.
const FALLBACK_GRADIENTS = [
  "linear-gradient(160deg, #7a4d0d, #2b1a05)",
  "linear-gradient(160deg, #1f5f8b, #06212f)",
  "linear-gradient(160deg, #6b1f5f, #240a1f)",
  "linear-gradient(160deg, #2f6b3f, #0d2414)",
  "linear-gradient(160deg, #6b3a1f, #241207)"
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getProductTheme(product: { name: string; category: string | null }): CategoryTheme {
  const key = (product.category ?? product.name).trim().toLowerCase();
  if (CATEGORY_THEMES[key]) {
    return CATEGORY_THEMES[key];
  }

  const fallback = FALLBACK_GRADIENTS[hashString(key) % FALLBACK_GRADIENTS.length];
  return { gradient: fallback, textColor: "#ffffff" };
}
