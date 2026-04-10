import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";

export default function HomePage() {
  return (
    <PortalShell pathname="/">
      <main className="page">
        <section className="heroLayout">
          <div className="heroCopy">
            <p className="eyebrow">Portal personal</p>
            <h1>Segui agenda, cuotas y rendimiento sin una interfaz cargada.</h1>
            <p className="lead">
              La experiencia queda dividida en paginas claras: agenda para descubrir,
              combinador para preparar jugadas e historial para medir acierto y retorno.
            </p>
            <div className="buttonRow">
              <Link className="button primary" href="/agenda">Ir a la agenda</Link>
              <Link className="button secondary" href="/combinador">Abrir combinador</Link>
            </div>
          </div>

          <aside className="panel softPanel">
            <p className="eyebrow">Enfoque</p>
            <h2>Base pensada para crecer rapido</h2>
            <ul className="cleanList">
              <li>Navegacion separada por funcionalidad.</li>
              <li>Diseno mas claro y aireado.</li>
              <li>Combinador con stake y retorno potencial.</li>
              <li>Historial persistido en el navegador.</li>
              <li>Estructura lista para desplegar en Vercel.</li>
            </ul>
          </aside>
        </section>

        <section className="cardGrid cardGridWide">
          <article className="panel featurePanel">
            <p className="eyebrow">Agenda</p>
            <h2>Partidos y picks con valor</h2>
            <p className="muted">
              Filtros simples por competicion, deporte y estado para descubrir oportunidades.
            </p>
            <Link className="textLink" href="/agenda">Explorar agenda</Link>
          </article>
          <article className="panel featurePanel">
            <p className="eyebrow">Combinador</p>
            <h2>Simular stake y ganancia</h2>
            <p className="muted">
              Elegi hasta 3 picks y calcula retorno potencial en segundos.
            </p>
            <Link className="textLink" href="/combinador">Preparar combinacion</Link>
          </article>
          <article className="panel featurePanel">
            <p className="eyebrow">Historial</p>
            <h2>Controlar acierto y ROI</h2>
            <p className="muted">
              Guarda apuestas y marca ganadas o perdidas para seguir el rendimiento real.
            </p>
            <Link className="textLink" href="/historial">Ver historial</Link>
          </article>
        </section>
      </main>
    </PortalShell>
  );
}
