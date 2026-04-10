import { BotView } from "@/components/bot-view";
import { PageHeader } from "@/components/page-header";
import { PortalShell } from "@/components/portal-shell";

export default function BotPage() {
  return (
    <PortalShell pathname="/bot">
      <main className="page">
        <PageHeader eyebrow="Automatizacion" title="Bot de apuestas y control diario" note="Paper-first, live-ready" />
        <BotView />
      </main>
    </PortalShell>
  );
}
