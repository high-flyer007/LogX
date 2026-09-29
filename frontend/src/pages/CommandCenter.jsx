import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Activity,
  Database,
  ShieldCheck,
  AlertTriangle,
  Zap,
  RefreshCw,
} from "lucide-react";

import { api } from "../services/api";
// const metrics = [
//   {
//     label: "Events Processed",
//     value: "1,284",
//     icon: Activity,
//   },
//   {
//     label: "Parse Success",
//     value: "98.7%",
//     icon: ShieldCheck,
//   },
//   {
//     label: "Quarantined",
//     value: "17",
//     icon: AlertTriangle,
//   },
//   {
//     label: "Throughput",
//     value: "342/s",
//     icon: Zap,
//   },
// ];

function MetricCard({
  label,
  value,
  icon: Icon,
  loading = false,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">

            {loading ? (
              <span className="text-lg text-slate-600">
                Loading...
              </span>
            ) : (
              value
            )}

          </p>

        </div>

        <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-3">

          <Icon
            size={20}
            className="text-cyan-300"
          />

        </div>

      </div>

    </div>
  );
}


export default function CommandCenter() {

  const navigate = useNavigate();

  const [health, setHealth] = useState(null);

  const [events, setEvents] = useState([]);

  const [quarantine, setQuarantine] = useState([]);

  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);


  async function loadDashboard() {

    try {

      setError(null);

      const [
        healthData,
        eventsData,
        quarantineData,
        analyticsData,
      ] = await Promise.all([
        api.health(),
        api.events(100),
        api.quarantine(),
        api.analyticsSummary(),
      ]);


      setHealth(healthData);

      setAnalytics(analyticsData);

      setEvents(
        Array.isArray(eventsData)
          ? eventsData
          : eventsData.events || []
      );

      setQuarantine(
        Array.isArray(quarantineData)
          ? quarantineData
          : quarantineData.quarantine || []
      );

    } catch (err) {

      console.error(
        "Dashboard loading failed:",
        err
      );

      setError(
        err.message ||
        "Unable to connect to LogX API"
      );

    } finally {

      setLoading(false);

    }

  }


  useEffect(() => {

    loadDashboard();

    const interval = setInterval(
      loadDashboard,
      5000
    );

    return () =>
      clearInterval(interval);

  }, []);


  const metrics = analytics?.overview || {
    total_events: 0,
    processed: 0,
    quarantined: 0,
    valid: 0,
    success_rate: 0,
  };

  const processedCount = metrics.processed;

  const quarantinedCount = metrics.quarantined;

  const successRate =
    metrics.total_events === 0
      ? "—"
      : `${metrics.success_rate}%`;


  const systemStatus =
    health?.status ||
    health?.state ||
    "unknown";


  const statusLabel =
    systemStatus
      .toString()
      .toUpperCase();


  return (
    // <div className="min-h-screen bg-[#070b11] text-white">
    <div className="text-white">

      {/* <main className="mx-auto max-w-[1600px] p-8"> */}
      <main className="mx-auto max-w-[1600px]">
        <header className="mb-8">

          <div className="flex items-center gap-3">

  <div
    className={`h-3 w-3 rounded-full ${
      error
        ? "bg-red-400"
        : "bg-emerald-400"
    }`}
  />

  <span
    className={`text-xs font-medium uppercase tracking-[0.25em] ${
      error
        ? "text-red-300"
        : "text-emerald-300"
    }`}
  >
    {error
      ? "API CONNECTION ERROR"
      : loading
        ? "CONNECTING"
        : `SYSTEM ${statusLabel || "ONLINE"}`}
  </span>

</div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Command Center
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            Universal security telemetry
            preprocessing and forensic pipeline.
          </p>

        </header>


        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

  <MetricCard
    label="Events Processed"
    value={processedCount}
    icon={Activity}
    loading={loading}
  />

  <MetricCard
    label="Parse Success"
    value={successRate}
    icon={ShieldCheck}
    loading={loading}
  />

  <MetricCard
    label="Quarantined"
    value={quarantinedCount}
    icon={AlertTriangle}
    loading={loading}
  />

  <MetricCard
  label="Active Parsers"
  value={analytics?.parsers?.length || 0}
  icon={Zap}
  loading={loading}
/>
</section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                  Processing Pipeline
                </p>

                <h2 className="mt-2 text-xl font-medium">
                  Telemetry Flow
                </h2>

              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-300">

                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                LIVE

              </div>

            </div>


            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-6">

             {[
                {
                  name: "RECEIVED",
                  detail: `${metrics.total_events} events`,
                },
                {
                  name: "RAW",
                  detail: "Evidence preserved",
                },
                {
                  name: "DETECTED",
                  detail: `${analytics?.formats?.length || 0} formats`,
                },
                {
                  name: "PARSED",
                  detail: `${analytics?.parsers?.length || 0} parsers`,
                },
                {
                  name: "NORMALIZED",
                  detail: `${metrics.valid} valid`,
                },
                {
                  name: "VALIDATED",
                  detail: `${metrics.success_rate}% success`,
                },
              ].map((stage, index) => (
                <div
                  key={stage.name}
                  className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.035] p-4 text-center"
                >
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-xs text-cyan-300">
                    {index + 1}
                  </div>

                  <p className="mt-3 text-[10px] font-medium tracking-wider text-slate-300">
                    {stage.name}
                  </p>

                  <p className="mt-1 text-[9px] text-slate-500">
                    {stage.detail}
                  </p>
                </div>
              ))}

            </div>

            <div className="mt-6 flex items-center justify-center gap-3 text-xs">
              <span className="h-px w-10 bg-white/10" />

              <span className="text-slate-600">
                FAILURE PATH
              </span>

              <span className="rounded-lg border border-amber-400/10 bg-amber-400/5 px-3 py-1.5 text-amber-300">
                {quarantinedCount} QUARANTINED
              </span>

              <span className="h-px w-10 bg-white/10" />
            </div>

          </div>


          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">

            <div className="flex items-center gap-3">

              <Database
                size={20}
                className="text-cyan-300"
              />

              <div>

                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Infrastructure
                </p>

                <h2 className="mt-1 text-lg font-medium">
                  Pipeline Health
                </h2>

              </div>

            </div>


            <div className="mt-6 space-y-3">

              {[
                [
                  "Pipeline",
                  error ? "OFFLINE" : loading ? "CONNECTING" : "ONLINE",
                ],
                [
                  "Parser Registry",
                  loading
                    ? "LOADING"
                    : `${analytics?.parsers?.length || 0} ACTIVE`,
                ],
                [
                  "Validation",
                  loading ? "LOADING" : "ONLINE",
                ],
                [
                  "Quarantine",
                  loading
                    ? "LOADING"
                    : `${quarantinedCount} EVENTS`,
                ],
                [
                  "Storage",
                  error ? "UNKNOWN" : "ONLINE",
                ],
              ].map(([name, status]) => (

                <div
                  key={name}
                  className="flex items-center justify-between rounded-xl border border-white/6 bg-black/10 px-4 py-3"
                >

                  <span className="text-sm text-slate-300">
                    {name}
                  </span>

                  <span
                    className={`flex items-center gap-2 text-xs ${
                      status === "OFFLINE"
                        ? "text-red-300"
                        : status === "UNKNOWN"
                          ? "text-amber-300"
                          : status.includes("LOADING") || status === "CONNECTING"
                            ? "text-cyan-300"
                            : "text-emerald-300"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        status === "OFFLINE"
                          ? "bg-red-400"
                          : status === "UNKNOWN"
                            ? "bg-amber-400"
                            : status.includes("LOADING") || status === "CONNECTING"
                              ? "bg-cyan-400"
                              : "bg-emerald-400"
                      }`}
                    />
                    {status}
                  </span>

                </div>

              ))}

            </div>

          </div>

        </section>


        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-6">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Recent Telemetry
              </p>
              <button
  onClick={loadDashboard}
  className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:border-cyan-400/30 hover:text-cyan-300"
>
  <RefreshCw
    size={13}
    className={
      loading
        ? "animate-spin"
        : ""
    }
  />

  Refresh
</button>
              <h2 className="mt-1 text-xl font-medium">
                Event Activity
              </h2>

            </div>

            <button
              onClick={() => navigate("/events")}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
            >
              View all events
            </button>
          </div>


          <div className="mt-6 overflow-hidden rounded-xl border border-white/6">

  <div className="grid grid-cols-5 border-b border-white/6 bg-white/[0.025] px-4 py-3 text-[10px] uppercase tracking-wider text-slate-500">

    <span>Event</span>
    <span>Source</span>
    <span>Parser</span>
    <span>Status</span>
    <span>Time</span>

  </div>


  {events.length === 0 ? (

    <div className="px-4 py-12 text-center text-sm text-slate-600">
      No events processed yet.
    </div>

  ) : (

    events.slice(0, 10).map(
      (event, index) => {

        const source =
          event.device?.vendor ||
          event.source_type ||
          event.source ||
          "Unknown";

        const parser =
          event.parser?.id ||
          event.parser_id ||
          "—";

        const status =
          event.status ||
          event.quality?.status ||
          "PROCESSED";

        const eventType =
          event.event?.type ||
          event.event_type ||
          "Security Event";

        const timestamp =
          event.event?.time ||
          event.created_at ||
          event.timestamp ||
          "—";


        return (

          <div
            key={
              event.event_id ||
              event.id ||
              index
            }
            onClick={() =>
              event.event_id &&
              navigate(`/events?event=${encodeURIComponent(event.event_id)}`)
            }
            className="grid cursor-pointer grid-cols-5 border-b border-white/5 px-4 py-4 text-sm transition hover:bg-white/[0.025] last:border-0"
          >

            <span className="text-slate-200">
              {eventType}
            </span>

            <span className="text-slate-400">
              {source}
            </span>

            <span className="font-mono text-xs text-slate-500">
              {parser}
            </span>

            <span
              className={
                status
                  .toString()
                  .toLowerCase()
                  .includes("quarantine")
                    ? "text-amber-300"
                    : "text-emerald-300"
              }
            >
              {status}
            </span>

            <span className="text-slate-500">
              {timestamp}
            </span>

          </div>

        );

      }
    )

    

  )}

</div>

        </section>

      </main>

    </div>
  );
}