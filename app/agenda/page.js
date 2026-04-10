import { AgendaView } from "@/components/agenda-view";
import { PageHeader } from "@/components/page-header";
import { PortalShell } from "@/components/portal-shell";

export default function AgendaPage() {
  return (
    <PortalShell pathname="/agenda">
      <main className="page">
        <PageHeader eyebrow="Agenda central" note="Datos simulados listos para API real" title="Partidos, filtros y picks destacados" />
        <AgendaView />
      </main>
    </PortalShell>
  );
}
