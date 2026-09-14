import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { deleteProduct, listProducts, logoutUser } from "./qq.client";
import { addToCart, clearCart, getCartCount, loadCart, removeFromCart, updateCartQuantity, type QqCartItem } from "./qq.cart";
import { AdminProductsPage } from "./components/AdminProductsPage";
import { AuthModal } from "./components/AuthModal";
import { CartDrawer } from "./components/CartDrawer";
import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { ProductFormModal } from "./components/ProductFormModal";
import { WhatsAppButton } from "./components/WhatsAppButton";
import { getGenreForCategory, type QqGenreKey } from "./qq.genres";
import { clearSession, loadSession, saveSession, type QqSession } from "./qq.session";
import type { QqProduct } from "./qq.types";

// Pantalla unica de arranque, pedida tal cual (14/09/2026): buscador en el
// medio + tarjetas de producto debajo, mismo espiritu visual que Netflix
// (buscador arriba, grilla de tarjetas abajo). Se le suma el header
// (marca, nav, ingresar) y el login/registro (15/09/2026), y despues
// tarjeta cuadrada + detalle al click + carrito + WhatsApp flotante
// (15/09/2026) -- el resto de las pantallas (editar producto, Blog,
// Contacto reales) se suman despues.
export function QqHomePage() {
  const [session, setSession] = useState<QqSession | null>(() => loadSession());
  // "catalogo" = lo que ve cualquier visitante; "productos" = pantalla
  // propia del admin para cargar/editar/borrar -- pedido explicito
  // (15/09/2026): "que no ingrese directo en la pantalla principal, que
  // tenga su propia pestaña".
  const [view, setView] = useState<"catalogo" | "productos">("catalogo");
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<QqGenreKey | null>(null);
  const [products, setProducts] = useState<QqProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // "new" = alta; un QqProduct = edicion de ese producto; null = cerrado.
  // Un solo estado para las dos cosas -- mismo modal (ver
  // ProductFormModal), pedido 15/09/2026.
  const [productFormTarget, setProductFormTarget] = useState<QqProduct | "new" | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<QqProduct | null>(null);
  const [cartItems, setCartItems] = useState<QqCartItem[]>(() => loadCart());
  const [showCart, setShowCart] = useState(false);
  const searchRowRef = useRef<HTMLFormElement>(null);
  const [fadeStart, setFadeStart] = useState<number | null>(null);

  const isAdmin = session?.user.role === "administrador";

  // La foto de fondo (fija a la ventana) empieza a oscurecerse justo
  // debajo del buscador -- pedido explicito (15/09/2026): "en la caja de
  // abajo del input, ahi es la division". Se mide la posicion real del
  // buscador (no un porcentaje fijo) para que la linea quede siempre
  // pegada a el, sea cual sea el tamaño de pantalla.
  useEffect(() => {
    function measureFadeStart() {
      if (!searchRowRef.current) return;
      const rect = searchRowRef.current.getBoundingClientRect();
      setFadeStart(rect.bottom + window.scrollY);
    }
    measureFadeStart();
    window.addEventListener("resize", measureFadeStart);
    return () => window.removeEventListener("resize", measureFadeStart);
  }, []);

  // El genero (Cine/Musica/Juegos) filtra sobre lo que ya trajo el
  // buscador -- no pega al backend de nuevo, se resuelve en el momento a
  // partir de la categoria de cada producto (ver qq.genres.ts).
  const visibleProducts = selectedGenre
    ? products.filter((product) => getGenreForCategory(product.category) === selectedGenre)
    : products;

  async function refresh(search?: string) {
    setIsLoading(true);
    try {
      const items = await listProducts(search);
      setProducts(items);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "No se pudo cargar el catálogo.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh(query);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  function handleInicio() {
    setView("catalogo");
    setQuery("");
    setSelectedGenre(null);
  }

  async function handleSalir() {
    if (session) {
      await logoutUser(session.token);
    }
    clearSession();
    setSession(null);
    setView("catalogo");
    toast.success("Saliste de tu cuenta.");
  }

  function handleAgregarAlCarrito(product: QqProduct, quantity: number) {
    setCartItems((current) => addToCart(current, product, quantity));
    setSelectedProduct(null);
    toast.success(`"${product.name}" se agregó al carrito.`);
  }

  function handleEditar(product: QqProduct) {
    setSelectedProduct(null);
    setProductFormTarget(product);
  }

  async function handleEliminar(product: QqProduct) {
    if (!session) return;
    try {
      await deleteProduct(session.token, product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setSelectedProduct(null);
      toast.success(`"${product.name}" se eliminó.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el producto.");
    }
  }

  return (
    <div className="qq-shell">
      {/* Foto de fondo de TODA la pagina (no solo del hero) -- fija a la
          ventana, el contenido scrollea por encima. Se sirve directo
          desde public/ (no empaquetada por Vite), con el nombre tal cual
          la sube el cliente -- asi confirmamos (15/09/2026) que carga
          bien y sin lios de cache. Si el cliente manda otra foto nueva,
          se reemplaza este nombre de archivo aca. */}
      <div
        className="qq-page-backdrop"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}fondoCinco.jpg)`,
          ...(fadeStart ? ({ "--qq-fade-start": `${fadeStart}px` } as Record<string, string>) : {})
        }}
      />

      {/* Hero: header arriba con aire, sobre la foto de fondo fija. Se va
          oscureciendo hacia abajo (ver .qq-page-backdrop::after) hasta
          hacer contraste con el buscador y las tarjetas, sin dejar de
          ser la misma foto. */}
      <div className="qq-hero">
        <Header
          session={session}
          cartCount={getCartCount(cartItems)}
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
          activeView={view}
          onInicio={handleInicio}
          onProductos={() => setView("productos")}
          onIngresar={() => setShowAuthModal(true)}
          onSalir={() => void handleSalir()}
          onAbrirCarrito={() => setShowCart(true)}
        />

      </div>

      {view === "productos" && isAdmin ? (
        <AdminProductsPage
          products={products}
          isLoading={isLoading}
          error={error}
          onNuevo={() => setProductFormTarget("new")}
          onEditar={handleEditar}
          onEliminar={(product) => void handleEliminar(product)}
        />
      ) : (
        <>
          <div className="qq-search-wrap">
            <div className="qq-hero-heading">
              <h1 className="qq-hero-title">¿Qué quieres ver hoy?</h1>
              <p className="qq-hero-subtitle">Busca y consulta contenidos en tu plataforma de streaming favorita.</p>
            </div>

            <form className="qq-search-row" ref={searchRowRef} onSubmit={(event) => event.preventDefault()}>
              <span className="qq-search-icon qq-search-icon--left" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.2" y2="16.2" strokeLinecap="round" />
                </svg>
              </span>

              <input
                type="text"
                className="qq-search-input"
                placeholder="Buscar películas, series, juegos"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
              />

              <button type="submit" className="qq-search-button" aria-label="Buscar">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.2" y2="16.2" strokeLinecap="round" />
                </svg>
              </button>
            </form>
          </div>

          <main className="qq-main">
            {error ? <p className="qq-error qq-error--center">{error}</p> : null}

            {!error && isLoading ? <p className="qq-hint">Cargando...</p> : null}

            {!error && !isLoading && visibleProducts.length === 0 ? (
              <p className="qq-hint">
                {query.trim()
                  ? `No se encontraron productos para "${query.trim()}".`
                  : selectedGenre
                    ? "No hay productos cargados en esta categoría todavía."
                    : "Todavía no hay productos cargados."}
              </p>
            ) : null}

            <div className="qq-grid">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} onClick={setSelectedProduct} />
              ))}
            </div>
          </main>
        </>
      )}

      <WhatsAppButton />

      {selectedProduct ? (
        <ProductDetailModal
          product={selectedProduct}
          isAdmin={isAdmin}
          onCerrar={() => setSelectedProduct(null)}
          onAgregarAlCarrito={handleAgregarAlCarrito}
          onEditar={handleEditar}
          onEliminar={(product) => void handleEliminar(product)}
        />
      ) : null}

      {showCart ? (
        <CartDrawer
          items={cartItems}
          onCerrar={() => setShowCart(false)}
          onCambiarCantidad={(productId, quantity) => setCartItems((current) => updateCartQuantity(current, productId, quantity))}
          onQuitar={(productId) => setCartItems((current) => removeFromCart(current, productId))}
          onVaciar={() => {
            setCartItems(clearCart());
            toast.success("Carrito vaciado.");
          }}
        />
      ) : null}

      {productFormTarget && session ? (
        <ProductFormModal
          token={session.token}
          product={productFormTarget === "new" ? undefined : productFormTarget}
          onCancelar={() => setProductFormTarget(null)}
          onGuardado={(product) => {
            const wasEditing = productFormTarget !== "new";
            setProductFormTarget(null);
            setProducts((current) =>
              wasEditing ? current.map((item) => (item.id === product.id ? product : item)) : [product, ...current]
            );
            toast.success(wasEditing ? `"${product.name}" se actualizó.` : `"${product.name}" se agregó correctamente.`);
          }}
        />
      ) : null}

      {showAuthModal ? (
        <AuthModal
          onCancelar={() => setShowAuthModal(false)}
          onIngresado={(nextSession) => {
            saveSession(nextSession);
            setSession(nextSession);
            setShowAuthModal(false);
            toast.success(`Hola, ${nextSession.user.fullName || nextSession.user.email}.`);
          }}
        />
      ) : null}
    </div>
  );
}
