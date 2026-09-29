import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Database,
  FileCode2,
  Network,
  RefreshCw,
  Server,
  Shield,
  Terminal,
  Wifi,
  Wrench,
} from "lucide-react";
import { api } from "../services/api";

const SOURCE_PROFILES = [
  {
    name: "FortiGate",
    category: "Firewall",
    formats: ["Key-Value"],
    parser: "fortigate.traffic",
    status: "active",
    description:
      "Fortinet firewall telemetry with traffic and connection fields.",
    icon: Shield,
  },
  {
    name: "Suricata",
    category: "IDS / IPS",
    formats: ["JSON"],
    parser: "Registry target",
    status: "ready",
    description:
      "Network intrusion detection telemetry profile.",
    icon: Network,
  },
  {
    name: "Zeek",
    category: "Network Security",
    formats: ["CSV", "TSV"],
    parser: "Registry target",
    status: "ready",
    description:
      "Network monitoring and connection telemetry profile.",
    icon: Activity,
  },
  {
    name: "VPN Gateway",
    category: "VPN",
    formats: ["Syslog"],
    parser: "Registry target",
    status: "ready",
    description:
      "Remote-access and VPN session telemetry profile.",
    icon: Wifi,
  },
  {
    name: "Custom Application",
    category: "Application",
    formats: ["JSON", "CSV", "Key-Value"],
    parser: "Auto-detect",
    status: "ready",
    description:
      "Generic application and service telemetry profile.",
    icon: Server,
  },
];

function StatusBadge({ status }) {
  const config = {
    active: {
      label: "ACTIVE",
      className:
        "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
      icon: CheckCircle2,
    },
    ready: {
      label: "REGISTRY TARGET",
      className:
        "border-cyan-400/20 bg-cyan-400/10 text-cyan-400",
      icon: Wrench,
    },
  };

  const item = config[status] || config.ready;
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-wider ${item.className}`}
    >
      <Icon size={13} />
      {item.label}
    </span>
  );
}

function SourceCard({ source }) {
  const Icon = source.icon;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1118] p-5 transition hover:border-cyan-400/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-400">
            <Icon size={20} />
          </div>

          <div>
            <h3 className="font-semibold text-white">
              {source.name}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {source.category}
            </p>
          </div>
        </div>

        <StatusBadge status={source.status} />
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-400">
        {source.description}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-600">
            Supported Formats
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {source.formats.map((format) => (
              <span
                key={format}
                className="rounded-md bg-white/5 px-2 py-1 font-mono text-xs text-slate-300"
              >
                {format}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-600">
            Parser
          </div>

          <div className="mt-2 break-all font-mono text-xs text-cyan-300">
            {source.parser}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sources() {
  const [parsers, setParsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadParsers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.parsers();
      setParsers(response?.parsers || []);
    } catch (err) {
      console.error("Parser registry load failed:", err);
      setError(err.message || "Unable to load parser registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParsers();
  }, []);

  const activeParsers = useMemo(
    () => parsers.filter((parser) => parser.id),
    [parsers]
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="text-xs font-semibold tracking-[0.25em] text-cyan-400">
            01 · SOURCE FABRIC
          </div>

          <h1 className="mt-2 text-3xl font-semibold text-white">
            Sources & Plugins
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Manage telemetry source profiles and inspect the LogX parser
            registry responsible for converting heterogeneous security
            events into the canonical event model.
          </p>
        </div>

        <button
          onClick={loadParsers}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-400"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh Registry
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Architecture */}
      <section className="rounded-2xl border border-white/10 bg-[#0b1118] p-5">
        <div className="mb-6">
          <div className="text-xs font-semibold tracking-[0.22em] text-cyan-400">
            02 · SOURCE ARCHITECTURE
          </div>

          <h2 className="mt-2 text-lg font-semibold text-white">
            Heterogeneous Telemetry → LogX
          </h2>
        </div>

        <div className="grid items-center gap-3 md:grid-cols-5">
          <ArchitectureNode
            icon={Shield}
            label="Firewall"
            value="FortiGate"
          />

          <Arrow />

          <ArchitectureNode
            icon={Network}
            label="IDS / IPS"
            value="Suricata"
          />

          <Arrow />

          <ArchitectureNode
            icon={Database}
            label="VPN / Apps"
            value="Other Sources"
          />
        </div>

        <div className="my-4 flex justify-center">
          <div className="h-6 w-px bg-cyan-400/30" />
        </div>

        <div className="flex justify-center">
          <div className="flex max-w-xl items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] px-6 py-4">
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-400">
              <Terminal size={20} />
            </div>

            <div>
              <div className="font-semibold text-white">
                LogX Parser Registry
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Detect → Parse → Normalize → Validate → Preserve
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Source Profiles */}
      <section>
        <div className="mb-4">
          <div className="text-xs font-semibold tracking-[0.22em] text-cyan-400">
            03 · SOURCE PROFILES
          </div>

          <h2 className="mt-2 text-xl font-semibold text-white">
            Supported Telemetry Sources
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Active means the source has a working parser in the current
            prototype. Registry Target identifies the source profile we
            have designed for future parser onboarding.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {SOURCE_PROFILES.map((source) => (
            <SourceCard
              key={source.name}
              source={source}
            />
          ))}
        </div>
      </section>

      {/* Parser Registry */}
      <section className="rounded-2xl border border-white/10 bg-[#0b1118] p-5">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <div className="text-xs font-semibold tracking-[0.22em] text-cyan-400">
              04 · PARSER REGISTRY
            </div>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Registered Parsers
            </h2>
          </div>

          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-400">
            {activeParsers.length} REGISTERED
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-cyan-400">
            <RefreshCw size={17} className="mr-2 animate-spin" />
            Loading parser registry...
          </div>
        ) : activeParsers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-600">
            No parsers registered.
          </div>
        ) : (
          <div className="space-y-3">
            {activeParsers.map((parser) => (
              <div
                key={parser.id}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-2.5 text-emerald-400">
                      <FileCode2 size={18} />
                    </div>

                    <div>
                      <div className="font-mono text-sm font-semibold text-white">
                        {parser.id}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {parser.vendor} · {parser.product}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <RegistryValue
                      label="Version"
                      value={parser.version}
                    />

                    <RegistryValue
                      label="Formats"
                      value={
                        parser.formats?.join(", ") ||
                        "Not specified"
                      }
                    />

                    <RegistryValue
                      label="Status"
                      value="ACTIVE"
                      active
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Plugin onboarding */}
      <section className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-400">
            <Wrench size={20} />
          </div>

          <div>
            <div className="text-xs font-semibold tracking-[0.22em] text-cyan-400">
              05 · PLUGIN ONBOARDING
            </div>

            <h2 className="mt-2 text-lg font-semibold text-white">
              Parser-first extensibility
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              New telemetry sources are onboarded through the parser
              registry rather than changing the core normalization
              pipeline. Each parser declares its identity, vendor,
              product, supported formats and version.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Identity",
                "Vendor",
                "Product",
                "Formats",
                "Version",
                "Parser Contract",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ArchitectureNode({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
      <Icon className="mx-auto text-cyan-400" size={20} />

      <div className="mt-3 text-xs uppercase tracking-wider text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-sm font-semibold text-slate-200">
        {value}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="hidden text-center text-cyan-400/50 md:block">
      →
    </div>
  );
}

function RegistryValue({ label, value, active = false }) {
  return (
    <div className="min-w-[110px] rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2">
      <div className="text-[9px] uppercase tracking-wider text-slate-600">
        {label}
      </div>

      <div
        className={`mt-1 text-xs ${
          active
            ? "font-semibold text-emerald-400"
            : "font-mono text-slate-300"
        }`}
      >
        {value}
      </div>
    </div>
  );
}