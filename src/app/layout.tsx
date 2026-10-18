import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Fraunces } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { ChromeGate } from "@/frontend/components/ChromeGate";
import { Footer, Header } from "@/frontend/components/SiteChrome";
import { PREFS_SCRIPT } from "@/frontend/lib/prefs";
import { SITE } from "@/frontend/lib/site";

// Atkinson Hyperlegible was designed by the Braille Institute for readers with low vision.
const body = Atkinson_Hyperlegible_Next({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const heading = Fraunces({ subsets: ["latin"], variable: "--font-heading", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${SITE.name}: find the real reason you're stuck`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { title: `${SITE.name}: find the real reason you're stuck`, description: SITE.description, type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f1" },
    { media: "(prefers-color-scheme: dark)", color: "#121815" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-leaf px-4 py-2 font-semibold text-leaf-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <ChromeGate>
          <Header />
        </ChromeGate>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 sm:pt-10">
          {children}
        </main>
        <ChromeGate>
          <Footer />
        </ChromeGate>
      </body>
    </html>
  );
}
