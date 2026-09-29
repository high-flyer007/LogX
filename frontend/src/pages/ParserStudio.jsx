import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  AlertTriangle,
  Beaker,
  CheckCircle2,
  Code2,
  Database,
  FileCode2,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Wand2,
  XCircle,
} from "lucide-react";

import { api } from "../services/api";

const SAMPLE = `time=2026-09-23T11:45:00Z src=10.0.0.40 dst=172.16.0.20 sport=51234 dport=443 proto=TCP decision=deny account=ali`;

const TARGET_FIELDS = [
  "unmapped",
  "event.action",
  "source.ip",
  "source.port",
  "destination.ip",
  "destination.port",
  "network.protocol",
  "network.bytes",
  "user.name",
  "device.name",
  "device.id",
  "threat.signature",
];

function getValue(object, path) {
  return path.reduce(
    (current, key) => current?.[key],
    object
  );
}

export default function ParserStudio() {
  const [parsers, setParsers] = useState([]);
  const [selectedParser, setSelectedParser] = useState("");

  // const [rawData, setRawData] = useState(SAMPLE);

  const [analysis, setAnalysis] = useState(null);
  const [mapping, setMapping] = useState({});

  const [registeredParser, setRegisteredParser] =
    useState(null);

  const [processResult, setProcessResult] =
    useState(null);

  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] =
    useState(false);
  const [processing, setProcessing] =
    useState(false);

  const [parserLoading, setParserLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();

const [rawData, setRawData] = useState(() => {
  return searchParams.get("raw") || SAMPLE;
});

  useEffect(() => {
    loadParsers();
  }, []);

  async function loadParsers() {
    try {
      setParserLoading(true);
      setError("");

      const response = await api.parsers();

      const items =
        response?.parsers ||
        response?.data ||
        [];

      setParsers(items);

      if (
        items.length > 0 &&
        !selectedParser
      ) {
        setSelectedParser(items[0].id);
      }
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load parser registry."
      );
    } finally {
      setParserLoading(false);
    }
  }

  async function analyzeLog() {
    if (!rawData.trim()) {
      setError("Enter a raw telemetry sample.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAnalysis(null);
      setRegisteredParser(null);
      setProcessResult(null);

      const response =
        await api.analyzeParser({
          raw_data: rawData,
        });

      setAnalysis(response);

      const candidates =
        response?.analysis?.field_candidates ||
        [];

      const initialMapping = {};

      candidates.forEach((field) => {
        initialMapping[field.source_field] =
          field.candidate &&
          field.candidate !== "unmapped"
            ? field.candidate
            : "unmapped";
      });

      setMapping(initialMapping);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Parser analysis failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateMapping(sourceField, targetField) {
    setMapping((current) => ({
      ...current,
      [sourceField]: targetField,
    }));
  }

  function buildParserId() {
    const firstSource =
      analysis?.detected_source?.source;

    if (
      firstSource &&
      firstSource !== "unknown"
    ) {
      return `${firstSource}.custom`;
    }

    return "unknown.custom_parser";
  }

  async function registerParser() {
    if (!analysis) {
      setError("Analyze a log before registering.");
      return;
    }

    try {
      setRegistering(true);
      setError("");

      const activeMappings = Object.fromEntries(
        Object.entries(mapping).filter(
          ([, target]) =>
            target &&
            target !== "unmapped"
        )
      );

      const requiredFields =
        Object.keys(activeMappings);

      const parserPayload = {
        parser_id: buildParserId(),
        version: "1.0.0",
        vendor:
          analysis.detected_source?.vendor ||
          "Custom",
        product:
          analysis.detected_source?.product ||
          "Custom Source",
        supported_formats: [
          analysis.detected_format?.format ||
            "key_value",
        ],
        required_fields: requiredFields,
        field_mappings: activeMappings,
      };

      const response =
        await api.registerParser(
          parserPayload
        );

      setRegisteredParser(response);
      await loadParsers();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Parser registration failed."
      );
    } finally {
      setRegistering(false);
    }
  }

  async function processLog() {
    if (!registeredParser) {
      setError(
        "Register the parser before processing the log."
      );
      return;
    }

    try {
      setProcessing(true);
      setError("");

      const response =
        await api.processEvent(rawData);

      setProcessResult(response);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Pipeline processing failed."
      );
    } finally {
      setProcessing(false);
    }
  }

  async function testRegisteredParser() {
    if (!selectedParser) {
      setError("Select a parser first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await api.testParser({
          parser_id: selectedParser,
          detected_format:
            activeParser?.formats?.[0] ||
            "key_value",
          raw_data: rawData,
        });

      setProcessResult(response);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Parser test failed."
      );
    } finally {
      setLoading(false);
    }
  }

  const activeParser = useMemo(
    () =>
      parsers.find(
        (parser) =>
          parser.id === selectedParser
      ),
    [parsers, selectedParser]
  );

  const fieldCandidates =
    analysis?.analysis?.field_candidates ||
    [];

  const patterns =
    analysis?.analysis?.patterns ||
    [];

  const confidence =
    analysis?.analysis?.confidence ?? 0;

  const processedEvent =
    processResult?.result ||
    processResult;

  return (
    <div className="space-y-6">

      {/* Header */}

      <div>
        <div className="flex items-center gap-2 text-cyan-300 text-sm font-medium uppercase tracking-[0.2em]">
          <Code2 size={16} />
          Parser Engineering
        </div>

        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Parser Studio
            </h1>

            <p className="mt-2 max-w-3xl text-slate-400">
              Turn unknown security telemetry into a
              deterministic LogX parser without losing
              the original evidence.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-300">
            <ShieldCheck size={17} />
            Human-approved deterministic parsing
          </div>
        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-red-300">
          <AlertTriangle size={18} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Unknown telemetry input */}

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
              <Database
                size={20}
                className="text-cyan-300"
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                Step 01 · Input
              </p>

              <h2 className="text-xl font-semibold text-white">
                Unknown Telemetry
              </h2>
            </div>
          </div>

          <button
            onClick={() => setRawData(SAMPLE)}
            className="text-xs text-slate-500 transition hover:text-cyan-300"
          >
            Load Sample
          </button>
        </div>

        <textarea
          value={rawData}
          onChange={(event) =>
            setRawData(event.target.value)
          }
          spellCheck={false}
          className="h-[220px] w-full resize-none rounded-xl border border-white/10 bg-black/30 p-5 font-mono text-sm leading-7 text-slate-300 outline-none focus:border-cyan-400/30"
        />

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {rawData.length} characters
          </span>

          <button
            onClick={analyzeLog}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw
                size={17}
                className="animate-spin"
              />
            ) : (
              <Wand2 size={17} />
            )}

            Analyze Log
          </button>
        </div>
      </section>

      {/* Analysis */}

      {analysis && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
              <Beaker
                size={20}
                className="text-emerald-300"
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">
                Step 02 · Analysis
              </p>

              <h2 className="text-xl font-semibold text-white">
                Parser Copilot
              </h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <InfoCard
              label="Format"
              value={
                analysis.detected_format?.format
              }
            />

            <InfoCard
              label="Format Confidence"
              value={`${Math.round(
                (analysis.detected_format
                  ?.confidence || 0) * 100
              )}%`}
            />

            <InfoCard
              label="Source"
              value={
                analysis.detected_source?.source
              }
            />

            <InfoCard
              label="Analysis Confidence"
              value={`${Math.round(
                confidence * 100
              )}%`}
            />
          </div>

          {patterns.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-xs uppercase tracking-[0.15em] text-slate-500">
                Detected Patterns
              </div>

              <div className="flex flex-wrap gap-2">
                {patterns.map((pattern) => (
                  <span
                    key={pattern}
                    className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs text-emerald-300"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Mapping */}

      {analysis && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
                <FileCode2
                  size={20}
                  className="text-cyan-300"
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
                  Step 03 · Human Review
                </p>

                <h2 className="text-xl font-semibold text-white">
                  Field Mapping
                </h2>
              </div>
            </div>

            <span className="text-xs text-slate-500">
              Review every suggested mapping
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10">

            {fieldCandidates.map((field) => {
              const current =
                mapping[field.source_field] ||
                "unmapped";

              return (
                <div
                  key={field.source_field}
                  className="grid gap-4 border-b border-white/5 px-5 py-4 last:border-b-0 md:grid-cols-[1fr_auto_1.5fr]"
                >
                  <div>
                    <div className="text-xs uppercase tracking-[0.1em] text-slate-500">
                      Raw field
                    </div>

                    <div className="mt-1 font-mono text-sm text-white">
                      {field.source_field}
                    </div>

                    <div className="mt-1 truncate text-xs text-slate-500">
                      {field.sample_value}
                    </div>
                  </div>

                  <div className="hidden items-center text-cyan-300 md:flex">
                    →
                  </div>

                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.1em] text-slate-500">
                      LogX field
                    </div>

                    <select
                      value={current}
                      onChange={(event) =>
                        updateMapping(
                          field.source_field,
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 font-mono text-sm text-cyan-300 outline-none focus:border-cyan-400/40"
                    >
                      {TARGET_FIELDS.map(
                        (target) => (
                          <option
                            key={target}
                            value={target}
                          >
                            {target}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={registerParser}
              disabled={registering}
              className="flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 font-medium text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {registering ? (
                <RefreshCw
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <CheckCircle2 size={17} />
              )}

              Approve & Register Parser
            </button>
          </div>
        </section>
      )}

      {/* Registration result */}

      {registeredParser && (
        <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-3">
              <CheckCircle2
                size={24}
                className="text-emerald-300"
              />

              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-emerald-300">
                  Step 04 · Registered
                </p>

                <h2 className="font-mono text-lg text-white">
                  {registeredParser.parser?.id}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {registeredParser.parser?.vendor}
                  {" · "}
                  {registeredParser.parser?.product}
                </p>
              </div>
            </div>

            <button
              onClick={processLog}
              disabled={processing}
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
            >
              {processing ? (
                <RefreshCw
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Play size={17} />
              )}

              Process & Replay
            </button>
          </div>
        </section>
      )}

      {/* Pipeline result */}

      {processResult && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl border border-purple-400/20 bg-purple-400/5 p-3">
              <ShieldCheck
                size={20}
                className="text-purple-300"
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-purple-300">
                Step 05 · Pipeline Result
              </p>

              <h2 className="text-xl font-semibold text-white">
                Normalized Event
              </h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <InfoCard
              label="Status"
              value={processedEvent?.status}
            />

            <InfoCard
              label="Parser"
              value={
                processedEvent?.parser?.id
              }
            />

            <InfoCard
              label="Validation"
              value={
                processedEvent?.validation?.status ||
                processedEvent?.quality?.status
              }
            />

            <InfoCard
              label="SHA-256"
              value={
                processedEvent?.raw?.sha256
              }
            />
          </div>

          {processedEvent?.lineage?.length > 0 && (
            <div className="mt-5">
              <div className="mb-3 text-xs uppercase tracking-[0.15em] text-slate-500">
                Field Lineage
              </div>

              <div className="space-y-2">
                {processedEvent.lineage.map(
                  (item, index) => (
                    <div
                      key={`${item.source_field}-${index}`}
                      className="grid gap-3 rounded-xl border border-white/5 bg-black/20 p-4 md:grid-cols-[1fr_auto_1fr]"
                    >
                      <div>
                        <div className="text-xs text-slate-500">
                          Source
                        </div>

                        <div className="font-mono text-sm text-white">
                          {item.source_field}
                        </div>
                      </div>

                      <div className="hidden items-center text-cyan-300 md:flex">
                        →
                      </div>

                      <div>
                        <div className="text-xs text-slate-500">
                          Normalized
                        </div>

                        <div className="font-mono text-sm text-cyan-300">
                          {item.target_field}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <pre className="mt-5 max-h-[420px] overflow-auto rounded-xl border border-white/10 bg-black/30 p-5 font-mono text-xs leading-6 text-slate-400">
            {JSON.stringify(
              processedEvent,
              null,
              2
            )}
          </pre>
        </section>
      )}

      {/* Existing registry */}

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-purple-400/20 bg-purple-400/5 p-3">
              <Server
                size={20}
                className="text-purple-300"
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-purple-300">
                Registry
              </p>

              <h2 className="text-xl font-semibold text-white">
                Registered Parsers
              </h2>
            </div>
          </div>

          <button
            onClick={loadParsers}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {parsers.map((parser) => (
            <button
              key={parser.id}
              onClick={() =>
                setSelectedParser(parser.id)
              }
              className={`rounded-xl border p-4 text-left transition ${
                selectedParser === parser.id
                  ? "border-cyan-400/30 bg-cyan-400/5"
                  : "border-white/5 bg-black/20 hover:border-white/10"
              }`}
            >
              <div className="font-mono text-sm text-white">
                {parser.id}
              </div>

              <div className="mt-2 text-xs text-slate-500">
                {parser.vendor} ·{" "}
                {parser.product}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(parser.formats || []).map(
                  (format) => (
                    <span
                      key={format}
                      className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase text-slate-400"
                    >
                      {format}
                    </span>
                  )
                )}
              </div>
            </button>
          ))}
        </div>

        {activeParser && (
          <div className="mt-5 rounded-xl border border-white/5 bg-black/20 p-4">
            <div className="mb-3 text-xs uppercase tracking-[0.15em] text-slate-500">
              Selected Parser
            </div>

            <pre className="overflow-auto font-mono text-xs leading-6 text-slate-400">
              {JSON.stringify(
                activeParser,
                null,
                2
              )}
            </pre>

            <button
              onClick={testRegisteredParser}
              disabled={loading}
              className="mt-4 flex items-center gap-2 rounded-xl border border-cyan-400/20 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-400/5"
            >
              <Play size={15} />
              Test Selected Parser
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>

      <div className="mt-2 truncate font-mono text-sm text-white">
        {value || "—"}
      </div>
    </div>
  );
}