import { LeagueRadarView } from "@/components/league-radar-view";
import { PageHeader } from "@/components/page-header";
import { PortalShell } from "@/components/portal-shell";

export default function RadarPage() {
  return (
    <PortalShell pathname="/radar">
      <main className="page">
        <PageHeader eyebrow="Mapa de valor" note="Ligas y equipos" title="Radar de ligas y precision por segmento" />
        <LeagueRadarView />
      </main>
    </PortalShell>
  );
}
