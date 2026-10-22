import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { brand } from "@/lib/brand";
import { CartProvider } from "@/components/cart/CartProvider";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Ticker } from "@/components/site/Ticker";
import { FloatingDock } from "@/components/dock/FloatingDock";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingCartBadge } from "@/components/site/FloatingCartBadge";
import { getSiteSettings } from "@/lib/settings";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name} · ${brand.tagline}`,
    template: `%s · ${brand.name}`,
  },
  description:
    "Nigerian quick-service kitchen in Abuja. Burgers, chicken, shawarma, small chops, party packs and catering. Eat well & spend less.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: brand.name,
    description: brand.tagline,
    type: "website",
    locale: "en_NG",
  },
};

export const viewport: Viewport = {
  themeColor: brand.colors.black,
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <html lang="en" className={`${sans.variable} ${display.variable}`}>
        <body className="admin-mode">
          <CartProvider>{children}</CartProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <CartProvider>
          <Ticker messages={settings.ticker_messages} />
          <Header />
          <main>{children}</main>
          <Footer />
          {settings.dock_enabled && (
            <FloatingDock config={settings.dock_config} whatsappNumber={settings.whatsapp_number} />
          )}
          <FloatingCartBadge />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
