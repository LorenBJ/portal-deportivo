import { TechnicalStaffView } from "@/components/technical-staff-view";
import { PageHeader } from "@/components/page-header";
import { PortalShell } from "@/components/portal-shell";

export default async function AnalystPage({ searchParams }) {
  const params = await searchParams;
  const initialMatchId = typeof params?.match === "string" ? params.match : "";
  const initialPrompt = typeof params?.prompt === "string" ? params.prompt : "";
  const initialTab = typeof params?.tab === "string" ? params.tab : "ayudante";

  return (
    <PortalShell pathname="/analista">
      <main className="page">
        <PageHeader eyebrow="Cuerpo tecnico" note="Operacion diaria, analisis de partido y estrategia" title="Mesa tecnica para decidir partidos, mercados y plan de accion" />
        <TechnicalStaffView initialMatchId={initialMatchId} initialPrompt={initialPrompt} initialTab={initialTab} />
      </main>
    </PortalShell>
  );
}
