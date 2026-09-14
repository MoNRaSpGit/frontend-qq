import { useState } from "react";
import { toast } from "react-toastify";
import { QQ_GENRES, type QqGenreKey } from "../qq.genres";
import type { QqSession } from "../qq.session";

type HeaderProps = {
  session: QqSession | null;
  cartCount: number;
  selectedGenre: QqGenreKey | null;
  onSelectGenre: (genre: QqGenreKey | null) => void;
  onInicio: () => void;
  onIngresar: () => void;
  onSalir: () => void;
  onAbrirCarrito: () => void;
};

// "Blog" y "Contacto" todavia no tienen pantalla propia -- se dejan como
// botones visibles (pedido tal cual) que por ahora solo avisan que viene
// despues, en vez de romper o navegar a una pagina vacia.
//
// "Caracteristicas" (15/09/2026): antes los chips de genero (Cine/Musica/
// Juegos) vivian al lado del buscador -- pedido explicito de sacarlos de
// ahi y ponerlos en un desplegable propio del header.
export function Header({ session, cartCount, selectedGenre, onSelectGenre, onInicio, onIngresar, onSalir, onAbrirCarrito }: HeaderProps) {
  const [showFeatures, setShowFeatures] = useState(false);

  function handleSelectGenre(genre: QqGenreKey | null) {
    onSelectGenre(genre);
    setShowFeatures(false);
  }

  return (
    <header className="qq-header">
      <span className="qq-brand">QQ</span>

      <nav className="qq-nav">
        <button type="button" className="qq-nav-link" onClick={onInicio}>
          Inicio
        </button>

        <div className="qq-features-dropdown">
          <button
            type="button"
            className={selectedGenre ? "qq-nav-link is-active" : "qq-nav-link"}
            onClick={() => setShowFeatures((current) => !current)}
          >
            Características
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" className="qq-features-caret">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {showFeatures ? (
            <div className="qq-features-panel" role="group" aria-label="Filtrar por categoría">
              <button
                type="button"
                className={selectedGenre === null ? "qq-chip is-active" : "qq-chip"}
                onClick={() => handleSelectGenre(null)}
              >
                Todos
              </button>
              {QQ_GENRES.map((genre) => (
                <button
                  type="button"
                  key={genre.key}
                  className={selectedGenre === genre.key ? "qq-chip is-active" : "qq-chip"}
                  onClick={() => handleSelectGenre(genre.key)}
                >
                  {genre.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

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
