// Redimensiona/comprime una imagen ANTES de mandarla al servidor, del lado del
// cliente (canvas), para que nunca llegue una foto "recontrapesada 4K".
//
// Problema que resuelve: el admin sube fotos de cualquier forma (3000x4000,
// verticales, cuadradas) y en la web de escritorio quedaban corridas o
// cortadas. Solucion: cada imagen se compone en un lienzo de medida EXACTA
// (la misma de la caja donde se muestra), asi lo que se guarda es
// exactamente lo que se ve, sin sorpresas.
const CANVAS_SIZE = 640;
const JPEG_QUALITY = 0.85;

// Relleno de las bandas cuando la foto no tiene la forma del lienzo: en vez de
// un color solido (que en una tienda rosa se ve como una franja negra), se
// usa la MISMA foto agrandada y borrosa de fondo, con la foto entera adelante.
// Se desenfoca achicando y agrandando (anda en todos los navegadores, a
// diferencia de ctx.filter que Safari no tiene).
function drawBlurredFill(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const tiny = document.createElement("canvas");
  tiny.width = 32;
  tiny.height = Math.max(1, Math.round((32 * height) / width));
  const tinyContext = tiny.getContext("2d");
  if (!tinyContext) return;
  const coverScale = Math.max(tiny.width / image.width, tiny.height / image.height);
  const w = image.width * coverScale;
  const h = image.height * coverScale;
  tinyContext.drawImage(image, (tiny.width - w) / 2, (tiny.height - h) / 2, w, h);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(tiny, 0, 0, width, height);
}

// Encaja la foto en un lienzo EXACTO de width x height. Si la forma es casi la
// misma (hasta ~12% de diferencia) se recorta apenas para llenar; si es muy
// distinta (vertical, cuadrada, panoramica) se muestra ENTERA sobre el fondo
// borroso, asi nunca se le corta la cara ni el producto a nadie.
function composeOnCanvas(image: HTMLImageElement, width: number, height: number, quality: number): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const targetRatio = width / height;
  const imageRatio = image.width / image.height;
  const closeEnough = Math.abs(imageRatio / targetRatio - 1) <= 0.12;

  if (closeEnough) {
    const scale = Math.max(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  } else {
    drawBlurredFill(context, image, width, height);
    const scale = Math.min(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  }
  return canvas.toDataURL("image/jpeg", quality);
}

// Tarjeta del catalogo: siempre cuadrada.
export async function resizeImageFile(file: File): Promise<string> {
  const originalDataUri = await readFileAsDataUri(file);
  const image = await loadImage(originalDataUri);
  // Sin soporte de canvas (muy raro) se manda la original tal cual.
  return composeOnCanvas(image, CANVAS_SIZE, CANVAS_SIZE, JPEG_QUALITY) ?? originalDataUri;
}

// Carrusel: medida unica y fija (la que se le dice al admin y la misma de la
// caja del carrusel), suba lo que suba.
// (16/11/2026) Dos medidas: celular 1200x400 = la forma del recuadro en el
// celular (se ve entera); PC 1920x300 = banda fina, lo importante al centro.
export const CAROUSEL_SIZES = {
  mobile: { width: 1200, height: 400 },
  desktop: { width: 1920, height: 300 }
} as const;
const CAROUSEL_JPEG_QUALITY = 0.82;

export async function resizeCarouselImageFile(file: File, variant: keyof typeof CAROUSEL_SIZES): Promise<string> {
  const originalDataUri = await readFileAsDataUri(file);
  const image = await loadImage(originalDataUri);
  const { width, height } = CAROUSEL_SIZES[variant];
  return composeOnCanvas(image, width, height, CAROUSEL_JPEG_QUALITY) ?? originalDataUri;
}

function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo leer la imagen."));
    image.src = dataUri;
  });
}
