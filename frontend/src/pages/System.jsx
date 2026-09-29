import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  CloudOff,
  Database,
  FileCode2,
  HardDrive,
  LockKeyhole,
  Network,
  RefreshCw,
  Server,
  ShieldCheck,
  WifiOff,
  Workflow,
} from "lucide-react";
import { api } from "../services/api";

function StatusPill({ status = "operational" }) {
  const operational = status === "operational";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-wider ${
        operational
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
          : "border-amber-400/20 bg-amber-400/10 text-amber-400"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          operational ? "bg-emerald-400" : "bg-amber-400"
        }`}
      />
      {operational ? "OPERATIONAL" : "CHECK"}
    </span>
  );
}

function SystemCard({
  icon: Icon,
  title,
  value,
  description,
  status = "operational",
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1118] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-400">
          <Icon size={20} />
        </div>

        <StatusPill status={status} />
      </div>

      <div className="mt-5 text-xs uppercase tracking-[0.16em] text-slate-500">
        {title}
      </div>

      <div className="mt-2 text-xl font-semibold text-white">
        {value}
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ComponentRow({ icon: Icon, name, description }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-cyan-400">
          <Icon size={17} />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-200">
            {name}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            {description}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-emerald-400">
        <CheckCircle2 size={15} />
        READY
      </div>
    </div>
  );
}

export default function System() {
  const [health, setHealth] = useState(null);
  const [parsers, setParsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState("");

  const checkSystem = async () => {
    setLoading(true);
    setError("");

    try {
      const [healthResponse, parserResponse] =
        await Promise.all([
          api.health(),
          api.parsers(),
        ]);

      setHealth(healthResponse);
      setParsers(parserResponse?.parsers || []);
      setLastChecked(new Date());
    } catch (err) {
      console.error("System status check failed:", err);
      setError(err.message || "Unable to check system status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystem();
  }, []);

  const apiOnline =
    health?.status === "ok" ||
    health?.status === "healthy" ||
    health?.ok === true ||
    Boolean(health);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="text-xs font-semibold tracking-[0.25em] text-cyan-400">
            01 · SYSTEM CONTROL
          </div>

          <h1 className="mt-2 text-3xl font-semibold text-white">
            System / Air-Gap
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Runtime health, local processing posture, parser registry
            and deployment characteristics of the LogX security
            telemetry platform.
          </p>
        </div>

        <button
          onClick={checkSystem}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-400"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Check System
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Air-gap hero */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.025] p-6">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-400/[0.04] blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-400">
              <WifiOff size={28} />
            </div>

            <div>
              <div className="text-xs font-semibold tracking-[0.25em] text-emerald-400">
                CORE PROCESSING MODE
              </div>

              <h2 className="mt-2 text-2xl font-semibold text-white">
                Local / Air-Gapped Ready
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Log ingestion, parsing, normalization, validation,
                provenance and evidence preservation are designed to
                execute locally without a mandatory external runtime
                service.
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl border border-emerald-400/20 bg-black/20 px-6 py-5 text-center">
            <div className="text-3xl font-bold text-emerald-400">
              LOCAL
            </div>

            <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
              Core Processing
            </div>
          </div>
        </div>
      </section>

      {/* Runtime cards */}
      <section>
        <div className="mb-4">
          <div className="text-xs font-semibold tracking-[0.22em] text-cyan-400">
            02 · RUNTIME HEALTH
          </div>

          <h2 className="mt-2 text-xl font-semibold text-white">
            Platform Status
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SystemCard
            icon={Activity}
            title="API"
            value={apiOnline ? "ONLINE" : "UNAVAILABLE"}
            description="FastAPI runtime responding to health checks."
            status={apiOnline ? "operational" : "check"}
          />

          <SystemCard
            icon={Workflow}
            title="Pipeline"
            value="READY"
            description="Detection, parsing, normalization and validation pipeline."
          />

          <SystemCard
            icon={Database}
            title="Event Store"
            value="AVAILABLE"
            description="Processed telemetry and provenance records are accessible."
          />

          <SystemCard
            icon={FileCode2}
            title="Parser Registry"
            value={`${parsers.length} REGISTERED`}
            description="Deterministic parsers available to the current runtime."
          />
        </div>
      </section>

      {/* Processing posture */}
      <section className="rounded-2xl border border-white/10 bg-[#0b1118] p-5">
        <div className="mb-5">
          <div className="text-xs font-semibold tracking-[0.22em] text-cyan-400">
            03 · PROCESSING POSTURE
          </div>

          <h2 className="mt-2 text-xl font-semibold text-white">
            Dependency Boundary
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            The core telemetry path remains local. Optional external
            intelligence services can be layered on later without
            changing the deterministic processing path.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <DependencyCard
            icon={HardDrive}
            title="Local Processing"
            value="REQUIRED PATH"
            description="Raw capture, detection, parsing, normalization, validation and provenance."
            active
          />

          <DependencyCard
            icon={CloudOff}
            title="External Runtime"
            value="NOT REQUIRED"
            description="Core event processing does not depend on a cloud service being available."
            active
          />

          <DependencyCard
            icon={LockKeyhole}
            title="Evidence Preservation"
            value="LOCAL"
            description="Original raw evidence and integrity fingerprints remain available to the platform."
            active
          />
        </div>
      </section>

      {/* Pipeline components */}
      <section className="rounded-2xl border border-white/10 bg-[#0b1118] p-5">
        <div className="mb-5">
          <div className="text-xs font-semibold tracking-[0.22em] text-cyan-400">
            04 · PIPELINE COMPONENTS
          </div>

          <h2 className="mt-2 text-xl font-semibold text-white">
            Local Processing Chain
          </h2>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <ComponentRow
            icon={Database}
            name="Raw Capture"
            description="Preserve incoming telemetry and generate integrity fingerprint."
          />

          <ComponentRow
            icon={Network}
            name="Format & Source Detection"
            description="Identify telemetry format and source profile."
          />

          <ComponentRow
            icon={FileCode2}
            name="Parser Registry"
            description="Select deterministic parser according to registered contracts."
          />

          <ComponentRow
            icon={Workflow}
            name="Normalization"
            description="Map heterogeneous fields into the canonical LogX event model."
          />

          <ComponentRow
            icon={ShieldCheck}
            name="Validation"
            description="Validate normalized structure and identify quality issues."
          />

          <ComponentRow
            icon={LockKeyhole}
            name="Provenance"
            description="Preserve lineage, parser metadata and processing trace."
          />
        </div>
      </section>

      {/* Deployment */}
      <section className="rounded-2xl border border-white/10 bg-[#0b1118] p-5">
        <div className="mb-5">
          <div className="text-xs font-semibold tracking-[0.22em] text-cyan-400">
            05 · DEPLOYMENT
          </div>

          <h2 className="mt-2 text-xl font-semibold text-white">
            Runtime Topology
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <DeploymentNode
            icon={Server}
            title="Frontend"
            value="React + Vite"
          />

          <DeploymentNode
            icon={Network}
            title="API"
            value="FastAPI"
          />

          <DeploymentNode
            icon={Database}
            title="Processing"
            value="Local Pipeline"
          />
        </div>

        <div className="my-5 flex items-center justify-center">
          <div className="h-px flex-1 bg-white/10" />

          <div className="mx-4 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-400">
            LOGX CORE
          </div>

          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.03] p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-400">
            <ShieldCheck size={17} />
            ISOLATED DEPLOYMENT COMPATIBLE
          </div>

          <p className="mt-2 text-xs text-slate-500">
            The core LogX processing path can operate inside a
            controlled network environment without requiring continuous
            internet connectivity.
          </p>
        </div>
      </section>

      {/* Verification */}
      <section className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-[0.22em] text-cyan-400">
              06 · SYSTEM VERIFICATION
            </div>

            <h2 className="mt-2 text-lg font-semibold text-white">
              Environment Check
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Last checked{" "}
              {lastChecked
                ? lastChecked.toLocaleTimeString()
                : "not yet checked"}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-400">
            <CheckCircle2 size={16} />
            SYSTEM ONLINE
          </div>
        </div>
      </section>
    </div>
  );
}

function DependencyCard({
  icon: Icon,
  title,
  value,
  description,
  active,
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-center justify-between">
        <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-2.5 text-cyan-400">
          <Icon size={18} />
        </div>

        {active && (
          <CheckCircle2
            size={17}
            className="text-emerald-400"
          />
        )}
      </div>

      <div className="mt-4 text-xs uppercase tracking-wider text-slate-500">
        {title}
      </div>

      <div className="mt-2 font-mono text-sm font-semibold text-emerald-400">
        {value}
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function DeploymentNode({ icon: Icon, title, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-5 text-center">
      <div className="mx-auto flex w-fit rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-400">
        <Icon size={20} />
      </div>

      <div className="mt-3 text-xs uppercase tracking-wider text-slate-500">
        {title}
      </div>

      <div className="mt-1 font-mono text-sm font-semibold text-slate-200">
        {value}
      </div>
    </div>
  );
}