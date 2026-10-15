import { toWhatsAppNumber } from "../qq.whatsapp";

// Numero de contacto de LogicLab (14/10/2026, pedido explicito) -- NO es
// el de QQ_WHATSAPP_NUMBER de qq.whatsapp.ts (ese es el numero real del
// cliente para vender cuentas/perfiles). Este es nuestro propio numero,
// para quien quiera contratarnos a nosotros.
const LOGICLAB_WHATSAPP_RAW = "092 945 696";
const LOGICLAB_WHATSAPP_NUMBER = toWhatsAppNumber(LOGICLAB_WHATSAPP_RAW);
const LOGICLAB_WHATSAPP_HREF = `https://wa.me/${LOGICLAB_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hola! Vi el catalogo y quiero consultar por un sistema para mi negocio."
)}`;

// Pie de pagina con nuestra propaganda (14/10/2026, pedido explicito):
// derechos de autor a la izquierda, "Desarrollado por" + logo + WhatsApp
// a la derecha. El logo de LogicLab todavia no esta -- en cuanto el
// usuario lo pase, reemplazar el <span>LogicLab</span> de abajo por un
// <img src={`${import.meta.env.BASE_URL}logiclab-logo.png`} ... /> (o el
// nombre de archivo que corresponda), siguiendo el mismo patron que
// EMPRESA_LOGO_URL en frontend-distribuidora/joker.
export function Footer() {
  return (
    <footer className="qq-footer">
      <span className="qq-footer-copyright">© {new Date().getFullYear()} LogicLab. Todos los derechos reservados.</span>

      <a href={LOGICLAB_WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="qq-footer-credit">
        <span className="qq-footer-credit-label">
          Desarrollado por <strong className="qq-footer-brand">LogicLab</strong>
        </span>
        <span className="qq-footer-divider" aria-hidden="true" />
        <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor" aria-hidden="true" className="qq-footer-whatsapp-icon">
          <path d="M16.02 3C9.4 3 4 8.36 4 15c0 2.28.64 4.42 1.75 6.24L4 29l7.98-1.7A11.9 11.9 0 0 0 16.02 27C22.64 27 28 21.64 28 15S22.64 3 16.02 3Zm6.54 16.9c-.28.79-1.62 1.5-2.24 1.58-.6.08-1.31.11-2.11-.13a19.4 19.4 0 0 1-1.94-.72c-3.42-1.48-5.65-4.91-5.82-5.14-.17-.23-1.39-1.85-1.39-3.52 0-1.67.87-2.49 1.18-2.83.31-.34.68-.42.91-.42.23 0 .45.002.65.011.21.01.49-.08.76.58.28.68.95 2.35 1.03 2.52.08.17.14.37.03.6-.11.23-.17.37-.34.57-.17.2-.36.45-.51.6-.17.17-.35.36-.15.71.2.34.88 1.45 1.89 2.35 1.3 1.16 2.4 1.52 2.74 1.69.34.17.54.14.74-.09.2-.23.85-.99 1.08-1.33.23-.34.46-.28.77-.17.31.11 1.97.93 2.31 1.1.34.17.57.26.65.4.08.14.08.8-.2 1.59Z" />
        </svg>
        <span>{LOGICLAB_WHATSAPP_RAW}</span>
      </a>
    </footer>
  );
}
