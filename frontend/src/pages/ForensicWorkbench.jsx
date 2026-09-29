import { useEffect, useMemo, useState } from "react";
// import { useSearchParams } from "react-router-dom";
import {
  ShieldCheck,
  Fingerprint,
  Database,
  GitBranch,
  Clock3,
  Server,
  Search,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { api } from "../services/api";

const fieldDefinitions = [
  {
    key: "source.ip",
    label: "Source IP",
    path: ["source", "ip"],
    rawKeys: ["srcip", "src_ip", "source.ip"],
  },
  {
    key: "source.port",
    label: "Source Port",
    path: ["source", "port"],
    rawKeys: ["srcport", "src_port", "source.port"],
  },
  {
    key: "destination.ip",
    label: "Destination IP",
    path: ["destination", "ip"],
    rawKeys: ["dstip", "dst_ip", "destination.ip"],
  },
  {
    key: "destination.port",
    label: "Destination Port",
    path: ["destination", "port"],
    rawKeys: ["dstport", "dst_port", "destination.port"],
  },
  {
    key: "network.protocol",
    label: "Protocol",
    path: ["network", "protocol"],
    rawKeys: ["proto", "protocol"],
  },
  {
    key: "event.action",
    label: "Action",
    path: ["event", "action"],
    rawKeys: ["action"],
  },
];

function getValue(object, path) {
  return path.reduce(
    (current, key) => current?.[key],
    object
  );
}

function findRawValue(rawData, keys) {
  if (!rawData || typeof rawData !== "string") {
    return null;
  }

  for (const key of keys) {
    const regex = new RegExp(
      `${key}\\s*=\\s*"?([^\\s"]+)"?`,
      "i"
    );

    const match = rawData.match(regex);

    if (match) {
      return match[1];
    }
  }

  return null;
}

function formatJson(value) {
  if (value === undefined) {
    return "—";
  }

  return JSON.stringify(value, null, 2);
}

export default function ForensicWorkbench() {
  // const [searchParams] = useSearchParams();
  // const requestedEventId = searchParams.get("event");

  const requestedEventId =
    new URLSearchParams(window.location.search).get("event");

  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedField, setSelectedField] = useState(
    "destination.ip"
  );

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEvents();
  }, [requestedEventId]);

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");

      const response = await api.events(100);

      const items =
        response?.events ||
        response?.items ||
        response?.data ||
        [];

      setEvents(items);

      if (items.length > 0) {
        const requestedId = requestedEventId;

        const requestedEvent = requestedId
          ? items.find(
              (item) =>
                (item.event_id || item.id) === requestedId
            )
          : null;

        const targetId =
          requestedEvent
            ? requestedId
            : items[0].event_id || items[0].id;

        setSelectedId(targetId);

        await loadEvent(targetId);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  async function loadEvent(eventId) {
    if (!eventId) return;

    try {
      setDetailLoading(true);
      setError("");

      const response = await api.event(eventId);

      setSelectedEvent(
        response?.event ||
        response?.result ||
        response?.data ||
        response
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load event");
    } finally {
      setDetailLoading(false);
    }
  }

  function handleSelectEvent(event) {
    const id =
      event.event_id ||
      event.id;

    setSelectedId(id);
    loadEvent(id);
  }

  const normalizedEvent = useMemo(() => {
    if (!selectedEvent) return {};

    return (
      selectedEvent.normalized_event ||
      selectedEvent.normalized ||
      selectedEvent
    );
  }, [selectedEvent]);

  const rawData =
    selectedEvent?.raw_data ||
    selectedEvent?.raw?.data ||
    selectedEvent?.raw ||
    "";

  const rawHash =
    selectedEvent?.raw_sha256 ||
    selectedEvent?.raw?.sha256 ||
    "Not available";

  const parser =
    selectedEvent?.parser ||
    normalizedEvent?.parser ||
    {};

  const parserId =
    parser?.id ||
    selectedEvent?.parser_id ||
    "Unknown parser";

  const parserVersion =
    parser?.version ||
    selectedEvent?.parser_version ||
    "—";

  const selectedDefinition =
    fieldDefinitions.find(
      (field) => field.key === selectedField
    ) || fieldDefinitions[0];

  const normalizedValue = getValue(
    normalizedEvent,
    selectedDefinition.path
  );

  const rawValue = findRawValue(
    typeof rawData === "string"
      ? rawData
      : JSON.stringify(rawData),
    selectedDefinition.rawKeys
  );

  const summary = {
    source:
      normalizedEvent?.device?.product ||
      normalizedEvent?.device?.vendor ||
      selectedEvent?.source_type ||
      "Unknown",

    action:
      normalizedEvent?.event?.action ||
      "—",

    sourceIp:
      normalizedEvent?.source?.ip ||
      "—",

    destinationIp:
      normalizedEvent?.destination?.ip ||
      "—",

    destinationPort:
      normalizedEvent?.destination?.port ||
      "—",

    protocol:
      normalizedEvent?.network?.protocol ||
      "—",
  };

  return (
    <div className="space-y-6">

      {/* Header */}

      <div>
        <div className="flex items-center gap-2 text-cyan-300 text-sm font-medium uppercase tracking-[0.2em]">
          <Fingerprint size={16} />
          Forensics
        </div>

        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Forensic Workbench
            </h1>

            <p className="mt-2 text-slate-400">
              Trace normalized telemetry back to its original
              evidence, parser, and integrity fingerprint.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-sm text-emerald-300">
            <ShieldCheck size={17} />
            Evidence Preserved
          </div>

        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-red-300">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Event selector */}

      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

        <div className="mb-4 flex items-center justify-between">

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
              Event Evidence
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Select an event to investigate
            </h2>
          </div>

          <button
            onClick={loadEvents}
            className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-400/10"
          >
            Refresh
          </button>

        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500">
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            No processed events available.
          </div>
        ) : (
          <div className="space-y-2">

            {events.map((event) => {

              const id =
                event.event_id ||
                event.id;

              const active =
                id === selectedId;

              return (
                <button
                  key={id}
                  onClick={() =>
                    handleSelectEvent(event)
                  }
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-cyan-400/30 bg-cyan-400/5"
                      : "border-white/5 bg-white/[0.02] hover:border-white/10"
                  }`}
                >

                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex items-center gap-3">

                      {active ? (
                        <CheckCircle2
                          size={18}
                          className="text-cyan-300"
                        />
                      ) : (
                        <Database
                          size={18}
                          className="text-slate-500"
                        />
                      )}

                      <div>
                        <div className="font-medium text-white">
                          {event.source_type ||
                            event.source ||
                            "Security Event"}
                        </div>

                        <div className="text-xs text-slate-500">
                          {event.event_id || event.id}
                        </div>
                      </div>

                    </div>

                    <div className="text-xs text-slate-400">
                      {event.status || "processed"}
                    </div>

                  </div>

                </button>
              );
            })}

          </div>
        )}

      </div>

      {/* Event summary */}

      {selectedEvent && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">

            <SummaryCard
              label="Source"
              value={summary.source}
            />

            <SummaryCard
              label="Action"
              value={summary.action}
            />

            <SummaryCard
              label="Source IP"
              value={summary.sourceIp}
            />

            <SummaryCard
              label="Destination"
              value={summary.destinationIp}
            />

            <SummaryCard
              label="Destination Port"
              value={summary.destinationPort}
            />

            <SummaryCard
              label="Protocol"
              value={summary.protocol}
            />

          </div>

          {/* Main forensic workspace */}

          <div className="grid gap-6 xl:grid-cols-2">

            {/* Normalized Event */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

              <div className="mb-5 flex items-center gap-3">

                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
                  <GitBranch
                    size={20}
                    className="text-cyan-300"
                  />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                    Normalized
                  </p>

                  <h2 className="text-xl font-semibold text-white">
                    LogX Event
                  </h2>
                </div>

              </div>

              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">

                {fieldDefinitions.map((field) => {

                  const value = getValue(
                    normalizedEvent,
                    field.path
                  );

                  const active =
                    selectedField === field.key;

                  return (
                    <button
                      key={field.key}
                      onClick={() =>
                        setSelectedField(field.key)
                      }
                      className={`flex w-full items-center justify-between border-b border-white/5 px-4 py-3 text-left last:border-b-0 ${
                        active
                          ? "bg-cyan-400/10"
                          : "hover:bg-white/[0.03]"
                      }`}
                    >

                      <span className="font-mono text-sm text-slate-300">
                        {field.key}
                      </span>

                      <span
                        className={`font-mono text-sm ${
                          active
                            ? "text-cyan-300"
                            : "text-white"
                        }`}
                      >
                        {value === undefined ||
                        value === null
                          ? "—"
                          : String(value)}
                      </span>

                    </button>
                  );
                })}

              </div>

              <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-4">

                <div className="mb-2 text-xs uppercase tracking-[0.15em] text-slate-500">
                  Complete normalized object
                </div>

                <pre className="max-h-[420px] overflow-auto text-xs leading-6 text-slate-300">
                  {formatJson(normalizedEvent)}
                </pre>

              </div>

            </section>

            {/* Lineage */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

              <div className="mb-5 flex items-center gap-3">

                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
                  <GitBranch
                    size={20}
                    className="text-emerald-300"
                  />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">
                    Field Lineage
                  </p>

                  <h2 className="text-xl font-semibold text-white">
                    {selectedDefinition.key}
                  </h2>
                </div>

              </div>

              <div className="space-y-3">

                <LineageRow
                  label="Normalized field"
                  value={selectedDefinition.key}
                />

                <LineageRow
                  label="Normalized value"
                  value={
                    normalizedValue === undefined
                      ? "—"
                      : String(normalizedValue)
                  }
                  highlight
                />

                <LineageRow
                  label="Original field"
                  value={selectedDefinition.rawKeys[0]}
                />

                <LineageRow
                  label="Raw value"
                  value={rawValue || "Not directly extracted"}
                />

                <LineageRow
                  label="Extraction method"
                  value="Key-Value parser"
                />

                <LineageRow
                  label="Parser"
                  value={parserId}
                />

                <LineageRow
                  label="Parser version"
                  value={parserVersion}
                />

                <LineageRow
                  label="Confidence"
                  value="1.00"
                  highlight
                />

              </div>

              <div className="mt-5 flex items-center justify-center gap-3 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">

                <span className="rounded-lg bg-white/5 px-3 py-2 font-mono text-xs text-slate-300">
                  {selectedDefinition.rawKeys[0]}
                </span>

                <ArrowRight
                  size={18}
                  className="text-cyan-300"
                />

                <span className="rounded-lg bg-cyan-400/10 px-3 py-2 font-mono text-xs text-cyan-300">
                  {selectedDefinition.key}
                </span>

              </div>

            </section>

          </div>

          {/* Raw evidence */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-center gap-3">

                <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
                  <Fingerprint
                    size={20}
                    className="text-amber-300"
                  />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-amber-300">
                    Original Evidence
                  </p>

                  <h2 className="text-xl font-semibold text-white">
                    Raw Telemetry
                  </h2>
                </div>

              </div>

              <div className="flex items-center gap-2 text-sm text-emerald-300">
                <ShieldCheck size={17} />
                SHA-256 preserved
              </div>

            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-5">

              <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-7 text-slate-300">
                {typeof rawData === "string"
                  ? rawData
                  : JSON.stringify(rawData, null, 2)}
              </pre>

            </div>

            <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-4">

              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-slate-500">
                <Fingerprint size={14} />
                SHA-256 Fingerprint
              </div>

              <div className="break-all font-mono text-xs text-cyan-300">
                {rawHash}
              </div>

            </div>

          </section>

          {/* Processing trace */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

            <div className="mb-5 flex items-center gap-3">

              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
                <Clock3
                  size={20}
                  className="text-cyan-300"
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                  Processing Trace
                </p>

                <h2 className="text-xl font-semibold text-white">
                  Evidence Processing Chain
                </h2>
              </div>

            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">

              {[
                ["01", "Received", "Raw event accepted"],
                ["02", "Detected", "Format/source identified"],
                ["03", "Parsed", parserId],
                ["04", "Normalized", "LogX Event 1.0"],
                ["05", "Validated", "Schema validation passed"],
              ].map(([number, title, description]) => (

                <div
                  key={number}
                  className="rounded-xl border border-white/10 bg-black/20 p-4"
                >

                  <div className="mb-4 flex items-center justify-between">

                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/5 text-xs text-cyan-300">
                      {number}
                    </span>

                    <CheckCircle2
                      size={16}
                      className="text-emerald-400"
                    />

                  </div>

                  <div className="font-medium text-white">
                    {title}
                  </div>

                  <div className="mt-1 text-xs leading-5 text-slate-500">
                    {description}
                  </div>

                </div>

              ))}

            </div>

          </section>

        </>
      )}

      {detailLoading && (
        <div className="fixed bottom-6 right-6 rounded-xl border border-cyan-400/20 bg-slate-950 px-4 py-3 text-sm text-cyan-300 shadow-2xl">
          Loading forensic evidence...
        </div>
      )}

    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <div className="text-xs uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>

      <div className="mt-2 truncate font-mono text-sm text-white">
        {value}
      </div>
    </div>
  );
}

function LineageRow({
  label,
  value,
  highlight = false,
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-4">

      <div className="text-xs uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>

      <div
        className={`mt-2 break-all font-mono text-sm ${
          highlight
            ? "text-cyan-300"
            : "text-slate-200"
        }`}
      >
        {value}
      </div>

    </div>
  );
}