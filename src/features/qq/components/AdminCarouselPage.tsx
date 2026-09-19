import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { addCarouselImage, deleteCarouselImage, getCarouselImageSrc } from "../qq.client";
import { resizeBackgroundImageFile } from "../qq.imageResize";
import type { QqCarouselImage } from "../qq.types";

type AdminCarouselPageProps = {
  token: string;
  images: QqCarouselImage[];
  isLoading: boolean;
  error: string | null;
  onAgregada: (image: QqCarouselImage) => void;
  onEliminada: (imageId: number) => void;
};

// Pestaña propia del admin para cargar las fotos de fondo del carrusel --
// pedido explicito (15/09/2026): "que el administrador entre a carrusel,
// ponga una imagen y esa imagen sea como la de fondo y vaya corriendo".
// La foto original (fondoCinco.jpg, fija en public/) sigue siendo
// siempre la primera del carrusel -- lo que se carga aca se agrega
// DESPUES de ella (ver QqHomePage.tsx).
export function AdminCarouselPage({ token, images, isLoading, error, onAgregada, onEliminada }: AdminCarouselPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setSubiendo(true);
    try {
      const dataUri = await resizeBackgroundImageFile(file);
      const image = await addCarouselImage(token, dataUri);
      onAgregada(image);
      toast.success("Imagen agregada al carrusel.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setSubiendo(false);
    }
  }

  async function handleEliminar(imageId: number) {
    setEliminandoId(imageId);
    try {
      await deleteCarouselImage(token, imageId);
      onEliminada(imageId);
      toast.success("Imagen eliminada del carrusel.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la imagen.");
    } finally {
      setEliminandoId(null);
      setConfirmandoId(null);
    }
  }

  return (
    <main className="qq-admin-main">
      <div className="qq-admin-header">
        <h2>Carrusel</h2>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={(event) => void handleFileChange(event)} hidden />
        <button
          type="button"
          className="qq-button qq-button--primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={subiendo}
        >
          {subiendo ? "Subiendo..." : "+ Agregar imagen"}
        </button>
      </div>

      <p className="qq-hint">
        La foto original del sitio siempre es la primera. Las que agregues acá se suman después de ella y el fondo va
        rotando entre todas, una por una.
      </p>

      {error ? <p className="qq-error qq-error--center">{error}</p> : null}
      {!error && isLoading ? <p className="qq-hint">Cargando...</p> : null}
      {!error && !isLoading && images.length === 0 ? <p className="qq-hint">Todavía no agregaste ninguna imagen extra.</p> : null}

      <div className="qq-carousel-grid">
        {images.map((image, index) => (
          <div className="qq-carousel-item" key={image.id}>
            <img src={getCarouselImageSrc(image)} alt={`Fondo del carrusel #${index + 2}`} />
            {confirmandoId === image.id ? (
              <div className="qq-carousel-item-confirm">
                <span>¿Eliminar?</span>
                <div className="qq-modal-actions">
                  <button type="button" className="qq-button qq-button--ghost" onClick={() => setConfirmandoId(null)}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="qq-button qq-button--danger"
                    disabled={eliminandoId === image.id}
                    onClick={() => void handleEliminar(image.id)}
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="qq-carousel-item-remove"
                onClick={() => setConfirmandoId(image.id)}
                aria-label="Eliminar imagen"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
