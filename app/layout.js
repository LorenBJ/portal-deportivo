import { Oxanium, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body"
});

const displayFont = Oxanium({
  subsets: ["latin"],
  variable: "--font-display"
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata = {
  title: "Portal Deportivo Personal",
  description: "Agenda deportiva, combinador e historial para uso personal"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
