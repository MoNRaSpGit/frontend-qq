import { toast } from "react-toastify";
import type { QqSession } from "../qq.session";

type HeaderProps = {
  session: QqSession | null;
  onInicio: () => void;
  onIngresar: () => void;
  onSalir: () => void;
};

// "Blog" y "Contacto" todavia no tienen pantalla propia -- se dejan como
// botones visibles (pedido tal cual) que por ahora solo avisan que viene
// despues, en vez de romper o navegar a una pagina vacia.
export function Header({ session, onInicio, onIngresar, onSalir }: HeaderProps) {
  return (
    <header className="qq-header">
      <span className="qq-brand">QQ</span>

      <nav className="qq-nav">
        <button type="button" className="qq-nav-link" onClick={onInicio}>
          Inicio
        </button>
        <button type="button" className="qq-nav-link" onClick={() => toast.info("Blog: próximamente.")}>
          Blog
        </button>
        <button type="button" className="qq-nav-link" onClick={() => toast.info("Contacto: próximamente.")}>
          Contacto
        </button>
      </nav>

      {session ? (
        <div className="qq-session">
          <span className="qq-session-name">{session.user.fullName || session.user.email}</span>
          <button type="button" className="qq-button qq-button--ghost" onClick={onSalir}>
            Salir
          </button>
        </div>
      ) : (
        <button type="button" className="qq-button qq-button--primary" onClick={onIngresar}>
          Ingresar
        </button>
      )}
    </header>
  );
}
