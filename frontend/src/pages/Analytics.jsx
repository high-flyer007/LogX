import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Database,
  FileCheck2,
  RefreshCw,
  ShieldCheck,
  Terminal,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { api } from "../services/api";

const COLORS = [
  "#22d3ee",
  "#34d399",
  "#f59e0b",
  "#a78bfa",
  "#fb7185",
  "#60a5fa",
];

function getEvents(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.events || [];
}

function getQuarantine(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.items || payload?.records || payload?.quarantine || [];
}

function MetricCard({ icon: Icon, label, value, detail, accent = "cyan" }) {
  const accentClasses = {
    cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    violet: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1118] p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
            {label}
          </div>

          <div className="mt-3 text-3xl font-semibold text-white">
            {value}
          </div>

          {detail && (
            <div className="mt-2 text-sm text-slate-500">
              {detail}
            </div>
          )}
        </div>

        <div
          className={`rounded-xl border p-3 ${
            accentClasses[accent] || accentClasses.cyan
          }`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ eyebrow, title, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b1118] p-5">
      <div className="mb-5">
        <div className="text-xs font-semibold tracking-[0.22em] text-cyan-400">
          {eyebrow}
        </div>

        <h2 className="mt-2 text-lg font-semibold text-white">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
  setLoading(true);
  setError("");

  try {
    const response = await api.analyticsSummary();
    setAnalytics(response);
  } catch (err) {
    console.error("Analytics load failed:", err);
    setError(err.message || "Unable to load analytics.");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadAnalytics();
  }, []);

const metrics = analytics?.overview || {
  total_events: 0,
  processed: 0,
  quarantined: 0,
  valid: 0,
  success_rate: 0,
};

const sourceData = analytics?.sources || [];
const formatData = analytics?.formats || [];
const actionData = analytics?.actions || [];
const parserData = analytics?.parsers || [];
const timelineData = analytics?.timeline || [];

   
  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-400">
          <RefreshCw className="animate-spin" size={20} />
          Loading telemetry analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="text-xs font-semibold tracking-[0.25em] text-cyan-400">
            01 · TELEMETRY INTELLIGENCE
          </div>

          <h1 className="mt-2 text-3xl font-semibold text-white">
            Analytics
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Operational visibility across normalized security telemetry,
            parser execution, source distribution and data quality.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-400"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Database}
          label="Total Events"
          value={metrics.total_events}
          detail="Loaded from LogX event store"
          accent="cyan"
        />

        <MetricCard
          icon={Activity}
          label="Processed"
          value={metrics.processed}
          detail={`${metrics.success_rate}% processing success`}
          accent="emerald"
        />

        <MetricCard
          icon={AlertTriangle}
          label="Quarantined"
          value={metrics.quarantined}
          detail="Events requiring investigation"
          accent="amber"
        />

        <MetricCard
          icon={ShieldCheck}
          label="Valid Events"
          value={metrics.valid}
          detail="Passed validation"
          accent="violet"
        />
      </div>

      {/* Pipeline status */}
      <section className="rounded-2xl border border-white/10 bg-[#0b1118] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-[0.22em] text-cyan-400">
              02 · PIPELINE HEALTH
            </div>

            <h2 className="mt-2 text-lg font-semibold text-white">
              Normalization Pipeline
            </h2>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            PIPELINE OPERATIONAL
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-6">
          {[
            "Raw Capture",
            "Detection",
            "Parsing",
            "Normalization",
            "Validation",
            "Provenance",
          ].map((stage, index) => (
            <div key={stage} className="relative">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-cyan-400">
                  0{index + 1}
                </div>

                <div className="mt-2 text-sm font-medium text-slate-200">
                  {stage}
                </div>

                <div className="mt-2 text-xs text-emerald-400">
                  Operational
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          eyebrow="03 · INGESTION"
          title="Events by Source"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />

                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                />

                <Tooltip
                  contentStyle={{
                    background: "#0b1118",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                  }}
                />

                <Bar
                  dataKey="value"
                  fill="#22d3ee"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          eyebrow="04 · FORMATS"
          title="Telemetry Format Distribution"
        >
          <div className="h-72">
            {formatData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formatData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={55}
                    paddingAngle={3}
                  >
                    {formatData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      background: "#0b1118",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-3">
            {formatData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center gap-2 text-xs text-slate-400"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    background:
                      COLORS[index % COLORS.length],
                  }}
                />
                {item.name}: {item.value}
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          eyebrow="05 · ACTIVITY"
          title="Telemetry Processing Timeline"
        >
          <div className="h-72">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                  />

                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#0b1118",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="#34d399"
                    fill="#34d399"
                    fillOpacity={0.08}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </ChartCard>

        <ChartCard
          eyebrow="06 · ACTIONS"
          title="Event Action Distribution"
        >
          <div className="h-72">
            {actionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#0b1118",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                    }}
                  />

                  <Bar
                    dataKey="value"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </ChartCard>
      </div>

      {/* Parser Intelligence */}
      <section className="rounded-2xl border border-white/10 bg-[#0b1118] p-5">
        <div className="mb-5">
          <div className="text-xs font-semibold tracking-[0.22em] text-cyan-400">
            07 · PARSER INTELLIGENCE
          </div>

          <h2 className="mt-2 text-lg font-semibold text-white">
            Parser Execution
          </h2>
        </div>

        {parserData.length > 0 ? (
          <div className="space-y-3">
            {parserData.map((parser) => {
              const percentage =
                metrics.total_events > 0
                  ? (parser.value / metrics.total) * 100
                  : 0;

              return (
                <div key={parser.name}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal size={15} className="text-cyan-400" />
                      <span className="font-mono text-sm text-slate-300">
                        {parser.name}
                      </span>
                    </div>

                    <span className="text-xs text-slate-500">
                      {parser.value} events
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-cyan-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyChart />
        )}
      </section>

      {/* Footer insight */}
      <section className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.03] p-5">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-400">
            <TrendingUp size={20} />
          </div>

          <div>
            <h3 className="font-semibold text-white">
              Telemetry Intelligence
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Analytics are calculated directly from normalized LogX
              events. No external analytics service is required, keeping
              the core telemetry processing compatible with the
              air-gapped operating model.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-600">
      No telemetry data available
    </div>
  );
}