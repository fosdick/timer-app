import React, { useState, useEffect } from "react";
import "./App.css";

// ── API health check ───────────────────────────────────────

type ApiStatus = "checking" | "ok" | "error";

function useApiHealth(): ApiStatus {
  const [status, setStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => (r.ok ? setStatus("ok") : setStatus("error")))
      .catch(() => setStatus("error"));
  }, []);

  return status;
}

// ── Tabs ───────────────────────────────────────────────────

const TABS = [
  { id: "pose-library",  label: "Pose Library",   src: "/pages/pose-library.html" },
  { id: "flow-editor",   label: "Flow Editor",   src: "/pages/flow-editor.html"  },
  { id: "svg-tracer",    label: "SVG Tracer",     src: "/pages/svg-tracer.html"   },
  { id: "flow-editor-v2", label: "Flow Editor v2", src: "/pages/flow-editor-v2.html" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Full-height iframe page ────────────────────────────────

function IframePage({ src, title }: { src: string; title: string }) {
  return (
    <iframe
      src={src}
      title={title}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        display: "block",
      }}
    />
  );
}

// ── App shell ──────────────────────────────────────────────

function App() {
  const [activeTab, setActiveTab] = useState<TabId>("pose-library");
  const apiStatus = useApiHealth();

  const statusLabel =
    apiStatus === "checking" ? "API …"
    : apiStatus === "ok"     ? "API ✓"
    :                          "API ✗";

  const activeTabDef = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="admin-layout">
      {/* Header */}
      <header className="admin-header">
        <h1>Timer App Yoga</h1>
        <span className="badge">Admin</span>
        <span
          className={`status ${
            apiStatus === "ok" ? "ok" : apiStatus === "error" ? "error" : ""
          }`}
        >
          {statusLabel}
        </span>
      </header>

      {/* Nav */}
      <nav className="admin-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content — full-height iframe */}
      <main className="admin-main">
        <IframePage src={activeTabDef.src} title={activeTabDef.label} />
      </main>
    </div>
  );
}

export default App;
