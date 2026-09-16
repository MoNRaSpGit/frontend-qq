import { getCartCount, getCartTotalsByCurrency, type QqCartItem } from "../qq.cart";
import { getBasePrice } from "../qq.pricing";
import { buildCartWhatsAppMessage, buildWhatsAppHref } from "../qq.whatsapp";

type CartDrawerProps = {
  items: QqCartItem[];
  onCerrar: () => void;
  onCambiarCantidad: (productId: number, quantity: number) => void;
  onQuitar: (productId: number) => void;
  onVaciar: () => void;
};

export function CartDrawer({ items, onCerrar, onCambiarCantidad, onQuitar, onVaciar }: CartDrawerProps) {
  const totals = getCartTotalsByCurrency(items);

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
                <div className="qq-cart-row" key={item.product.id}>
                  <div className="qq-cart-row-info">
                    <span className="qq-cart-row-name">{item.product.name}</span>
                    <span className="qq-cart-row-price">${getBasePrice(item.product).toFixed(0)} /mes c/u</span>
                  </div>
                  <div className="qq-qty-stepper">
                    <button type="button" onClick={() => onCambiarCantidad(item.product.id, item.quantity - 1)} aria-label="Restar">
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => onCambiarCantidad(item.product.id, item.quantity + 1)} aria-label="Sumar">
                      +
                    </button>
                  </div>
                  <button type="button" className="qq-cart-row-remove" onClick={() => onQuitar(item.product.id)} aria-label="Quitar">
                    Quitar
                  </button>
                </div>
              ))}
            </div>

            <div className="qq-cart-totals">
              {totals.map((total) => (
                <div key={total.currency} className="qq-cart-total-line">
                  <span>Total mensual</span>
                  <strong>${total.total.toFixed(0)} /mes</strong>
                </div>
              ))}
            </div>

            {/* El link ya trae escrito, listo para mandar, el detalle de
                lo que hay en el carrito -- pedido explicito (15/09/2026):
                que el cliente no tenga que volver a escribirlo. */}
            <a
              href={buildWhatsAppHref(buildCartWhatsAppMessage(items))}
              target="_blank"
              rel="noopener noreferrer"
              className="qq-button qq-button--whatsapp qq-cart-whatsapp"
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
