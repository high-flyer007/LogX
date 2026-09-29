import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Database,
  RefreshCw,
  Search,
  ShieldAlert,
  Fingerprint,
  Clock3,
  FileWarning,
  Eye,
} from "lucide-react";

import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

function formatDate(value) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function shortenHash(hash) {
  if (!hash) return "Not available";

  if (hash.length <= 24) {
    return hash;
  }

  return `${hash.slice(0, 12)}...${hash.slice(-12)}`;
}

export default function Quarantine() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  async function loadQuarantine() {
    try {
      setLoading(true);
      setError("");

      const response = await api.quarantine();

      setRecords(response.events || []);
    } catch (err) {
      console.error("Failed to load quarantine:", err);
      setError(err.message || "Unable to load quarantine records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuarantine();
  }, []);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return records;
    }

    return records.filter((record) =>
      JSON.stringify(record).toLowerCase().includes(query)
    );
  }, [records, search]);

  return (
    <div className="space-y-8">

      {/* Header */}
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-400">
            <ShieldAlert size={16} />
            Evidence Isolation
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Quarantine
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400">
            Review unknown or malformed telemetry that could not safely pass
            through the deterministic LogX processing pipeline.
          </p>
        </div>

        <button
          onClick={loadQuarantine}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-5 py-3 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>

      </section>


      {/* Metrics */}
      <section className="grid gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">
                Quarantined Events
              </p>

              <p className="mt-3 text-3xl font-semibold text-white">
                {records.length}
              </p>
            </div>

            <div className="rounded-xl border border-amber-400/10 bg-amber-400/5 p-3">
              <AlertTriangle
                size={22}
                className="text-amber-300"
              />
            </div>
          </div>
        </div>


        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">
                Preserved Evidence
              </p>

              <p className="mt-3 text-3xl font-semibold text-emerald-300">
                100%
              </p>
            </div>

            <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-3">
              <Database
                size={22}
                className="text-emerald-300"
              />
            </div>
          </div>
        </div>


        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">
                Review Status
              </p>

              <p className="mt-3 text-3xl font-semibold text-cyan-300">
                READY
              </p>
            </div>

            <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-3">
              <Eye
                size={22}
                className="text-cyan-300"
              />
            </div>
          </div>
        </div>

      </section>


      {/* Main workspace */}
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">


        {/* Event list */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.035]">

          <div className="border-b border-white/10 p-5">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                  Isolated telemetry
                </p>

                <h2 className="mt-2 text-xl font-semibold text-white">
                  Quarantine Queue
                </h2>
              </div>


              <div className="relative w-full md:w-72">

                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search quarantine..."
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/40"
                />

              </div>

            </div>

          </div>


          {error && (
            <div className="m-5 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
              {error}
            </div>
          )}


          <div className="divide-y divide-white/5">

            {!loading && filteredRecords.length === 0 && (
              <div className="p-12 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/5">
                  <ShieldAlert
                    size={24}
                    className="text-emerald-300"
                  />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-white">
                  Quarantine is clear
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  No isolated telemetry matches the current filter.
                </p>

              </div>
            )}


            {loading && (
              <div className="p-12 text-center text-sm text-slate-500">
                Loading quarantine records...
              </div>
            )}


            {!loading &&
              filteredRecords.map((record, index) => {

                const eventId =
                  record.event_id ||
                  record.id ||
                  `quarantine-${index}`;

                const reason =
                  record.reason ||
                  record.error ||
                  record.status ||
                  "Processing failure";

                const rawHash =
                  record.raw_sha256 ||
                  record.sha256 ||
                  record.raw_hash;

                return (
                  <button
                    key={eventId}
                    onClick={() => setSelected(record)}
                    className={`w-full text-left transition hover:bg-cyan-400/[0.035] ${
                      selected === record
                        ? "bg-cyan-400/[0.05]"
                        : ""
                    }`}
                  >

                    <div className="p-5">

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-full border border-amber-400/20 bg-amber-400/5 px-2.5 py-1 text-xs font-medium text-amber-300">
                              QUARANTINED
                            </span>

                            <span className="rounded-md border border-white/10 px-2 py-1 font-mono text-[11px] text-slate-500">
                              {String(eventId).slice(0, 18)}
                            </span>

                          </div>

                          <p className="mt-3 font-medium text-white">
                            {reason}
                          </p>

                          <p className="mt-1 truncate font-mono text-xs text-slate-500">
                            {rawHash
                              ? shortenHash(rawHash)
                              : "SHA-256 unavailable"}
                          </p>

                        </div>

                        <Eye
                          size={18}
                          className="mt-1 shrink-0 text-slate-600"
                        />

                      </div>

                    </div>

                  </button>
                );
              })}

          </div>

        </div>


        {/* Evidence panel */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.035]">

          {!selected ? (

            <div className="flex min-h-[520px] items-center justify-center p-8 text-center">

              <div>

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/5">
                  <FileWarning
                    size={27}
                    className="text-cyan-300"
                  />
                </div>

                <p className="mt-5 text-lg font-semibold text-white">
                  Select an event
                </p>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Select a quarantined event to inspect its preserved raw
                  evidence, failure reason, and integrity fingerprint.
                </p>

              </div>

            </div>

          ) : (

            <div>

              <div className="border-b border-white/10 p-5">

                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
                  <Fingerprint size={15} />
                  Evidence Detail
                </div>

                <h2 className="mt-2 text-xl font-semibold text-white">
                  Quarantined Event
                </h2>

              </div>


              <div className="space-y-5 p-5">

                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    Event ID
                  </p>

                  <p className="mt-2 break-all font-mono text-sm text-slate-300">
                    {selected.event_id ||
                      selected.id ||
                      "Unavailable"}
                  </p>
                </div>


                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    Reason
                  </p>

                  <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-6 text-amber-200">
                    {selected.reason ||
                      selected.error ||
                      "Processing failure"}
                  </div>
                </div>


                <div className="grid gap-4 sm:grid-cols-2">

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500">
                      <Fingerprint size={14} />
                      SHA-256
                    </div>

                    <p className="mt-2 break-all font-mono text-xs text-slate-300">
                      {selected.raw_sha256 ||
                        selected.sha256 ||
                        selected.raw_hash ||
                        "Unavailable"}
                    </p>
                  </div>


                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500">
                      <Clock3 size={14} />
                      Received
                    </div>

                    <p className="mt-2 text-sm text-slate-300">
                      {formatDate(
                        selected.created_at ||
                        selected.received_at ||
                        selected.timestamp
                      )}
                    </p>
                  </div>

                </div>


                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    Preserved Raw Evidence
                  </p>

                  <pre className="mt-2 max-h-80 overflow-auto rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-xs leading-6 text-slate-300">
                    {selected.raw_data ||
                      selected.raw ||
                      selected.raw_message ||
                      JSON.stringify(selected, null, 2)}
                  </pre>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => {
                      if (!selected?.raw_data) return;

                      navigate(
                        `/parser-studio?raw=${encodeURIComponent(
                          selected.raw_data
                        )}`
                      );
                    }}
                    disabled={!selected?.raw_data}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Analyze in Parser Studio
                  </button>
                </div>
                {/* Parser Analyzer Intelligence */}
{selected.analysis && (
  <div className="rounded-2xl border border-purple-400/15 bg-purple-400/[0.035] p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
          <ShieldAlert size={15} />
          Parser Analyzer
        </div>

        <h3 className="mt-2 text-lg font-semibold text-white">
          Unknown Telemetry Intelligence
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Deterministic analysis performed before quarantine.
        </p>
      </div>

      <div className="rounded-xl border border-purple-400/20 bg-purple-400/10 px-3 py-2 text-center">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">
          Confidence
        </p>
        <p className="mt-1 text-lg font-semibold text-purple-300">
          {Math.round((selected.analysis.confidence || 0) * 100)}%
        </p>
      </div>
    </div>

    {/* Detection summary */}
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">
          Detected Format
        </p>
        <p className="mt-1 font-mono text-sm text-cyan-300">
          {selected.analysis.format || "unknown"}
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">
          Detected Source
        </p>
        <p className="mt-1 font-mono text-sm text-amber-300">
          {selected.analysis.source || "unknown"}
        </p>
      </div>
    </div>

    {/* Patterns */}
    {selected.analysis.patterns?.length > 0 && (
      <div className="mt-5">
        <p className="text-xs uppercase tracking-widest text-slate-500">
          Detected Patterns
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {selected.analysis.patterns.map((pattern) => (
            <span
              key={pattern}
              className="rounded-full border border-purple-400/20 bg-purple-400/5 px-3 py-1.5 text-xs text-purple-200"
            >
              {pattern.replaceAll("_", " ")}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Field candidates */}
    {selected.analysis.field_candidates?.length > 0 && (
      <div className="mt-5">
        <p className="text-xs uppercase tracking-widest text-slate-500">
          Field Mapping Candidates
        </p>

        <div className="mt-2 overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-[1fr_auto_1fr] bg-white/[0.025] px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500">
            <span>Source Field</span>
            <span></span>
            <span>Candidate</span>
          </div>

          <div className="divide-y divide-white/5">
            {selected.analysis.field_candidates.map((field, index) => (
              <div
                key={`${field.source_field}-${index}`}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-2.5"
              >
                <span className="truncate font-mono text-xs text-slate-300">
                  {field.source_field}
                </span>

                <span className="text-slate-600">→</span>

                <span
                  className={
                    field.candidate === "unmapped"
                      ? "truncate font-mono text-xs text-slate-600"
                      : "truncate font-mono text-xs text-emerald-300"
                  }
                >
                  {field.candidate}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Parser hints */}
    {selected.analysis.parser_hints?.length > 0 && (
      <div className="mt-5">
        <p className="text-xs uppercase tracking-widest text-slate-500">
          Parser Hints
        </p>

        <div className="mt-2 space-y-2">
          {selected.analysis.parser_hints.map((hint, index) => (
            <div
              key={index}
              className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.035] p-3 text-xs leading-5 text-cyan-200"
            >
              {hint}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}
                <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.035] p-4">

                  <div className="flex items-start gap-3">

                    <ShieldAlert
                      size={18}
                      className="mt-0.5 shrink-0 text-cyan-300"
                    />

                    <div>
                      <p className="text-sm font-medium text-cyan-200">
                        Evidence preserved
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        The quarantined event remains available for
                        deterministic parser review and replay without
                        modifying the original raw evidence.
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            </div>

          )}

        </div>

      </section>

    </div>
  );
}