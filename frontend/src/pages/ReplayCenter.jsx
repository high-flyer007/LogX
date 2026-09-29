import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  History,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Database,
  GitCompare,
  Clock3,
} from "lucide-react";

import { api } from "../services/api";


function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
      {children}
    </p>
  );
}


function InfoCard({ label, value, mono = false }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-sm font-semibold text-white ${
          mono ? "font-mono" : ""
        }`}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}


function StatusBadge({ success }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        success
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : "border-red-400/20 bg-red-400/10 text-red-300"
      }`}
    >
      {success ? (
        <CheckCircle2 size={14} />
      ) : (
        <XCircle size={14} />
      )}

      {success ? "REPLAY SUCCESS" : "REPLAY FAILED"}
    </div>
  );
}


export default function ReplayCenter() {
  const [events, setEvents] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [replaying, setReplaying] = useState(false);
  const [error, setError] = useState("");
  const [replayResult, setReplayResult] = useState(null);
  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [eventsResponse, historyResponse] = await Promise.all([
        api.events(100),
        api.replayHistory(),
      ]);

      setEvents(eventsResponse?.events || []);
      setHistory(historyResponse?.history || []);

      if (!selectedEvent && eventsResponse?.events?.length) {
        setSelectedEvent(eventsResponse.events[0]);
      }
    } catch (err) {
      console.error("Replay Center loading failed:", err);
      setError(err.message || "Unable to load replay data.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);


  const selectedRaw = useMemo(() => {
  if (!selectedEvent) {
    return "";
  }

  return (
    selectedEvent.raw_data ||
    selectedEvent.data?.raw?.data ||
    selectedEvent.raw?.data ||
    selectedEvent.raw?.message ||
    ""
  );
}, [selectedEvent]);

  const selectedSha256 =
  selectedEvent?.sha256 ||
  selectedEvent?.data?.raw?.sha256 ||
  selectedEvent?.raw?.sha256 ||
  "";

  const selectedParser =
    selectedEvent?.parser?.id ||
    selectedEvent?.parser_id ||
    "fortigate.traffic";


  const selectedParserVersion =
    selectedEvent?.parser?.version ||
    selectedEvent?.parser_version ||
    "1.0.0";


  const handleReplay = async () => {
  if (!selectedEvent) return;

  const eventId =
    selectedEvent.event_id ||
    selectedEvent.id;

  const rawData =
    selectedEvent.raw_data ||
    selectedEvent.data?.raw?.data ||
    selectedEvent.raw?.data ||
    selectedEvent.raw?.message ||
    "";

  const originalSha256 =
    selectedEvent.sha256 ||
    selectedEvent.data?.raw?.sha256 ||
    selectedEvent.raw?.sha256 ||
    "";

  if (!rawData) {
    setError("Original raw evidence is unavailable for this event.");
    return;
  }

  if (!originalSha256) {
    setError("Original SHA-256 fingerprint is unavailable.");
    return;
  }

  setReplaying(true);
  setError("");
  setReplayResult(null);

  try {
    const result = await api.replay({
      raw_data: rawData,
      original_sha256: originalSha256,
      parser_id: selectedParser,
      parser_version: selectedParserVersion,
      reason: `Manual replay from Replay Center — ${eventId}`,
    });

    console.log("REPLAY RESULT:", result);

    setReplayResult(result);

    await loadData();
  } catch (err) {
    console.error("Replay failed:", err);
    setError(err.message || "Replay failed.");
  } finally {
    setReplaying(false);
  }
};

  return (
    <div className="space-y-8 pb-12">

      {/* Header */}
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">

        <div>
          <SectionLabel>Evidence Reprocessing</SectionLabel>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Replay Center
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400">
            Reprocess preserved security telemetry against deterministic
            parser versions without losing the original evidence or
            provenance chain.
          </p>
        </div>


        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />

          Refresh
        </button>

      </div>


      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
          {error}
        </div>
      )}


      {/* Concept banner */}
      <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.035] p-5">

        <div className="flex items-start gap-4">

          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
            <ShieldCheck
              size={22}
              className="text-cyan-300"
            />
          </div>

          <div>
            <p className="font-semibold text-white">
              Raw evidence remains immutable
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Replay operates on preserved telemetry. The original event,
              parser version, and processing history remain available for
              forensic verification.
            </p>
          </div>

        </div>

      </div>


      {/* Main workspace */}
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">

        {/* Event selection */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

          <div className="flex items-center justify-between">

            <div>
              <SectionLabel>01 · Select Evidence</SectionLabel>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Preserved Events
              </h2>
            </div>

            <Database
              size={21}
              className="text-cyan-300"
            />

          </div>


          <div className="mt-5 space-y-3">

            {loading ? (
              <div className="rounded-xl border border-white/10 p-8 text-center text-sm text-slate-500">
                Loading preserved events…
              </div>
            ) : events.length === 0 ? (

              <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">

                <Database
                  size={30}
                  className="mx-auto text-slate-600"
                />

                <p className="mt-4 font-semibold text-slate-300">
                  No events available
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Process an event through Live Ingest first.
                </p>

              </div>

            ) : (

              events.map((event, index) => {

                const id =
                  event.event_id ||
                  event.id ||
                  `event-${index}`;

                const isSelected =
                  selectedEvent === event;

                const source =
                  event.device?.product ||
                  event.device?.vendor ||
                  event.source ||
                  "Unknown Source";

                const action =
                  event.event?.action ||
                  event.action ||
                  "unknown";

                return (
                  <button
                    key={id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-cyan-400/30 bg-cyan-400/[0.06]"
                        : "border-white/10 bg-black/10 hover:border-white/20"
                    }`}
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <div className="flex items-center gap-2">

                          {isSelected ? (
                            <CheckCircle2
                              size={16}
                              className="text-cyan-300"
                            />
                          ) : (
                            <Database
                              size={16}
                              className="text-slate-500"
                            />
                          )}

                          <span className="font-semibold text-white">
                            {source}
                          </span>

                          <span className="rounded-md border border-cyan-400/10 bg-cyan-400/5 px-2 py-1 text-[11px] text-cyan-300">
                            {action}
                          </span>

                        </div>

                        <p className="mt-2 font-mono text-xs text-slate-500">
                          {id}
                        </p>

                      </div>

                      <ArrowRight
                        size={17}
                        className={
                          isSelected
                            ? "text-cyan-300"
                            : "text-slate-600"
                        }
                      />

                    </div>

                  </button>
                );
              })

            )}

          </div>

        </section>


        {/* Replay configuration */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

          <div className="flex items-center justify-between">

            <div>
              <SectionLabel>02 · Replay Configuration</SectionLabel>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Processing Target
              </h2>
            </div>

            <RotateCcw
              size={21}
              className="text-emerald-300"
            />

          </div>


          {selectedEvent ? (

            <div className="mt-5 space-y-4">

              <div className="grid grid-cols-2 gap-3">

                <InfoCard
                  label="Parser"
                  value={selectedParser}
                  mono
                />

                <InfoCard
                  label="Version"
                  value={selectedParserVersion}
                  mono
                />

                <InfoCard
                  label="Event ID"
                  value={
                    selectedEvent.event_id ||
                    selectedEvent.id
                  }
                  mono
                />

                <InfoCard
                  label="Evidence"
                  value="PRESERVED"
                />

              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
  <p className="text-xs uppercase tracking-wider text-slate-500">
    Original SHA-256
  </p>

  <p className="mt-2 break-all font-mono text-xs leading-6 text-cyan-300">
    {selectedSha256 || "Unavailable"}
  </p>
</div>


              <div className="rounded-xl border border-white/10 bg-black/20 p-4">

                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Replay Source
                </p>

                <p className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap font-mono text-xs leading-6 text-slate-300">
                  {selectedRaw || "Raw payload unavailable"}
                </p>

              </div>


              <button
                onClick={handleReplay}
                disabled={replaying}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >

                <RotateCcw
                  size={18}
                  className={replaying ? "animate-spin" : ""}
                />

                {replaying
                  ? "Reprocessing Evidence…"
                  : "Replay Event"}

              </button>

              {/* Replay Integrity */}
{replayResult && (
  <section className="mt-6 rounded-2xl border border-cyan-400/20 bg-[#0b1118] p-6">
    <div className="mb-5 flex items-center justify-between">
      <div>
        <div className="text-xs font-semibold tracking-[0.25em] text-cyan-400">
          04 · INTEGRITY VERIFICATION
        </div>

        <h2 className="mt-2 text-xl font-semibold text-white">
          Replay Integrity Result
        </h2>
      </div>

      <div
        className={`rounded-full border px-4 py-2 text-sm font-semibold ${
          replayResult.integrity_preserved
            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
            : "border-red-400/20 bg-red-400/10 text-red-400"
        }`}
      >
        {replayResult.integrity_preserved
          ? "✓ VERIFIED"
          : "✕ INTEGRITY MISMATCH"}
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">
          Original SHA-256
        </div>

        <div className="break-all font-mono text-sm text-slate-300">
          {replayResult.original_sha256}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">
          Replayed SHA-256
        </div>

        <div className="break-all font-mono text-sm text-slate-300">
          {replayResult.replayed_sha256}
        </div>
      </div>
    </div>

    <div
  className={`mt-5 rounded-xl border p-5 text-center ${
    replayResult.integrity_preserved
      ? "border-emerald-400/20 bg-emerald-400/5"
      : "border-red-400/20 bg-red-400/5"
  }`}
>
  <div
    className={`text-3xl font-bold ${
      replayResult.integrity_preserved
        ? "text-emerald-400"
        : "text-red-400"
    }`}
  >
    {replayResult.integrity_preserved
      ? "✓ SHA-256 MATCH"
      : "✕ SHA-256 MISMATCH"}
  </div>

  <p className="mt-2 text-sm text-slate-400">
    {replayResult.integrity_preserved
      ? "Original evidence and replayed evidence are byte-for-byte identical."
      : "The replayed evidence does not match the original SHA-256 fingerprint."}
  </p>

  <div
    className={`mt-3 text-xs font-medium uppercase tracking-[0.2em] ${
      replayResult.integrity_preserved
        ? "text-emerald-400"
        : "text-red-400"
    }`}
  >
    {replayResult.integrity_preserved
      ? "Evidence Integrity Preserved"
      : "Evidence Integrity Requires Investigation"}
  </div>
</div>
  </section>
)}
  {/* Replay Before / After Comparison */}
{replayResult?.comparison && (
  <section className="mt-6 rounded-2xl border border-white/10 bg-[#0b1118] p-6">

    <div className="mb-6 flex items-center justify-between">
      <div>
        <div className="text-xs font-semibold tracking-[0.25em] text-cyan-400">
          05 · FORENSIC COMPARISON
        </div>

        <h2 className="mt-2 text-xl font-semibold text-white">
          Before / After Replay Diff
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Compare the persisted normalized event with the replayed result.
        </p>
      </div>

      <GitCompare
        size={22}
        className="text-cyan-300"
      />
    </div>

    {/* Summary */}
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

      <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          Changed
        </p>

        <p className="mt-2 text-2xl font-bold text-amber-300">
          {replayResult.comparison.summary?.changed ?? 0}
        </p>
      </div>

      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          Added
        </p>

        <p className="mt-2 text-2xl font-bold text-emerald-300">
          {replayResult.comparison.summary?.added ?? 0}
        </p>
      </div>

      <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          Removed
        </p>

        <p className="mt-2 text-2xl font-bold text-red-300">
          {replayResult.comparison.summary?.removed ?? 0}
        </p>
      </div>

      <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          Unchanged
        </p>

        <p className="mt-2 text-2xl font-bold text-cyan-300">
          {replayResult.comparison.summary?.unchanged ?? 0}
        </p>
      </div>

    </div>

    {/* Changed Fields */}
    {replayResult.comparison.changed?.length > 0 && (
      <div className="mt-6">

        <div className="mb-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-400" />

          <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-300">
            Changed Fields
          </h3>
        </div>

        <div className="space-y-3">

          {replayResult.comparison.changed.map(
            (item, index) => (
              <div
                key={`changed-${index}`}
                className="rounded-xl border border-amber-400/15 bg-amber-400/[0.035] p-4"
              >

                <p className="font-mono text-sm font-semibold text-white">
                  {item.field}
                </p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">

                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Before
                    </p>

                    <p className="mt-2 break-all font-mono text-sm text-slate-300">
                      {item.before === null ||
                      item.before === undefined
                        ? "—"
                        : String(item.before)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-amber-400/10 bg-amber-400/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-amber-400">
                      After
                    </p>

                    <p className="mt-2 break-all font-mono text-sm text-amber-200">
                      {item.after === null ||
                      item.after === undefined
                        ? "—"
                        : String(item.after)}
                    </p>
                  </div>

                </div>
              </div>
            )
          )}

        </div>
      </div>
    )}

    {/* Added Fields */}
    {replayResult.comparison.added?.length > 0 && (
      <div className="mt-6">

        <div className="mb-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />

          <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
            Added Fields
          </h3>
        </div>

        <div className="space-y-3">

          {replayResult.comparison.added.map(
            (item, index) => (
              <div
                key={`added-${index}`}
                className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.035] p-4"
              >

                <p className="font-mono text-sm font-semibold text-white">
                  {item.field}
                </p>

                <div className="mt-3 rounded-lg border border-emerald-400/10 bg-emerald-400/5 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-400">
                    New Value
                  </p>

                  <p className="mt-2 break-all font-mono text-sm text-emerald-200">
                    {item.after === null ||
                    item.after === undefined
                      ? "—"
                      : String(item.after)}
                  </p>
                </div>

              </div>
            )
          )}

        </div>
      </div>
    )}

    {/* Removed Fields */}
    {replayResult.comparison.removed?.length > 0 && (
      <div className="mt-6">

        <div className="mb-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-400" />

          <h3 className="text-sm font-semibold uppercase tracking-wider text-red-300">
            Removed Fields
          </h3>
        </div>

        <div className="space-y-3">

          {replayResult.comparison.removed.map(
            (item, index) => (
              <div
                key={`removed-${index}`}
                className="rounded-xl border border-red-400/15 bg-red-400/[0.035] p-4"
              >

                <p className="font-mono text-sm font-semibold text-white">
                  {item.field}
                </p>

                <div className="mt-3 rounded-lg border border-red-400/10 bg-red-400/5 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-red-400">
                    Previous Value
                  </p>

                  <p className="mt-2 break-all font-mono text-sm text-red-200">
                    {item.before === null ||
                    item.before === undefined
                      ? "—"
                      : String(item.before)}
                  </p>
                </div>

              </div>
            )
          )}

        </div>
      </div>
    )}

    {/* Unchanged Fields */}
    {replayResult.comparison.unchanged?.length > 0 && (
      <div className="mt-6">

        <div className="mb-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-cyan-400" />

          <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
            Unchanged Fields
          </h3>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10">

          {replayResult.comparison.unchanged.map(
            (item, index) => (
              <div
                key={`unchanged-${index}`}
                className="flex flex-col gap-2 border-b border-white/10 bg-black/10 px-4 py-3 last:border-b-0 md:flex-row md:items-center md:justify-between"
              >

                <span className="font-mono text-xs text-slate-400">
                  {item.field}
                </span>

                <span className="break-all font-mono text-xs text-slate-500">
                  {item.value === null ||
                  item.value === undefined
                    ? "—"
                    : String(item.value)}
                </span>

              </div>
            )
          )}

        </div>
      </div>
    )}

    {/* No Changes */}
    {replayResult.comparison.summary &&
      replayResult.comparison.summary.changed === 0 &&
      replayResult.comparison.summary.added === 0 &&
      replayResult.comparison.summary.removed === 0 && (
        <div className="mt-6 rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-5 text-center">
          <CheckCircle2
            size={24}
            className="mx-auto text-emerald-400"
          />

          <p className="mt-3 font-semibold text-emerald-300">
            No normalized field changes detected
          </p>

          <p className="mt-1 text-sm text-slate-500">
            The replay produced the same normalized representation.
          </p>
        </div>
      )}

  </section>
)}

            </div>

          ) : (

            <div className="mt-5 rounded-xl border border-dashed border-white/10 p-12 text-center">

              <GitCompare
                size={30}
                className="mx-auto text-slate-600"
              />

              <p className="mt-4 font-semibold text-slate-300">
                Select an event
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Choose preserved evidence to begin replay.
              </p>

            </div>

          )}

        </section>

      </div>


      {/* Replay history */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

        <div className="flex items-center justify-between">

          <div>
            <SectionLabel>03 · Provenance</SectionLabel>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Replay History
            </h2>
          </div>

          <History
            size={21}
            className="text-cyan-300"
          />

        </div>


        {history.length === 0 ? (

          <div className="mt-5 rounded-xl border border-dashed border-white/10 p-10 text-center">

            <Clock3
              size={28}
              className="mx-auto text-slate-600"
            />

            <p className="mt-4 font-semibold text-slate-300">
              No replay operations yet
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Replay history will appear here after evidence is reprocessed.
            </p>

          </div>

        ) : (

          <div className="mt-5 overflow-hidden rounded-xl border border-white/10">

            {history.map((item, index) => {

              const success =
                item.status === "processed" ||
                item.status === "success" ||
                item.result?.status === "processed";

              return (
                <div
                  key={item.id || item.replay_id || index}
                  className="border-b border-white/10 p-4 last:border-b-0"
                >

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div>

                      <div className="flex flex-wrap items-center gap-3">

                        <StatusBadge success={success} />

                        <span className="font-mono text-xs text-slate-500">
                          {item.replay_id ||
                            item.id ||
                            "replay"}
                        </span>

                      </div>

                      <p className="mt-3 text-sm text-slate-300">
                        {item.parser_id ||
                          item.parser?.id ||
                          selectedParser}
                      </p>

                    </div>


                    <div className="text-left lg:text-right">

                      <p className="font-mono text-xs text-slate-500">
                        {item.parser_version ||
                          item.parser?.version ||
                          selectedParserVersion}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        {item.timestamp ||
                          item.created_at ||
                          "Recorded replay"}
                      </p>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        )}

      </section>

    </div>
  );
}