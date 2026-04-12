import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import ComplianceFooter from "@/components/ComplianceFooter";

export const metadata: Metadata = {
  title: "Fuel Prices UK — Live Petrol & Diesel Prices",
  description:
    "Find the cheapest petrol and diesel near you. Live prices from the UK Government Fuel Finder scheme.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
