import { getProductImageSrc } from "../qq.client";
import { getProductTheme } from "../qq.theme";
import type { QqProduct } from "../qq.types";

type ProductCardProps = {
  product: QqProduct;
  onClick?: (product: QqProduct) => void;
};

// Tarjeta cuadrada, solo imagen + nombre -- nada de precio ni categoria
// aca (eso vive en el detalle, al hacer click). Pedido explicito
// (15/09/2026): si el admin subio una foto real, manda sobre el
// wordmark de color (ver getProductImageSrc).
export function ProductCard({ product, onClick }: ProductCardProps) {
  const theme = getProductTheme(product);
  const imageSrc = getProductImageSrc(product);

  return (
    <button type="button" className="qq-card" onClick={() => onClick?.(product)}>
      <div className="qq-card-media" style={imageSrc ? undefined : { background: theme.gradient }}>
        {imageSrc ? <img src={imageSrc} alt={product.name} loading="lazy" /> : null}
        <span className="qq-card-name-overlay" style={imageSrc ? undefined : { color: theme.textColor }}>
          {product.name}
        </span>
      </div>
    </button>
  );
}
