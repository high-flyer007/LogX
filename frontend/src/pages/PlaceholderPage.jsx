import {
  Construction,
} from "lucide-react";


export default function PlaceholderPage({
  title,
  description,
}) {

  return (
    <div className="flex min-h-[calc(100vh-134px)] items-center justify-center">

      <div className="max-w-lg text-center">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/5">

          <Construction
            size={28}
            className="text-cyan-300"
          />

        </div>

        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300">
          LogX Module
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          {title}
        </h1>

        <p className="mt-3 leading-relaxed text-slate-500">
          {description}
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-amber-400/10 bg-amber-400/5 px-4 py-2 text-xs text-amber-300">

          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />

          MODULE INITIALIZING

        </div>

      </div>

    </div>
  );
}