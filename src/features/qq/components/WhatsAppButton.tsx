// Boton flotante que abre un chat de WhatsApp directo. Pedido explicito
// (15/09/2026), con la misma receta que ya charlamos antes en el
// monorepo para que abra bien en cualquier dispositivo:
//   - link https://wa.me/<numero> (el metodo OFICIAL de Meta, no
//     "whatsapp://" ni nada parecido)
//   - numero completo en formato internacional, SOLO digitos, sin "+"
//     ni espacios ni guiones
//   - <a> real (no window.open desde JS) para no chocar con bloqueadores
//     de popups
// La unica falla que esto no puede evitar: si alguien entra al catalogo
// desde el navegador interno de Instagram/Facebook, esas apps bloquean
// a proposito el salto a WhatsApp -- no es algo que se pueda arreglar
// desde el codigo del sitio.
const WHATSAPP_RAW_NUMBER = "092 945 696";
const WHATSAPP_MESSAGE = "Hola! Quiero consultar por una cuenta/perfil.";

function toWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const withoutLeadingZero = digits.replace(/^0+/, "");
  return withoutLeadingZero.startsWith("598") ? withoutLeadingZero : `598${withoutLeadingZero}`;
}

const WHATSAPP_HREF = `https://wa.me/${toWhatsAppNumber(WHATSAPP_RAW_NUMBER)}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export function WhatsAppButton() {
  return (
    <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="qq-whatsapp-button" aria-label="Escribinos por WhatsApp">
      <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor" aria-hidden="true">
        <path d="M16.02 3C9.4 3 4 8.36 4 15c0 2.28.64 4.42 1.75 6.24L4 29l7.98-1.7A11.9 11.9 0 0 0 16.02 27C22.64 27 28 21.64 28 15S22.64 3 16.02 3Zm6.54 16.9c-.28.79-1.62 1.5-2.24 1.58-.6.08-1.31.11-2.11-.13a19.4 19.4 0 0 1-1.94-.72c-3.42-1.48-5.65-4.91-5.82-5.14-.17-.23-1.39-1.85-1.39-3.52 0-1.67.87-2.49 1.18-2.83.31-.34.68-.42.91-.42.23 0 .45.002.65.011.21.01.49-.08.76.58.28.68.95 2.35 1.03 2.52.08.17.14.37.03.6-.11.23-.17.37-.34.57-.17.2-.36.45-.51.6-.17.17-.35.36-.15.71.2.34.88 1.45 1.89 2.35 1.3 1.16 2.4 1.52 2.74 1.69.34.17.54.14.74-.09.2-.23.85-.99 1.08-1.33.23-.34.46-.28.77-.17.31.11 1.97.93 2.31 1.1.34.17.57.26.65.4.08.14.08.8-.2 1.59Z" />
      </svg>
      <span>WhatsApp</span>
    </a>
  );
}
