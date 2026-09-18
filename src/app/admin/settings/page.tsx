"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeading } from "@/components/ui/PageHeading";
import { Stamp } from "@/components/ui/Stamp";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [config, setConfig] = useState({
    defaultTokens: 100,
    maintenanceMode: false,
    apiKey: "••••••••••••••••••••••••••••••••",
    maxBatchSize: 10,
  });

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div>
      <PageHeading
        stamp="System"
        title="Settings."
        lede="Kuota default, kunci API, dan mode maintenance."
        meta={
          <Button type="button" variant="ghost" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
        }
      />

      {saveSuccess ? (
        <p className="mb-6 border border-line px-4 py-3 text-sm text-accent">
          Konfigurasi tersimpan.
        </p>
      ) : null}

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <section className="border border-line">
          <div className="border-b border-line px-4 py-3">
            <Stamp>Quota</Stamp>
          </div>
          <div className="flex flex-col justify-between gap-6 p-4 md:flex-row md:items-center">
            <div className="max-w-md">
              <p className="text-sm text-text">Initial user tokens</p>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">
                Kuota harian yang diberikan saat akun contributor baru dibuat.
              </p>
            </div>
            <input
              type="number"
              value={config.defaultTokens}
              onChange={(e) => setConfig({ ...config, defaultTokens: Number(e.target.value) })}
              className="input-admin w-full md:w-32"
            />
          </div>
        </section>

        <section className="border border-line">
          <div className="border-b border-line px-4 py-3">
            <Stamp>API</Stamp>
          </div>
          <div className="divide-y divide-line">
            <div className="flex flex-col justify-between gap-6 p-4 md:flex-row md:items-center">
              <div className="max-w-md">
                <p className="text-sm text-text">Gemini key</p>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  Disimpan di environment, bukan di form ini.
                </p>
              </div>
              <input type="text" disabled value={config.apiKey} className="input-admin w-full md:w-64 opacity-60" />
            </div>
            <div className="flex flex-col justify-between gap-6 p-4 md:flex-row md:items-center">
              <div className="max-w-md">
                <p className="text-sm text-text">Max batch</p>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  Batas antrean generate per klik.
                </p>
              </div>
              <input
                type="number"
                value={config.maxBatchSize}
                onChange={(e) => setConfig({ ...config, maxBatchSize: Number(e.target.value) })}
                className="input-admin w-full md:w-32"
              />
            </div>
          </div>
        </section>

        <section className="border border-line">
          <div className="border-b border-line px-4 py-3">
            <Stamp>Danger</Stamp>
          </div>
          <div className="flex flex-col justify-between gap-6 p-4 md:flex-row md:items-center">
            <div className="max-w-md">
              <p className="text-sm text-text">Maintenance mode</p>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">
                Hentikan akses contributor. Super admin tetap masuk.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
              className="text-[11px] uppercase tracking-[0.18em] text-text-muted transition-colors duration-hover hover:text-accent"
            >
              {config.maintenanceMode ? "On" : "Off"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
