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

export type QqProduct = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  hasImage: boolean;
  category: string | null;
  status: QqProductStatus;
  createdAt: string;
};
