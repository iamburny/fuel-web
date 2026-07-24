"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { resetFavourites } from "@/lib/favourites";
import { resetAlerts } from "@/lib/alerts";

const links = [
  { href: "/", label: "Nearby" },
  { href: "/prices", label: "Prices & Trends" },
  { href: "/heatmap", label: "Heat Map" },
  { href: "/favourites", label: "Favourites" },
  { href: "/download", label: "Get the App" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const path = usePathname();
  const { isLoggedIn, email, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // Close the mobile dropdown whenever the route changes (link tap, back button, etc).
  useEffect(() => setOpen(false), [path]);

  const signOut = () => {
    logout();
    resetFavourites();
    resetAlerts();
    setOpen(false);
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo" onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="" width={28} height={28} className="nav-logo-icon" />
          <strong>fuel</strong>
          <span>tracker.uk</span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className={clsx("nav-links", open && "open")}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx("nav-link", path === l.href && "active")}
            >
              {l.label}
            </Link>
          ))}
          {isLoggedIn && (
            <button
              type="button"
              onClick={signOut}
              className="nav-link"
              title={email ? `Signed in as ${email}` : "Sign out"}
              style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
