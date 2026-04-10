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
              <Link className="button secondary" href="/analista">Abrir analista</Link>
            </div>
          </div>

          <aside className="panel softPanel">
            <p className="eyebrow">Objetivo</p>
            <h2>Flujo diario simple</h2>
            <ul className="cleanList">
              <li>Agenda del dia con mercados utiles.</li>
              <li>Lectura rapida por partido y contexto.</li>
              <li>Analista para armar simples o combinadas.</li>
              <li>Historial para medir acierto y ROI real.</li>
            </ul>
          </aside>
        </section>

        <section className="cardGrid cardGridWide">
          <article className="panel featurePanel">
            <p className="eyebrow">Agenda</p>
            <h2>Cabina de partidos</h2>
            <p className="muted">La agenda pasa a ser el centro: jornada, contexto y mercados operables sin ruido innecesario.</p>
            <Link className="textLink" href="/agenda">Explorar agenda</Link>
          </article>
          <article className="panel featurePanel">
            <p className="eyebrow">Combinador</p>
            <h2>Combinadas mas sanas</h2>
            <p className="muted">Seleccionar poco, sumar cuotas con criterio y controlar stake, retorno y riesgo.</p>
            <Link className="textLink" href="/combinador">Preparar combinacion</Link>
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
