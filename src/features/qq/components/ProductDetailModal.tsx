import { useState } from "react";
import { getProductImageSrc } from "../qq.client";
import { getAvailableVariants, getPriceLines, getVariantPrice, QQ_PRICE_VARIANT_LABELS, type QqPriceVariant } from "../qq.pricing";
import { getProductTheme } from "../qq.theme";
import type { QqProduct } from "../qq.types";

type ProductDetailModalProps = {
  product: QqProduct;
  isAdmin: boolean;
  onCerrar: () => void;
  onAgregarAlCarrito: (product: QqProduct, variant: QqPriceVariant, quantity: number) => void;
  onEditar: (product: QqProduct) => void;
  onEliminar: (product: QqProduct) => void;
};

// Se abre al clickear una tarjeta -- ahi (y solo ahi) se ve el precio y
// la descripcion. Pedido explicito (15/09/2026): precio siempre en pesos
// y siempre mensual, y si el logueado es administrador, tambien puede
// editar/eliminar el producto desde aca mismo.
//
// Si el producto tiene los DOS precios cargados, el cliente tiene que
// elegir perfil o cuenta ANTES de poder agregarlo al carrito -- pedido
// explicito (16/09/2026): "que no pueda agregar al carrito si no
// selecciona el que quiere". Si solo tiene uno cargado, se usa ese
// directo, sin pedir que elija nada.
export function ProductDetailModal({ product, isAdmin, onCerrar, onAgregarAlCarrito, onEditar, onEliminar }: ProductDetailModalProps) {
  const availableVariants = getAvailableVariants(product);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<QqPriceVariant | null>(
    availableVariants.length === 1 ? availableVariants[0] : null
  );
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const theme = getProductTheme(product);
  const imageSrc = getProductImageSrc(product);
  const needsVariantChoice = availableVariants.length > 1;

  return (
    <div className="qq-modal-overlay" onClick={onCerrar}>
      <div className="qq-detail-box" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="qq-detail-close" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <div className="qq-detail-media" style={imageSrc ? undefined : { background: theme.gradient }}>
          {imageSrc ? (
            <img src={imageSrc} alt={product.name} />
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

          {needsVariantChoice ? (
            // Los dos precios cargados -- hay que elegir uno para poder
            // agregar al carrito (pedido explicito, 16/09/2026).
            <div className="qq-detail-variant-picker" role="radiogroup" aria-label="Elegí perfil o cuenta">
              {availableVariants.map((variant) => (
                <button
                  key={variant}
                  type="button"
                  role="radio"
                  aria-checked={selectedVariant === variant}
                  className={selectedVariant === variant ? "qq-detail-variant-option is-selected" : "qq-detail-variant-option"}
                  onClick={() => setSelectedVariant(variant)}
                >
                  <span className="qq-detail-price-label">{QQ_PRICE_VARIANT_LABELS[variant]}</span>
                  <span className="qq-detail-variant-amount">${getVariantPrice(product, variant).toFixed(0)} /mes</span>
                </button>
              ))}
            </div>
          ) : (
            // Uno solo cargado -- se muestra directo, sin nada para
            // elegir. Pedido explicito (16/09/2026): "si no le pongo el
            // precio de perfil, no sale".
            <div className="qq-detail-prices">
              {getPriceLines(product).map((line) => (
                <div className="qq-detail-price" key={line.label}>
                  <span className="qq-detail-price-label">{line.label}</span>
                  <span>
                    ${line.amount.toFixed(0)} <span className="qq-detail-price-suffix">/mes</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {confirmandoEliminar ? (
            <div className="qq-confirm-delete">
              <p>¿Eliminar "{product.name}"? No se puede deshacer.</p>
              <div className="qq-modal-actions">
                <button type="button" className="qq-button qq-button--ghost" onClick={() => setConfirmandoEliminar(false)}>
                  Cancelar
                </button>
                <button type="button" className="qq-button qq-button--danger" onClick={() => onEliminar(product)}>
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <>
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
                  disabled={!selectedVariant}
                  onClick={() => selectedVariant && onAgregarAlCarrito(product, selectedVariant, quantity)}
                >
                  Agregar al carrito
                </button>
              </div>

              {needsVariantChoice && !selectedVariant ? (
                <p className="qq-hint qq-detail-variant-hint">Elegí perfil o cuenta para poder agregarlo.</p>
              ) : null}

              {isAdmin ? (
                <div className="qq-detail-admin-actions">
                  <button type="button" className="qq-button qq-button--ghost" onClick={() => onEditar(product)}>
                    Editar
                  </button>
                  <button type="button" className="qq-button qq-button--danger" onClick={() => setConfirmandoEliminar(true)}>
                    Eliminar
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
