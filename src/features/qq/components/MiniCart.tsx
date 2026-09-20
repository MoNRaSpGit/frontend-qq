import { useEffect, useRef, useState } from "react";
import { getCartCount, getCartTotalsByCurrency, type QqCartItem } from "../qq.cart";
import { getProductImageSrc } from "../qq.client";
import { getVariantPrice, QQ_PRICE_VARIANT_LABELS, type QqPriceVariant } from "../qq.pricing";
import { getProductTheme } from "../qq.theme";
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

// Pedido explicito (19/09/2026): "3,5 seg" (antes 5, antes 3). Tambien lo
// usa la barra que se vacia (animationDuration, mas abajo), asi los dos
// siempre coinciden.
const VISIBLE_MS = 3500;

// Numero que "sube" (o baja) hasta su nuevo valor en vez de cambiar de golpe
// -- el total del carrito se siente vivo al agregar algo. Arranca en el valor
// actual (no anima al montar) y respeta prefers-reduced-motion.
function useCountUp(target: number, durationMs = 650): number {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || displayRef.current === target) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }

    const from = displayRef.current;
    const startedAt = performance.now();
    let frameId = 0;

    function tick(now: number) {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = from + (target - from) * eased;
      displayRef.current = value;
      setDisplay(value);
      if (progress < 1) frameId = window.requestAnimationFrame(tick);
    }

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [target, durationMs]);

  return display;
}

function AnimatedAmount({ value }: { value: number }) {
  const shown = useCountUp(value);
  return <>${Math.round(shown)}</>;
}

// Miniatura del producto: su foto/logo si la tiene, si no el degrade de su
// categoria con las iniciales (mismo criterio que las tarjetas del catalogo).
function Thumb({ product, size }: { product: QqProduct; size: "lg" | "sm" }) {
  const imageSrc = getProductImageSrc(product);
  const theme = getProductTheme(product);
  const initials = product.name.replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 2).toUpperCase();

  return (
    <span className={`qq-minicart-thumb qq-minicart-thumb--${size}`} style={imageSrc ? undefined : { background: theme.gradient, color: theme.textColor }}>
      {imageSrc ? <img src={imageSrc} alt="" /> : initials}
    </span>
  );
}

function VariantPill({ variant }: { variant: QqPriceVariant }) {
  return <span className={`qq-minicart-pill qq-minicart-pill--${variant}`}>{QQ_PRICE_VARIANT_LABELS[variant]}</span>;
}

// Vista rapida del carrito (19/09/2026, pedido explicito): al agregar un
// producto entra desde el costado un panel a TODO LO ALTO de la pantalla
// con la confirmacion, el producto recien agregado, lo que ya habia, cuantos
// productos son y el total acumulado, y a los 3,5 segundos se va solo. NO es
// el carrito completo (ese sigue abriendose con el icono del header) y NO
// bloquea la pagina: no hay fondo oscuro, solo el panel ocupa lugar y el
// resto se sigue pudiendo tocar. Si el cursor esta encima, espera (se puede
// leer con calma); al sacarlo, vuelve la cuenta.
//
// Segunda version (19/09/2026, "mas lindo, mas elaborado, es para gente
// joven"): vidrio translucido, check animado, foto/logo de cada producto,
// etiquetas de color, total que cuenta hacia arriba y barra de tiempo con
// brillo.
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
    // lastAddedId en las dependencias: un agregado nuevo reinicia la cuenta.
  }, [visible, paused, lastAddedId]);

  const isOpen = visible && !hidden && lastAdded !== null;
  const totals = getCartTotalsByCurrency(items);
  const mainTotal = totals[0]?.total ?? 0;

  // La linea del carrito que corresponde a lo recien agregado (trae la
  // cantidad ACUMULADA, no solo la de este agregado).
  const addedLine = lastAdded
    ? items.find((item) => item.product.id === lastAdded.product.id && item.variant === lastAdded.variant)
    : undefined;
  const otherItems = lastAdded
    ? items.filter((item) => !(item.product.id === lastAdded.product.id && item.variant === lastAdded.variant))
    : items;

  return (
    <aside
      className={isOpen ? "qq-minicart is-open" : "qq-minicart"}
      role="status"
      aria-live="polite"
      aria-hidden={!isOpen}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button type="button" className="qq-minicart-close" onClick={() => setVisible(false)} aria-label="Cerrar" tabIndex={isOpen ? 0 : -1}>
        ×
      </button>

      <header className="qq-minicart-hero">
        <span className="qq-minicart-check-wrap" key={lastAddedId ?? 0}>
          <svg className="qq-minicart-check" viewBox="0 0 52 52" aria-hidden="true">
            <circle className="qq-minicart-check-circle" cx="26" cy="26" r="23" fill="none" />
            <path className="qq-minicart-check-mark" fill="none" d="M15 27 l8 8 l14 -16" />
          </svg>
        </span>
        <div>
          <h3>¡Agregado!</h3>
          <p>Producto agregado al carrito</p>
        </div>
      </header>

      {lastAdded && addedLine ? (
        <div className="qq-minicart-added" key={lastAdded.id}>
          <Thumb product={lastAdded.product} size="lg" />
          <div className="qq-minicart-added-info">
            <strong>{lastAdded.product.name}</strong>
            <div className="qq-minicart-added-meta">
              <VariantPill variant={lastAdded.variant} />
              <span>×{addedLine.quantity} en tu carrito</span>
            </div>
          </div>
          <span className="qq-minicart-added-price">${(getVariantPrice(lastAdded.product, lastAdded.variant) * addedLine.quantity).toFixed(0)}</span>
        </div>
      ) : null}

      <div className="qq-minicart-scroll">
        {otherItems.length > 0 ? (
          <>
            <h4 className="qq-minicart-section">También en tu carrito</h4>
            <ul className="qq-minicart-list">
              {otherItems.map((item, index) => (
                <li key={`${item.product.id}-${item.variant}`} className="qq-minicart-row" style={{ ["--i" as string]: index }}>
                  <Thumb product={item.product} size="sm" />
                  <span className="qq-minicart-row-info">
                    <span className="qq-minicart-row-name">{item.product.name}</span>
                    <span className="qq-minicart-row-meta">
                      <VariantPill variant={item.variant} />
                      <span>×{item.quantity}</span>
                    </span>
                  </span>
                  <span className="qq-minicart-row-price">${(getVariantPrice(item.product, item.variant) * item.quantity).toFixed(0)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      <footer className="qq-minicart-footer">
        <div className="qq-minicart-count">
          <span>Productos en el carrito</span>
          <strong>{getCartCount(items)}</strong>
        </div>
        <div className="qq-minicart-total">
          <span>Total acumulado</span>
          <strong>
            <AnimatedAmount value={mainTotal} />
            <small> /mes</small>
          </strong>
        </div>
        {totals.length > 1 ? (
          <p className="qq-minicart-extra-totals">
            {totals.slice(1).map((total) => `${total.currency} $${total.total.toFixed(0)}`).join(" · ")}
          </p>
        ) : null}

        <button type="button" className="qq-minicart-cta" onClick={onVerCarrito} tabIndex={isOpen ? 0 : -1}>
          Ver mi carrito
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="qq-minicart-hint">Seguí mirando, esto se cierra solo</p>
      </footer>

      {/* Barra que se va vaciando: muestra cuanto falta para que se cierre.
          Se reinicia con cada agregado y con cada vez que se saca el cursor
          (key), y queda llena mientras el cursor esta encima. */}
      <div
        className={paused ? "qq-minicart-timer is-paused" : "qq-minicart-timer"}
        key={`${lastAddedId ?? 0}-${paused}`}
        style={{ animationDuration: `${VISIBLE_MS}ms` }}
      />
    </aside>
  );
}
