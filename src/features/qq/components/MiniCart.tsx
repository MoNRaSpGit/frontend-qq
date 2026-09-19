import { useEffect, useState } from "react";
import { getCartCount, getCartTotalsByCurrency, type QqCartItem } from "../qq.cart";
import { getVariantPrice, QQ_PRICE_VARIANT_LABELS, type QqPriceVariant } from "../qq.pricing";
import type { QqProduct } from "../qq.types";

export type QqLastAdded = {
  // Distinto en cada agregado (aunque sea el mismo producto) -- es lo que
  // hace que el panel reaparezca y el conteo de segundos arranque de nuevo.
  id: number;
  product: QqProduct;
  variant: QqPriceVariant;
  quantity: number;
};

type MiniCartProps = {
  items: QqCartItem[];
  lastAdded: QqLastAdded | null;
  // true mientras el carrito completo (CartDrawer) esta abierto: ahi el
  // usuario ya esta viendo todo, el panel rapido sobra.
  hidden: boolean;
  onVerCarrito: () => void;
};

const VISIBLE_MS = 3000;
const MAX_LINES = 4;

// Vista rapida del carrito (19/09/2026, pedido explicito): al agregar un
// producto entra desde el costado un panel con la confirmacion, lo que hay
// en el carrito, cuantos productos son y el total acumulado, y a los ~3
// segundos se va solo. NO es el carrito completo (ese sigue abriendose con
// el icono del header) y NO bloquea la pagina: no hay fondo oscuro, solo el
// panel ocupa lugar y el resto se sigue pudiendo tocar. Si el cursor esta
// encima, espera (se puede leer con calma); al sacarlo, vuelven los 3s.
export function MiniCart({ items, lastAdded, hidden, onVerCarrito }: MiniCartProps) {
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const lastAddedId = lastAdded?.id ?? null;

  // Cada agregado (id nuevo) muestra el panel, incluso si ya estaba visible.
  useEffect(() => {
    if (lastAddedId !== null) setVisible(true);
  }, [lastAddedId]);

  useEffect(() => {
    if (!visible || paused) return;
    const timeoutId = window.setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => window.clearTimeout(timeoutId);
    // lastAddedId en las dependencias: un agregado nuevo reinicia los 3s.
  }, [visible, paused, lastAddedId]);

  const isOpen = visible && !hidden && lastAdded !== null;
  const totals = getCartTotalsByCurrency(items);
  const shownItems = items.slice(0, MAX_LINES);
  const hiddenCount = items.length - shownItems.length;

  return (
    <aside
      className={isOpen ? "qq-minicart is-open" : "qq-minicart"}
      role="status"
      aria-live="polite"
      aria-hidden={!isOpen}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="qq-minicart-header">
        <span className="qq-minicart-check" aria-hidden="true">
          ✓
        </span>
        <strong>Producto agregado al carrito</strong>
        <button type="button" className="qq-minicart-close" onClick={() => setVisible(false)} aria-label="Cerrar" tabIndex={isOpen ? 0 : -1}>
          ×
        </button>
      </div>

      {lastAdded ? (
        <p className="qq-minicart-added">
          {lastAdded.product.name} <span>({QQ_PRICE_VARIANT_LABELS[lastAdded.variant]})</span>
          {lastAdded.quantity > 1 ? <span> · +{lastAdded.quantity}</span> : null}
        </p>
      ) : null}

      <ul className="qq-minicart-list">
        {shownItems.map((item) => {
          const isNew = lastAdded !== null && item.product.id === lastAdded.product.id && item.variant === lastAdded.variant;
          return (
            <li key={`${item.product.id}-${item.variant}`} className={isNew ? "is-new" : undefined}>
              <span className="qq-minicart-line-name">
                {item.product.name} <span>({QQ_PRICE_VARIANT_LABELS[item.variant]})</span>
              </span>
              <span className="qq-minicart-line-qty">×{item.quantity}</span>
              <span className="qq-minicart-line-price">${(getVariantPrice(item.product, item.variant) * item.quantity).toFixed(0)}</span>
            </li>
          );
        })}
        {hiddenCount > 0 ? <li className="qq-minicart-more">y {hiddenCount} más…</li> : null}
      </ul>

      <div className="qq-minicart-summary">
        <div>
          <span>Productos en el carrito</span>
          <strong>{getCartCount(items)}</strong>
        </div>
        {totals.map((total) => (
          <div key={total.currency}>
            <span>Total</span>
            <strong>${total.total.toFixed(0)} /mes</strong>
          </div>
        ))}
      </div>

      <button type="button" className="qq-button qq-button--ghost qq-minicart-view" onClick={onVerCarrito} tabIndex={isOpen ? 0 : -1}>
        Ver carrito
      </button>

      {/* Barra que se va vaciando: muestra cuanto falta para que se cierre.
          Se reinicia con cada agregado y con cada vez que se saca el cursor
          (key), y queda llena mientras el cursor esta encima. */}
      <div className={paused ? "qq-minicart-timer is-paused" : "qq-minicart-timer"} key={`${lastAddedId ?? 0}-${paused}`} />
    </aside>
  );
}
