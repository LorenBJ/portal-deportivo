import { CombinadorView } from "@/components/combinador-view";
import { PageHeader } from "@/components/page-header";
import { PortalShell } from "@/components/portal-shell";

export default function CombinadorPage() {
  return (
    <PortalShell pathname="/combinador">
      <main className="page">
        <PageHeader eyebrow="Simulacion" note="Cuotas y mercados consumidos desde el backend" title="Combinador con stake y retorno estimado" />
        <CombinadorView />
      </main>
    </PortalShell>
  );
}
