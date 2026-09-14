import { getProductTheme } from "../qq.theme";
import type { QqProduct } from "../qq.types";

type ProductCardProps = {
  product: QqProduct;
  onClick?: (product: QqProduct) => void;
};

// Tarjeta cuadrada, solo imagen + nombre -- nada de precio ni categoria
// aca (eso vive en el detalle, al hacer click). Pedido explicito
// (15/09/2026): cuando lleguen las imagenes reales de cada servicio, el
// wordmark de color se deja de ver solo (imageUrl manda apenas se carga).
export function ProductCard({ product, onClick }: ProductCardProps) {
  const theme = getProductTheme(product);

  return (
    <button type="button" className="qq-card" onClick={() => onClick?.(product)}>
      <div className="qq-card-media" style={product.imageUrl ? undefined : { background: theme.gradient }}>
        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" /> : null}
        <span className="qq-card-name-overlay" style={product.imageUrl ? undefined : { color: theme.textColor }}>
          {product.name}
        </span>
      </div>
    </button>
  );
}
