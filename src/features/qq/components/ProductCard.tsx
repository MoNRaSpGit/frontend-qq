import type { QqProduct } from "../qq.types";

type ProductCardProps = {
  product: QqProduct;
  onClick?: (product: QqProduct) => void;
};

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <button type="button" className="qq-card" onClick={() => onClick?.(product)}>
      <div className="qq-card-media">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <span className="qq-card-media-placeholder">{product.name.slice(0, 1).toUpperCase()}</span>
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
