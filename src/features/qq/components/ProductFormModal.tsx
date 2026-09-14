import { useState, type FormEvent } from "react";
import { createProduct } from "../qq.client";
import type { QqProduct } from "../qq.types";

type ProductFormModalProps = {
  token: string;
  onCancelar: () => void;
  onGuardado: (product: QqProduct) => void;
};

// Alta simple, sin edicion todavia -- version arranque pedida por el
// usuario (14/09/2026): buscador + tarjetas primero, el resto de los
// detalles (editar, borrar, imagenes reales) se ven despues. Solo un
// administrador logueado llega a ver este modal (ver QqHomePage).
export function ProductFormModal({ token, onCancelar, onGuardado }: ProductFormModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("UYU");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const precioNum = Number(price);

    if (!name.trim()) {
      setError("Ingresá el nombre del producto.");
      return;
    }
    if (!Number.isFinite(precioNum) || precioNum < 0) {
      setError("Ingresá un precio válido.");
      return;
    }

    setError("");
    setGuardando(true);
    try {
      const product = await createProduct(token, {
        name: name.trim(),
        price: precioNum,
        currency: currency.trim() || "UYU",
        category: category.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim() || undefined
      });
      onGuardado(product);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el producto.");
      setGuardando(false);
    }
  }

  return (
    <div className="qq-modal-overlay">
      <div className="qq-modal-box">
        <h2>Nuevo producto</h2>

        <form onSubmit={(event) => void handleSubmit(event)}>
          <label className="qq-field">
            <span>Nombre</span>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
          </label>

          <div className="qq-field-row">
            <label className="qq-field">
              <span>Precio</span>
              <input type="number" step="0.01" min="0" value={price} onChange={(event) => setPrice(event.target.value)} />
            </label>
            <label className="qq-field">
              <span>Moneda</span>
              <input type="text" value={currency} onChange={(event) => setCurrency(event.target.value)} />
            </label>
          </div>

          <label className="qq-field">
            <span>Categoría (opcional)</span>
            <input type="text" value={category} onChange={(event) => setCategory(event.target.value)} />
          </label>

          <label className="qq-field">
            <span>URL de imagen (opcional)</span>
            <input type="text" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." />
          </label>

          <label className="qq-field">
            <span>Descripción (opcional)</span>
            <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>

          {error ? <p className="qq-error">{error}</p> : null}

          <div className="qq-modal-actions">
            <button type="button" className="qq-button qq-button--ghost" onClick={onCancelar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="qq-button qq-button--primary" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
