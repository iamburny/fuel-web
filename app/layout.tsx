import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import ComplianceFooter from "@/components/ComplianceFooter";
import ThemeSync from "@/components/ThemeSync";

export const metadata: Metadata = {
  title: "Fuel Prices UK — Live Petrol & Diesel Prices",
  description:
    "Find the cheapest petrol and diesel near you. Live prices from the UK Government Fuel Finder scheme.",
};

// Sets <html data-theme="..."> synchronously, before first paint, so an explicit light/dark
// preference doesn't flash the wrong theme for a frame. Left unset for "system" (or no saved
// preference), so the @media (prefers-color-scheme) rule in globals.css handles it with no JS.
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var raw = localStorage.getItem('fuel-preferences');
    var theme = raw ? JSON.parse(raw).theme : null;
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ThemeSync />
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
