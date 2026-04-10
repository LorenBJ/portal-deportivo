import { AnalystView } from "@/components/analyst-view";
import { PageHeader } from "@/components/page-header";
import { PortalShell } from "@/components/portal-shell";

export default async function AnalystPage({ searchParams }) {
  const params = await searchParams;
  const initialMatchId = typeof params?.match === "string" ? params.match : "";
  const initialPrompt = typeof params?.prompt === "string" ? params.prompt : "";

  return (
    <PortalShell pathname="/analista">
      <main className="page">
        <PageHeader eyebrow="Analista" note="GPT-5.4-mini sobre el feed actual" title="Chat para analizar partidos y mercados" />
        <AnalystView initialMatchId={initialMatchId} initialPrompt={initialPrompt} />
      </main>
    </PortalShell>
  );
}

