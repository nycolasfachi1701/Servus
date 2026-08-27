import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--fonte-sans",
});

const serif = Fraunces({
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700"],
  variable: "--fonte-serif",
});

export const metadata: Metadata = {
  title: {
    default: "Servus — Gestão da Igreja",
    template: "%s · Servus",
  },
  description:
    "Servus: membros, ministérios, escalas com rodízio justo, eventos e calendário da igreja em um só lugar.",
  applicationName: "Servus",
  icons: { icon: "/icone.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0D0A0C" },
    { media: "(prefers-color-scheme: light)", color: "#FAF7F8" },
  ],
};

/** Aplica o tema salvo antes da primeira pintura (evita "flash" claro). */
const SCRIPT_TEMA = `try{var t=localStorage.getItem('servus-tema');if(t==='claro'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`dark ${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-dvh bg-fundo text-texto">{children}</body>
    </html>
  );
}
