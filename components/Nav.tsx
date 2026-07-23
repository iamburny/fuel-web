"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "@/lib/auth";
import { resetFavourites } from "@/lib/favourites";

const links = [
  { href: "/", label: "Nearby" },
  { href: "/prices", label: "Prices & Trends" },
  { href: "/favourites", label: "Favourites" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const path = usePathname();
  const { isLoggedIn, email, logout } = useAuth();

  const signOut = () => {
    logout();
    resetFavourites();
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <Image src="/logo.png" alt="" width={28} height={28} className="nav-logo-icon" />
          <strong>fuel</strong>
          <span>tracker.uk</span>
        </Link>
        <div className="nav-links">
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
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
