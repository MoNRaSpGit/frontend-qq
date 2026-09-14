import { getProductTheme } from "../qq.theme";
import type { QqProduct } from "../qq.types";

type ProductCardProps = {
  product: QqProduct;
  onClick?: (product: QqProduct) => void;
};

export function ProductCard({ product, onClick }: ProductCardProps) {
  const theme = getProductTheme(product);

  return (
    <button type="button" className="qq-card" onClick={() => onClick?.(product)}>
      <div className="qq-card-media" style={product.imageUrl ? undefined : { background: theme.gradient }}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="qq-card-media-mock" style={{ color: theme.textColor }}>
            <span className="qq-card-media-wordmark">{product.name}</span>
            {product.description ? <span className="qq-card-media-tagline">{product.description}</span> : null}
          </div>
        )}
      </div>
      <div className="qq-card-body">
        <span className="qq-card-name">{product.name}</span>
        {product.category ? <span className="qq-card-category">{product.category}</span> : null}
        <span className="qq-card-price">
          {product.currency} {product.price.toFixed(2)}
        </span>
      </div>
    </button>
  );
}
