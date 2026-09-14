import { useState, type FormEvent } from "react";
import { loginUser, registerUser } from "../qq.client";
import type { QqSession } from "../qq.session";

type AuthModalProps = {
  onCancelar: () => void;
  onIngresado: (session: QqSession) => void;
};

// Un solo modal para las dos cosas: entrar con una cuenta que ya existe,
// o crear una nueva -- el registro publico siempre da el rol "usuario"
// (solo ve el catalogo). El unico administrador se crea aparte, no por
// aca.
export function AuthModal({ onCancelar, onIngresado }: AuthModalProps) {
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Completá email y contraseña.");
      return;
    }

    setError("");
    setGuardando(true);
    try {
      const result =
        modo === "login"
          ? await loginUser({ email: email.trim(), password })
          : await registerUser({ email: email.trim(), password, fullName: fullName.trim() || undefined });
      onIngresado(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la operación.");
      setGuardando(false);
    }
  }

  return (
    <div className="qq-modal-overlay">
      <div className="qq-modal-box">
        <h2>{modo === "login" ? "Ingresar" : "Crear cuenta"}</h2>

        <div className="qq-auth-tabs">
          <button type="button" className={modo === "login" ? "qq-chip is-active" : "qq-chip"} onClick={() => setModo("login")}>
            Ya tengo cuenta
          </button>
          <button
            type="button"
            className={modo === "registro" ? "qq-chip is-active" : "qq-chip"}
            onClick={() => setModo("registro")}
          >
            Soy nuevo
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)}>
          {modo === "registro" ? (
            <label className="qq-field">
              <span>Nombre (opcional)</span>
              <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} autoFocus />
            </label>
          ) : null}

          <label className="qq-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoFocus={modo === "login"}
            />
          </label>

          <label className="qq-field">
            <span>Contraseña</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>

          {error ? <p className="qq-error">{error}</p> : null}

          <div className="qq-modal-actions">
            <button type="button" className="qq-button qq-button--ghost" onClick={onCancelar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="qq-button qq-button--primary" disabled={guardando}>
              {guardando ? "Un momento..." : modo === "login" ? "Ingresar" : "Crear cuenta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
