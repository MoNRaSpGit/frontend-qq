import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getDiscountConfig, updateDiscountConfig } from "../qq.client";
import type { QqDiscountConfig } from "../qq.types";

type AdminDiscountPageProps = {
  token: string;
  onGuardado: (config: QqDiscountConfig) => void;
};

// Codigo de descuento (28/09/2026, pedido explicito): el admin carga el
// codigo (ej "qqweb"), el porcentaje (entero 1-10) y si esta habilitado
// o no. Si esta deshabilitado, el carrito ni muestra el input para el
// cliente final -- ver CartDrawer.tsx.
export function AdminDiscountPage({ token, onGuardado }: AdminDiscountPageProps) {
  const [code, setCode] = useState("");
  const [percentage, setPercentage] = useState(10);
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDiscountConfig()
      .then((config) => {
        if (cancelled) return;
        setCode(config.code);
        setPercentage(config.percentage);
        setEnabled(config.enabled);
        setLoadError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "No se pudo cargar la configuración.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGuardar() {
    if (enabled && !code.trim()) {
      toast.error("Ingresá un código antes de habilitarlo.");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await updateDiscountConfig(token, { code: code.trim(), percentage, enabled });
      setCode(saved.code);
      setPercentage(saved.percentage);
      setEnabled(saved.enabled);
      onGuardado(saved);
      toast.success("Código de descuento actualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="qq-admin-main">
      <div className="qq-admin-header">
        <h2>Código de descuento</h2>
      </div>

      {loadError ? <p className="qq-error qq-error--center">{loadError}</p> : null}
      {!loadError && isLoading ? <p className="qq-hint">Cargando...</p> : null}

      {!loadError && !isLoading ? (
        <div className="qq-discount-form">
          <label className="qq-field">
            <span>Código</span>
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Ej: qqweb"
              disabled={isSaving}
            />
          </label>

          <label className="qq-field">
            <span>Porcentaje de descuento</span>
            <input
              type="number"
              min={1}
              max={10}
              step={1}
              value={percentage}
              onChange={(event) => setPercentage(Number(event.target.value))}
              disabled={isSaving}
            />
          </label>

          <label className="qq-field qq-field--checkbox">
            <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} disabled={isSaving} />
            <span>Habilitado (muestra el input de código en el carrito)</span>
          </label>

          <div className="qq-modal-actions">
            <button type="button" className="qq-button qq-button--primary" onClick={() => void handleGuardar()} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
