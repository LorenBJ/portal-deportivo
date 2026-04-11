import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";

export default function HomePage() {
  return (
    <PortalShell pathname="/">
      <main className="page">
        <section className="heroLayout">
          <div className="heroCopy">
            <p className="eyebrow">Cabina diaria</p>
            <h1>Todo tu proceso de apuesta en una sola plataforma.</h1>
            <p className="lead">
              Ver partidos del dia, detectar valor, entender contexto y medir si una estrategia chica y disciplinada puede crecer mes a mes.
            </p>
            <div className="buttonRow">
              <Link className="button primary" href="/agenda">Ir a la agenda</Link>
              <Link className="button secondary" href="/radar">Abrir radar</Link>
            </div>
          </div>

          <aside className="panel softPanel">
            <p className="eyebrow">Objetivo</p>
            <h2>Flujo diario simple</h2>
            <ul className="cleanList">
              <li>Agenda del dia con mercados utiles.</li>
              <li>Lectura rapida por partido y contexto.</li>
              <li>Radar para medir ligas y equipos.</li>
              <li>Historial para medir acierto y ROI real.</li>
              <li>Bot lab para bankroll, temperatura y riesgo.</li>
            </ul>
          </aside>
        </section>

        <section className="cardGrid cardGridWide homeFourGrid">
          <article className="panel featurePanel">
            <p className="eyebrow">Agenda</p>
            <h2>Cabina de partidos</h2>
            <p className="muted">La agenda pasa a ser el centro: jornada, contexto y mercados operables sin ruido innecesario.</p>
            <Link className="textLink" href="/agenda">Explorar agenda</Link>
          </article>
          <article className="panel featurePanel">
            <p className="eyebrow">Radar</p>
            <h2>Ligas y equipos</h2>
            <p className="muted">Ver qué segmentos conviene empujar según cobertura viva, ROI y acierto histórico.</p>
            <Link className="textLink" href="/radar">Abrir radar</Link>
          </article>
          <article className="panel featurePanel">
            <p className="eyebrow">Bot</p>
            <h2>Motor y bankroll</h2>
            <p className="muted">Medir temperatura, drawdown, presupuesto diario y regimen del bot antes de pasar a live.</p>
            <Link className="textLink" href="/bot">Abrir bot lab</Link>
          </article>
          <article className="panel featurePanel">
            <p className="eyebrow">Analista</p>
            <h2>IA para decidir mejor</h2>
            <p className="muted">Pedir lectura de partido, comparar mercados y despues armar una combinada con esa info.</p>
            <Link className="textLink" href="/analista">Ir al analista</Link>
          </article>
        </section>
      </main>
    </PortalShell>
  );
}
