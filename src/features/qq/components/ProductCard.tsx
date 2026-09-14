import { getProductImageSrc } from "../qq.client";
import { getProductTheme } from "../qq.theme";
import type { QqProduct } from "../qq.types";

type ProductCardProps = {
  product: QqProduct;
  onClick?: (product: QqProduct) => void;
};

// Tarjeta cuadrada, solo imagen -- nada de precio ni categoria aca (eso
// vive en el detalle, al hacer click). Pedido explicito (15/09/2026): el
// nombre del producto ya no se muestra en la tarjeta cuando hay una foto
// real subida -- el nombre ya viene "dibujado" en esa imagen (es un
// logo), asi que el campo "Nombre" pasa a servir solo para el buscador.
// Si todavia no tiene imagen, se sigue mostrando el nombre sobre el
// wordmark de color para que la tarjeta no quede en blanco.
export function ProductCard({ product, onClick }: ProductCardProps) {
  const theme = getProductTheme(product);
  const imageSrc = getProductImageSrc(product);

  return (
    <button type="button" className="qq-card" onClick={() => onClick?.(product)}>
      <div className="qq-card-media" style={imageSrc ? undefined : { background: theme.gradient }}>
        {imageSrc ? (
          <img src={imageSrc} alt={product.name} loading="lazy" />
        ) : (
          <span className="qq-card-name-overlay" style={{ color: theme.textColor }}>
            {product.name}
          </span>
        )}
      </div>
    </button>
  );
}
