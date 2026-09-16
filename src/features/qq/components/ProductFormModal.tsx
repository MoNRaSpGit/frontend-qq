import { useRef, useState, type FormEvent } from "react";
import { createProduct, getProductImageSrc, updateProduct, uploadProductImage } from "../qq.client";
import { QQ_CATEGORY_OPTIONS } from "../qq.categories";
import { resizeImageFile } from "../qq.imageResize";
import type { QqProduct } from "../qq.types";

type ProductFormModalProps = {
  token: string;
  // Si viene un producto, el modal edita en vez de crear -- mismo
  // formulario para las dos cosas (pedido 15/09/2026).
  product?: QqProduct;
  onCancelar: () => void;
  onGuardado: (product: QqProduct) => void;
};

// Precio SIEMPRE en pesos (UYU) y SIEMPRE mensual -- pedido explicito
// (15/09/2026): "el precio va a ser en pesos... eso es mensual". No hay
// selector de moneda, se manda fijo.
export function ProductFormModal({ token, product, onCancelar, onGuardado }: ProductFormModalProps) {
  const isEditing = Boolean(product);
  const [name, setName] = useState(product?.name ?? "");
  const [accountPrice, setAccountPrice] = useState(product?.accountPrice !== null && product?.accountPrice !== undefined ? String(product.accountPrice) : "");
  const [profilePrice, setProfilePrice] = useState(product?.profilePrice !== null && product?.profilePrice !== undefined ? String(product.profilePrice) : "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [imagePreview, setImagePreview] = useState<string | null>(product ? getProductImageSrc(product) : null);
  const [pendingImageDataUri, setPendingImageDataUri] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const resized = await resizeImageFile(file);
      setPendingImageDataUri(resized);
      setImagePreview(resized);
    } catch {
      setError("No se pudo procesar esa imagen. Probá con otra.");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmedAccountPrice = accountPrice.trim();
    const trimmedProfilePrice = profilePrice.trim();
    const accountPriceNum = trimmedAccountPrice ? Number(trimmedAccountPrice) : null;
    const profilePriceNum = trimmedProfilePrice ? Number(trimmedProfilePrice) : null;

    if (!name.trim()) {
      setError("Ingresá el nombre del producto.");
      return;
    }
    if (accountPriceNum !== null && (!Number.isFinite(accountPriceNum) || accountPriceNum < 0)) {
      setError("Ingresá un precio de cuenta válido.");
      return;
    }
    if (profilePriceNum !== null && (!Number.isFinite(profilePriceNum) || profilePriceNum < 0)) {
      setError("Ingresá un precio de perfil válido.");
      return;
    }
    // "Si pone los dos, salen los dos... hay tarjetas que si llevan y
    // otras que no" -- pero al menos UNO de los dos tiene que estar
    // (pedido explicito, 16/09/2026).
    if (accountPriceNum === null && profilePriceNum === null) {
      setError("Ingresá al menos un precio (de cuenta o de perfil).");
      return;
    }
    if (!category) {
      setError("Elegí una categoría.");
      return;
    }

    setError("");
    setGuardando(true);
    try {
      const common = {
        name: name.trim(),
        currency: "UYU",
        category,
        description: description.trim() || undefined
      };

      // En alta, un precio vacio se omite (undefined); en edicion, un
      // precio vaciado a proposito se manda como null explicito para
      // borrarlo de verdad (ver UpdateQqProductDto en el backend).
      const savedProduct =
        isEditing && product
          ? await updateProduct(token, product.id, { ...common, accountPrice: accountPriceNum, profilePrice: profilePriceNum })
          : await createProduct(token, {
              ...common,
              accountPrice: accountPriceNum ?? undefined,
              profilePrice: profilePriceNum ?? undefined
            });

      const finalProduct = pendingImageDataUri
        ? await uploadProductImage(token, savedProduct.id, pendingImageDataUri)
        : savedProduct;

      onGuardado(finalProduct);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el producto.");
      setGuardando(false);
    }
  }

  return (
    <div className="qq-modal-overlay">
      <div className="qq-modal-box">
        <h2>{isEditing ? "Editar producto" : "Nuevo producto"}</h2>

        <form onSubmit={(event) => void handleSubmit(event)}>
          <label className="qq-field">
            <span>Imagen</span>
            <div className="qq-image-picker">
              {imagePreview ? (
                <img src={imagePreview} alt="Vista previa" className="qq-image-preview" />
              ) : (
                <div className="qq-image-preview qq-image-preview--empty">Sin imagen</div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(event) => void handleFileChange(event)}
                hidden
              />
              <button type="button" className="qq-button qq-button--ghost" onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? "Cambiar imagen" : "Elegir imagen"}
              </button>
            </div>
            <small>Se ajusta sola al tamaño de la tarjeta -- no hace falta subir algo pesado.</small>
          </label>

          <label className="qq-field">
            <span>Nombre</span>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
          </label>

          <label className="qq-field">
            <span>Categoría</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">Elegir...</option>
              {QQ_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {/* Dos precios independientes -- pedido explicito (16/09/2026):
              "hay tarjetas que si llevan los dos, otras que no". Se
              puede dejar uno vacio, pero no los dos. */}
          <label className="qq-field">
            <span>Precio de cuenta mensual ($, opcional)</span>
            <input
              type="number"
              step="1"
              min="0"
              inputMode="decimal"
              value={accountPrice}
              onChange={(event) => setAccountPrice(event.target.value)}
            />
          </label>

          <label className="qq-field">
            <span>Precio de perfil mensual ($, opcional)</span>
            <input
              type="number"
              step="1"
              min="0"
              inputMode="decimal"
              value={profilePrice}
              onChange={(event) => setProfilePrice(event.target.value)}
            />
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
