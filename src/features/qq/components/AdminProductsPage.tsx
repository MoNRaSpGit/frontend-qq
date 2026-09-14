import { useState } from "react";
import { getProductImageSrc } from "../qq.client";
import type { QqProduct } from "../qq.types";

type AdminProductsPageProps = {
  products: QqProduct[];
  isLoading: boolean;
  error: string | null;
  onNuevo: () => void;
  onEditar: (product: QqProduct) => void;
  onEliminar: (product: QqProduct) => void;
};

// Pantalla propia del administrador para cargar/editar/borrar productos --
// pedido explicito (15/09/2026): "que no ingrese directo en la pantalla
// principal, que tenga su propia pestaña". Antes el alta vivia como un
// boton suelto arriba de la grilla publica; ahora esa grilla publica
// vuelve a ser solo de consulta, y esto es lo unico que ve el admin al
// entrar a "Productos".
export function AdminProductsPage({ products, isLoading, error, onNuevo, onEditar, onEliminar }: AdminProductsPageProps) {
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  return (
    <main className="qq-admin-main">
      <div className="qq-admin-header">
        <h2>Productos</h2>
        <button type="button" className="qq-button qq-button--primary" onClick={onNuevo}>
          + Ingresar producto
        </button>
      </div>

      {error ? <p className="qq-error qq-error--center">{error}</p> : null}
      {!error && isLoading ? <p className="qq-hint">Cargando...</p> : null}
      {!error && !isLoading && products.length === 0 ? <p className="qq-hint">Todavía no cargaste ningún producto.</p> : null}

      <div className="qq-admin-list">
        {products.map((product) => {
          const imageSrc = getProductImageSrc(product);
          return (
            <div className="qq-admin-row" key={product.id}>
              <div className="qq-admin-row-media">
                {imageSrc ? <img src={imageSrc} alt={product.name} /> : <span className="qq-admin-row-media-empty">Sin imagen</span>}
              </div>

              <div className="qq-admin-row-info">
                <span className="qq-admin-row-name">{product.name}</span>
                <span className="qq-admin-row-meta">
                  {product.category || "Sin categoría"} · ${product.price.toFixed(0)} /mes
                </span>
              </div>

              <div className="qq-admin-row-actions">
                {confirmandoId === product.id ? (
                  <>
                    <span className="qq-admin-confirm-text">¿Eliminar?</span>
                    <button type="button" className="qq-button qq-button--ghost" onClick={() => setConfirmandoId(null)}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="qq-button qq-button--danger"
                      onClick={() => {
                        setConfirmandoId(null);
                        onEliminar(product);
                      }}
                    >
                      Sí, eliminar
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="qq-button qq-button--ghost" onClick={() => onEditar(product)}>
                      Editar
                    </button>
                    <button type="button" className="qq-button qq-button--danger" onClick={() => setConfirmandoId(product.id)}>
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
