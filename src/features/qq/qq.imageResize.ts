// Achica/comprime una imagen ANTES de mandarla al servidor, del lado del cliente
// (canvas), para que nunca llegue una foto "recontrapesada 4K".
//
// 17/11/2026 (pedido explicito): la imagen se guarda TAL COMO ES, con sus
// proporciones. Antes se componia en un lienzo de medida fija con un fondo
// borroso (la misma foto agrandada y desenfocada) cuando la forma no coincidia:
// eso producia los costados difuminados en tarjetas y carrusel. Ahora solo se
// achica si es mas grande de lo necesario y se comprime; nada se recorta, se
// rellena ni se desenfoca. La forma de mostrarla la resuelve el CSS.
const PRODUCT_MAX_SIDE = 1280;
const PRODUCT_JPEG_QUALITY = 0.85;

// Medidas RECOMENDADAS para el carrusel (las que se le dicen al admin en los
// prompts para IA): celular 1200x400, PC 1920x300. Si sube otra forma, se
// guarda como es (solo se achica el ancho si pasa de la medida).
export const CAROUSEL_SIZES = {
  mobile: { width: 1200, height: 400 },
  desktop: { width: 1920, height: 300 }
} as const;
const CAROUSEL_JPEG_QUALITY = 0.82;

// Achica (nunca agranda) manteniendo las proporciones. Sin soporte de canvas
// (muy raro) se manda la original tal cual.
async function downscale(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> {
  const originalDataUri = await readFileAsDataUri(file);
  const image = await loadImage(originalDataUri);

  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return originalDataUri;

  // Fondo negro por si la imagen tiene transparencia (el JPEG no la admite).
  context.fillStyle = "#000000";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

// Tarjeta del catalogo: la imagen tal cual, solo achicada si es enorme.
export function resizeImageFile(file: File): Promise<string> {
  return downscale(file, PRODUCT_MAX_SIDE, PRODUCT_MAX_SIDE, PRODUCT_JPEG_QUALITY);
}

// Carrusel (celular o PC): tal cual, solo achicada si pasa del ancho recomendado.
export function resizeCarouselImageFile(file: File, variant: keyof typeof CAROUSEL_SIZES): Promise<string> {
  const { width } = CAROUSEL_SIZES[variant];
  return downscale(file, width, Number.POSITIVE_INFINITY, CAROUSEL_JPEG_QUALITY);
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
