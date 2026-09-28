import { useState } from "react";
import { getCartCount, getCartTotalsByCurrency, type QqCartItem } from "../qq.cart";
import { reportWhatsAppCheckout } from "../qq.client";
import { applyDiscount, isValidDiscountCode } from "../qq.discount";
import { getVariantPrice, QQ_PRICE_VARIANT_LABELS, type QqPriceVariant } from "../qq.pricing";
import { buildCartWhatsAppMessage, buildWhatsAppHref } from "../qq.whatsapp";
import type { QqDiscountConfig } from "../qq.types";

type CartDrawerProps = {
  items: QqCartItem[];
  onCerrar: () => void;
  onCambiarCantidad: (productId: number, variant: QqPriceVariant, quantity: number) => void;
  onQuitar: (productId: number, variant: QqPriceVariant) => void;
  onVaciar: () => void;
  // Se llama despues de tocar "Comprar por WhatsApp": el carrito ya se
  // mando, asi que la pantalla lo vacia y cierra el cajon (ver
  // QqHomePage.tsx).
  onCompraEnviada: () => void;
  // Configurable por el admin (28/09/2026) -- si viene null (deshabilitado
  // o no se pudo consultar al backend), el input ni se muestra.
  discountConfig: QqDiscountConfig | null;
};

// Retraso antes de vaciar el carrito tras tocar "Comprar por WhatsApp".
// Si se vaciara en el mismo instante del click, el <a> desapareceria del
// DOM (el cajon muestra "todavia no agregaste nada" con carrito vacio)
// antes de que el navegador termine de abrir WhatsApp -- en algunos
// navegadores (los internos de Instagram/Facebook, sobre todo) eso puede
// perder el salto. Con el retraso el enlace ya se abrio.
const CLEAR_AFTER_CHECKOUT_MS = 600;

export function CartDrawer({ items, onCerrar, onCambiarCantidad, onQuitar, onVaciar, onCompraEnviada, discountConfig }: CartDrawerProps) {
  const totals = getCartTotalsByCurrency(items);
  // Codigo de descuento (26/09/2026, pedido explicito; configurable por el
  // admin desde 28/09/2026). Se valida al tocar "Aplicar", no en cada
  // tecla, para no marcar error mientras la persona todavia esta
  // escribiendo.
  const [codigoInput, setCodigoInput] = useState("");
  const [codigoAplicado, setCodigoAplicado] = useState(false);
  const [codigoError, setCodigoError] = useState(false);

  function handleAplicarCodigo() {
    if (discountConfig && isValidDiscountCode(codigoInput, discountConfig.code)) {
      setCodigoAplicado(true);
      setCodigoError(false);
    } else {
      setCodigoAplicado(false);
      setCodigoError(true);
    }
  }

  function handleWhatsAppClick() {
    reportWhatsAppCheckout(items);
    window.setTimeout(onCompraEnviada, CLEAR_AFTER_CHECKOUT_MS);
  }

  return (
    <div className="qq-modal-overlay" onClick={onCerrar}>
      <div className="qq-cart-box" onClick={(event) => event.stopPropagation()}>
        <div className="qq-cart-header">
          <h2>Tu carrito ({getCartCount(items)})</h2>
          <button type="button" className="qq-detail-close" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <p className="qq-hint">Todavía no agregaste nada.</p>
        ) : (
          <>
            <div className="qq-cart-list">
              {items.map((item) => (
                <div className="qq-cart-row" key={`${item.product.id}-${item.variant}`}>
                  <div className="qq-cart-row-info">
                    <span className="qq-cart-row-name">
                      {item.product.name} <span className="qq-cart-row-variant">({QQ_PRICE_VARIANT_LABELS[item.variant]})</span>
                    </span>
                    <span className="qq-cart-row-price">${getVariantPrice(item.product, item.variant).toFixed(0)} /mes c/u</span>
                  </div>
                  <div className="qq-qty-stepper">
                    <button
                      type="button"
                      onClick={() => onCambiarCantidad(item.product.id, item.variant, item.quantity - 1)}
                      aria-label="Restar"
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onCambiarCantidad(item.product.id, item.variant, item.quantity + 1)}
                      aria-label="Sumar"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="qq-cart-row-remove"
                    onClick={() => onQuitar(item.product.id, item.variant)}
                    aria-label="Quitar"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>

            {discountConfig ? (
              <div className="qq-cart-discount">
                <label htmlFor="qq-cart-discount-input">¿Tenés un código de descuento?</label>
                <div className="qq-cart-discount-row">
                  <input
                    id="qq-cart-discount-input"
                    type="text"
                    value={codigoInput}
                    onChange={(event) => {
                      setCodigoInput(event.target.value);
                      setCodigoError(false);
                    }}
                    placeholder="Ingresá el código"
                    disabled={codigoAplicado}
                  />
                  <button type="button" className="qq-button qq-button--ghost" onClick={handleAplicarCodigo} disabled={codigoAplicado || !codigoInput.trim()}>
                    {codigoAplicado ? "Aplicado" : "Aplicar"}
                  </button>
                </div>
                {codigoAplicado ? <p className="qq-cart-discount-ok">Código aplicado: {discountConfig.percentage}% de descuento.</p> : null}
                {codigoError ? <p className="qq-cart-discount-error">Ese código no es válido.</p> : null}
              </div>
            ) : null}

            <div className="qq-cart-totals">
              {totals.map((total) => (
                <div key={total.currency} className="qq-cart-total-line">
                  <span>Total mensual</span>
                  {codigoAplicado && discountConfig ? (
                    <span className="qq-cart-total-with-discount">
                      <span className="qq-cart-total-original">${total.total.toFixed(0)}</span>
                      <strong>${applyDiscount(total.total, discountConfig.percentage).toFixed(0)} /mes</strong>
                    </span>
                  ) : (
                    <strong>${total.total.toFixed(0)} /mes</strong>
                  )}
                </div>
              ))}
            </div>

            {/* El link ya trae escrito, listo para mandar, el detalle de
                lo que hay en el carrito -- pedido explicito (15/09/2026):
                que el cliente no tenga que volver a escribirlo. Si aplico
                el codigo, el mensaje ya lleva el total con el descuento. */}
            <a
              href={buildWhatsAppHref(
                buildCartWhatsAppMessage(
                  items,
                  codigoAplicado && discountConfig ? { code: discountConfig.code, percentage: discountConfig.percentage } : undefined
                )
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="qq-button qq-button--whatsapp qq-cart-whatsapp"
              onClick={handleWhatsAppClick}
            >
              Comprar por WhatsApp
            </a>

            <div className="qq-modal-actions">
              <button type="button" className="qq-button qq-button--ghost" onClick={onVaciar}>
                Vaciar carrito
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
