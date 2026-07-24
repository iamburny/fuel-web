import type { Metadata } from "next";
import Link from "next/link";
import { Apple, PlayCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Get the App — Fuel Tracker UK",
  description: "Fuel Tracker UK for Android and iOS — coming soon.",
};

export default function DownloadPage() {
  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <h1>Get the App</h1>
        <p>Fuel Tracker UK, in your pocket — coming soon</p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StoreTile
          store="Google Play"
          icon={<PlayCircle size={22} />}
          note="In final testing — release coming soon."
        />
        <StoreTile
          store="App Store"
          icon={<Apple size={22} />}
          note="Apple app coming soon."
        />
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
        No need to wait — the web app already has everything: live prices, the price heat map,
        favourites, and area alerts. <Link href="/">Open Fuel Tracker UK</Link> right in your
        browser.
      </p>
    </div>
  );
}

function StoreTile({ store, icon, note }: { store: string; icon: React.ReactNode; note: string }) {
  return (
    <div
      className="card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: 0.75,
        cursor: "default",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "var(--bg-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-primary)",
          flexShrink: 0,
        }}
        aria-hidden
      >
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 600 }}>{store}</div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>{note}</div>
        <span
          style={{
            display: "inline-block",
            marginTop: 8,
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            color: "var(--accent)",
            background: "var(--accent-glow)",
            borderRadius: 999,
            padding: "3px 10px",
          }}
        >
          Coming soon
        </span>
      </div>
    </div>
  );
}
