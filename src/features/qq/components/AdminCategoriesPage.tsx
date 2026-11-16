import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { createCategory, deleteCategory, listCategories, moveCategory, renameCategory } from "../qq.client";
import { setQqGenres, useQqGenres } from "../qq.genres";

type AdminCategoriesPageProps = {
  token: string;
};

// Pestaña "Categorías" (16/11/2026, pedido explicito): el administrador agrega,
// renombra, ordena y borra categorias, para armarlas a medida.
// Renombrar cambia solo el nombre que se ve: los productos ya cargados siguen
// en su categoria. Borrar una que todavia tiene productos no se deja.
export function AdminCategoriesPage({ token }: AdminCategoriesPageProps) {
  const genres = useQqGenres();
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    setQqGenres(await listCategories());
  }

  async function run(action: () => Promise<unknown>, successMessage?: string) {
    setBusy(true);
    try {
      await action();
      await reload();
      if (successMessage) toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el cambio.");
    } finally {
      setBusy(false);
    }
  }

  function handleAddCategory(event: FormEvent) {
    event.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    void run(async () => {
      await createCategory(token, label);
      setNewLabel("");
    }, "Categoría agregada.");
  }

  function startEdit(id: number | undefined, label: string) {
    if (id === undefined) return;
    setEditingId(id);
    setEditingLabel(label);
  }

  function saveEdit(id: number) {
    const label = editingLabel.trim();
    if (!label) return;
    void run(async () => {
      await renameCategory(token, id, label);
      setEditingId(null);
    }, "Nombre actualizado.");
  }

  function renderRow(id: number | undefined, label: string, isFirst: boolean, isLast: boolean, extra?: "sub") {
    if (id === undefined) return null;
    const isEditing = editingId === id;
    return (
      <div className={extra === "sub" ? "qq-cat-row qq-cat-row--sub" : "qq-cat-row"} key={id}>
        {isEditing ? (
          <input
            className="qq-cat-input"
            value={editingLabel}
            onChange={(event) => setEditingLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveEdit(id);
              if (event.key === "Escape") setEditingId(null);
            }}
            autoFocus
            maxLength={120}
          />
        ) : (
          <span className="qq-cat-label">{label}</span>
        )}

        <div className="qq-cat-actions">
          {isEditing ? (
            <>
              <button type="button" className="qq-button qq-button--primary" disabled={busy} onClick={() => saveEdit(id)}>
                Guardar
              </button>
              <button type="button" className="qq-button qq-button--ghost" onClick={() => setEditingId(null)}>
                Cancelar
              </button>
            </>
          ) : confirmDeleteId === id ? (
            <>
              <span className="qq-cat-confirm">¿Borrar?</span>
              <button
                type="button"
                className="qq-button qq-button--danger"
                disabled={busy}
                onClick={() => {
                  setConfirmDeleteId(null);
                  void run(() => deleteCategory(token, id), "Borrada.");
                }}
              >
                Sí, borrar
              </button>
              <button type="button" className="qq-button qq-button--ghost" onClick={() => setConfirmDeleteId(null)}>
                No
              </button>
            </>
          ) : (
            <>
              <button type="button" className="qq-cat-icon" disabled={busy || isFirst} aria-label="Subir" onClick={() => void run(() => moveCategory(token, id, "up"))}>
                ↑
              </button>
              <button type="button" className="qq-cat-icon" disabled={busy || isLast} aria-label="Bajar" onClick={() => void run(() => moveCategory(token, id, "down"))}>
                ↓
              </button>
              <button type="button" className="qq-button qq-button--ghost" onClick={() => startEdit(id, label)}>
                Renombrar
              </button>
              <button type="button" className="qq-button qq-button--ghost" onClick={() => setConfirmDeleteId(id)}>
                Borrar
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="qq-admin-main">
      <div className="qq-admin-header">
        <h2>Categorías</h2>
      </div>

      <p className="qq-hint">
        Armá las categorías del catálogo a tu medida. Si le cambiás el nombre a una, los productos que ya
        tenía siguen en ella. Para borrar una, primero tenés que cambiar la categoría de sus productos.
      </p>

      <form className="qq-cat-add" onSubmit={handleAddCategory}>
        <input
          className="qq-cat-input"
          value={newLabel}
          onChange={(event) => setNewLabel(event.target.value)}
          placeholder="Nueva categoría (ej: Aros)"
          maxLength={120}
        />
        <button type="submit" className="qq-button qq-button--primary" disabled={busy || !newLabel.trim()}>
          + Agregar categoría
        </button>
      </form>

      <div className="qq-cat-list">
        {genres.map((genre, index) => (
          <section className="qq-cat-group" key={genre.key}>
            {renderRow(genre.id, genre.label, index === 0, index === genres.length - 1)}
          </section>
        ))}
        {genres.length === 0 ? <p className="qq-hint">Todavía no hay categorías. Agregá la primera arriba.</p> : null}
      </div>
    </main>
  );
}
