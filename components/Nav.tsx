"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const links = [
  { href: "/", label: "Nearby" },
  { href: "/prices", label: "Prices & Trends" },
];

export default function Nav() {
  const path = usePathname();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          FUEL<span>.prices" </span>
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
        </div>
      </div>
    </nav>
  );
}
