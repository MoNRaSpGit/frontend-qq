import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getProductImageSrc } from "../qq.client";
import { getAvailableVariants, getBillingSuffix, getBillingType, getPriceLines, getVariantPrice, QQ_PRICE_VARIANT_LABELS, type QqPriceVariant } from "../qq.pricing";
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
    // Sin precio: se agrega directo (variante "perfil" interna, no se muestra).
    availableVariants.length === 0 ? "perfil" : availableVariants.length === 1 ? availableVariants[0] : null
  );
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const theme = getProductTheme(product);
  const imageSrc = getProductImageSrc(product);
  // Foto principal + fotos extra (otros angulos), pasables con flechas, puntitos,
  // teclado o deslizando el dedo (17/11/2026).
  const slides = [imageSrc, ...(product.gallery ?? []).map((photo) => photo.url)].filter((src): src is string => Boolean(src));
  const [slideIndex, setSlideIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const goToSlide = (index: number) => setSlideIndex((index + slides.length) % slides.length);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") setSlideIndex((current) => (current - 1 + slides.length) % slides.length);
      if (event.key === "ArrowRight") setSlideIndex((current) => (current + 1) % slides.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);
  const needsVariantChoice = availableVariants.length > 1;
  // Sin ningun precio cargado (17/11/2026): el precio dice "Consultar" y se agrega
  // al carrito igual, con valor $0.
  const hasPrice = availableVariants.length > 0;

  return (
    <div className="qq-modal-overlay" onClick={onCerrar}>
      <div className="qq-detail-box" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="qq-detail-close" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <div
          className="qq-detail-media"
          style={slides.length > 0 ? undefined : { background: theme.gradient }}
          onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)}
          onTouchEnd={(event) => {
            if (touchStartX === null || slides.length < 2) return;
            const delta = event.changedTouches[0].clientX - touchStartX;
            if (Math.abs(delta) > 40) goToSlide(slideIndex + (delta < 0 ? 1 : -1));
            setTouchStartX(null);
          }}
        >
          {slides.length > 0 ? (
            <img key={slides[slideIndex]} src={slides[slideIndex]} alt={`${product.name} (foto ${slideIndex + 1} de ${slides.length})`} />
          ) : (
            <span className="qq-detail-media-wordmark" style={{ color: theme.textColor }}>
              {product.name}
            </span>
          )}

          {slides.length > 1 ? (
            <>
              <button type="button" className="qq-detail-arrow qq-detail-arrow--prev" onClick={() => goToSlide(slideIndex - 1)} aria-label="Foto anterior">
                ‹
              </button>
              <button type="button" className="qq-detail-arrow qq-detail-arrow--next" onClick={() => goToSlide(slideIndex + 1)} aria-label="Foto siguiente">
                ›
              </button>
              <div className="qq-detail-dots">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={index === slideIndex ? "qq-detail-dot is-active" : "qq-detail-dot"}
                    onClick={() => setSlideIndex(index)}
                    aria-label={`Ir a la foto ${index + 1}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="qq-detail-body">
          <h2>{product.name}</h2>
          {product.category ? <span className="qq-card-category">{product.category}</span> : null}
          {product.description ? <p className="qq-detail-description">{product.description}</p> : null}

          {!hasPrice ? (
            <div className="qq-detail-prices">
              <div className="qq-detail-price">
                <span className="qq-detail-price-label">Precio</span>
                <span>Consultar</span>
              </div>
            </div>
          ) : needsVariantChoice ? (
            // Los dos precios cargados -- hay que elegir uno para poder
            // agregar al carrito (pedido explicito, 16/09/2026). Pedido
            // explicito (17/09/2026): "el boton me sale opaco... algunos
            // productos si y otros no, es raro" -- el boton deshabilitado
            // no explicaba nada por su cuenta si el cliente no llegaba a
            // leer el cartel de abajo. Ahora el cartel esta ARRIBA de las
            // opciones (lo primero que se ve) y las opciones sin elegir
            // tienen un borde punteado para que se noten clickeables, no
            // como un simple texto decorativo.
            <>
              {!selectedVariant ? <p className="qq-hint qq-detail-variant-hint">Elegí perfil o cuenta para poder agregarlo.</p> : null}
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
                    <span className="qq-detail-variant-amount">${getVariantPrice(product, variant).toFixed(0)} {getBillingSuffix(getBillingType(product))}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            // Uno solo cargado -- se muestra directo, sin nada para
            // elegir. Pedido explicito (16/09/2026): "si no le pongo el
            // precio de perfil, no sale".
            <div className="qq-detail-prices">
              {getPriceLines(product).map((line) => (
                <div className="qq-detail-price" key={line.label}>
                  <span className="qq-detail-price-label">{line.label}</span>
                  <span>
                    ${line.amount.toFixed(0)} <span className="qq-detail-price-suffix">{getBillingSuffix(getBillingType(product))}</span>
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
                  className={selectedVariant ? "qq-button qq-button--primary qq-detail-add" : "qq-button qq-button--primary qq-detail-add is-blocked"}
                  onClick={() => {
                    if (!selectedVariant) {
                      toast.error("Debés seleccionar un precio (perfil o cuenta) antes de agregarlo.");
                      return;
                    }
                    onAgregarAlCarrito(product, selectedVariant, quantity);
                  }}
                >
                  Agregar al carrito
                </button>
              </div>

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
