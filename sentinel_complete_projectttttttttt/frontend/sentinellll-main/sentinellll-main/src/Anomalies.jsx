import { useState, useEffect } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  Search,
  ShieldCheck,
  Zap,
  Droplets,
  Recycle,
  Sparkles,
  Play,
  Download,
  X,
  CheckCircle2,
  Sliders
} from "lucide-react";
import { alerts as fallbackAlerts } from "./data/demoData.js";
import { fetchAnomalies, explainAnomalyWithAI, createAction } from "./api.js";
import "./Anomalies.css";

const resourceIcons = {
  Electricity: Zap,
  Water: Droplets,
  Waste: Recycle,
};

export default function Anomalies() {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("All");
  const [resource, setResource] = useState("All");

  const [alertsList, setAlertsList] = useState(fallbackAlerts);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [runningDetection, setRunningDetection] = useState(false);
  const [actionDone, setActionDone] = useState(false);

  useEffect(() => {
    async function loadAnomalies() {
      const data = await fetchAnomalies();
      if (data && data.length > 0) {
        const mapped = data.map((a) => ({
          id: a.id,
          title: `${a.anomaly_type.replace("_", " ").toUpperCase()}: ${a.space_name || "Zone"}`,
          building: a.building_name || "Campus Block",
          severity: a.severity === "high" ? "High" : "Medium",
          resource: (a.resource_type || "electricity").charAt(0).toUpperCase() + (a.resource_type || "electricity").slice(1),
          baseline: a.baseline,
          actual: a.actual_value || (a.baseline * (1 + a.deviation_pct / 100)),
          deviationPct: a.deviation_pct,
          score: a.score,
          status: a.status,
          code: a.explanation_code,
          unit: a.unit || "kWh",
          time: `Score: ${a.score}σ (${a.status})`,
          raw: a
        }));
        setAlertsList(mapped);
      }
    }
    loadAnomalies();
  }, []);

  const filteredAlerts = alertsList.filter((alert) => {
    const query = search.toLowerCase();

    const matchesSearch =
      alert.title.toLowerCase().includes(query) ||
      alert.building.toLowerCase().includes(query);

    const matchesSeverity =
      severity === "All" || alert.severity === severity;

    const matchesResource =
      resource === "All" || alert.resource === resource;

    return matchesSearch && matchesSeverity && matchesResource;
  });

  const highCount = alertsList.filter(
    (alert) => alert.severity === "High"
  ).length;

  async function handleOpenDetail(alert) {
    setSelectedAnomaly(alert);
    setDrawerOpen(true);
    setAiExplanation(null);
    setActionDone(false);
  }

  async function handleAskAI() {
    if (!selectedAnomaly) return;
    setAiLoading(true);
    const res = await explainAnomalyWithAI(
      selectedAnomaly.raw ? selectedAnomaly.raw.id : selectedAnomaly.id,
      `Explain this alert for facilities coordinators.`
    );
    setAiExplanation(res);
    setAiLoading(false);
  }

  async function handleTakeAction() {
    if (!selectedAnomaly) return;
    await createAction({
      prediction_id: selectedAnomaly.raw ? selectedAnomaly.raw.id : null,
      title: `Resolve ${selectedAnomaly.title}`,
      owner: "Lead Facilities Officer",
      status: "in_progress",
      notes: aiExplanation ? aiExplanation.summary : "Action dispatched via Sentinel Anomaly Center."
    });
    setActionDone(true);
  }

  async function handleRunDetection() {
    setRunningDetection(true);
    try {
      const res = await fetch("/api/v1/anomalies/run", { method: "POST" });
      if (res.ok) {
        const fresh = await fetchAnomalies();
        if (fresh) {
          setAlertsList(fresh.map((a) => ({
            id: a.id,
            title: `${a.anomaly_type.replace("_", " ").toUpperCase()}: ${a.space_name || "Zone"}`,
            building: a.building_name || "Campus Block",
            severity: a.severity === "high" ? "High" : "Medium",
            resource: (a.resource_type || "electricity").charAt(0).toUpperCase() + (a.resource_type || "electricity").slice(1),
            baseline: a.baseline,
            actual: a.actual_value,
            deviationPct: a.deviation_pct,
            score: a.score,
            status: a.status,
            code: a.explanation_code,
            unit: a.unit || "kWh",
            time: `Score: ${a.score}σ (${a.status})`,
            raw: a
          })));
        }
      }
    } finally {
      setRunningDetection(false);
    }
  }

  return (
    <main className="anomalies-page">
      <header className="anomalies-topbar">
        <button
          className="anomalies-back"
          onClick={() => (window.location.href = "/dashboard")}
        >
          <ArrowLeft size={18} />
          Back to dashboard
        </button>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={handleRunDetection}
            disabled={runningDetection}
            style={{
              background: "rgba(155, 118, 255, 0.2)",
              border: "1px solid rgba(155, 118, 255, 0.4)",
              color: "#c7b3ff",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Play size={13} />
            {runningDetection ? "Evaluating Models..." : "Run Anomaly Engine"}
          </button>

          <a
            href="/api/v1/export/summary.csv"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#fff",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Download size={13} /> Export CSV
          </a>

          <a
            href="/reports"
            style={{
              background: "rgba(124, 58, 237, 0.2)",
              border: "1px solid rgba(124, 58, 237, 0.4)",
              color: "#c4b5fd",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: "600",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            Incident Reports
          </a>

          <a
            href="/analytics"
            style={{
              background: "rgba(79, 70, 229, 0.2)",
              border: "1px solid rgba(79, 70, 229, 0.4)",
              color: "#a5b4fc",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: "600",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            Excel Analytics
          </a>

          <span className="anomalies-demo">FASTAPI LIVE</span>
        </div>
      </header>

      <section className="anomalies-heading">
        <p className="anomalies-eyebrow">
          SENTINEL / CAMPUS MONITORING
        </p>
        <h1>Anomaly alerts</h1>
        <p>
          Inspect high-frequency telemetry spikes, baseline deviations, and AI diagnostics.
        </p>
      </section>

      <section className="anomaly-summary">
        <article>
          <AlertTriangle size={22} />
          <span>Active detected alerts</span>
          <strong>{alertsList.length}</strong>
        </article>

        <article>
          <ShieldCheck size={22} />
          <span>High-severity alerts</span>
          <strong>{highCount}</strong>
        </article>

        <article>
          <Search size={22} />
          <span>Matching filters</span>
          <strong>{filteredAlerts.length}</strong>
        </article>
      </section>

      <section className="anomaly-list-section">
        <div className="anomaly-list-heading">
          <div>
            <p className="anomalies-eyebrow">ALERT MANAGEMENT</p>
            <h2>Campus alerts</h2>
          </div>
          <span>{filteredAlerts.length} results</span>
        </div>

        <div className="anomaly-filters">
          <label className="anomaly-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search alerts or buildings..."
            />
          </label>

          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
            aria-label="Filter by severity"
          >
            <option value="All">All severities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={resource}
            onChange={(event) => setResource(event.target.value)}
            aria-label="Filter by resource"
          >
            <option value="All">All resources</option>
            <option value="Electricity">Electricity</option>
            <option value="Water">Water</option>
            <option value="Waste">Waste</option>
          </select>
        </div>

        <div className="anomaly-list">
          {filteredAlerts.map((alert) => {
            const Icon = resourceIcons[alert.resource] || AlertTriangle;

            return (
              <article
                className="anomaly-card"
                key={alert.id}
                onClick={() => handleOpenDetail(alert)}
                style={{ cursor: "pointer" }}
              >
                <div className="anomaly-resource-icon">
                  <Icon size={22} />
                </div>

                <div className="anomaly-card-content">
                  <div className="anomaly-card-title">
                    <h3>{alert.title}</h3>
                    <span
                      className={`severity-pill severity-${alert.severity.toLowerCase()}`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  <p>{alert.building}</p>

                  <div className="anomaly-card-meta">
                    <span>{alert.resource}</span>
                    <span>{alert.time}</span>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredAlerts.length === 0 && (
            <div className="anomaly-empty">
              <Search size={25} />
              <h3>No matching alerts</h3>
              <p>Try changing your search or filters.</p>
            </div>
          )}
        </div>

        <p className="anomaly-disclaimer">
          Synchronized with Sentinel Anomaly Inference Service (Rolling Z-Score & Scikit-learn Pipeline).
        </p>
      </section>

      {/* Detailed Anomaly Drawer */}
      {drawerOpen && selectedAnomaly && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "flex-end",
          zIndex: 9999
        }}>
          <div style={{
            background: "#15121f",
            width: "100%",
            maxWidth: "480px",
            height: "100%",
            padding: "24px",
            overflowY: "auto",
            borderLeft: "1px solid rgba(155, 118, 255, 0.3)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span className={`severity-pill severity-${selectedAnomaly.severity.toLowerCase()}`}>
                  {selectedAnomaly.severity} Severity
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{ background: "none", border: "none", color: "#8f8a9f", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <h2 style={{ fontSize: "20px", margin: "0 0 6px", fontWeight: "700" }}>{selectedAnomaly.title}</h2>
              <p style={{ color: "#a68aff", margin: "0 0 20px", fontSize: "13px" }}>{selectedAnomaly.building}</p>

              <div style={{ background: "rgba(255, 255, 255, 0.04)", borderRadius: "8px", padding: "16px", marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#8f8a9f", display: "block" }}>Observed Reading</span>
                  <strong style={{ fontSize: "16px", color: "#f87171" }}>
                    {selectedAnomaly.actual ? Number(selectedAnomaly.actual).toFixed(1) : "—"} {selectedAnomaly.unit}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#8f8a9f", display: "block" }}>Expected Baseline</span>
                  <strong style={{ fontSize: "16px", color: "#34d399" }}>
                    {selectedAnomaly.baseline ? Number(selectedAnomaly.baseline).toFixed(1) : "—"} {selectedAnomaly.unit}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#8f8a9f", display: "block" }}>Deviation</span>
                  <strong style={{ fontSize: "14px", color: "#fbbf24" }}>+{selectedAnomaly.deviationPct || "—"}%</strong>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "#8f8a9f", display: "block" }}>Reason Code</span>
                  <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#c7b3ff" }}>{selectedAnomaly.code || "Z_SCORE_EXCEEDED"}</span>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <button
                  onClick={handleAskAI}
                  disabled={aiLoading}
                  style={{
                    width: "100%",
                    background: "rgba(155, 118, 255, 0.2)",
                    border: "1px solid rgba(155, 118, 255, 0.4)",
                    color: "#c7b3ff",
                    borderRadius: "8px",
                    padding: "10px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontSize: "13px"
                  }}
                >
                  <Sparkles size={16} />
                  {aiLoading ? "Generating Gemini Explanation..." : "Ask Gemini AI Explanation"}
                </button>
              </div>

              {aiExplanation && (
                <div style={{ background: "rgba(155, 118, 255, 0.08)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(155, 118, 255, 0.25)", fontSize: "12px", lineHeight: "1.5", marginBottom: "20px" }}>
                  <strong style={{ color: "#a68aff", display: "block", marginBottom: "4px" }}>AI Ground-Truth Explanation:</strong>
                  <p style={{ margin: "0 0 10px", color: "#e2ddff" }}>{aiExplanation.summary}</p>

                  <strong style={{ color: "#a68aff", display: "block", marginBottom: "4px" }}>Recommended Checks:</strong>
                  <ul style={{ margin: 0, paddingLeft: "16px", color: "#c7b3ff" }}>
                    {aiExplanation.suggested_checks?.map((chk, i) => (
                      <li key={i} style={{ marginBottom: "3px" }}>{chk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <button
                onClick={handleTakeAction}
                disabled={actionDone}
                style={{
                  width: "100%",
                  background: actionDone ? "#10B981" : "#7c3aed",
                  color: "#fff",
                  border: "none",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "13px"
                }}
              >
                {actionDone ? <><CheckCircle2 size={16} /> Work Order Created in Backend</> : "Trigger Virtual Cutoff / Work Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
