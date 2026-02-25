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

// ── Nav tabs ───────────────────────────────────────────────

const TABS = [
  { id: "flow-editor", label: "Flow Editor" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Placeholder pages ──────────────────────────────────────

function FlowEditorPlaceholder() {
  return (
    <div className="placeholder-card">
      <h2>Flow Editor</h2>
      <p>
        Yoga flow JSON editor — coming soon.
        <br />
        This will be a port of <code>assets/data/yoga-flow-editor.html</code>.
      </p>
    </div>
  );
}

// ── App shell ──────────────────────────────────────────────

function App() {
  const [activeTab, setActiveTab] = useState<TabId>("flow-editor");
  const apiStatus = useApiHealth();

  const statusLabel =
    apiStatus === "checking"
      ? "API …"
      : apiStatus === "ok"
      ? "API ✓"
      : "API ✗";

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

      {/* Content */}
      <main className="admin-main">
        {activeTab === "flow-editor" && <FlowEditorPlaceholder />}
      </main>
    </div>
  );
}

export default App;
