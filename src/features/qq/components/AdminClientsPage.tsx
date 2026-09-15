import { useState } from "react";
import { getClientStatus, getDaysUntilDue } from "../qq.clientStatus";
import type { QqClient } from "../qq.types";

type AdminClientsPageProps = {
  clients: QqClient[];
  isLoading: boolean;
  error: string | null;
  onNuevo: () => void;
  onEditar: (client: QqClient) => void;
  onEliminar: (client: QqClient) => void;
};

function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split("-");
  return `${day}/${month}/${year}`;
}

function describeDaysLeft(dueDate: string): string {
  const daysLeft = getDaysUntilDue(dueDate);
  if (daysLeft < 0) return `Vencido hace ${Math.abs(daysLeft)} día${Math.abs(daysLeft) === 1 ? "" : "s"}`;
  if (daysLeft === 0) return "Vence hoy";
  return `Quedan ${daysLeft} día${daysLeft === 1 ? "" : "s"}`;
}

// Cuenta corriente (15/09/2026): pantalla propia del admin, separada del
// catalogo publico -- lista de clientes con semaforo blanco/amarillo/rojo
// segun cuanto falte para la fecha de vencimiento (ver
// qq.clientStatus.ts). Pedido explicito: la fila solo muestra nombre +
// vencimiento -- el email/telefono y los botones de editar/borrar salen
// recien al hacerle click, para que la lista quede limpia de un vistazo.
export function AdminClientsPage({ clients, isLoading, error, onNuevo, onEditar, onEliminar }: AdminClientsPageProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  function toggleExpanded(clientId: number) {
    setConfirmandoId(null);
    setExpandedId((current) => (current === clientId ? null : clientId));
  }

  return (
    <main className="qq-admin-main">
      <div className="qq-admin-header">
        <h2>Clientes</h2>
        <button type="button" className="qq-button qq-button--primary" onClick={onNuevo}>
          + Nuevo cliente
        </button>
      </div>

      {error ? <p className="qq-error qq-error--center">{error}</p> : null}
      {!error && isLoading ? <p className="qq-hint">Cargando...</p> : null}
      {!error && !isLoading && clients.length === 0 ? <p className="qq-hint">Todavía no cargaste ningún cliente.</p> : null}

      <div className="qq-admin-list">
        {clients.map((client) => {
          const status = getClientStatus(client.dueDate);
          const isExpanded = expandedId === client.id;
          return (
            <div className={`qq-client-row qq-client-row--${status}`} key={client.id}>
              <button type="button" className="qq-client-row-summary" onClick={() => toggleExpanded(client.id)}>
                <span className="qq-admin-row-name">{client.name}</span>
                <span className="qq-admin-row-meta">
                  Vence el {formatDueDate(client.dueDate)} · {describeDaysLeft(client.dueDate)}
                </span>
              </button>

              {isExpanded ? (
                <div className="qq-client-row-details">
                  <span className="qq-admin-row-meta">Email: {client.email || "sin dato"}</span>
                  <span className="qq-admin-row-meta">Teléfono: {client.phone || "sin dato"}</span>

                  <div className="qq-admin-row-actions">
                    {confirmandoId === client.id ? (
                      <>
                        <span className="qq-admin-confirm-text">¿Eliminar?</span>
                        <button type="button" className="qq-button qq-button--ghost" onClick={() => setConfirmandoId(null)}>
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="qq-button qq-button--danger"
                          onClick={() => {
                            setConfirmandoId(null);
                            onEliminar(client);
                          }}
                        >
                          Sí, eliminar
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="qq-button qq-button--ghost" onClick={() => onEditar(client)}>
                          Editar
                        </button>
                        <button type="button" className="qq-button qq-button--danger" onClick={() => setConfirmandoId(client.id)}>
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </main>
  );
}
