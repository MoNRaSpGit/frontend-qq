export type QqUserRole = "administrador" | "usuario";

export type QqUser = {
  id: number;
  email: string;
  fullName: string | null;
  role: QqUserRole;
};

export type QqProductStatus = "published" | "draft";

export type QqCarouselImage = {
  id: number;
  createdAt: string;
};

// Cuenta corriente (15/09/2026): SOLO el admin ve esto (email/telefono
// de clientes reales, no es publico como productos/carrusel).
export type QqClient = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  dueDate: string;
  createdAt: string;
};

// Dos precios independientes (16/09/2026): "hay tarjetas que llevan los
// dos, otras que no". Al menos uno de los dos siempre esta cargado (se
// valida en el backend), pero nunca los dos a la vez son obligatorios.
export type QqProduct = {
  id: number;
  name: string;
  description: string | null;
  accountPrice: number | null;
  profilePrice: number | null;
  currency: string;
  imageUrl: string | null;
  hasImage: boolean;
  category: string | null;
  status: QqProductStatus;
  // Orden manual en el catalogo (16/09/2026) -- "si la cambio al puesto
  // 1, la 1 pasa al puesto de la que cambie". El publico ve las
  // tarjetas ordenadas por esto.
  position: number;
  createdAt: string;
};
