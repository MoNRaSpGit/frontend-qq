// Redimensiona/comprime una imagen ANTES de mandarla al servidor, del
// lado del cliente (canvas) -- para que nunca llegue una foto "de esas
// recontrapesadas 4K" (pedido explicito, 15/09/2026). Queda una imagen
// "prudente": formato JPEG con compresion, que entra comoda en la
// tarjeta cuadrada del catalogo.
//
// La tarjeta es SIEMPRE cuadrada (1:1) -- si se subiera la imagen con su
// forma original (un logo ancho, una foto horizontal, etc.), el recorte
// autoamtico de la tarjeta (object-fit: cover) le corta los costados o
// arriba/abajo y puede "quedar mal" (pedido explicito, 15/09/2026: "que
// el programa automaticamente ponga el tamaño correcto"). Para evitarlo,
// se compone la imagen en un lienzo cuadrado de una vez por todas: se
// escala ENTERA sin recortar nada (como "contain") y se centra sobre un
// fondo solido que combina con las tarjetas -- asi lo que se guarda ya
// es exactamente lo que se va a ver, sin sorpresas.
const CANVAS_SIZE = 640;
const JPEG_QUALITY = 0.85;
const LETTERBOX_BACKGROUND = "#1c1c1f";

export async function resizeImageFile(file: File): Promise<string> {
  const originalDataUri = await readFileAsDataUri(file);
  const image = await loadImage(originalDataUri);

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const context = canvas.getContext("2d");
  if (!context) {
    // Sin soporte de canvas (muy raro hoy en dia): se manda la original
    // tal cual, mejor eso que no poder cargar nada.
    return originalDataUri;
  }

  context.fillStyle = LETTERBOX_BACKGROUND;
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const scale = Math.min(CANVAS_SIZE / image.width, CANVAS_SIZE / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = (CANVAS_SIZE - drawWidth) / 2;
  const offsetY = (CANVAS_SIZE - drawHeight) / 2;

  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
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
