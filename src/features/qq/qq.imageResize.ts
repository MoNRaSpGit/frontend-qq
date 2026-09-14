// Redimensiona/comprime una imagen ANTES de mandarla al servidor, del
// lado del cliente (canvas) -- para que nunca llegue una foto "de esas
// recontrapesadas 4K" (pedido explicito, 15/09/2026). Queda una imagen
// "prudente": ancho maximo fijo, formato JPEG con compresion, que entra
// comoda en la tarjeta cuadrada del catalogo.
const MAX_WIDTH = 800;
const JPEG_QUALITY = 0.82;

export async function resizeImageFile(file: File): Promise<string> {
  const originalDataUri = await readFileAsDataUri(file);
  const image = await loadImage(originalDataUri);

  const scale = Math.min(1, MAX_WIDTH / image.width);
  const targetWidth = Math.round(image.width * scale);
  const targetHeight = Math.round(image.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    // Sin soporte de canvas (muy raro hoy en dia): se manda la original
    // tal cual, mejor eso que no poder cargar nada.
    return originalDataUri;
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
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
