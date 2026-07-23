"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

/**
 * Wraps the app in the Google OAuth provider so any component can render a "Continue with Google"
 * button. If the client ID isn't configured (e.g. local dev before setup), we skip the provider —
 * the sign-in button hides itself in that case, and the rest of the app is unaffected.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  if (!CLIENT_ID) return <>{children}</>;
  return <GoogleOAuthProvider clientId={CLIENT_ID}>{children}</GoogleOAuthProvider>;
}
