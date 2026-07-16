import type { Metadata, Viewport } from "next";
export const viewport: Viewport = {
  themeColor: "#120f0d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
import { Cairo, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "sonner";
import { AdminLocaleProvider } from "@/components/admin/admin-locale-provider";
import { PageTransition } from "@/components/page-transition";
import { PreviewFocusBridge } from "@/components/preview-focus-bridge";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getAdminLocaleDirection } from "@/lib/admin-locale";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { SITE_URL } from "@/lib/site-url";
import arMessages from "../../messages/ar.json";
import enMessages from "../../messages/en.json";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Veyra Developments",
    template: "%s | Veyra Developments",
  },
  description: "Real estate development, finishing, and smart home solutions. From project selection to delivery.",
  metadataBase: new URL(SITE_URL),
  applicationName: "Veyra Developments",
  icons: {
    icon: [{ url: "/brand/veyra-mark.svg", type: "image/svg+xml" }],
    shortcut: ["/brand/veyra-mark.svg"],
    apple: [{ url: "/brand/veyra-mark.svg" }],
  },
  openGraph: {
    title: "Veyra Developments",
    description: "Real estate development, finishing, and smart home solutions.",
    siteName: "Veyra Developments",
    locale: "en_US",
    type: "website",
    images: [{ url: "/scenes/brand-og.svg", width: 1200, height: 630, alt: "Veyra Developments" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Veyra Developments",
    description: "Real estate development, finishing, and smart home solutions.",
    images: ["/scenes/brand-og.svg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getCurrentAdminLocale();
  const messages = locale === "ar" ? arMessages : enMessages;
  const direction = getAdminLocaleDirection(locale);

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${cormorant.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className={`min-h-full antialiased ${direction === "rtl" ? "font-arabic" : ""}`}>
        <AdminLocaleProvider initialLocale={locale} messages={messages}>
          <Toaster
            position={direction === "rtl" ? "bottom-left" : "bottom-right"}
            theme="dark"
            richColors
            toastOptions={{
              style: {
                background: "rgba(18, 15, 13, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f5efe7",
                backdropFilter: "blur(20px)",
              },
            }}
          />
          <PreviewFocusBridge />
          <div className="flex min-h-full flex-col">
            <SiteHeader />
            <main className="flex-1">
              <PageTransition>{children}</PageTransition>
            </main>
            <SiteFooter />
          </div>
        </AdminLocaleProvider>
      </body>
    </html>
  );
}
