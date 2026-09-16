import type { QqProduct } from "./qq.types";

// Dos precios independientes por producto (16/09/2026): precio de
// cuenta y precio de perfil, cada uno opcional pero nunca los dos a la
// vez (el backend ya garantiza que al menos uno este cargado).

// Precio "base" para el carrito/WhatsApp -- un producto entra al
// carrito con UN precio, asi que si tiene los dos cargados se usa el de
// cuenta (la oferta "completa") como el de referencia.
export function getBasePrice(product: Pick<QqProduct, "accountPrice" | "profilePrice">): number {
  return product.accountPrice ?? product.profilePrice ?? 0;
}

// Lineas para mostrar en la tarjeta/detalle -- pedido explicito
// (16/09/2026): "si no le pongo el precio de perfil, no sale... si pongo
// los dos, salen los dos".
export function getPriceLines(product: Pick<QqProduct, "accountPrice" | "profilePrice">): Array<{ label: string; amount: number }> {
  const lines: Array<{ label: string; amount: number }> = [];
  if (product.profilePrice !== null) {
    lines.push({ label: "Precio perfil", amount: product.profilePrice });
  }
  if (product.accountPrice !== null) {
    lines.push({ label: "Precio cuenta", amount: product.accountPrice });
  }
  return lines;
}
