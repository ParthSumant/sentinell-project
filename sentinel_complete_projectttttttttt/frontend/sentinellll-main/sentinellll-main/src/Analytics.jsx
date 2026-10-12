import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Upload,
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Table,
  Sparkles,
  Download,
  Building2,
  Zap,
  Droplets,
  Calendar,
  X
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";
import "./Analytics.css";

// -------------------------------------------------------------
// Canonical Preloaded Datasets for SVVV Campus
// -------------------------------------------------------------
const PRESET_HOURLY_DATA = [
  { time: "00:00", actual_kw: 3.2, baseline_kw: 2.8, water_lpm: 1.4, cost_inr: 27.2 },
  { time: "02:00", actual_kw: 14.8, baseline_kw: 2.1, water_lpm: 1.2, cost_inr: 125.8, anomaly: "Phantom Surge" },
  { time: "04:00", actual_kw: 8.5, baseline_kw: 2.1, water_lpm: 28.5, cost_inr: 72.2, anomaly: "Pipe Burst" },
  { time: "06:00", actual_kw: 4.1, baseline_kw: 3.5, water_lpm: 8.2, cost_inr: 34.8 },
  { time: "08:00", actual_kw: 22.4, baseline_kw: 19.5, water_lpm: 18.0, cost_inr: 190.4 },
  { time: "10:00", actual_kw: 48.6, baseline_kw: 44.0, water_lpm: 32.4, cost_inr: 413.1 },
  { time: "12:00", actual_kw: 62.1, baseline_kw: 55.2, water_lpm: 45.1, cost_inr: 527.8 },
  { time: "14:00", actual_kw: 58.7, baseline_kw: 52.0, water_lpm: 38.6, cost_inr: 498.9 },
  { time: "16:00", actual_kw: 44.3, baseline_kw: 41.2, water_lpm: 29.0, cost_inr: 376.5 },
  { time: "18:00", actual_kw: 28.9, baseline_kw: 22.0, water_lpm: 16.5, cost_inr: 245.6 },
  { time: "20:00", actual_kw: 12.5, baseline_kw: 8.4, water_lpm: 11.2, cost_inr: 106.2 },
  { time: "22:00", actual_kw: 6.8, baseline_kw: 4.5, water_lpm: 4.0, cost_inr: 57.8 },
];

const PRESET_BUILDINGS_DATA = [
  { building: "Maa Saraswati Block", kwh_daily: 485, peak_kw: 62.5, water_kl: 12.4, cost_inr: 4122 },
  { building: "EEE Block Labs", kwh_daily: 612, peak_kw: 78.1, water_kl: 8.6, cost_inr: 5202 },
  { building: "Architecture Studios", kwh_daily: 240, peak_kw: 34.0, water_kl: 4.2, cost_inr: 2040 },
  { building: "Central Library", kwh_daily: 185, peak_kw: 26.5, water_kl: 3.8, cost_inr: 1572 },
  { building: "Administration Wing", kwh_daily: 310, peak_kw: 42.0, water_kl: 7.1, cost_inr: 2635 },
  { building: "Hostel Blocks (A & B)", kwh_daily: 540, peak_kw: 55.0, water_kl: 34.5, cost_inr: 4590 },
];

const PRESET_WEEKLY_DATA = [
  { day: "Mon", electricity_kwh: 2420, water_kl: 68.2, carbon_kg: 1984, loss_averted_inr: 1250 },
  { day: "Tue", electricity_kwh: 2610, water_kl: 71.0, carbon_kg: 2140, loss_averted_inr: 980 },
  { day: "Wed", electricity_kwh: 2540, water_kl: 66.5, carbon_kg: 2082, loss_averted_inr: 1640 },
  { day: "Thu", electricity_kwh: 2780, water_kl: 74.2, carbon_kg: 2279, loss_averted_inr: 850 },
  { day: "Fri", electricity_kwh: 2490, water_kl: 65.0, carbon_kg: 2041, loss_averted_inr: 1920 },
  { day: "Sat", electricity_kwh: 1280, water_kl: 38.0, carbon_kg: 1049, loss_averted_inr: 540 },
  { day: "Sun", electricity_kwh: 980, water_kl: 32.5, carbon_kg: 803, loss_averted_inr: 420 },
];

export default function Analytics() {
  const [datasetSource, setDatasetSource] = useState("hourly"); // hourly, buildings, weekly, custom
  const [customData, setCustomData] = useState(null);
  const [customFilename, setCustomFilename] = useState("");
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [workbookRef, setWorkbookRef] = useState(null);

  // Visualization Preferences
  const [chartType, setChartType] = useState("area"); // area, bar, line
  const [selectedYKey, setSelectedYKey] = useState("");
  const [selectedXKey, setSelectedXKey] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Table search
  const [tableSearch, setTableSearch] = useState("");

  // Determine active dataset
  const activeDataset = useMemo(() => {
    if (datasetSource === "custom" && customData && customData.length > 0) {
      return customData;
    }
    if (datasetSource === "buildings") return PRESET_BUILDINGS_DATA;
    if (datasetSource === "weekly") return PRESET_WEEKLY_DATA;
    return PRESET_HOURLY_DATA;
  }, [datasetSource, customData]);

  // Extract available columns
  const availableColumns = useMemo(() => {
    if (!activeDataset || activeDataset.length === 0) return [];
    return Object.keys(activeDataset[0]);
  }, [activeDataset]);

  // Detect numerical and categorical keys
  const { numericKeys, categoricalKeys } = useMemo(() => {
    if (!activeDataset || activeDataset.length === 0) {
      return { numericKeys: [], categoricalKeys: [] };
    }
    const sample = activeDataset[0];
    const num = [];
    const cat = [];
    Object.keys(sample).forEach((k) => {
      const val = sample[k];
      if (typeof val === "number" || (!isNaN(Number(val)) && val !== "" && val !== null)) {
        num.push(k);
      } else {
        cat.push(k);
      }
    });
    return { numericKeys: num, categoricalKeys: cat };
  }, [activeDataset]);

  // Active X & Y keys with smart defaults
  const activeXKey = selectedXKey || categoricalKeys[0] || availableColumns[0];
  const activeYKey = selectedYKey || numericKeys[0] || availableColumns[1];

  // Statistical calculations
  const stats = useMemo(() => {
    if (!activeDataset || activeDataset.length === 0 || !activeYKey) return null;
    const values = activeDataset
      .map((d) => Number(d[activeYKey]))
      .filter((v) => !isNaN(v));
    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
      count: values.length,
      sum: sum.toFixed(2),
      avg: avg.toFixed(2),
      max: max.toFixed(2),
      min: min.toFixed(2),
    };
  }, [activeDataset, activeYKey]);

  // Handle Excel (.xlsx, .xls) and CSV file uploads
  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setCustomFilename(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        setWorkbookRef(wb);
        setSheetNames(wb.SheetNames);

        const firstSheetName = wb.SheetNames[0];
        setActiveSheet(firstSheetName);

        const ws = wb.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (!data || data.length === 0) {
          setUploadError("The uploaded Excel sheet contains no readable rows.");
          return;
        }

        setCustomData(data);
        setDatasetSource("custom");
        setSelectedXKey("");
        setSelectedYKey("");
      } catch (err) {
        console.error("Excel parse error:", err);
        setUploadError("Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv.");
      }
    };
    reader.readAsBinaryString(file);
  }

  // Handle switching sheets in uploaded workbook
  function handleSheetChange(sheetName) {
    if (!workbookRef) return;
    setActiveSheet(sheetName);
    const ws = workbookRef.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
    setCustomData(data);
    setSelectedXKey("");
    setSelectedYKey("");
  }

  // Filtered rows for table preview
  const tableRows = useMemo(() => {
    if (!activeDataset) return [];
    if (!tableSearch.trim()) return activeDataset.slice(0, 50);

    const q = tableSearch.toLowerCase();
    return activeDataset
      .filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(q)
        )
      )
      .slice(0, 50);
  }, [activeDataset, tableSearch]);

  return (
    <main className="analytics-page">
      {/* Top Bar */}
      <header className="analytics-topbar">
        <div className="analytics-topbar-left">
          <button
            className="analytics-back-btn"
            onClick={() => (window.location.href = "/dashboard")}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div className="analytics-badge-sentinel">
            <Sparkles size={13} /> EXCEL & TELEMETRY VISUALIZATION ENGINE
          </div>
        </div>

        <div className="analytics-topbar-right">
          <label className="analytics-upload-btn">
            <Upload size={15} /> Upload Excel / CSV
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </header>

      {/* Hero Header */}
      <section className="analytics-hero">
        <div className="analytics-hero-copy">
          <span className="analytics-eyebrow">GRAPHICAL DATA REPRESENTATION & ANALYTICS</span>
          <h1>Campus Resource Data Explorer</h1>
          <p>
            Upload your custom Excel (.xlsx / .csv) files or explore preloaded SVVV
            telemetry. Generate interactive area trends, comparative bar charts,
            and statistical loss breakdowns instantly.
          </p>
        </div>
      </section>

      {/* Upload Banner & Preset Selector */}
      <section className="analytics-source-bar">
        <div className="dataset-tabs">
          <button
            className={`dataset-tab ${datasetSource === "hourly" ? "active" : ""}`}
            onClick={() => setDatasetSource("hourly")}
          >
            <Zap size={14} /> 24h Hourly Telemetry
          </button>
          <button
            className={`dataset-tab ${datasetSource === "buildings" ? "active" : ""}`}
            onClick={() => setDatasetSource("buildings")}
          >
            <Building2 size={14} /> Building-Wise Breakdown
          </button>
          <button
            className={`dataset-tab ${datasetSource === "weekly" ? "active" : ""}`}
            onClick={() => setDatasetSource("weekly")}
          >
            <Calendar size={14} /> Weekly Resource Trend
          </button>

          {customData && (
            <button
              className={`dataset-tab ${datasetSource === "custom" ? "active" : ""}`}
              onClick={() => setDatasetSource("custom")}
            >
              <FileSpreadsheet size={14} /> {customFilename || "Uploaded Excel"}
            </button>
          )}
        </div>

        {datasetSource === "custom" && sheetNames.length > 1 && (
          <div className="sheet-selector">
            <span>Sheet:</span>
            <select
              value={activeSheet}
              onChange={(e) => handleSheetChange(e.target.value)}
            >
              {sheetNames.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {uploadError && (
        <div className="analytics-error-banner">
          <AlertCircle size={16} /> {uploadError}
        </div>
      )}

      {/* Chart Configuration Toolbar */}
      <section className="analytics-controls-panel">
        <div className="control-group">
          <label>Chart Mode</label>
          <div className="chart-type-selector">
            <button
              className={chartType === "area" ? "active" : ""}
              onClick={() => setChartType("area")}
              title="Area Curve"
            >
              <TrendingUp size={15} /> Area
            </button>
            <button
              className={chartType === "bar" ? "active" : ""}
              onClick={() => setChartType("bar")}
              title="Bar Chart"
            >
              <BarChart3 size={15} /> Bar
            </button>
            <button
              className={chartType === "line" ? "active" : ""}
              onClick={() => setChartType("line")}
              title="Line Chart"
            >
              <Layers size={15} /> Line
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>Metric Series (Y-Axis)</label>
          <select
            value={activeYKey}
            onChange={(e) => setSelectedYKey(e.target.value)}
          >
            {numericKeys.map((key) => (
              <option key={key} value={key}>
                {key.replace(/_/g, " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Category / Dimension (X-Axis)</label>
          <select
            value={activeXKey}
            onChange={(e) => setSelectedXKey(e.target.value)}
          >
            {availableColumns.map((key) => (
              <option key={key} value={key}>
                {key.replace(/_/g, " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {stats && (
          <div className="stat-quick-pills">
            <div className="stat-pill">
              <span>AVG</span>
              <strong>{stats.avg}</strong>
            </div>
            <div className="stat-pill">
              <span>MAX</span>
              <strong>{stats.max}</strong>
            </div>
            <div className="stat-pill">
              <span>SUM</span>
              <strong>{stats.sum}</strong>
            </div>
            <div className="stat-pill">
              <span>ROWS</span>
              <strong>{stats.count}</strong>
            </div>
          </div>
        )}
      </section>

      {/* Main Graphical Representation Chart Panel */}
      <section className="analytics-chart-panel">
        <div className="chart-panel-header">
          <div>
            <span className="chart-overline">TELEMETRY & EXCEL VISUALIZER</span>
            <h2>
              {activeYKey ? activeYKey.replace(/_/g, " ").toUpperCase() : "Metric"}{" "}
              vs {activeXKey ? activeXKey.replace(/_/g, " ").toUpperCase() : "Index"}
            </h2>
          </div>
          <span className="dataset-indicator">
            ● {datasetSource === "custom" ? customFilename : `${datasetSource.toUpperCase()} DATASET`}
          </span>
        </div>

        <div className="chart-canvas-wrap">
          <ResponsiveContainer width="100%" height={400}>
            {chartType === "bar" ? (
              <BarChart data={activeDataset}>
                <CartesianGrid stroke="#ffffff0a" vertical={false} />
                <XAxis
                  dataKey={activeXKey}
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#161326",
                    border: "1px solid #7c3aed",
                    borderRadius: 10,
                    color: "#fff",
                  }}
                />
                <Legend />
                <Bar
                  dataKey={activeYKey}
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart data={activeDataset}>
                <CartesianGrid stroke="#ffffff0a" vertical={false} />
                <XAxis
                  dataKey={activeXKey}
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#161326",
                    border: "1px solid #7c3aed",
                    borderRadius: 10,
                    color: "#fff",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={activeYKey}
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#c084fc" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : (
              <AreaChart data={activeDataset}>
                <defs>
                  <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ffffff0a" vertical={false} />
                <XAxis
                  dataKey={activeXKey}
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#161326",
                    border: "1px solid #7c3aed",
                    borderRadius: 10,
                    color: "#fff",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey={activeYKey}
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  fill="url(#analyticsGradient)"
                  activeDot={{ r: 6, fill: "#e9d5ff" }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </section>

      {/* Parsed Data Table Preview */}
      <section className="analytics-table-panel">
        <div className="table-header-row">
          <div className="table-title-group">
            <Table size={18} className="text-purple-400" />
            <h3>Excel Data Records & Telemetry Log</h3>
            <span className="row-counter">
              Showing {tableRows.length} of {activeDataset.length} rows
            </span>
          </div>

          <div className="table-search-box">
            <input
              type="text"
              placeholder="Search table rows..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                {availableColumns.map((col) => (
                  <th key={col}>{col.replace(/_/g, " ").toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, idx) => (
                <tr key={idx}>
                  {availableColumns.map((col) => (
                    <td key={col}>
                      {typeof row[col] === "number"
                        ? row[col].toLocaleString()
                        : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
