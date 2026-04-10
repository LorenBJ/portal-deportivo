import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";

export default function HomePage() {
  return (
    <PortalShell pathname="/">
      <main className="page">
        <section className="heroLayout">
          <div className="heroCopy">
            <p className="eyebrow">Portal personal</p>
            <h1>Agenda, picks filtrados y analista conversacional.</h1>
            <p className="lead">
              Motor propio mas conservador, chat para analizar partidos y una experiencia pensada para decidir con menos ruido.
            </p>
            <div className="buttonRow">
              <Link className="button primary" href="/agenda">Ir a la agenda</Link>
              <Link className="button secondary" href="/analista">Abrir analista</Link>
            </div>
          </div>

          <aside className="panel softPanel">
            <p className="eyebrow">Novedad</p>
            <h2>Motor v2 + chat</h2>
            <ul className="cleanList">
              <li>Ranking por edge, confianza y estabilidad.</li>
              <li>Filtro anti-outsiders absurdos.</li>
              <li>Analista con contexto del feed actual.</li>
              <li>Base lista para sumar busqueda externa despues.</li>
            </ul>
          </aside>
        </section>

        <section className="cardGrid cardGridWide">
          <article className="panel featurePanel">
            <p className="eyebrow">Agenda</p>
            <h2>Picks mejor filtrados</h2>
            <p className="muted">Ahora el ranking prioriza valor esperado, confianza y sentido deportivo.</p>
            <Link className="textLink" href="/agenda">Explorar agenda</Link>
          </article>
          <article className="panel featurePanel">
            <p className="eyebrow">Combinador</p>
            <h2>Solo picks recomendados</h2>
            <p className="muted">La seleccion prioriza mercados mas sanos y reduce sorpresas extremas.</p>
            <Link className="textLink" href="/combinador">Preparar combinacion</Link>
          </article>
          <article className="panel featurePanel">
            <p className="eyebrow">Analista</p>
            <h2>Chat sobre el partido</h2>
            <p className="muted">Pedi una lectura del partido, mercados y stake sugerido con tu feed actual.</p>
            <Link className="textLink" href="/analista">Ir al analista</Link>
          </article>
        </section>
      </main>
    </PortalShell>
  );
}
