import {
  Activity,
  BarChart3,
  Boxes,
  Database,
  FileSearch,
  GitBranch,
  History,
  LayoutDashboard,
  Network,
  Radio,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react";

import { NavLink, Outlet } from "react-router-dom";


const navigation = [
  {
    section: "OPERATIONS",
    items: [
      {
        name: "Command Center",
        path: "/",
        icon: LayoutDashboard,
      },
      {
        name: "Live Ingest",
        path: "/live-ingest",
        icon: Radio,
      },
      {
        name: "Event Explorer",
        path: "/events",
        icon: Activity,
      },
    ],
  },

  {
    section: "FORENSICS",
    items: [
      {
        name: "Forensic Workbench",
        path: "/forensics",
        icon: FileSearch,
      },
      {
        name: "Parser Studio",
        path: "/parser-studio",
        icon: Terminal,
      },
      {
        name: "Quarantine",
        path: "/quarantine",
        icon: ShieldAlert,
      },
      {
        name: "Replay Center",
        path: "/replay",
        icon: History,
      },
    ],
  },

  {
    section: "INTELLIGENCE",
    items: [
      {
        name: "Analytics",
        path: "/analytics",
        icon: BarChart3,
      },
      {
        name: "Sources & Plugins",
        path: "/sources",
        icon: Boxes,
      },
    ],
  },

  {
    section: "SYSTEM",
    items: [
      {
        name: "System / Air-Gap",
        path: "/system",
        icon: Settings,
      },
    ],
  },
];


function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-white/[0.08] bg-[#090d13]">

      {/* Logo */}

      <div className="flex h-[78px] items-center border-b border-white/[0.07] px-6">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">

            <ShieldCheck
              size={21}
              className="text-cyan-300"
            />

          </div>

          <div>

            <div className="text-lg font-bold tracking-[0.18em] text-white">
              LOGX
            </div>

            <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500">
              Security Telemetry
            </div>

          </div>

        </div>

      </div>


      {/* Navigation */}

      <nav className="flex-1 overflow-y-auto px-3 py-5">

        {navigation.map((group) => (

          <div
            key={group.section}
            className="mb-6"
          >

            <div className="mb-2 px-3 text-[9px] font-semibold tracking-[0.2em] text-slate-600">
              {group.section}
            </div>


            <div className="space-y-1">

              {group.items.map((item) => {

                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                        isActive
                          ? "border border-cyan-400/10 bg-cyan-400/[0.08] text-cyan-200"
                          : "border border-transparent text-slate-400 hover:bg-white/[0.035] hover:text-slate-200",
                      ].join(" ")
                    }
                  >

                    <Icon
                      size={17}
                      strokeWidth={1.8}
                      className="shrink-0"
                    />

                    <span>
                      {item.name}
                    </span>

                    {/* {item.name === "Quarantine" && (
                    //   <span className="ml-auto rounded-full bg-amber-400/10 px-2 py-0.5 text-[9px] text-amber-300">
                    //   </span>
                    )} */}

                  </NavLink>
                );

              })}

            </div>

          </div>

        ))}

      </nav>


      {/* Bottom status */}

      <div className="border-t border-white/[0.07] p-4">

        <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] p-3">

          <div className="flex items-center gap-2">

            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />

            <span className="text-xs font-medium text-emerald-300">
              SYSTEM ONLINE
            </span>

          </div>

          <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
            Local processing environment
          </p>

        </div>

      </div>

    </aside>
  );
}


function TopBar() {
  return (
    <header className="fixed left-[260px] right-0 top-0 z-30 flex h-[78px] items-center justify-between border-b border-white/[0.07] bg-[#090d13]/90 px-7 backdrop-blur-xl">

      <div>

        <div className="flex items-center gap-2 text-xs text-slate-500">

          <Network size={14} />

          <span>
            LOGX
          </span>

          <span>
            /
          </span>

          <span className="text-slate-300">
            Security Telemetry Platform
          </span>

        </div>

      </div>


      <div className="flex items-center gap-5">

        <div className="flex items-center gap-2 text-xs text-slate-500">

          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

          API

          <span className="text-emerald-300">
            ONLINE
          </span>

        </div>


        <div className="h-5 w-px bg-white/10" />


        <div className="flex items-center gap-2">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/10 bg-cyan-400/5">

            <Database
              size={15}
              className="text-cyan-300"
            />

          </div>

          <div className="hidden sm:block">

            <p className="text-[10px] text-slate-500">
              ENVIRONMENT
            </p>

            <p className="text-xs text-slate-300">
              AIR-GAPPED
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}


export default function LogXLayout() {
  return (
    <div className="min-h-screen bg-[#070b11] text-white">

      <Sidebar />

      <TopBar />

      <main className="ml-[260px] min-h-screen pt-[78px]">

        <div className="p-7">

          <Outlet />

        </div>

      </main>

    </div>
  );
}