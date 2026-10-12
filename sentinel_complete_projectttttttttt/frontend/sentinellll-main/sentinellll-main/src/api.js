// Centralized API connector between Sentinel React Frontend and FastAPI Backend

const API_BASE = ""; // Relative path works both via Vite proxy and FastAPI direct mount

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend /health unreachable, using offline fallback", e);
  }
  return null;
}

export async function fetchOverview(buildingId = null) {
  try {
    const url = buildingId && buildingId !== "All buildings"
      ? `${API_BASE}/api/v1/overview?building_id=${encodeURIComponent(buildingId)}`
      : `${API_BASE}/api/v1/overview`;
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Failed to fetch /api/v1/overview", e);
  }
  return null;
}

export async function fetchBuildings() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/buildings`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Failed to fetch /api/v1/buildings", e);
  }
  return null;
}

export async function fetchSpaces(buildingId = null) {
  try {
    const url = buildingId
      ? `${API_BASE}/api/v1/spaces?building_id=${encodeURIComponent(buildingId)}`
      : `${API_BASE}/api/v1/spaces`;
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Failed to fetch /api/v1/spaces", e);
  }
  return null;
}

export async function fetchAnomalies(severity = null, status = null, buildingId = null) {
  try {
    const params = new URLSearchParams();
    if (severity && severity !== "All") params.append("severity", severity.toLowerCase());
    if (status && status !== "All") params.append("status", status.toLowerCase());
    if (buildingId && buildingId !== "All buildings") params.append("building_id", buildingId);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/api/v1/anomalies${query}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Failed to fetch /api/v1/anomalies", e);
  }
  return null;
}

export async function fetchAnomalyDetail(anomalyId) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/anomalies/${anomalyId}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`Failed to fetch /api/v1/anomalies/${anomalyId}`, e);
  }
  return null;
}

export async function explainAnomalyWithAI(anomalyId, question = "Explain this alert and suggest next checks.") {
  try {
    const res = await fetch(`${API_BASE}/api/v1/ai/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anomaly_id: anomalyId, question })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Failed to explain anomaly with AI", e);
  }
  return null;
}

export async function fetchImpactSummary() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/impact/summary`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Failed to fetch impact summary", e);
  }
  return null;
}

export async function fetchActions(status = null) {
  try {
    const query = status ? `?status=${status}` : "";
    const res = await fetch(`${API_BASE}/api/v1/actions${query}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Failed to fetch actions", e);
  }
  return [];
}

export async function createAction(payload) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Failed to create action", e);
  }
  return null;
}

export async function updateAction(actionId, payload) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/actions/${actionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`Failed to update action ${actionId}`, e);
  }
  return null;
}

export async function recordOutcome(actionId, payload) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/actions/${actionId}/outcomes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`Failed to record outcome for action ${actionId}`, e);
  }
  return null;
}

// -------------------------------------------------------------
// Incident Reports & Admin Resolution APIs
// -------------------------------------------------------------

export async function fetchReports(author = null) {
  try {
    const url = author && author.toLowerCase() !== "admin"
      ? `${API_BASE}/api/reports?author=${encodeURIComponent(author)}`
      : `${API_BASE}/api/reports`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return data.reports || [];
    }
  } catch (e) {
    console.warn("Failed to fetch /api/reports", e);
  }
  return [];
}

export async function submitReport(reportData) {
  try {
    const res = await fetch(`${API_BASE}/api/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportData)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Failed to submit report", e);
  }
  return null;
}

export async function updateReportStatus(reportId, statusData) {
  try {
    const res = await fetch(`${API_BASE}/api/reports/${reportId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(statusData)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`Failed to update report ${reportId} status`, e);
  }
  return null;
}

export async function fetchLossAnalytics() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/loss-analytics`);
    if (res.ok) {
      const data = await res.json();
      return data.metrics || null;
    }
  } catch (e) {
    console.warn("Failed to fetch loss analytics", e);
  }
  return null;
}

export async function adminLogin(username, password) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) return await res.json();
    const err = await res.json();
    return { success: false, message: err.detail || err.message || "Invalid credentials" };
  } catch (e) {
    console.warn("Admin login failed", e);
    return { success: false, message: "Server connection failed" };
  }
}

