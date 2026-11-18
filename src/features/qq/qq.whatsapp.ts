import { getCartTotalsByCurrency, type QqCartItem } from "./qq.cart";
import { applyDiscount } from "./qq.discount";
import { getBillingSuffix, getBillingType, getVariantPrice, hasAnyPrice, QQ_PRICE_VARIANT_LABELS } from "./qq.pricing";

// Numero real del cliente (19/09/2026: se cambia a 098 856 076, pedido
// explicito; antes 092945696) en formato internacional para wa.me -- misma
// receta que ya usamos en el resto del monorepo: solo digitos, sin "+" ni
// espacios, prefijo 598 si no lo tiene.
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
// que ya eligio en el carrito. Si aplico el codigo de descuento (26/09/2026,
// configurable por el admin desde 28/09/2026), el total ya sale con el
// descuento aplicado y se aclara el codigo usado, para que quien vende
// sepa que corresponde.
export function buildCartWhatsAppMessage(
  items: QqCartItem[],
  discount?: { code: string; percentage: number }
): string {
  const lines = items.map((item) => {
    const subtitle = item.quantity > 1 ? ` x${item.quantity}` : "";
    const priced = hasAnyPrice(item.product);
    const variantLabel = priced ? ` (${QQ_PRICE_VARIANT_LABELS[item.variant]})` : "";
    const suffix = ` ${getBillingSuffix(getBillingType(item.product))}`;
    return `- ${item.product.name}${variantLabel}${subtitle} ($${getVariantPrice(item.product, item.variant).toFixed(0)}${suffix})`;
  });

  const totals = getCartTotalsByCurrency(items);
  const totalLines = totals.map(({ currency, billing, total }) => {
    const moneda = currency === "USD" ? "U$S" : "$";
    const suffix = getBillingSuffix(billing);
    if (!discount) {
      return `Total: ${moneda}${total.toFixed(0)} ${suffix}`;
    }
    const withDiscount = applyDiscount(total, discount.percentage);
    return `Subtotal: ${moneda}${total.toFixed(0)} ${suffix}\nDescuento (código ${discount.code.toUpperCase()}, ${discount.percentage}%)\nTotal con descuento: ${moneda}${withDiscount.toFixed(0)} ${suffix}`;
  });

  return ["Hola! Me gustaría comprar estos productos:", "", ...lines, "", ...totalLines].join("\n");
}
