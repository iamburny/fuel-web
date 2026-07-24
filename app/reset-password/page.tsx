"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ApiError, authApi } from "@/lib/api";

// Visually-hidden but present for screen readers and password managers (matches EmailPasswordForm).
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

const primaryButton = (loading: boolean): React.CSSProperties => ({
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 16px",
  fontSize: "0.9rem",
  fontWeight: 600,
  cursor: loading ? "default" : "pointer",
  opacity: loading ? 0.7 : 1,
});

/** Phase 1: no token in the URL — ask for the email and trigger the reset link. */
function RequestForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authApi.requestPasswordReset(email.trim());
    } catch {
      // Ignore — the endpoint always succeeds; we show the same message regardless so we never
      // reveal whether an address is registered.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <p style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
        If that address has an account, we&rsquo;ve sent a password-reset link. Check your inbox (and
        spam folder) — the link expires in 1 hour.
      </p>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: 4 }}>
        Enter your email and we&rsquo;ll send you a link to reset your password.
      </p>
      <label htmlFor="reset-email" style={srOnly}>Email</label>
      <input
        type="email"
        id="reset-email"
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
      <button type="submit" disabled={loading} style={primaryButton(loading)}>
        {loading ? "Please wait…" : "Send reset link"}
      </button>
      <Link
        href="/settings"
        style={{ fontSize: "0.8rem", color: "var(--text-muted)", textDecoration: "none", textAlign: "center" }}
      >
        Back to sign in
      </Link>
    </form>
  );
}

/** Phase 2: token present — choose a new password. */
function ConfirmForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.confirmPasswordReset(token, password);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 400
          ? "This reset link is invalid or has expired. Request a new one."
          : "Couldn't reset your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.5, marginBottom: 16 }}>
          Your password has been reset. You can now sign in with your new password.
        </p>
        <Link
          href="/settings"
          style={{ ...primaryButton(false), display: "inline-block", textDecoration: "none" }}
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: 4 }}>
        Choose a new password for your account.
      </p>
      <label htmlFor="new-password" style={srOnly}>New password</label>
      <input
        type="password"
        id="new-password"
        name="password"
        className="search-input"
        placeholder="New password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <label htmlFor="confirm-password" style={srOnly}>Confirm new password</label>
      <input
        type="password"
        id="confirm-password"
        name="confirm-password"
        className="search-input"
        placeholder="Confirm new password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {error && <div style={{ fontSize: "0.85rem", color: "#ef4444" }}>{error}</div>}
      <button type="submit" disabled={loading} style={primaryButton(loading)}>
        {loading ? "Please wait…" : "Reset password"}
      </button>
    </form>
  );
}

function ResetPasswordInner() {
  const token = useSearchParams().get("token");
  return (
    <div className="container">
      <div className="page-header">
        <h1>Reset password</h1>
      </div>
      <div className="card" style={{ maxWidth: 420 }}>
        {token ? <ConfirmForm token={token} /> : <RequestForm />}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams requires a Suspense boundary during static generation.
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
