import { useEffect, useState } from "react";
import { getCarouselImageSrc } from "../qq.client";
import type { QqCarouselImage } from "../qq.types";

type CarouselProps = {
  images: QqCarouselImage[];
};

const AUTOPLAY_MS = 5000;

// Carrusel clasico (15/09/2026): flechas + puntitos + auto-play,
// formato horizontal (panoramico). Las fotos las carga el admin desde
// su propia pestaña "Carrusel" (ver AdminCarouselPage.tsx) -- esto es
// SOLO la vidriera publica, no toca la foto de fondo de la pagina (esa
// sigue siendo siempre la original, fija).
export function Carousel({ images }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  // Pedido explicito (19/09/2026): "si alguien pone el cursor en el
  // carrusel, que pare y no siga pasando imagenes". Al sacar el cursor
  // vuelve a andar solo (el conteo de los 5s arranca de nuevo).
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (images.length < 2 || isPaused) return;
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(intervalId);
  }, [images.length, isPaused]);

  if (images.length === 0) return null;

  function goTo(index: number) {
    setActiveIndex((index + images.length) % images.length);
  }

  return (
    <div className="qq-carousel" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <div className="qq-carousel-viewport">
        <div className="qq-carousel-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {images.map((image) => (
            <div className="qq-carousel-slide" key={image.id}>
              <img src={getCarouselImageSrc(image)} alt="" loading="lazy" />
            </div>
          ))}
        </div>

        {images.length > 1 ? (
          <>
            <button type="button" className="qq-carousel-arrow qq-carousel-arrow--prev" onClick={() => goTo(activeIndex - 1)} aria-label="Anterior">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className="qq-carousel-arrow qq-carousel-arrow--next" onClick={() => goTo(activeIndex + 1)} aria-label="Siguiente">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="qq-carousel-dots" role="tablist" aria-label="Imágenes destacadas">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={index === activeIndex ? "qq-carousel-dot is-active" : "qq-carousel-dot"}
              onClick={() => goTo(index)}
              aria-label={`Ir a la imagen ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
