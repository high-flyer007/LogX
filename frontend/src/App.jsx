import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import LogXLayout from "./components/layout/LogXLayout";

import CommandCenter from "./pages/CommandCenter";
import LiveIngest from "./pages/LiveIngest";
import PlaceholderPage from "./pages/PlaceholderPage";
import EventExplorer from "./pages/EventExplorer";
import ForensicWorkbench from "./pages/ForensicWorkbench";
import ParserStudio from "./pages/ParserStudio";
import Quarantine from "./pages/Quarantine";
import ReplayCenter from "./pages/ReplayCenter";
import Analytics from "./pages/Analytics";
import Sources from "./pages/Sources";
import System from "./pages/System";

const modules = {
  live: {
    title: "Live Ingest",
    description:
      "Receive security telemetry through REST, file, and syslog ingestion channels and observe the processing pipeline in real time.",
  },

  events: {
    title: "Event Explorer",
    description:
      "Search, inspect, filter, and investigate normalized security events while retaining access to the original evidence.",
  },

  forensics: {
    title: "Forensic Workbench",
    description:
      "Trace normalized fields back to their original raw values, parser versions, extraction methods, and integrity fingerprints.",
  },

  parser: {
    title: "Parser Studio",
    description:
      "Create, test, validate, and manage deterministic parser definitions for new telemetry sources.",
  },

  quarantine: {
    title: "Quarantine",
    description:
      "Review unknown or malformed telemetry that could not safely pass through the deterministic processing pipeline.",
  },

  replay: {
    title: "Replay Center",
    description:
      "Reprocess preserved raw evidence against updated parser and normalization versions without losing historical provenance.",
  },

  analytics: {
    title: "Analytics",
    description:
      "Analyze telemetry volume, parser performance, source distribution, processing health, and pipeline quality.",
  },

  sources: {
    title: "Sources & Plugins",
    description:
      "Manage telemetry source profiles, parser definitions, versions, capabilities, and onboarding status.",
  },

  system: {
    title: "System / Air-Gap",
    description:
      "Inspect LogX runtime health, local processing components, integrity services, and air-gapped deployment status.",
  },
};


export default function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route
          element={<LogXLayout />}
        >

          <Route
            path="/"
            element={<CommandCenter />}
          />

          <Route
  path="/live-ingest"
  element={<LiveIngest />}
/>

          
          <Route
  path="/events"
  element={<EventExplorer />}
/>
          <Route
  path="/forensics"
  element={<ForensicWorkbench />}
/>

          <Route
  path="/parser-studio"
  element={<ParserStudio />}
/>

          <Route
  path="/quarantine"
  element={<Quarantine />}
/>

          <Route
  path="/replay"
  element={<ReplayCenter />}
/>

          <Route path="/analytics" element={<Analytics />} />

          <Route path="/sources" element={<Sources />} />

          <Route path="/system" element={<System />} />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}