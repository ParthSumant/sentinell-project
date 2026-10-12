import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  Droplets,
  LayoutDashboard,
  Leaf,
  Recycle,
  ShieldCheck,
  Zap,
  Menu,
  X,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Download,
  ClipboardList,
  FileSpreadsheet
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import {
  buildings as fallbackBuildings,
  resourceTotals as fallbackTotals,
  consumptionData,
  alerts as fallbackAlerts,
} from "./data/demoData";

import {
  fetchOverview,
  fetchBuildings,
  fetchAnomalies,
  explainAnomalyWithAI,
  createAction,
} from "./api";

import "./Dashboard.css";

const iconMap = {
  Zap,
  Droplets,
  Recycle,
  Leaf,
};

function Dashboard() {
  const [selectedBuilding, setSelectedBuilding] = useState("All buildings");
  const [selectedResource, setSelectedResource] = useState("electricity");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Overview");

  // Synchronized Backend States
  const [backendConnected, setBackendConnected] = useState(false);
  const [buildingsList, setBuildingsList] = useState(fallbackBuildings);
  const [resourceCards, setResourceCards] = useState(fallbackTotals);
  const [alertsList, setAlertsList] = useState(fallbackAlerts);
  
  // AI Explanation Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(false);

  useEffect(() => {
    async function loadBackendData() {
      try {
        const [overviewData, bldData, anomalyData] = await Promise.all([
          fetchOverview(),
          fetchBuildings(),
          fetchAnomalies(),
        ]);

        if (overviewData) {
          setBackendConnected(true);
          
          // Map backend overview KPIs to Resource Cards
          setResourceCards([
            {
              name: "Electricity",
              value: overviewData.electricity_kpi.value.toLocaleString(),
              unit: overviewData.electricity_kpi.unit,
              change: `${overviewData.electricity_kpi.trend_pct}% vs baseline`,
              icon: "Zap",
            },
            {
              name: "Water",
              value: overviewData.water_kpi.value.toLocaleString(),
              unit: overviewData.water_kpi.unit,
              change: `${overviewData.water_kpi.trend_pct > 0 ? "+" : ""}${overviewData.water_kpi.trend_pct}% vs baseline`,
              icon: "Droplets",
            },
            {
              name: "Waste",
              value: overviewData.waste_kpi.value.toLocaleString(),
              unit: overviewData.waste_kpi.unit,
              change: `${overviewData.waste_kpi.trend_pct}% vs baseline`,
              icon: "Recycle",
            },
            {
              name: "Cost / Carbon",
              value: `₹${Math.round(overviewData.estimated_cost_inr).toLocaleString()}`,
              unit: "INR",
              change: `${Math.round(overviewData.electricity_kpi.value * 0.82).toLocaleString()} kg CO₂e`,
              icon: "Leaf",
            },
          ]);
        }

        if (bldData && bldData.length > 0) {
          setBuildingsList(bldData.map((b) => b.name));
        }

        if (anomalyData && anomalyData.length > 0) {
          const mappedAlerts = anomalyData.map((a, index) => ({
            id: a.id,
            title: `${a.anomaly_type.replace("_", " ").toUpperCase()}: ${a.space_name || "Zone"} (+${a.deviation_pct}%)`,
            building: a.building_name || "Campus Block",
            severity: a.severity === "high" ? "High" : "Medium",
            resource: (a.resource_type || "electricity").charAt(0).toUpperCase() + (a.resource_type || "electricity").slice(1),
            rawAnomaly: a,
            time: `Score: ${a.score}σ (${a.status})`,
          }));
          setAlertsList(mappedAlerts);
        }
      } catch (err) {
        console.warn("Using offline fallback data:", err);
      }
    }

    loadBackendData();
  }, []);

  const filteredAlerts =
    selectedBuilding === "All buildings"
      ? alertsList
      : alertsList.filter((alert) => alert.building === selectedBuilding);

  const resourceLabel =
    selectedResource.charAt(0).toUpperCase() + selectedResource.slice(1);

  const resourceUnit = {
    electricity: "kWh",
    water: "kL",
    waste: "kg",
  }[selectedResource];

  function navigateTo(section) {
    setActiveSection(section);
    setSidebarOpen(false);

    const element = document.getElementById(
      section.toLowerCase().replaceAll(" ", "-")
    );

    element?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleAskAI(alert) {
    setActiveAlert(alert);
    setAiModalOpen(true);
    setAiLoading(true);
    setActionSuccess(false);

    const res = await explainAnomalyWithAI(
      alert.rawAnomaly ? alert.rawAnomaly.id : "PRED-CSLAB2-PHANTOM",
      `Explain this ${alert.resource} anomaly in ${alert.building} and suggest next checks for the facilities engineer.`
    );

    setAiExplanation(res);
    setAiLoading(false);
  }

  async function handleCreateAction(alert) {
    if (!alert) return;
    const payload = {
      prediction_id: alert.rawAnomaly ? alert.rawAnomaly.id : null,
      title: `Investigate ${alert.title}`,
      owner: "Facilities Engineer",
      status: "in_progress",
      notes: aiExplanation ? aiExplanation.summary : "Action dispatched via Sentinel Dashboard."
    };
    await createAction(payload);
    setActionSuccess(true);
  }

  return (
    <main className="dashboard">
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`dashboard-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <a className="dashboard-brand" href="/">
          <span className="dashboard-brand-mark">S</span>
          <span>SENTINEL<span className="brand-dot">.</span></span>
        </a>

        <div className="workspace-label">WORKSPACE</div>

        {[
          { name: "Overview", icon: LayoutDashboard },
          { name: "Resources", icon: Activity },
          { name: "Anomalies", icon: AlertTriangle, link: "/anomalies" },
          { name: "Incident Reports", icon: ClipboardList, link: "/reports" },
          { name: "Excel Data Analytics", icon: FileSpreadsheet, link: "/analytics" },
          { name: "Buildings", icon: Building2 },
          { name: "Recommendations", icon: ShieldCheck },
        ].map(({ name, icon: Icon, link }) => (
          <button
            className={`sidebar-link ${activeSection === name ? "active" : ""}`}
            key={name}
            onClick={() => {
              if (link) {
                window.location.href = link;
              } else {
                navigateTo(name);
              }
            }}
          >
            <Icon size={17} />
            <span>{name}</span>
          </button>
        ))}

        <div className="sidebar-bottom">
          <span className="sidebar-status-dot" style={{ backgroundColor: backendConnected ? "#10B981" : "#F59E0B" }} />
          {backendConnected ? "FASTAPI + SUPABASE SYNCED" : "OFFLINE DEMO MODE"}
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <button
            className="mobile-nav-toggle"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X /> : <Menu />}
          </button>

          <div>
            <div className="dashboard-breadcrumb">SENTINEL / WORKSPACE</div>
            <h1>Campus overview</h1>
            <p>Understand your campus. Make smarter decisions.</p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span className="demo-tag" style={{ color: backendConnected ? "#10B981" : "#F59E0B" }}>
              ● {backendConnected ? "BACKEND LIVE" : "DEMO DATA"}
            </span>
            <a
              href="/api/v1/export/summary.csv"
              className="demo-tag"
              style={{ textDecoration: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
              title="Download CSV report matching current filters"
            >
              <Download size={13} /> EXPORT CSV
            </a>
          </div>
        </header>

        <section className="dashboard-welcome" id="overview">
          <div>
            <span className="dashboard-eyebrow">CAMPUS INTELLIGENCE SYSTEM</span>
            <h2>Every resource tells a story.</h2>
            <p>
              A unified view of resource consumption, potential anomalies,
              and campus sustainability across Shri Vaishnav Vidyapeeth Vishwavidyalaya.
            </p>
          </div>
          <div className="welcome-orbit" aria-hidden="true">S</div>
        </section>

        <section className="dashboard-section" id="resources">
          <div className="dashboard-section-heading">
            <div>
              <span className="section-overline">RESOURCE MONITORING</span>
              <h2>Resource overview</h2>
            </div>

            <select
              aria-label="Filter dashboard by building"
              value={selectedBuilding}
              onChange={(event) => setSelectedBuilding(event.target.value)}
            >
              <option>All buildings</option>
              {buildingsList.map((building) => (
                <option key={building}>{building}</option>
              ))}
            </select>
          </div>

          <div className="resource-grid">
            {resourceCards.map((resource) => {
              const Icon = iconMap[resource.icon] || Zap;

              return (
                <article className="resource-card" key={resource.name}>
                  <div className="resource-card-top">
                    <span className="resource-icon"><Icon size={20} /></span>
                    <ArrowUpRight size={17} className="resource-arrow" />
                  </div>

                  <p>{resource.name}</p>

                  <div className="resource-value">
                    {resource.value}
                    <span>{resource.unit}</span>
                  </div>

                  <small>{resource.change}</small>
                </article>
              );
            })}
          </div>
        </section>

        <section className="dashboard-panel" id="anomalies">
          <div className="dashboard-section-heading">
            <div>
              <span className="section-overline">PATTERN MONITORING</span>
              <h2>Consumption analytics</h2>
            </div>

            <select
              aria-label="Choose resource chart"
              value={selectedResource}
              onChange={(event) => setSelectedResource(event.target.value)}
            >
              <option value="electricity">Electricity</option>
              <option value="water">Water</option>
              <option value="waste">Waste</option>
            </select>
          </div>

          <p className="chart-caption">
            Weekly telemetry trend · {resourceLabel} · {resourceUnit}
          </p>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={consumptionData}>
                <defs>
                  <linearGradient id="resourceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9b76ff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#9b76ff" stopOpacity={0.01} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="#ffffff10" vertical={false} />

                <XAxis
                  dataKey="day"
                  stroke="#8f8a9f"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  stroke="#8f8a9f"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  width={38}
                />

                <Tooltip
                  contentStyle={{
                    background: "#15121f",
                    border: "1px solid #594580",
                    borderRadius: 8,
                    color: "#ffffff",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey={selectedResource}
                  stroke="#a68aff"
                  strokeWidth={2.5}
                  fill="url(#resourceGradient)"
                  activeDot={{ r: 5, fill: "#c7b3ff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="dashboard-panel" id="buildings">
          <div className="dashboard-section-heading">
            <div>
              <span className="section-overline">CAMPUS DIRECTORY</span>
              <h2>Buildings & spaces</h2>
            </div>
            <span className="panel-count">{String(buildingsList.length).padStart(2, "0")} BUILDINGS</span>
          </div>

          <div className="building-list">
            {buildingsList.map((building, index) => (
              <button
                className="dashboard-building"
                key={building}
                onClick={() => {
                  setSelectedBuilding(building);
                  setActiveSection("Buildings");
                }}
              >
                <span className="building-code">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="building-details">
                  <strong>{building}</strong>
                  <small>Resource monitoring · Connected</small>
                </span>

                <ArrowUpRight size={17} />
              </button>
            ))}
          </div>

          <div className="integration-note">
            <Building2 size={17} />
            <p>
              <strong>SVVV Indore Campus Spatial Radar</strong>
              <span>
                Coordinates: 22.8145° N, 75.8459° E. Sub-meter pulse telemetry is monitored across 65 campus spaces.
              </span>
            </p>
          </div>
        </section>

        <section className="dashboard-panel" id="recommendations">
          <div className="dashboard-section-heading">
            <div>
              <span className="section-overline">ATTENTION REQUIRED</span>
              <h2>Resource alerts</h2>
            </div>
            <span className="panel-count">{filteredAlerts.length} ACTIVE ALERTS</span>
          </div>

          <div className="alert-list">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <article className="alert-item" key={alert.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span className={`alert-icon severity-${alert.severity.toLowerCase()}`}>
                      <AlertTriangle size={18} />
                    </span>

                    <div className="alert-details">
                      <strong>{alert.title}</strong>
                      <span>{alert.building} · {alert.resource} · {alert.time}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => handleAskAI(alert)}
                      style={{
                        background: "rgba(155, 118, 255, 0.15)",
                        border: "1px solid rgba(155, 118, 255, 0.35)",
                        color: "#c7b3ff",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        fontSize: "11px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px"
                      }}
                    >
                      <Sparkles size={13} />
                      Ask AI
                    </button>

                    <span className={`severity-tag severity-${alert.severity.toLowerCase()}`}>
                      {alert.severity}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-alert">
                No active anomalies for this building.
              </p>
            )}
          </div>

          <p className="demo-disclaimer">
            Integrated with Sentinel FastAPI Anomaly Engine. Rolling Z-Score and Scikit-learn detection pipelines active.
          </p>
        </section>

        <footer className="dashboard-footer">
          SENTINEL · CAMPUS INTELLIGENCE
          <span>BACKEND SYNCHRONIZED</span>
          <a href="/anomalies">Review Anomaly Center ↗</a>
        </footer>
      </section>

      {/* AI Explanation Modal */}
      {aiModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{
            background: "#15121f",
            border: "1px solid rgba(155, 118, 255, 0.4)",
            borderRadius: "16px",
            maxWidth: "540px",
            width: "100%",
            padding: "24px",
            color: "#fff",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={18} color="#a68aff" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Gemini Anomaly Explanation</h3>
              </div>
              <button
                onClick={() => setAiModalOpen(false)}
                style={{ background: "none", border: "none", color: "#8f8a9f", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {aiLoading ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#a68aff" }}>
                <Sparkles size={24} className="animate-spin" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: "13px" }}>Consulting Google Gemini with verified telemetry facts...</p>
              </div>
            ) : aiExplanation ? (
              <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                <div style={{ background: "rgba(155, 118, 255, 0.1)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(155, 118, 255, 0.2)", marginBottom: "16px" }}>
                  <strong>Diagnostic Summary:</strong>
                  <p style={{ margin: "4px 0 0", color: "#e2ddff" }}>{aiExplanation.summary}</p>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <strong>Ground-Truth Evidence:</strong>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "6px" }}>
                    {aiExplanation.evidence?.map((ev, i) => (
                      <div key={i} style={{ background: "rgba(255, 255, 255, 0.04)", padding: "8px", borderRadius: "6px", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", color: "#8f8a9f", display: "block" }}>{ev.label}</span>
                        <strong style={{ fontSize: "14px", color: "#a68aff" }}>{ev.value} {ev.unit}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <strong>Recommended Inspection Checks:</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: "18px", color: "#d1cde0" }}>
                    {aiExplanation.suggested_checks?.map((chk, i) => (
                      <li key={i} style={{ marginBottom: "4px" }}>{chk}</li>
                    ))}
                  </ul>
                </div>

                <p style={{ fontSize: "11px", color: "#8f8a9f", fontStyle: "italic", margin: "14px 0" }}>
                  Note: {aiExplanation.caveat}
                </p>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                  <button
                    onClick={() => setAiModalOpen(false)}
                    style={{ background: "transparent", border: "1px solid #594580", color: "#c7b3ff", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleCreateAction(activeAlert)}
                    disabled={actionSuccess}
                    style={{
                      background: actionSuccess ? "#10B981" : "#7c3aed",
                      border: "none",
                      color: "#fff",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    {actionSuccess ? <><CheckCircle2 size={14} /> Action Created</> : "Assign Facilities Action"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}

export default Dashboard;
