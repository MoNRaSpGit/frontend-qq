import { getBillingType, getVariantPrice, type QqBillingType, type QqPriceVariant } from "./qq.pricing";
import type { QqProduct } from "./qq.types";

// Carrito guardado en localStorage, por navegador -- sin backend todavia
// (no hay pantalla de pago ni pedido real armada). Pedido explicito
// (15/09/2026): click en una tarjeta expande el detalle con un boton
// "Agregar al carrito".
const STORAGE_KEY = "qq.cart.v1";

// Cada linea es un producto + la variante elegida (perfil/cuenta) --
// pedido explicito (16/09/2026): "que el cliente seleccione el que
// quiera y con ese se va al carrito". Si el mismo producto se agrega
// con las DOS variantes, quedan como dos lineas separadas (tienen
// precios distintos).
export type QqCartItem = {
  product: QqProduct;
  variant: QqPriceVariant;
  quantity: number;
};

function isSameLine(item: QqCartItem, productId: number, variant: QqPriceVariant): boolean {
  return item.product.id === productId && item.variant === variant;
}

export function loadCart(): QqCartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QqCartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items: QqCartItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Si localStorage no esta disponible, el carrito no persiste entre
    // recargas pero la app sigue funcionando en la pestaña actual.
  }
}

export function addToCart(items: QqCartItem[], product: QqProduct, variant: QqPriceVariant, quantity = 1): QqCartItem[] {
  const existing = items.find((item) => isSameLine(item, product.id, variant));
  const next = existing
    ? items.map((item) => (isSameLine(item, product.id, variant) ? { ...item, quantity: item.quantity + quantity } : item))
    : [...items, { product, variant, quantity }];
  saveCart(next);
  return next;
}

export function updateCartQuantity(
  items: QqCartItem[],
  productId: number,
  variant: QqPriceVariant,
  quantity: number
): QqCartItem[] {
  const next =
    quantity <= 0
      ? items.filter((item) => !isSameLine(item, productId, variant))
      : items.map((item) => (isSameLine(item, productId, variant) ? { ...item, quantity } : item));
  saveCart(next);
  return next;
}

export function removeFromCart(items: QqCartItem[], productId: number, variant: QqPriceVariant): QqCartItem[] {
  const next = items.filter((item) => !isSameLine(item, productId, variant));
  saveCart(next);
  return next;
}

export function clearCart(): QqCartItem[] {
  saveCart([]);
  return [];
}

// Agrupa el total por moneda (no suma U$S con UYU como si fueran lo
// mismo) -- hoy todo el catalogo esta en UYU, pero si el dia de mañana
// hay productos en otra moneda, esto ya lo banca sin romper nada.
// Ademas separa lo que se paga POR MES de lo que es PRECIO UNICO (14/11/2026):
// no se suman juntos. Primero va lo mensual.
export function getCartTotalsByCurrency(items: QqCartItem[]): Array<{ currency: string; billing: QqBillingType; total: number }> {
  const totals = new Map<string, { currency: string; billing: QqBillingType; total: number }>();
  for (const item of items) {
    const billing = getBillingType(item.product);
    const key = item.product.currency + "|" + billing;
    const current = totals.get(key) ?? { currency: item.product.currency, billing, total: 0 };
    current.total += getVariantPrice(item.product, item.variant) * item.quantity;
    totals.set(key, current);
  }
  return Array.from(totals.values()).sort((a, b) => (a.billing === b.billing ? 0 : a.billing === "monthly" ? -1 : 1));
}

export function getCartCount(items: QqCartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
