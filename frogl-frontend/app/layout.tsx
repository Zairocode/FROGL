import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

// Bricolage tiene caracter propio sin ser un chiste; Figtree es redonda y
// calida, que es lo que le faltaba a la pagina. Entran por los mismos
// tokens de siempre, asi que ningun componente se entera del cambio.
const display = Bricolage_Grotesque({
  variable: "--font-display-src",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const sans = Figtree({
  variable: "--font-ui-src",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FROGL — evaluador de pitches",
  description:
    "Presentás. El jurado híbrido reacciona en vivo y te puntúa.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg text-fg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
