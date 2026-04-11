import { PageHeader } from "@/components/page-header";
import { PortalShell } from "@/components/portal-shell";
import { ReportsView } from "@/components/reports-view";

export default function ReportsPage() {
  return (
    <PortalShell pathname="/informes">
      <main className="page">
        <PageHeader eyebrow="Informes" note="Exportacion y lectura portable del historial" title="Resultados filtrables y PDF compartible" />
        <ReportsView />
      </main>
    </PortalShell>
  );
}
