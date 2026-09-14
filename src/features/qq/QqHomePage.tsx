import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { deleteProduct, listProducts, logoutUser } from "./qq.client";
import { addToCart, clearCart, getCartCount, loadCart, removeFromCart, updateCartQuantity, type QqCartItem } from "./qq.cart";
import { AuthModal } from "./components/AuthModal";
import { CartDrawer } from "./components/CartDrawer";
import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { ProductFormModal } from "./components/ProductFormModal";
import { WhatsAppButton } from "./components/WhatsAppButton";
import { getGenreForCategory, QQ_GENRES, type QqGenreKey } from "./qq.genres";
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

  const isAdmin = session?.user.role === "administrador";

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
    setQuery("");
    setSelectedGenre(null);
  }

  async function handleSalir() {
    if (session) {
      await logoutUser(session.token);
    }
    clearSession();
    setSession(null);
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
      {/* Hero clasico: la foto ocupa la mitad de arriba (con el header
          encima) y se va apagando hasta fundirse con el fondo oscuro de
          abajo, donde viven el buscador y las tarjetas. */}
      {/* Prueba puntual (15/09/2026): imagen servida directo desde public/
          (fondoDos.jpg, sin cambiarle nombre ni carpeta) en vez de
          importada desde src/assets, para descartar que el problema sea
          el bundling -- si esto tampoco se ve, el problema no es de donde
          sale la imagen. */}
      <div className="qq-hero" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}fondoDos.jpg)` }}>
        <Header
          session={session}
          cartCount={getCartCount(cartItems)}
          onInicio={handleInicio}
          onIngresar={() => setShowAuthModal(true)}
          onSalir={() => void handleSalir()}
          onAbrirCarrito={() => setShowCart(true)}
        />
      </div>

      <div className="qq-search-wrap">
        <form className="qq-search-row" onSubmit={(event) => event.preventDefault()}>
          <input
            type="text"
            className="qq-search-input"
            placeholder="Buscar producto..."
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

        <div className="qq-genre-chips" role="group" aria-label="Filtrar por categoría">
          <button
            type="button"
            className={selectedGenre === null ? "qq-chip is-active" : "qq-chip"}
            onClick={() => setSelectedGenre(null)}
          >
            Todos
          </button>
          {QQ_GENRES.map((genre) => (
            <button
              type="button"
              key={genre.key}
              className={selectedGenre === genre.key ? "qq-chip is-active" : "qq-chip"}
              onClick={() => setSelectedGenre((current) => (current === genre.key ? null : genre.key))}
            >
              {genre.label}
            </button>
          ))}
        </div>

        {isAdmin ? (
          <button
            type="button"
            className="qq-button qq-button--primary qq-add-button"
            onClick={() => setProductFormTarget("new")}
          >
            + Agregar producto
          </button>
        ) : null}
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
