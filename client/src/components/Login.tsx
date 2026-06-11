import { useState } from "react";
import { api, clearCredentials, setCredentials } from "../api";

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    setError(null);
    setCredentials(user, pass);
    try {
      await api.listSessions(); // proves the credentials work
      onSuccess();
    } catch {
      clearCredentials();
      setError("Sign in failed. Check your username and password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 420, paddingTop: "4rem" }}>
      <article>
        <h1>BJJ Journal</h1>
        <p className="muted">Sign in to open your training log.</p>
        <label>
          Username
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="current-password"
            onKeyDown={(e) => e.key === "Enter" && void signIn()}
          />
        </label>
        {error && <p style={{ color: "var(--belt-red)" }}>{error}</p>}
        <button onClick={() => void signIn()} disabled={busy || !user}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </article>
    </main>
  );
}
