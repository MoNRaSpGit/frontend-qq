import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { listProducts } from "./qq.client";
import { ProductCard } from "./components/ProductCard";
import { ProductFormModal } from "./components/ProductFormModal";
import { getGenreForCategory, QQ_GENRES, type QqGenreKey } from "./qq.genres";
import type { QqProduct } from "./qq.types";

// Pantalla unica de arranque, pedida tal cual (14/09/2026): buscador en el
// medio + tarjetas de producto debajo, mismo espiritu visual que Netflix
// (buscador arriba, grilla de tarjetas abajo). El resto de las pantallas
// (editar producto, categorias, etc.) se suman despues.
export function QqHomePage() {
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<QqGenreKey | null>(null);
  const [products, setProducts] = useState<QqProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

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

  return (
    <div className="qq-shell">
      <header className="qq-header">
        <span className="qq-brand">QQ</span>
        <button type="button" className="qq-button qq-button--primary" onClick={() => setShowAddModal(true)}>
          + Agregar producto
        </button>
      </header>

      <div className="qq-search-wrap">
        <input
          type="text"
          className="qq-search-input"
          placeholder="Buscar producto..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
        />

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
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>

      {showAddModal ? (
        <ProductFormModal
          onCancelar={() => setShowAddModal(false)}
          onGuardado={(product) => {
            setShowAddModal(false);
            setProducts((current) => [product, ...current]);
            toast.success(`"${product.name}" se agregó correctamente.`);
          }}
        />
      ) : null}
    </div>
  );
}
