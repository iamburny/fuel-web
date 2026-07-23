"use client";

import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useState } from "react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { reloadFavourites } from "@/lib/favourites";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

/** Reads the `email` claim from a Google ID token (JWT) for display only — the backend re-verifies. */
function emailFromIdToken(idToken: string): string | null {
  try {
    const base64 = idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)).email ?? null;
  } catch {
    return null;
  }
}

export default function GoogleSignInButton() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (!CLIENT_ID) {
    return (
      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
        Google sign-in isn&rsquo;t configured yet.
      </p>
    );
  }

  const handleSuccess = async (cr: CredentialResponse) => {
    const idToken = cr.credential;
    if (!idToken) {
      setError("Sign-in failed. Please try again.");
      return;
    }
    try {
      const res = await authApi.googleLogin(idToken);
      login(res.access_token, emailFromIdToken(idToken));
      await reloadFavourites();
    } catch {
      setError("Couldn't sign in. Please try again.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <GoogleLogin onSuccess={handleSuccess} onError={() => setError("Sign-in was cancelled or failed.")} />
      {error && <p style={{ fontSize: "0.85rem", color: "#ef4444" }}>{error}</p>}
    </div>
  );
}
