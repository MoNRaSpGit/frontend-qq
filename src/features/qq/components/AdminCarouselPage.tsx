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

// Prompt para que el administrador genere el banner con su IA (16/11/2026,
// mismo recurso que en Ropa): medida real del carrusel de QQ, que es una sola
// franja 1920 x 271. En PC se recortan los costados (alto minimo 316 px con
// object-fit: cover) y en celular se ve ENTERA pero chica (~390 x 55 px).
const AI_PROMPT = `Necesito un banner publicitario para el carrusel de la página de Qq Digital (venta de suscripciones y cuentas digitales: streaming, música, juegos, herramientas).

Medidas exactas: 1920 x 271 píxeles (una franja MUY horizontal y finita, proporción 7:1).

Cómo tiene que ser:
- La franja ocupa todo el ancho de la pantalla. En la computadora, según el tamaño de la ventana, se recortan los COSTADOS: todo lo importante (título, logo, imagen principal) tiene que ir en la zona CENTRAL, entre los píxeles 400 y 1520 de ancho.
- Los costados (los primeros y últimos 400 px) solo con fondo, degradé o decoración que se pueda cortar sin problema.
- En el celular la imagen se ve ENTERA pero muy chica (unos 390 x 55 px). Por eso: un título cortísimo (2 a 4 palabras) en letras GRANDES y gruesas. Nada de letra chica.
- Dejá al menos 25 px libres arriba y abajo: ningún texto pegado al borde.
- Estilo de la página: oscuro y moderno (fondo negro o muy oscuro), con colores vivos como detalle. Buen contraste entre el texto y el fondo para que se lea.
- Sin marcos, sin bordes blancos y sin simular una pantalla: la imagen ocupa todo el lienzo.

Tema del banner: [ESCRIBÍ ACÁ DE QUÉ ES: ej. "Netflix desde $350 al mes", "nuevo: Spotify Premium", "1 mes gratis"]`;

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(AI_PROMPT);
    toast.success("Prompt copiado. Pegalo en tu IA y completá el tema.");
  } catch {
    toast.error("No se pudo copiar. Probá de nuevo.");
  }
}

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

      <div className="qq-carousel-size">
        <strong>Medida: 1920 × 271 px</strong>
        <span>En PC se cortan los costados (lo importante al centro). En celular se ve entera pero chica: poco texto y grande.</span>
        <button type="button" className="qq-button qq-button--ghost" onClick={() => void copyPrompt()}>
          Copiar prompt para IA
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
