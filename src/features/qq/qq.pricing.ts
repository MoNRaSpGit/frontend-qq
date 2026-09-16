import type { QqProduct } from "./qq.types";

// Dos precios independientes por producto (16/09/2026): precio de
// cuenta y precio de perfil, cada uno opcional pero nunca los dos a la
// vez (el backend ya garantiza que al menos uno este cargado).
export type QqPriceVariant = "cuenta" | "perfil";

export const QQ_PRICE_VARIANT_LABELS: Record<QqPriceVariant, string> = {
  cuenta: "Cuenta",
  perfil: "Perfil"
};

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

// Que variantes tiene cargadas un producto -- si tiene las dos, el
// cliente tiene que elegir cual quiere ANTES de poder agregarlo al
// carrito (pedido explicito, 16/09/2026): "que no pueda agregar al
// carrito si no selecciona el que quiere".
export function getAvailableVariants(product: Pick<QqProduct, "accountPrice" | "profilePrice">): QqPriceVariant[] {
  const variants: QqPriceVariant[] = [];
  if (product.profilePrice !== null) variants.push("perfil");
  if (product.accountPrice !== null) variants.push("cuenta");
  return variants;
}

// Precio de la variante elegida -- con respaldo al otro precio si el
// producto cambio despues de que algo quedara guardado en el carrito
// (nunca deberia dar $0 mientras el producto tenga algun precio
// cargado).
export function getVariantPrice(product: Pick<QqProduct, "accountPrice" | "profilePrice">, variant: QqPriceVariant): number {
  if (variant === "cuenta") {
    return product.accountPrice ?? product.profilePrice ?? 0;
  }
  return product.profilePrice ?? product.accountPrice ?? 0;
}
