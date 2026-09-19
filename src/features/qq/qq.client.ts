import { API_BASE_URL } from "../../shared/config/api";
import { getVariantPrice } from "./qq.pricing";
import type { QqCarouselImage, QqClient, QqProduct, QqProductStatus, QqUser } from "./qq.types";

function buildUrl(path: string) {
  return `${API_BASE_URL}/api/v1${path}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as Partial<T> & { message?: string | string[] };

  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message[0] : data.message;
    throw new Error(message || `HTTP ${response.status}`);
  }

  return data as T;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

// Si el admin subio una foto, se sirve desde el backend (binario, no
// base64 en el JSON del producto); si no, se usa la URL externa vieja
// (compatibilidad) o null si no tiene ninguna.
export function getProductImageSrc(product: Pick<QqProduct, "id" | "hasImage" | "imageUrl">): string | null {
  if (product.hasImage) {
    return buildUrl(`/qq/products/${product.id}/image`);
  }
  return product.imageUrl;
}

export async function listProducts(search?: string) {
  const query = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const response = await fetch(buildUrl(`/qq/products${query}`));
  const data = await readJson<{ items: QqProduct[] }>(response);
  return data.items;
}

export async function createProduct(
  token: string,
  payload: {
    name: string;
    description?: string;
    accountPrice?: number;
    profilePrice?: number;
    currency?: string;
    imageUrl?: string;
    category?: string;
    status?: QqProductStatus;
  }
) {
  const response = await fetch(buildUrl("/qq/products"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ item: QqProduct }>(response);
  return data.item;
}

export async function updateProduct(
  token: string,
  productId: number,
  payload: Partial<{
    name: string;
    description: string;
    accountPrice: number | null;
    profilePrice: number | null;
    currency: string;
    imageUrl: string;
    category: string;
    status: QqProductStatus;
  }>
) {
  const response = await fetch(buildUrl(`/qq/products/${productId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ item: QqProduct }>(response);
  return data.item;
}

export async function deleteProduct(token: string, productId: number) {
  const response = await fetch(buildUrl(`/qq/products/${productId}`), {
    method: "DELETE",
    headers: authHeaders(token)
  });
  await readJson<{ ok: boolean }>(response);
}

// Orden manual del catalogo (16/09/2026) -- mover a un puesto swapea con
// el producto que ya estaba ahi (se resuelve en el backend).
export async function reorderProduct(token: string, productId: number, position: number) {
  const response = await fetch(buildUrl(`/qq/products/${productId}/position`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ position })
  });
  const data = await readJson<{ item: QqProduct }>(response);
  return data.item;
}

export async function uploadProductImage(token: string, productId: number, dataUri: string) {
  const response = await fetch(buildUrl(`/qq/products/${productId}/image`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ dataUri })
  });
  const data = await readJson<{ item: QqProduct }>(response);
  return data.item;
}

// Avisa al backend que alguien toco "Comprar por WhatsApp" con este carrito
// (19/09/2026, pedido explicito: contabilizar las ventas). Es una intencion
// de compra, no una venta confirmada -- el pedido se cierra por WhatsApp,
// afuera del sistema. Dispara y olvida: NUNCA puede demorar ni romper el
// salto a WhatsApp, por eso traga cualquier error, y usa keepalive para que
// el pedido termine de salir aunque el navegador cambie de pestaña.
export function reportWhatsAppCheckout(items: Array<{ product: QqProduct; variant: "cuenta" | "perfil"; quantity: number }>): void {
  try {
    const payloadItems = items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      variant: item.variant,
      quantity: item.quantity,
      unitPrice: getVariantPrice(item.product, item.variant)
    }));
    const total = Math.round(payloadItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * 100) / 100;

    void fetch(buildUrl("/qq/events/whatsapp-checkout"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payloadItems, total }),
      keepalive: true
    }).catch(() => {});
  } catch {
    // Nunca frena al cliente.
  }
}

// Carrusel de fondos (15/09/2026): el admin carga fotos desde su propia
// pestaña y el sitio va rotando entre ellas + la foto original fija de
// public/ como fondo de toda la pagina (ver QqHomePage.tsx).
export function getCarouselImageSrc(image: Pick<QqCarouselImage, "id" | "version">): string {
  return buildUrl(`/qq/carousel/${image.id}/image?v=${image.version}`);
}

export async function listCarouselImages() {
  const response = await fetch(buildUrl("/qq/carousel"));
  const data = await readJson<{ items: QqCarouselImage[] }>(response);
  return data.items;
}

export async function addCarouselImage(token: string, dataUri: string) {
  const response = await fetch(buildUrl("/qq/carousel"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ dataUri })
  });
  const data = await readJson<{ item: QqCarouselImage }>(response);
  return data.item;
}

export async function deleteCarouselImage(token: string, imageId: number) {
  const response = await fetch(buildUrl(`/qq/carousel/${imageId}`), {
    method: "DELETE",
    headers: authHeaders(token)
  });
  await readJson<{ ok: boolean }>(response);
}

// Cuenta corriente (15/09/2026) -- SOLO el admin ve/toca esto, requiere
// token en las 4 operaciones (ni siquiera listar es publico, a
// diferencia de productos/carrusel).
export async function listClients(token: string) {
  const response = await fetch(buildUrl("/qq/clients"), { headers: authHeaders(token) });
  const data = await readJson<{ items: QqClient[] }>(response);
  return data.items;
}

export async function createClient(
  token: string,
  payload: { name: string; dueDate: string; email?: string; phone?: string }
) {
  const response = await fetch(buildUrl("/qq/clients"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ item: QqClient }>(response);
  return data.item;
}

export async function updateClient(
  token: string,
  clientId: number,
  payload: Partial<{ name: string; dueDate: string; email: string; phone: string }>
) {
  const response = await fetch(buildUrl(`/qq/clients/${clientId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ item: QqClient }>(response);
  return data.item;
}

export async function deleteClient(token: string, clientId: number) {
  const response = await fetch(buildUrl(`/qq/clients/${clientId}`), {
    method: "DELETE",
    headers: authHeaders(token)
  });
  await readJson<{ ok: boolean }>(response);
}

export async function registerUser(payload: { email: string; password: string; fullName?: string }) {
  const response = await fetch(buildUrl("/qq/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return readJson<{ user: QqUser; token: string }>(response);
}

export async function loginUser(payload: { email: string; password: string }) {
  const response = await fetch(buildUrl("/qq/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return readJson<{ user: QqUser; token: string }>(response);
}

export async function logoutUser(token: string) {
  await fetch(buildUrl("/qq/auth/logout"), { method: "POST", headers: authHeaders(token) }).catch(() => {});
}
