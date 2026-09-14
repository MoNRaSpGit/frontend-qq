import { toast } from "react-toastify";
import type { QqSession } from "../qq.session";

type HeaderProps = {
  session: QqSession | null;
  cartCount: number;
  onInicio: () => void;
  onIngresar: () => void;
  onSalir: () => void;
  onAbrirCarrito: () => void;
};

// "Blog" y "Contacto" todavia no tienen pantalla propia -- se dejan como
// botones visibles (pedido tal cual) que por ahora solo avisan que viene
// despues, en vez de romper o navegar a una pagina vacia.
export function Header({ session, cartCount, onInicio, onIngresar, onSalir, onAbrirCarrito }: HeaderProps) {
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

      <div className="qq-header-right">
        <button type="button" className="qq-cart-button" onClick={onAbrirCarrito} aria-label="Ver carrito">
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1.4" />
            <circle cx="18" cy="21" r="1.4" />
            <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {cartCount > 0 ? <span className="qq-cart-badge">{cartCount}</span> : null}
        </button>

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
      </div>
    </header>
  );
}
