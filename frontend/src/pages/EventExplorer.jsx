import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Database,
  Clock3,
  Network,
  Fingerprint,
  ChevronRight,
  X,
  FileSearch,
} from "lucide-react";

// import { api } from "../api";
import { api } from "../services/api";

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function getEventData(event) {
  return event?.data || {};
}

function getEventAction(event) {
  return getEventData(event)?.event?.action || "—";
}

function getSourceIp(event) {
  return getEventData(event)?.source?.ip || "—";
}

function getDestinationIp(event) {
  return getEventData(event)?.destination?.ip || "—";
}

function getDestinationPort(event) {
  return getEventData(event)?.destination?.port || "—";
}

function getProtocol(event) {
  return getEventData(event)?.network?.protocol || "—";
}

function getParser(event) {
  return getEventData(event)?.parser?.id || "—";
}

function getValidationStatus(event) {
  return (
    getEventData(event)?.validation?.status ||
    getEventData(event)?.quality?.status ||
    "unknown"
  );
}

function StatusBadge({ status }) {
  const valid =
    status === "valid" ||
    status === "processed";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        valid
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : "border-amber-400/20 bg-amber-400/10 text-amber-300",
      ].join(" ")}
    >
      {valid ? (
        <ShieldCheck size={13} />
      ) : (
        <AlertTriangle size={13} />
      )}
      {status}
    </span>
  );
}

function InfoCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
        {Icon && <Icon size={14} className="text-cyan-300" />}
        {label}
      </div>

      <div className="mt-2 break-all text-sm font-medium text-slate-100">
        {value}
      </div>
    </div>
  );
}

function LineageRow({ item }) {
  return (
    <div className="grid gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-4 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-500">
          Target
        </div>
        <div className="mt-1 font-mono text-sm text-cyan-300">
          {item.target_field || "—"}
        </div>
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-500">
          Source
        </div>
        <div className="mt-1 font-mono text-sm text-slate-200">
          {item.source_field || "—"}
        </div>
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-500">
          Original
        </div>
        <div className="mt-1 break-all font-mono text-sm text-slate-300">
          {String(item.original_value ?? "—")}
        </div>
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-500">
          Confidence
        </div>
        <div className="mt-1 font-mono text-sm text-emerald-300">
          {typeof item.confidence === "number"
            ? `${Math.round(item.confidence * 100)}%`
            : "—"}
        </div>
      </div>
    </div>
  );
}

function EventDetails({ event, onClose, onInvestigate }) {
  if (!event) return null;

  const data = getEventData(event);

  const lineage = Array.isArray(data.lineage)
    ? data.lineage
    : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-3xl flex-col border-l border-white/10 bg-[#080d12] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-cyan-300">
              <FileSearch size={15} />
              Event Details
            </div>

            <h2 className="mt-2 text-xl font-semibold text-white">
              {event.source || "Unknown Source"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-400 transition hover:border-white/20 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Identity */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Event Identity
              </h3>

              <StatusBadge status={event.status} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <InfoCard
                label="Event ID"
                value={event.event_id}
                icon={Fingerprint}
              />

              <InfoCard
                label="Ingest ID"
                value={event.ingest_id}
                icon={Database}
              />

              <InfoCard
                label="Created"
                value={formatDate(event.created_at)}
                icon={Clock3}
              />

              <InfoCard
                label="Format"
                value={event.format}
                icon={FileSearch}
              />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onInvestigate}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                <Search size={16} />
                Open Forensic Workbench
              </button>
            </div>
          </section>

          {/* Network */}
          <section className="mt-8">
            <h3 className="mb-3 text-sm font-semibold text-white">
              Network Context
            </h3>

            <div className="grid gap-3 md:grid-cols-2">
              <InfoCard
                label="Source"
                value={`${getSourceIp(event)}:${data?.source?.port || "—"}`}
                icon={Network}
              />

              <InfoCard
                label="Destination"
                value={`${getDestinationIp(event)}:${getDestinationPort(event)}`}
                icon={Network}
              />

              <InfoCard
                label="Protocol"
                value={getProtocol(event)}
              />

              <InfoCard
                label="Action"
                value={getEventAction(event)}
              />
            </div>
          </section>

          {/* Parser */}
          <section className="mt-8">
            <h3 className="mb-3 text-sm font-semibold text-white">
              Processing
            </h3>

            <div className="grid gap-3 md:grid-cols-2">
              <InfoCard
                label="Parser"
                value={getParser(event)}
              />

              <InfoCard
                label="Parser Version"
                value={data?.parser?.version || "—"}
              />

              <InfoCard
                label="Validation"
                value={getValidationStatus(event)}
              />

              <InfoCard
                label="Pipeline Version"
                value={data?.provenance?.pipeline_version || "—"}
              />
            </div>
          </section>

          {/* Raw evidence */}
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Raw Evidence
              </h3>

              <span className="rounded-full border border-cyan-400/15 bg-cyan-400/5 px-2.5 py-1 text-xs text-cyan-300">
                PRESERVED
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-6 text-slate-300">
                {data?.raw?.data || "No raw evidence available."}
              </pre>
            </div>

            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">
                SHA-256
              </div>

              <div className="mt-2 break-all font-mono text-xs text-cyan-300">
                {event.sha256 || data?.raw?.sha256 || "—"}
              </div>
            </div>
          </section>

          {/* Lineage */}
          <section className="mt-8 pb-8">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Field Lineage
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Trace normalized fields back to their raw source.
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400">
                {lineage.length} mappings
              </span>
            </div>

            <div className="space-y-3">
              {lineage.length > 0 ? (
                lineage.map((item, index) => (
                  <LineageRow
                    key={`${item.target_field}-${index}`}
                    item={item}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-white/10 p-5 text-sm text-slate-500">
                  No lineage information available.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function EventExplorer() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");

      const response = await api.events(100);

      setEvents(
        Array.isArray(response?.events)
          ? response.events
          : []
      );
    } catch (err) {
      console.error("Event Explorer loading failed:", err);
      setError(err.message || "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const sources = useMemo(
    () => [
      ...new Set(
        events
          .map((event) => event.source)
          .filter(Boolean)
      ),
    ],
    [events]
  );

  const formats = useMemo(
    () => [
      ...new Set(
        events
          .map((event) => event.format)
          .filter(Boolean)
      ),
    ],
    [events]
  );

  const statuses = useMemo(
    () => [
      ...new Set(
        events
          .map((event) => event.status)
          .filter(Boolean)
      ),
    ],
    [events]
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const data = getEventData(event);

      const searchable = [
        event.event_id,
        event.ingest_id,
        event.source,
        event.format,
        event.status,
        getEventAction(event),
        getSourceIp(event),
        getDestinationIp(event),
        getDestinationPort(event),
        getProtocol(event),
        getParser(event),
        data?.device?.name,
        data?.device?.product,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchable.includes(query);

      const matchesSource =
        sourceFilter === "all" ||
        event.source === sourceFilter;

      const matchesFormat =
        formatFilter === "all" ||
        event.format === formatFilter;

      const matchesStatus =
        statusFilter === "all" ||
        event.status === statusFilter;

      return (
        matchesSearch &&
        matchesSource &&
        matchesFormat &&
        matchesStatus
      );
    });
  }, [
    events,
    search,
    sourceFilter,
    formatFilter,
    statusFilter,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-cyan-300">
            <Database size={15} />
            Telemetry
          </div>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Event Explorer
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Search, inspect, and investigate normalized security
            telemetry while preserving the original evidence.
          </p>
        </div>

        <button
          onClick={loadEvents}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/10 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search IP, event ID, parser, action..."
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/30"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-11 rounded-xl border border-white/10 bg-[#0b1117] px-3 text-sm text-slate-300 outline-none focus:border-cyan-400/30"
          >
            <option value="all">All sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>

          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="h-11 rounded-xl border border-white/10 bg-[#0b1117] px-3 text-sm text-slate-300 outline-none focus:border-cyan-400/30"
          >
            <option value="all">All formats</option>
            {formats.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 rounded-xl border border-white/10 bg-[#0b1117] px-3 text-sm text-slate-300 outline-none focus:border-cyan-400/30"
          >
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle size={17} />
            Event API unavailable
          </div>

          <div className="mt-1 text-xs text-red-300/70">
            {error}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-semibold text-white">
            {filteredEvents.length}
          </span>

          <span className="ml-2 text-sm text-slate-500">
            events
          </span>
        </div>

        <div className="text-xs text-slate-500">
          Showing up to 100 recent events
        </div>
      </div>

      {/* Events */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
            <RefreshCw
              size={18}
              className="mr-2 animate-spin"
            />
            Loading telemetry...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <Database
              size={30}
              className="text-slate-600"
            />

            <h3 className="mt-4 text-sm font-medium text-slate-300">
              No events found
            </h3>

            <p className="mt-1 max-w-md text-xs text-slate-600">
              Process telemetry through Live Ingest or change
              the current filters.
            </p>
          </div>
        ) : (
          <div>
            {filteredEvents.map((event) => (
              <button
                key={event.event_id}
                onClick={() => setSelectedEvent(event)}
                className="group flex w-full items-center gap-5 border-b border-white/7 px-5 py-4 text-left transition last:border-b-0 hover:bg-cyan-400/[0.025]"
              >
                {/* Status */}
                <div className="hidden w-20 shrink-0 md:block">
                  <StatusBadge status={event.status} />
                </div>

                {/* Main */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-white">
                      {event.source || "Unknown"}
                    </span>

                    <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[11px] text-slate-500">
                      {event.format || "unknown"}
                    </span>

                    <span className="rounded-md border border-cyan-400/10 bg-cyan-400/5 px-2 py-0.5 text-[11px] text-cyan-300">
                      {getEventAction(event)}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="font-mono text-slate-400">
                      {getSourceIp(event)}
                    </span>

                    <span>→</span>

                    <span className="font-mono text-slate-400">
                      {getDestinationIp(event)}:
                      {getDestinationPort(event)}
                    </span>

                    <span>•</span>

                    <span>
                      {getProtocol(event).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Parser/time */}
                <div className="hidden text-right lg:block">
                  <div className="font-mono text-xs text-slate-500">
                    {getParser(event)}
                  </div>

                  <div className="mt-1 text-[11px] text-slate-600">
                    {formatDate(event.created_at)}
                  </div>
                </div>

                <ChevronRight
                  size={18}
                  className="shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onInvestigate={() => {
            const eventId =
              selectedEvent.event_id ||
              selectedEvent.id;

            if (!eventId) return;

            navigate(
              `/forensics?event=${encodeURIComponent(
                eventId
              )}`
            );
          }}
        />
      )}
    </div>
  );
}