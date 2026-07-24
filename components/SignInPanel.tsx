"use client";

import EmailPasswordForm from "./EmailPasswordForm";
import GoogleSignInButton from "./GoogleSignInButton";

/** Full sign-in UI: email/password form + Google. Shared by Settings and the Favourites CTA. */
export default function SignInPanel() {
  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 360, margin: "0 auto" }}>
      <EmailPasswordForm />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: "var(--text-muted)",
          fontSize: "0.8rem",
        }}
      >
        <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
        or
        <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>
      <GoogleSignInButton />
    </div>
  );
}
