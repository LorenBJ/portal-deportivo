import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/agenda", label: "Agenda" },
  { href: "/radar", label: "Radar" },
  { href: "/combinador", label: "Combinador" },
  { href: "/historial", label: "Historial" },
  { href: "/informes", label: "Informes" },
  { href: "/bot", label: "Bot" },
  { href: "/analista", label: "Cuerpo tecnico" }
];

export function PortalShell({ pathname, children }) {
  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brandMark">PD</span>
          <span>
            <strong>Portal Deportivo</strong>
            <small>Uso personal</small>
          </span>
        </Link>
        <nav className="nav">
          {links.map((link) => (
            <Link
              key={link.href}
              className={`navLink${pathname === link.href ? " active" : ""}`}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
