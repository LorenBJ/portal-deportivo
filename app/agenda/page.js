import { AgendaView } from "@/components/agenda-view";
import { PageHeader } from "@/components/page-header";
import { PortalShell } from "@/components/portal-shell";

export default function AgendaPage() {
  return (
    <PortalShell pathname="/agenda">
      <main className="page">
        <PageHeader eyebrow="Agenda central" note="Cabina diaria conectada al feed" title="Jornada, lectura base y acceso directo al analista" />
        <AgendaView />
      </main>
    </PortalShell>
  );
}

