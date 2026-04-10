import "./globals.css";

export const metadata = {
  title: "Portal Deportivo Personal",
  description: "Agenda deportiva, combinador e historial para uso personal"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
