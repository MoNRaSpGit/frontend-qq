import { useState } from "react";
import { toast } from "react-toastify";
import { QQ_GENRES, type QqGenreKey } from "../qq.genres";
import type { QqSession } from "../qq.session";
import { buildWhatsAppHref } from "../qq.whatsapp";

const HEADER_WHATSAPP_HREF = buildWhatsAppHref("Hola! Quiero consultar por una cuenta/perfil.");

type HeaderProps = {
  session: QqSession | null;
  cartCount: number;
  selectedGenre: QqGenreKey | null;
  onSelectGenre: (genre: QqGenreKey | null) => void;
  activeView: "catalogo" | "productos" | "carrusel" | "clientes";
  onInicio: () => void;
  onProductos: () => void;
  onCarrusel: () => void;
  onClientes: () => void;
  onIngresar: () => void;
  onSalir: () => void;
  onAbrirCarrito: () => void;
};

// "Blog" y "Contacto" todavia no tienen pantalla propia -- se dejan como
// botones visibles (pedido tal cual) que por ahora solo avisan que viene
// despues, en vez de romper o navegar a una pagina vacia.
//
// "Categorias" (15/09/2026): antes los chips de genero (Cine/Musica/
// Juegos) vivian al lado del buscador -- pedido explicito de sacarlos de
// ahi y ponerlos en un desplegable propio del header.
export function Header({
  session,
  cartCount,
  selectedGenre,
  onSelectGenre,
  activeView,
  onInicio,
  onProductos,
  onCarrusel,
  onClientes,
  onIngresar,
  onSalir,
  onAbrirCarrito
}: HeaderProps) {
  const [showFeatures, setShowFeatures] = useState(false);
  const isAdmin = session?.user.role === "administrador";

  function handleSelectGenre(genre: QqGenreKey | null) {
    onSelectGenre(genre);
    setShowFeatures(false);
  }

  return (
    <header className="qq-header">
      {/* Se saco el boton "Ingresar" -- pedido explicito (15/09/2026):
          para entrar, se aprieta el logo del cliente. Solo tiene sentido
          cuando no hay sesion -- si ya estas logueado, el logo no hace
          nada (para eso esta "Salir"). */}
      {session ? (
        <img className="qq-brand-logo" src={`${import.meta.env.BASE_URL}QqNeutro.png`} alt="Qq Digital" />
      ) : (
        <button type="button" className="qq-brand-logo-button" onClick={onIngresar} aria-label="Ingresar">
          <img className="qq-brand-logo" src={`${import.meta.env.BASE_URL}QqNeutro.png`} alt="Qq Digital" />
        </button>
      )}

      <nav className="qq-nav">
        <button
          type="button"
          className={activeView === "catalogo" ? "qq-nav-link is-active" : "qq-nav-link"}
          onClick={onInicio}
        >
          Inicio
        </button>

        {isAdmin ? (
          <button
            type="button"
            className={activeView === "productos" ? "qq-nav-link is-active" : "qq-nav-link"}
            onClick={onProductos}
          >
            Productos
          </button>
        ) : null}

        {isAdmin ? (
          <button
            type="button"
            className={activeView === "carrusel" ? "qq-nav-link is-active" : "qq-nav-link"}
            onClick={onCarrusel}
          >
            Carrusel
          </button>
        ) : null}

        {isAdmin ? (
          <button
            type="button"
            className={activeView === "clientes" ? "qq-nav-link is-active" : "qq-nav-link"}
            onClick={onClientes}
          >
            Clientes
          </button>
        ) : null}

        <div className="qq-features-dropdown">
          <button
            type="button"
            className={selectedGenre ? "qq-nav-link is-active" : "qq-nav-link"}
            onClick={() => setShowFeatures((current) => !current)}
          >
            Categorías
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
          // Solo se ve en celular (ver .qq-header-whatsapp en global.css) --
          // en PC, sin sesion, el header-right queda con el carrito nomas.
          <a
            href={HEADER_WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="qq-header-whatsapp"
            aria-label="Escribinos por WhatsApp"
          >
            <svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M16.02 3C9.4 3 4 8.36 4 15c0 2.28.64 4.42 1.75 6.24L4 29l7.98-1.7A11.9 11.9 0 0 0 16.02 27C22.64 27 28 21.64 28 15S22.64 3 16.02 3Zm6.54 16.9c-.28.79-1.62 1.5-2.24 1.58-.6.08-1.31.11-2.11-.13a19.4 19.4 0 0 1-1.94-.72c-3.42-1.48-5.65-4.91-5.82-5.14-.17-.23-1.39-1.85-1.39-3.52 0-1.67.87-2.49 1.18-2.83.31-.34.68-.42.91-.42.23 0 .45.002.65.011.21.01.49-.08.76.58.28.68.95 2.35 1.03 2.52.08.17.14.37.03.6-.11.23-.17.37-.34.57-.17.2-.36.45-.51.6-.17.17-.35.36-.15.71.2.34.88 1.45 1.89 2.35 1.3 1.16 2.4 1.52 2.74 1.69.34.17.54.14.74-.09.2-.23.85-.99 1.08-1.33.23-.34.46-.28.77-.17.31.11 1.97.93 2.31 1.1.34.17.57.26.65.4.08.14.08.8-.2 1.59Z" />
            </svg>
          </a>
        )}
      </div>
    </header>
  );
}
