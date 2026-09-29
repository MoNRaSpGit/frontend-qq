import { toWhatsAppNumber } from "../qq.whatsapp";

// Pie de pagina (29/09/2026, pedido explicito): discreto y chiquito,
// solo el copyright a la izquierda y el credito del desarrollador a la
// derecha, con logo clickeable que abre WhatsApp -- mismo criterio que
// WhatsAppButton.tsx (link real https://wa.me/, no window.open, numero
// completo sin "+" ni espacios).
const DEVELOPER_WHATSAPP_NUMBER = toWhatsAppNumber("092945696");
const DEVELOPER_WHATSAPP_HREF = `https://wa.me/${DEVELOPER_WHATSAPP_NUMBER}`;

export function Footer() {
  return (
    <footer className="qq-footer">
      <span className="qq-footer-copy">© {new Date().getFullYear()} Qq Digital</span>
      <a
        href={DEVELOPER_WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="qq-footer-credit"
        aria-label="Desarrollado por - contactar por WhatsApp"
      >
        <span>Desarrollado por</span>
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo del desarrollador" className="qq-footer-logo" />
      </a>
    </footer>
  );
}
