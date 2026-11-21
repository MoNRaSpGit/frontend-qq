import { useEffect, useState } from "react";
import { getVisits, type VisitsSummary } from "../qq.client";

// Pestaña "Visitas" del admin (21/11/2026): cuanta gente entro y que miro, en
// palabras simples. Se consulta al abrir la pestaña o al cambiar el periodo
// (no se actualiza sola). El servidor manda solo los totales.
const PERIODS = [
  { days: 1, label: "Hoy" },
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" }
];
const WEEKDAY = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function AdminVisitsPage({ token }: { token: string }) {
  const [days, setDays] = useState(1);
  const [data, setData] = useState<VisitsSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getVisits(token, days)
      .then((result) => !cancelled && setData(result))
      .catch(() => !cancelled && setError("No se pudieron cargar las visitas. Probá de nuevo en un rato."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token, days]);

  const periodText = days === 1 ? "hoy" : days === 7 ? "en los últimos 7 días" : "en los últimos 30 días";
  const maxDay = Math.max(1, ...(data?.byDay ?? []).map((item) => item.people));
  const maxTop = Math.max(1, ...(data?.topProducts ?? []).map((item) => item.views));

  return (
    <section className="qq-visits">
      <div className="qq-visits-head">
        <h2>Visitas</h2>
        <div className="qq-visits-periods">
          {PERIODS.map((period) => (
            <button key={period.days} type="button" className={days === period.days ? "is-active" : ""} onClick={() => setDays(period.days)}>
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="qq-visits-error">{error}</p> : null}

      <div className={loading ? "qq-visits-body is-loading" : "qq-visits-body"}>
        <div className="qq-visits-hero">
          <span>Te visitaron {periodText}</span>
          <b>{data?.people ?? 0}</b>
          <small>{(data?.people ?? 0) === 1 ? "persona" : "personas"}</small>
        </div>

        <div className="qq-visits-cards">
          <div>
            <span>👀 Productos vistos</span>
            <b>{data?.views ?? 0}</b>
          </div>
          <div>
            <span>🛒 Agregados al carrito</span>
            <b>{data?.carts ?? 0}</b>
          </div>
        </div>

        {days > 1 && (data?.byDay.length ?? 0) > 0 ? (
          <div className="qq-visits-block">
            <h3>Personas por día</h3>
            <div className="qq-visits-bars">
              {data!.byDay.map((item) => {
                const date = new Date(item.day + "T12:00:00");
                return (
                  <div key={item.day} className="qq-visits-bar">
                    <b>{item.people}</b>
                    <i style={{ height: Math.max(6, (item.people / maxDay) * 100) + "%" }} />
                    <span>{days === 7 ? WEEKDAY[date.getDay()] : String(date.getDate())}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="qq-visits-block">
          <h3>Lo más mirado</h3>
          {(data?.topProducts.length ?? 0) === 0 ? (
            <p className="qq-visits-empty">Todavía nadie abrió un producto {periodText}.</p>
          ) : (
            <ol className="qq-visits-top">
              {data!.topProducts.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <i style={{ width: (item.views / maxTop) * 100 + "%" }} />
                  <b>{item.views}</b>
                </li>
              ))}
            </ol>
          )}
        </div>
        <p className="qq-visits-note">No se cuentan las visitas de quien entra como administrador.</p>
      </div>
    </section>
  );
}
