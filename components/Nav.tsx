"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const links = [
  { href: "/", label: "Nearby" },
  { href: "/prices", label: "Prices & Trends" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const path = usePathname();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <Image src="/logo.png" alt="" width={28} height={28} className="nav-logo-icon" />
          <strong>fuel</strong>
          <span>track.uk</span>
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
