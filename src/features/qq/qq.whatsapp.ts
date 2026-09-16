import type { QqCartItem } from "./qq.cart";
import { getVariantPrice, QQ_PRICE_VARIANT_LABELS } from "./qq.pricing";

// Numero real del cliente (15/09/2026: se corrige a 098 856 076, el
// original -- antes tenia cargado el numero personal del admin por
// error) en formato internacional para wa.me -- misma receta que ya
// usamos en el resto del monorepo: solo digitos, sin "+" ni espacios,
// prefijo 598 si no lo tiene.
const WHATSAPP_RAW_NUMBER = "098 856 076";

export function toWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const withoutLeadingZero = digits.replace(/^0+/, "");
  return withoutLeadingZero.startsWith("598") ? withoutLeadingZero : `598${withoutLeadingZero}`;
}

export const QQ_WHATSAPP_NUMBER = toWhatsAppNumber(WHATSAPP_RAW_NUMBER);

export function buildWhatsAppHref(message: string): string {
  return `https://wa.me/${QQ_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Arma el mensaje ya "engatillado" con los productos del carrito -- pedido
// explicito (15/09/2026): que el cliente no tenga que escribir de nuevo lo
// que ya eligio en el carrito.
export function buildCartWhatsAppMessage(items: QqCartItem[]): string {
  const lines = items.map((item) => {
    const subtitle = item.quantity > 1 ? ` x${item.quantity}` : "";
    const variantLabel = QQ_PRICE_VARIANT_LABELS[item.variant];
    return `- ${item.product.name} (${variantLabel})${subtitle} ($${getVariantPrice(item.product, item.variant).toFixed(0)}/mes)`;
  });

  return ["Hola! Me gustaría comprar estos productos:", "", ...lines].join("\n");
}
