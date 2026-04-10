import { HistorialView } from "@/components/historial-view";
import { PageHeader } from "@/components/page-header";
import { PortalShell } from "@/components/portal-shell";

export default function HistorialPage() {
  return (
    <PortalShell pathname="/historial">
      <main className="page">
        <PageHeader eyebrow="Seguimiento" title="Historial de apuestas y rendimiento" />
        <HistorialView />
      </main>
    </PortalShell>
  );
}
