import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { deleteClient, deleteProduct, listCarouselImages, listClients, listProducts, logoutUser, reorderProduct } from "./qq.client";
import { addToCart, clearCart, getCartCount, loadCart, removeFromCart, updateCartQuantity, type QqCartItem } from "./qq.cart";
import { AdminCarouselPage } from "./components/AdminCarouselPage";
import { AdminClientsPage } from "./components/AdminClientsPage";
import { AdminProductsPage } from "./components/AdminProductsPage";
import { AuthModal } from "./components/AuthModal";
import { Carousel } from "./components/Carousel";
import { CartDrawer } from "./components/CartDrawer";
import { ClientFormModal } from "./components/ClientFormModal";
import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { ProductFormModal } from "./components/ProductFormModal";
import { WhatsAppButton } from "./components/WhatsAppButton";
import { getGenreForCategory, type QqGenreKey } from "./qq.genres";
import { QQ_PRICE_VARIANT_LABELS, type QqPriceVariant } from "./qq.pricing";
import { clearSession, loadSession, saveSession, type QqSession } from "./qq.session";
import type { QqCarouselImage, QqClient, QqProduct } from "./qq.types";

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
  const [view, setView] = useState<"catalogo" | "productos" | "carrusel" | "clientes">("catalogo");
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<QqGenreKey | null>(null);
  const [products, setProducts] = useState<QqProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carouselImages, setCarouselImages] = useState<QqCarouselImage[]>([]);
  const [isCarouselLoading, setIsCarouselLoading] = useState(true);
  const [carouselError, setCarouselError] = useState<string | null>(null);
  // Cuenta corriente (15/09/2026) -- SOLO se pide al backend cuando hay
  // sesion de admin (ver useEffect mas abajo), a diferencia de
  // productos/carrusel que son publicos y se piden siempre.
  const [clients, setClients] = useState<QqClient[]>([]);
  const [isClientsLoading, setIsClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  // "new" = alta; un QqProduct = edicion de ese producto; null = cerrado.
  // Un solo estado para las dos cosas -- mismo modal (ver
  // ProductFormModal), pedido 15/09/2026.
  const [productFormTarget, setProductFormTarget] = useState<QqProduct | "new" | null>(null);
  // Mismo criterio para clientes (ver ClientFormModal).
  const [clientFormTarget, setClientFormTarget] = useState<QqClient | "new" | null>(null);
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

  async function refreshCarousel() {
    setIsCarouselLoading(true);
    try {
      const items = await listCarouselImages();
      setCarouselImages(items);
      setCarouselError(null);
    } catch (fetchError) {
      setCarouselError(fetchError instanceof Error ? fetchError.message : "No se pudo cargar el carrusel.");
    } finally {
      setIsCarouselLoading(false);
    }
  }

  useEffect(() => {
    void refreshCarousel();
  }, []);

  // Cuenta corriente: se pide recien cuando hay sesion de admin (el
  // endpoint exige token, a diferencia de productos/carrusel que son
  // publicos) -- si se desloguea, se limpia para no dejar datos de
  // clientes colgados en memoria.
  useEffect(() => {
    if (!isAdmin || !session) {
      setClients([]);
      return;
    }
    setIsClientsLoading(true);
    listClients(session.token)
      .then((items) => {
        setClients(items);
        setClientsError(null);
      })
      .catch((fetchError) => {
        setClientsError(fetchError instanceof Error ? fetchError.message : "No se pudo cargar la cuenta corriente.");
      })
      .finally(() => setIsClientsLoading(false));
  }, [isAdmin, session]);

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

  function handleAgregarAlCarrito(product: QqProduct, variant: QqPriceVariant, quantity: number) {
    setCartItems((current) => addToCart(current, product, variant, quantity));
    setSelectedProduct(null);
    toast.success(`"${product.name}" (${QQ_PRICE_VARIANT_LABELS[variant]}) se agregó al carrito.`);
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

  // Orden manual (16/09/2026): el swap en el backend cambia la posicion
  // de DOS productos a la vez (el movido y el que ya estaba en ese
  // puesto) -- se vuelve a pedir la lista entera en vez de parchear a
  // mano, para no arriesgarse a que el otro quede con un numero viejo.
  async function handleReordenarProducto(product: QqProduct, position: number) {
    if (!session) return;
    try {
      await reorderProduct(session.token, product.id, position);
      await refresh(query);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo reordenar el producto.");
    }
  }

  function handleEditarCliente(client: QqClient) {
    setClientFormTarget(client);
  }

  async function handleEliminarCliente(client: QqClient) {
    if (!session) return;
    try {
      await deleteClient(session.token, client.id);
      setClients((current) => current.filter((item) => item.id !== client.id));
      toast.success(`"${client.name}" se eliminó.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el cliente.");
    }
  }

  return (
    <div className="qq-shell">
      {/* Foto de fondo de TODA la pagina (no solo del hero) -- fija a la
          ventana, el contenido scrollea por encima. Se sirve directo
          desde public/ (no empaquetada por Vite). Pedido explicito
          (15/09/2026): "dejemos la foto de fondo original" -- las fotos
          que carga el admin en "Carrusel" van en su propia vidriera
          horizontal dentro del catalogo (ver Carousel.tsx), no aca. */}
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
          onSelectGenre={(genre) => {
            // Pedido explicito (17/09/2026): "si estoy en Productos y
            // pongo categoria, no me lleva a categoria, queda trancado
            // ahi" -- elegir una categoria solo actualizaba el filtro,
            // nunca cambiaba la vista. Andaba "bien" en Inicio porque ya
            // estabamos en catalogo (no hacia falta navegar a ningun
            // lado), pero en Productos/Carrusel/Clientes el filtro
            // quedaba aplicado sin que se viera nada.
            setSelectedGenre(genre);
            setView("catalogo");
          }}
          activeView={view}
          onInicio={handleInicio}
          onProductos={() => setView("productos")}
          onCarrusel={() => setView("carrusel")}
          onClientes={() => setView("clientes")}
          onIngresar={() => setShowAuthModal(true)}
          onSalir={() => void handleSalir()}
          onAbrirCarrito={() => setShowCart(true)}
        />

        {/* Pegado a la cabecera de verdad (adentro de .qq-hero, justo
            despues del <Header>) -- pedido explicito (15/09/2026): "no
            quedo pegado a la cabecera, quedo pegado al titulo del
            buscador". El hero reserva un alto grande (46vh) para
            lucir la foto de fondo antes del titulo/buscador; poniendo
            el carrusel afuera de este div quedaba pegado al titulo en
            vez de al header, por ese espacio de por medio. */}
        {view === "catalogo" && !isCarouselLoading && !carouselError && carouselImages.length > 0 ? (
          <div className="qq-carousel-wrap">
            <Carousel images={carouselImages} />
          </div>
        ) : null}
      </div>

      {view === "productos" && isAdmin ? (
        <AdminProductsPage
          products={products}
          isLoading={isLoading}
          error={error}
          onNuevo={() => setProductFormTarget("new")}
          onEditar={handleEditar}
          onEliminar={(product) => void handleEliminar(product)}
          onReordenar={(product, position) => void handleReordenarProducto(product, position)}
        />
      ) : view === "carrusel" && isAdmin && session ? (
        <AdminCarouselPage
          token={session.token}
          images={carouselImages}
          isLoading={isCarouselLoading}
          error={carouselError}
          onAgregada={(image) => setCarouselImages((current) => [...current, image])}
          onEliminada={(imageId) => setCarouselImages((current) => current.filter((item) => item.id !== imageId))}
        />
      ) : view === "clientes" && isAdmin && session ? (
        <AdminClientsPage
          clients={clients}
          isLoading={isClientsLoading}
          error={clientsError}
          onNuevo={() => setClientFormTarget("new")}
          onEditar={handleEditarCliente}
          onEliminar={(client) => void handleEliminarCliente(client)}
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
          onCambiarCantidad={(productId, variant, quantity) =>
            setCartItems((current) => updateCartQuantity(current, productId, variant, quantity))
          }
          onQuitar={(productId, variant) => setCartItems((current) => removeFromCart(current, productId, variant))}
          onVaciar={() => {
            setCartItems(clearCart());
            toast.success("Carrito vaciado.");
          }}
          // Pedido explicito (19/09/2026): al tocar "Comprar por WhatsApp" el
          // carrito tiene que vaciarse (antes quedaba la lista armada). Se
          // cierra tambien el cajon para volver a una pantalla limpia.
          onCompraEnviada={() => {
            setCartItems(clearCart());
            setShowCart(false);
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
            // Un producto nuevo entra siempre al final (mayor numero de
            // posicion, ver qq-products.service.ts#createProduct) -- se
            // agrega al final del array tambien, para no mostrarlo
            // primero en el catalogo cuando en realidad quedo ultimo.
            setProducts((current) =>
              wasEditing ? current.map((item) => (item.id === product.id ? product : item)) : [...current, product]
            );
            toast.success(wasEditing ? `"${product.name}" se actualizó.` : `"${product.name}" se agregó correctamente.`);
          }}
        />
      ) : null}

      {clientFormTarget && session ? (
        <ClientFormModal
          token={session.token}
          client={clientFormTarget === "new" ? undefined : clientFormTarget}
          onCancelar={() => setClientFormTarget(null)}
          onGuardado={(client) => {
            const wasEditing = clientFormTarget !== "new";
            setClientFormTarget(null);
            setClients((current) =>
              wasEditing ? current.map((item) => (item.id === client.id ? client : item)) : [client, ...current]
            );
            toast.success(wasEditing ? `"${client.name}" se actualizó.` : `"${client.name}" se agregó correctamente.`);
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
