"use client";

import { useState, type FormEvent } from "react";
import { ApiError, authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { reloadFavourites } from "@/lib/favourites";

// Visually-hidden but present for screen readers and password managers (which use the associated
// <label> to identify each field).
const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

/** Maps a failed auth request to a friendly message. */
function friendlyError(err: unknown, isRegister: boolean): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Incorrect email or password.";
    if (err.status === 409) return "That email is already registered — try logging in.";
  }
  return isRegister ? "Couldn't create your account. Please try again." : "Couldn't sign in. Please try again.";
}

export default function EmailPasswordForm() {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Register (if signing up) then always log in to obtain the JWT — mirrors the Android flow.
      if (isRegister) await authApi.register(email.trim(), password);
      const res = await authApi.login(email.trim(), password);
      login(res.access_token, email.trim());
      await reloadFavourites();
    } catch (err) {
      setError(friendlyError(err, isRegister));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
      {/* name + id + autocomplete are what password managers key off. "username" is the spec token
          for the login identifier (even though it's an email); new-password/current-password lets
          managers offer generation on sign-up and autofill on log-in. */}
      <label htmlFor="auth-email" style={srOnly}>Email</label>
      <input
        type="email"
        id="auth-email"
        name="email"
        className="search-input"
        placeholder="Email"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label htmlFor="auth-password" style={srOnly}>Password</label>
      <input
        type="password"
        id="auth-password"
        name="password"
        className="search-input"
        placeholder="Password"
        autoComplete={isRegister ? "new-password" : "current-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <div style={{ fontSize: "0.85rem", color: "#ef4444" }}>{error}</div>}

      <button
        type="submit"
        disabled={loading}
        style={{
          background: "var(--accent)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 16px",
          fontSize: "0.9rem",
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Please wait…" : isRegister ? "Sign up" : "Log in"}
      </button>

      <button
        type="button"
        onClick={() => {
          setIsRegister((v) => !v);
          setError(null);
        }}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          fontSize: "0.8rem",
          cursor: "pointer",
          padding: 0,
          textAlign: "center",
        }}
      >
        {isRegister ? "Already have an account? Log in" : "New here? Create an account"}
      </button>
    </form>
  );
}
