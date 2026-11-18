import { useEffect, useState } from "react";

// Aviso temporal (17/11/2026, pedido explicito): "estamos teniendo problemas
// con las imagenes, pero el servicio sigue funcionando". Aparece al abrir la
// pagina, se queda 10 segundos (da para leerlo) y se va solo; tambien se puede
// cerrar con la X.
//
// PARA SACARLO: poner NOTICE_MESSAGE en null (o borrar este componente y su
// <NoticePopup /> en QqHomePage.tsx). Para otro aviso, cambiar el texto.
const NOTICE_MESSAGE: string | null =
  "Estamos teniendo problemas con las imágenes, pero el servicio sigue funcionando normalmente. Disculpe las molestias.";
const VISIBLE_MS = 10_000;

export function NoticePopup() {
  const [visible, setVisible] = useState(NOTICE_MESSAGE !== null);

  useEffect(() => {
    if (!NOTICE_MESSAGE) return;
    const timeoutId = window.setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!NOTICE_MESSAGE || !visible) return null;

  return (
    <div className="qq-notice" role="status" aria-live="polite">
      <span className="qq-notice-icon" aria-hidden="true">
        ⚠️
      </span>
      <p className="qq-notice-text">{NOTICE_MESSAGE}</p>
      <button type="button" className="qq-notice-close" onClick={() => setVisible(false)} aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  );
}
