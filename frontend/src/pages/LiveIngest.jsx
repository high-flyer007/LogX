import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  FileInput,
  Loader2,
  Send,
  ShieldCheck,
  Terminal,
} from "lucide-react";

import { api } from "../services/api";

const SAMPLE_LOG = `date=2026-09-19 time=18:30:00 devname="FGT-01" devid="FG123" logid="0000000013" type="traffic" subtype="forward" srcip=10.0.0.5 srcport=51542 dstip=8.8.8.8 dstport=443 proto=6 sentbyte=1024 action="deny" policyid=10`;

const stages = [
  "RECEIVED",
  "RAW",
  "DETECTED",
  "PARSED",
  "NORMALIZED",
  "VALIDATED",
];

export default function LiveIngest() {
  const [rawData, setRawData] = useState(SAMPLE_LOG);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  async function handleProcess() {
    if (!rawData.trim()) {
      setError("Please enter a raw security log.");
      return;
    }

    setProcessing(true);
    setError("");
    setResult(null);

    try {
      const response = await api.processEvent(rawData);
      setResult(response);
    } catch (err) {
      setError(err.message || "Failed to process event.");
    } finally {
      setProcessing(false);
    }
  }

  function loadSample() {
    setRawData(SAMPLE_LOG);
    setResult(null);
    setError("");
  }

  const processedEvent = result?.result || result;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.28em] text-cyan-300">
          <Activity size={15} />
          Telemetry Ingestion
        </div>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Live Ingest
        </h1>

        <p className="mt-2 max-w-3xl text-slate-400">
          Submit raw security telemetry and observe how LogX transforms
          heterogeneous logs into a normalized, validated security event.
        </p>
      </div>

      {/* Pipeline */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
              Processing Pipeline
            </p>

            <h2 className="mt-1 text-lg font-medium text-white">
              Telemetry Flow
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            READY
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {stages.map((stage, index) => {
            const active =
              processing || result;

            return (
              <div
                key={stage}
                className={`rounded-xl border p-4 text-center transition ${
                  active
                    ? "border-cyan-400/20 bg-cyan-400/[0.04]"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/5 text-xs text-cyan-300">
                  {index + 1}
                </div>

                <p className="mt-3 text-[11px] font-medium tracking-wider text-slate-300">
                  {stage}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Input + result */}
      <div className="grid gap-6 xl:grid-cols-2">

        {/* Raw input */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-300">
                <FileInput size={18} />
                <h2 className="font-medium text-white">
                  Raw Telemetry
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Original evidence is submitted without modification.
              </p>
            </div>

            <button
              onClick={loadSample}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
            >
              Load Sample
            </button>
          </div>

          <textarea
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            spellCheck={false}
            className="mt-5 h-64 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-sm leading-6 text-slate-300 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/30"
            placeholder="Paste raw security telemetry here..."
          />

          <div className="mt-4 flex items-center justify-between">

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Terminal size={14} />
              {rawData.length} characters
            </div>

            <button
              onClick={handleProcess}
              disabled={processing}
              className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Process Event
                </>
              )}
            </button>

          </div>

          {error && (
            <div className="mt-4 flex gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
              <CircleAlert size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

        </section>

        {/* Result */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

          <div className="flex items-start justify-between">

            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />

                <h2 className="font-medium text-white">
                  Processing Result
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Normalized LogX event returned by the backend.
              </p>
            </div>

            {result && (
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 size={15} />
                PROCESSED
              </div>
            )}

          </div>

          {!result && !processing && (
            <div className="flex h-80 items-center justify-center text-center">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/5">
                  <Activity size={24} className="text-cyan-300" />
                </div>

                <p className="mt-4 text-sm text-slate-400">
                  Submit telemetry to see the normalized event.
                </p>
              </div>
            </div>
          )}

          {processing && (
            <div className="flex h-80 items-center justify-center">
              <div className="text-center">
                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-cyan-300"
                />

                <p className="mt-4 text-sm text-slate-400">
                  Running LogX processing pipeline...
                </p>
              </div>
            </div>
          )}

          {processedEvent && (
            <div className="mt-5 space-y-4">

              <div className="grid grid-cols-2 gap-3">

                <InfoCard
                  label="Status"
                  value={processedEvent.status || "processed"}
                />

                <InfoCard
                  label="Schema"
                  value={
                    processedEvent.schema?.version
                      ? `LogX Event ${processedEvent.schema.version}`
                      : "LogX Event"
                  }
                />

                <InfoCard
                  label="Action"
                  value={processedEvent.event?.action || "—"}
                />

                <InfoCard
                  label="Protocol"
                  value={processedEvent.network?.protocol || "—"}
                />

              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">

                <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">
                  Normalized Event
                </p>

                <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-slate-300">
                  {JSON.stringify(processedEvent, null, 2)}
                </pre>

              </div>

            </div>
          )}

        </section>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-2 truncate text-sm font-medium text-white">
        {value}
      </p>
    </div>
  );
}