import { useState } from "react";
import { getProductImageSrc } from "../qq.client";
import { getPriceLines } from "../qq.pricing";
import type { QqProduct } from "../qq.types";

type AdminProductsPageProps = {
  products: QqProduct[];
  isLoading: boolean;
  error: string | null;
  onNuevo: () => void;
  onEditar: (product: QqProduct) => void;
  onEliminar: (product: QqProduct) => void;
  onReordenar: (product: QqProduct, position: number) => void;
};

// Input de posicion -- key con el numero actual para que se resetee solo
// cuando cambia desde afuera (por ejemplo, al hacer swap con otra
// tarjeta), sin pisar lo que el admin esta tipeando mientras escribe.
function PositionInput({ product, onReordenar }: { product: QqProduct; onReordenar: (product: QqProduct, position: number) => void }) {
  const [value, setValue] = useState(String(product.position));

  function commit() {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setValue(String(product.position));
      return;
    }
    if (parsed !== product.position) {
      onReordenar(product, parsed);
    }
  }

  return (
    <input
      key={product.position}
      type="number"
      min="1"
      className="qq-admin-position-input"
      defaultValue={product.position}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      aria-label={`Posición de ${product.name}`}
    />
  );
}

// Pantalla propia del administrador para cargar/editar/borrar productos --
// pedido explicito (15/09/2026): "que no ingrese directo en la pantalla
// principal, que tenga su propia pestaña". Antes el alta vivia como un
// boton suelto arriba de la grilla publica; ahora esa grilla publica
// vuelve a ser solo de consulta, y esto es lo unico que ve el admin al
// entrar a "Productos".
//
// Orden manual (16/09/2026): cada fila muestra su numero de posicion en
// un input editable -- "si la cambio al puesto 1, la 1 pasa al puesto de
// la que cambie" (swap, resuelto en el backend). La lista siempre se
// ordena por esa posicion.
export function AdminProductsPage({ products, isLoading, error, onNuevo, onEditar, onEliminar, onReordenar }: AdminProductsPageProps) {
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const sortedProducts = [...products].sort((a, b) => a.position - b.position);

  return (
    <main className="qq-admin-main">
      <div className="qq-admin-header">
        <h2>Productos</h2>
        <button type="button" className="qq-button qq-button--primary" onClick={onNuevo}>
          + Ingresar producto
        </button>
      </div>

      <p className="qq-hint">Cambiá el número de posición de una tarjeta para moverla -- la que estaba en ese lugar pasa al de ella.</p>

      {error ? <p className="qq-error qq-error--center">{error}</p> : null}
      {!error && isLoading ? <p className="qq-hint">Cargando...</p> : null}
      {!error && !isLoading && products.length === 0 ? <p className="qq-hint">Todavía no cargaste ningún producto.</p> : null}

      <div className="qq-admin-list">
        {sortedProducts.map((product) => {
          const imageSrc = getProductImageSrc(product);
          return (
            <div className="qq-admin-row" key={product.id}>
              <PositionInput product={product} onReordenar={onReordenar} />

              <div className="qq-admin-row-media">
                {imageSrc ? <img src={imageSrc} alt={product.name} /> : <span className="qq-admin-row-media-empty">Sin imagen</span>}
              </div>

              <div className="qq-admin-row-info">
                <span className="qq-admin-row-name">{product.name}</span>
                <span className="qq-admin-row-meta">
                  {product.category || "Sin categoría"} ·{" "}
                  {getPriceLines(product)
                    .map((line) => `${line.label} $${line.amount.toFixed(0)}/mes`)
                    .join(" · ")}
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
