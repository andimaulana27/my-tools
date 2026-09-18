import { Button } from "@/components/ui/Button";
import { CaseRow } from "@/components/ui/CaseRow";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { MetaRow } from "@/components/ui/MetaRow";
import { PageHero } from "@/components/ui/PageHero";
import { Stamp } from "@/components/ui/Stamp";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { SITE_GRID, SITE_WRAP } from "@/lib/layout";
import { TOOLS } from "@/lib/tools";
import { cn } from "@/lib/cn";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg">
      <SiteNav />
      <main>
        <section className="bg-field relative flex min-h-[calc(100svh-4rem)] flex-col justify-end overflow-hidden pb-16 pt-20 md:pb-20 md:pt-24">
          <div className={cn(SITE_WRAP, SITE_GRID, "flex flex-1 flex-col justify-center")}>
            <Stamp className="mb-8">Introduction</Stamp>
            <DisplayTitle className="w-full text-[clamp(2.5rem,8vw,6.5rem)]">Tools.</DisplayTitle>
            <div className="mt-10 max-w-3xl md:mt-12">
              <MetaRow
                items={[
                  { label: "Use", value: "Private AI workspace" },
                  { label: "Focus", value: "Stock + assets" },
                  { label: "Access", value: "Invite only" },
                ]}
              />
            </div>
            <p className="mt-10 max-w-xl text-sm leading-[1.75] text-text-muted md:text-[15px]">
              Suite pribadi untuk siklus produksi: metadata microstock, generator aset, video loop
              4K, dan otomasi penamaan. Satu sistem, tanpa dekorasi yang mengganggu kerja.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button href="/login" variant="ghost">
                Enter workspace
              </Button>
              <Button href="/#engines" variant="ghost">
                View engines
              </Button>
            </div>
            <div className="mt-16 flex items-end justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-faint">
                01 / 02 — Engines
              </p>
              <a
                href="#engines"
                className="text-[11px] uppercase tracking-[0.18em] text-text-muted transition-colors duration-hover hover:text-accent"
              >
                Next — Engines →
              </a>
            </div>
          </div>
        </section>

        <section id="engines" className="py-20 md:py-28">
          <div className={SITE_WRAP}>
            <PageHero
              as="h2"
              stamp="Catalog"
              title="Engines."
              meta={[
                { label: "Count", value: `${String(TOOLS.length).padStart(2, "0")} tools` },
                { label: "Rule", value: "Quota per action" },
                { label: "Output", value: "Stock-ready" },
              ]}
              lede="Delapan engine untuk metadata, aset, video, dan arsitektur. Masuk dulu untuk menjalankan."
            />
            <div className="mt-14">
              {TOOLS.map((tool) => (
                <CaseRow
                  key={tool.href}
                  index={tool.index}
                  title={tool.title}
                  kicker={tool.kicker}
                  summary={tool.summary}
                  extra={tool.extra}
                  href="/login"
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
