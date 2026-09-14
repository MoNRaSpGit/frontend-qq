import { useState } from "react";
import { getProductTheme } from "../qq.theme";
import type { QqProduct } from "../qq.types";

type ProductDetailModalProps = {
  product: QqProduct;
  onCerrar: () => void;
  onAgregarAlCarrito: (product: QqProduct, quantity: number) => void;
};

// Se abre al clickear una tarjeta -- ahi (y solo ahi) se ve el precio y
// la descripcion. Pedido explicito (15/09/2026).
export function ProductDetailModal({ product, onCerrar, onAgregarAlCarrito }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const theme = getProductTheme(product);

  return (
    <div className="qq-modal-overlay" onClick={onCerrar}>
      <div className="qq-detail-box" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="qq-detail-close" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <div className="qq-detail-media" style={product.imageUrl ? undefined : { background: theme.gradient }}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <span className="qq-detail-media-wordmark" style={{ color: theme.textColor }}>
              {product.name}
            </span>
          )}
        </div>

        <div className="qq-detail-body">
          <h2>{product.name}</h2>
          {product.category ? <span className="qq-card-category">{product.category}</span> : null}
          {product.description ? <p className="qq-detail-description">{product.description}</p> : null}

          <div className="qq-detail-price">
            {product.currency} {product.price.toFixed(2)}
          </div>

          <div className="qq-detail-actions">
            <div className="qq-qty-stepper">
              <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Restar">
                −
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((current) => current + 1)} aria-label="Sumar">
                +
              </button>
            </div>
            <button
              type="button"
              className="qq-button qq-button--primary qq-detail-add"
              onClick={() => onAgregarAlCarrito(product, quantity)}
            >
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
