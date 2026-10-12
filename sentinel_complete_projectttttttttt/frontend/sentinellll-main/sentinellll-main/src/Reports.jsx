import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  Shield,
  IndianRupee,
  Search,
  Filter,
  ArrowLeft,
  Building2,
  Droplets,
  Zap,
  Leaf,
  FileSpreadsheet,
  Download,
  Flame,
  Check,
  User,
  Lock,
  LogOut,
  X
} from "lucide-react";
import {
  fetchReports,
  submitReport,
  updateReportStatus,
  fetchLossAnalytics,
  adminLogin,
  fetchBuildings,
} from "./api";
import "./Reports.css";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [lossMetrics, setLossMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState([]);

  // Filter & Search
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL, PENDING, SOLVED, MY_REPORTS
  const [searchQuery, setSearchQuery] = useState("");
  const [resourceFilter, setResourceFilter] = useState("ALL");

  // User & Admin Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem("sentinel_user_name") || "Student User";
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("sentinel_is_admin") === "true";
  });
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminUsername, setAdminUsername] = useState("admin");
  const [adminError, setAdminError] = useState("");

  // Create Report Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    author: currentUser,
    zone: "Maa Saraswati Block - Lab 204",
    resource: "Electricity",
    severity: "WARNING",
    notes: "",
  });

  // Resolve Modal State
  const [resolvingReport, setResolvingReport] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState(
    "Inspected on-site. Virtual relay cutoff engaged and line throttled."
  );

  useEffect(() => {
    loadData();
    loadBuildingList();
  }, [currentUser]);

  async function loadData() {
    setLoading(true);
    try {
      const [reps, metrics] = await Promise.all([
        fetchReports(),
        fetchLossAnalytics(),
      ]);
      setReports(reps || []);
      setLossMetrics(metrics || null);
    } catch (err) {
      console.warn("Could not load reports data", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadBuildingList() {
    const blds = await fetchBuildings();
    if (blds && blds.length > 0) {
      setBuildings(blds.map((b) => b.name));
    } else {
      setBuildings([
        "Maa Saraswati Block",
        "EEE Block",
        "Architecture Block",
        "Central Library",
        "Administration Wing",
        "Hostel Block A & B",
      ]);
    }
  }

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  async function handleAdminAuth(e) {
    e.preventDefault();
    setAdminError("");
    const res = await adminLogin(adminUsername, adminPassword);
    if (res.success) {
      setIsAdmin(true);
      localStorage.setItem("sentinel_is_admin", "true");
      setAdminModalOpen(false);
      setAdminPassword("");
      showToast("🛡️ Admin mode activated! You can now resolve reports.");
    } else {
      setAdminError(res.message || "Invalid credentials. Use 'admin' / 'pass111'");
    }
  }

  function handleAdminLogout() {
    setIsAdmin(false);
    localStorage.removeItem("sentinel_is_admin");
    showToast("Logged out of Admin mode.");
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!formData.notes.trim()) {
      alert("Please provide details about the problem.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        author: currentUser || "Anonymous Student",
        userRole: isAdmin ? "admin" : "student",
      };
      const res = await submitReport(payload);
      if (res && res.success) {
        showToast(`✅ Report [${res.report.id}] submitted! Status: PENDING`);
        setCreateModalOpen(false);
        setFormData({
          author: currentUser,
          zone: buildings[0] || "General Campus",
          resource: "Electricity",
          severity: "WARNING",
          notes: "",
        });
        loadData();
      } else {
        alert("Failed to submit report. Please try again.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmResolve() {
    if (!resolvingReport) return;
    try {
      const res = await updateReportStatus(resolvingReport.id, {
        status: "SOLVED",
        resolvedBy: "admin",
        resolutionNotes: resolutionNotes,
      });
      if (res && res.success) {
        showToast(`🛡️ Report [${resolvingReport.id}] marked as SOLVED! Loss averted recorded.`);
        setResolvingReport(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    // Status filter
    if (activeFilter === "PENDING" && r.status !== "PENDING") return false;
    if (activeFilter === "SOLVED" && r.status !== "SOLVED") return false;
    if (activeFilter === "MY_REPORTS" && r.author?.toLowerCase() !== currentUser?.toLowerCase())
      return false;

    // Resource filter
    if (resourceFilter !== "ALL" && r.resource?.toLowerCase() !== resourceFilter.toLowerCase())
      return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = r.id?.toLowerCase().includes(q);
      const matchZone = r.zone?.toLowerCase().includes(q);
      const matchNotes = r.notes?.toLowerCase().includes(q);
      const matchAuthor = r.author?.toLowerCase().includes(q);
      if (!matchId && !matchZone && !matchNotes && !matchAuthor) return false;
    }

    return true;
  });

  const pendingCount = reports.filter((r) => r.status === "PENDING").length;
  const solvedCount = reports.filter((r) => r.status === "SOLVED").length;
  const sustainedLoss = lossMetrics?.sustainedLossPerHour || 0;
  const lossAverted = lossMetrics?.totalLossAverted || 0;

  function exportCSV() {
    const headers = [
      "ID",
      "Timestamp",
      "Author",
      "Zone",
      "Resource",
      "Severity",
      "Status",
      "EstimatedLossPerHour",
      "Notes",
      "SolvedAt",
      "ResolutionNotes",
    ];
    const rows = filteredReports.map((r) => [
      r.id,
      r.timestamp,
      `"${r.author || ""}"`,
      `"${r.zone || ""}"`,
      r.resource,
      r.severity,
      r.status,
      r.estimatedLossPerHour || 0,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
      r.solvedAt || "",
      `"${(r.resolutionNotes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sentinel_reports_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <main className="reports-page">
      {/* Toast Notification */}
      {toastMessage && <div className="reports-toast">{toastMessage}</div>}

      {/* Top Bar */}
      <header className="reports-topbar">
        <div className="reports-topbar-left">
          <button
            className="reports-back-btn"
            onClick={() => (window.location.href = "/dashboard")}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div className="reports-badge-sentinel">
            <span className="pulse-dot" /> SENTINEL INCIDENT HUB
          </div>
        </div>

        <div className="reports-topbar-right">
          <button
            className="reports-btn-create"
            onClick={() => setCreateModalOpen(true)}
          >
            <PlusCircle size={16} /> Report a Problem
          </button>

          {isAdmin ? (
            <div className="admin-status-pill">
              <Shield size={14} className="text-emerald-400" />
              <span>ADMIN MODE (ACTIVE)</span>
              <button
                className="admin-logout-btn"
                onClick={handleAdminLogout}
                title="Exit admin mode"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              className="reports-btn-admin-login"
              onClick={() => setAdminModalOpen(true)}
            >
              <Lock size={14} /> Admin Login
            </button>
          )}
        </div>
      </header>

      {/* Hero / Header */}
      <section className="reports-hero">
        <div className="reports-hero-copy">
          <span className="reports-eyebrow">CAMPUS PROBLEM DISPATCH & RESOLUTION</span>
          <h1>Incident Reports & Resolution</h1>
          <p>
            Report resource leakages, off-hour phantom loads, and facilities
            anomalies across SVVV campus. Track pending investigations and loss
            averted in real time.
          </p>
        </div>
      </section>

      {/* KPI Metric Strips */}
      <section className="reports-kpi-grid">
        <div className="reports-kpi-card">
          <div className="kpi-icon-wrap amber">
            <Clock size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Awaiting Resolution</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{pendingCount}</span>
              <span className="kpi-sub">Pending reports</span>
            </div>
            <span className="kpi-trend text-amber">Active monitoring</span>
          </div>
        </div>

        <div className="reports-kpi-card">
          <div className="kpi-icon-wrap emerald">
            <CheckCircle2 size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Resolved Incidents</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{solvedCount}</span>
              <span className="kpi-sub">Problems solved</span>
            </div>
            <span className="kpi-trend text-emerald">Verified by Facilities</span>
          </div>
        </div>

        <div className="reports-kpi-card">
          <div className="kpi-icon-wrap rose">
            <Flame size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Sustained Loss Rate</span>
            <div className="kpi-value-row">
              <span className="kpi-value">₹{sustainedLoss.toFixed(1)}</span>
              <span className="kpi-sub">/ hour</span>
            </div>
            <span className="kpi-trend text-rose">Ongoing pending drain</span>
          </div>
        </div>

        <div className="reports-kpi-card">
          <div className="kpi-icon-wrap purple">
            <IndianRupee size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Financial Loss Averted</span>
            <div className="kpi-value-row">
              <span className="kpi-value">₹{lossAverted.toLocaleString()}</span>
              <span className="kpi-sub">Campus savings</span>
            </div>
            <span className="kpi-trend text-purple">Via proactive cutoff</span>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="reports-toolbar">
        <div className="reports-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by ID, building, problem notes, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="reports-filter-pills">
          {[
            { id: "ALL", label: `All (${reports.length})` },
            { id: "PENDING", label: `Pending (${pendingCount})` },
            { id: "SOLVED", label: `Solved (${solvedCount})` },
            { id: "MY_REPORTS", label: "My Reports" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`filter-pill ${activeFilter === tab.id ? "active" : ""}`}
              onClick={() => setActiveFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="reports-actions-row">
          <select
            className="reports-resource-select"
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
          >
            <option value="ALL">All Resources</option>
            <option value="Electricity">⚡ Electricity</option>
            <option value="Water">💧 Water</option>
            <option value="HVAC">❄️ HVAC / AC</option>
          </select>

          <button className="reports-btn-export" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </section>

      {/* Reports Queue List */}
      <section className="reports-content">
        {loading ? (
          <div className="reports-empty-state">
            <div className="spinner" />
            <p>Loading campus incident records...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="reports-empty-state">
            <CheckCircle2 size={40} className="text-slate-500" />
            <h3>No incidents match your filter</h3>
            <p>There are no reported problems in this category at the moment.</p>
            <button
              className="reports-btn-create"
              onClick={() => setCreateModalOpen(true)}
            >
              <PlusCircle size={15} /> Log an Incident
            </button>
          </div>
        ) : (
          <div className="reports-grid">
            {filteredReports.map((r) => {
              const isSolved = r.status === "SOLVED";
              const isCritical = r.severity === "CRITICAL";
              const isWarning = r.severity === "WARNING";

              return (
                <article
                  key={r.id}
                  className={`report-card ${isSolved ? "card-solved" : "card-pending"} ${
                    isCritical && !isSolved ? "card-critical" : ""
                  }`}
                >
                  <div className="report-card-header">
                    <div className="report-id-wrap">
                      <span className="report-id">{r.id}</span>
                      <span className="report-timestamp">{r.timestamp}</span>
                    </div>

                    <div className="report-status-badges">
                      <span
                        className={`status-pill ${
                          isSolved ? "status-solved" : "status-pending"
                        }`}
                      >
                        {isSolved ? (
                          <>
                            <Check size={12} /> SOLVED
                          </>
                        ) : (
                          <>
                            <span className="pulse-mini-dot" /> PENDING
                          </>
                        )}
                      </span>

                      <span
                        className={`severity-pill ${
                          isCritical ? "sev-critical" : isWarning ? "sev-warning" : "sev-info"
                        }`}
                      >
                        {r.severity}
                      </span>
                    </div>
                  </div>

                  <div className="report-meta-row">
                    <span className="report-zone">
                      <Building2 size={14} /> {r.zone || "SVVV Campus"}
                    </span>
                    <span className="report-resource">
                      {r.resource === "Electricity" ? (
                        <Zap size={14} className="text-amber-400" />
                      ) : (
                        <Droplets size={14} className="text-blue-400" />
                      )}{" "}
                      {r.resource}
                    </span>
                  </div>

                  <p className="report-notes">{r.notes}</p>

                  <div className="report-loss-box">
                    {isSolved ? (
                      <div className="loss-saved-text">
                        <span>Averted Savings:</span>
                        <strong>+₹{r.lossAvertedTotal || 450}</strong>
                      </div>
                    ) : (
                      <div className="loss-drain-text">
                        <span>Est. Sustained Drain:</span>
                        <strong>₹{r.estimatedLossPerHour || 55.0}/hr</strong>
                      </div>
                    )}
                    <span className="report-author">
                      By: <strong>{r.author || "Student"}</strong>
                    </span>
                  </div>

                  {isSolved && r.resolutionNotes && (
                    <div className="resolution-notes-box">
                      <div className="resolution-header">
                        <CheckCircle2 size={13} />
                        <span>Resolution by {r.resolvedBy || "admin"} ({r.solvedAt || "Verified"}):</span>
                      </div>
                      <p>{r.resolutionNotes}</p>
                    </div>
                  )}

                  {/* Admin Action Button */}
                  {!isSolved && (
                    <div className="report-actions">
                      {isAdmin ? (
                        <button
                          className="btn-admin-resolve"
                          onClick={() => {
                            setResolvingReport(r);
                          }}
                        >
                          <Shield size={14} /> Resolve & Mark Solved
                        </button>
                      ) : (
                        <div className="user-pending-note">
                          <Clock size={13} /> Dispatched to Campus Facilities Admin
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* CREATE REPORT MODAL */}
      {createModalOpen && (
        <div className="modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <PlusCircle size={20} className="text-purple-400" />
                <h3>Report a Campus Problem</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setCreateModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="modal-form">
              <div className="form-group">
                <label>Your Name / Student ID</label>
                <input
                  type="text"
                  required
                  value={formData.author}
                  onChange={(e) => {
                    setFormData({ ...formData, author: e.target.value });
                    setCurrentUser(e.target.value);
                    localStorage.setItem("sentinel_user_name", e.target.value);
                  }}
                  placeholder="Enter your name or ID"
                />
              </div>

              <div className="form-group">
                <label>Building / Campus Space</label>
                <select
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                >
                  {buildings.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="Central Library - 2nd Floor">Central Library - 2nd Floor</option>
                  <option value="CS Lab 2 (Computer Centre)">CS Lab 2 (Computer Centre)</option>
                  <option value="Hostel Block B Bathrooms">Hostel Block B Bathrooms</option>
                  <option value="Main Academic Corridor">Main Academic Corridor</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Resource Involved</label>
                  <select
                    value={formData.resource}
                    onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                  >
                    <option value="Electricity">Electricity / Lighting</option>
                    <option value="Water">Water / Pipeline</option>
                    <option value="HVAC">HVAC / Air Conditioning</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Severity Level</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  >
                    <option value="INFO">Low (Info)</option>
                    <option value="WARNING">Medium (Warning)</option>
                    <option value="CRITICAL">High (Critical Leak/Waste)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Problem Description & Location Specifics</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe what you observed (e.g. continuous leak, computers running all night, corridor lights on during daylight)..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Incident Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN LOGIN MODAL */}
      {adminModalOpen && (
        <div className="modal-backdrop" onClick={() => setAdminModalOpen(false)}>
          <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Shield size={20} className="text-purple-400" />
                <h3>Facilities Admin Verification</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setAdminModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdminAuth} className="modal-form">
              {adminError && <div className="admin-error-box">{adminError}</div>}

              <div className="form-group">
                <label>Admin Username</label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin"
                />
              </div>

              <div className="form-group">
                <label>Admin Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password (pass111)"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setAdminModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Login as Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE REPORT MODAL */}
      {resolvingReport && (
        <div className="modal-backdrop" onClick={() => setResolvingReport(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <CheckCircle2 size={20} className="text-emerald-400" />
                <h3>Mark Report as SOLVED</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setResolvingReport(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-form">
              <p className="resolve-prompt">
                Resolving <strong>{resolvingReport.id}</strong> in{" "}
                <strong>{resolvingReport.zone}</strong>. Enter action taken:
              </p>

              <div className="form-group">
                <label>Facilities Resolution Summary</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Virtual cutoff engaged. Pressure valve throttled."
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setResolvingReport(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-resolve-confirm"
                  onClick={handleConfirmResolve}
                >
                  <Check size={16} /> Confirm Solved & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
