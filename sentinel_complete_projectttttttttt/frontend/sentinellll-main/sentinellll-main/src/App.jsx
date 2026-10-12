import { useEffect, useState } from "react";
import "./App.css";
import Dashboard from "./Dashboard.jsx";
import BuildingDetails from "./BuildingDetails.jsx";
import ResourceDetails from "./ResourceDetails.jsx";
import Anomalies from "./Anomalies.jsx";
import Reports from "./Reports.jsx";
import Analytics from "./Analytics.jsx";

function App() {
  const [path, setPath] = useState(window.location.pathname);

  const [theme, setTheme] = useState(
    () => localStorage.getItem("sentinel-theme") || "system"
  );

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const activeTheme =
        theme === "system"
          ? media.matches
            ? "black"
            : "white"
          : theme;

      root.setAttribute("data-theme", activeTheme);
      root.style.colorScheme =
        activeTheme === "white" ? "light" : "dark";
    };

    applyTheme();
    media.addEventListener("change", applyTheme);

    // Listen for history navigation
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      media.removeEventListener("change", applyTheme);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [theme]);

  function changeTheme(newTheme) {
    localStorage.setItem("sentinel-theme", newTheme);
    setTheme(newTheme);
  }

  function navigate(to) {
    window.history.pushState({}, "", to);
    setPath(to);
    window.scrollTo(0, 0);
  }

  // Route: Incident Reports & Dispatch
  if (path === "/reports") {
    return <Reports />;
  }

  // Route: Excel / CSV Graphical Data Visualizer
  if (path === "/analytics" || path === "/data") {
    return <Analytics />;
  }

  // Route: Dashboard
  if (path === "/dashboard") {
    return (
      <Dashboard
        theme={theme}
        onThemeChange={changeTheme}
      />
    );
  }

  // Route: Building details
  if (path === "/building") {
    return <BuildingDetails />;
  }

  // Route: Resource details
  if (path === "/resources") {
    return <ResourceDetails />;
  }

  // Route: Anomaly alerts
  if (path === "/anomalies") {
    return <Anomalies />;
  }

  // Default Route: Enhanced SENTINEL Landing Page
  return (
    <main className="sentinel">
      {/* Top Navbar */}
      <nav className="navbar">
        <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
          <span className="brand-mark">S</span>
          <span>
            SENTINEL<span className="brand-dot">.</span>
          </span>
        </a>

        <div className="nav-links">
          <a href="#about">ABOUT</a>
          <a href="#how-it-works">HOW IT WORKS</a>
          <a href="#model">MODEL USED</a>
          <a href="/reports" onClick={(e) => { e.preventDefault(); navigate("/reports"); }}>
            REPORTS
          </a>
          <a href="/analytics" onClick={(e) => { e.preventDefault(); navigate("/analytics"); }}>
            EXCEL ANALYTICS
          </a>
          <a href="/anomalies" onClick={(e) => { e.preventDefault(); navigate("/anomalies"); }}>
            ANOMALIES
          </a>
        </div>

        <a className="nav-cta" href="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>
          DASHBOARD ↗
        </a>

        <a
          className="mobile-menu"
          href="#features"
          aria-label="Explore features"
        >
          ☰
        </a>
      </nav>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" />
            CSI SVVV • SUSTAINABLE TECH WITHOUT LIMITS (PS-04)
          </div>

          <h1>
            Stay ahead.
            <br />
            <span>Protect every resource.</span>
          </h1>

          <p className="hero-description">
            Welcome to <strong>SENTINEL</strong> — Shri Vaishnav Vidyapeeth
            Vishwavidyalaya's autonomous resource intelligence platform. Detect
            phantom electricity loads, concealed pipe bursts, and report campus
            incidents in real time with machine learning.
          </p>

          <form
            className="search-bar"
            onSubmit={(event) => {
              event.preventDefault();
              navigate("/dashboard");
            }}
          >
            <span>⌕</span>
            <input
              type="text"
              aria-label="Search campus"
              placeholder="Search buildings, rooms, or telemetry..."
            />
            <button type="submit" aria-label="Open dashboard">
              ↗
            </button>
          </form>

          <div className="hero-actions">
            <a className="button-primary" href="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>
              EXPLORE DASHBOARD <span>↗</span>
            </a>
            <a className="button-secondary" href="/reports" onClick={(e) => { e.preventDefault(); navigate("/reports"); }}>
              REPORT A PROBLEM <span>+</span>
            </a>
            <a className="button-secondary" href="/analytics" onClick={(e) => { e.preventDefault(); navigate("/analytics"); }}>
              EXCEL DATA VISUALIZER
            </a>
          </div>

          <div className="hero-footnote">
            <span className="footnote-line" />
            ISOLATION FOREST (3σ) • GEMINI AI ROOT CAUSE • REAL-TIME DISPATCH
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="art-glow" />

          <div className="contour contour-one">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} style={{ "--i": i }} />
            ))}
          </div>

          <div className="contour contour-two">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} style={{ "--i": i }} />
            ))}
          </div>

          <div className="art-caption">
            <span className="caption-symbol">◈</span>
            <p>Observe. Detect. Protect.</p>
            <small>8 BUILDINGS · 65 MONITORED SPACES · SVVV INDORE</small>
          </div>

          <div className="art-index">SENTINEL / 360°</div>
        </div>

        <div className="scroll-indicator">
          <span />
          SCROLL TO EXPLORE ARCHITECTURE
        </div>
      </section>

      {/* SECTION 1: ABOUT */}
      <section className="intro-section" id="about">
        <div>
          <span className="section-kicker">
            01 — ABOUT SENTINEL
          </span>
          <h2>
            Autonomous campus intelligence.
            <br />
            <span>Zero resource waste.</span>
          </h2>
        </div>

        <div>
          <p>
            Modern educational campuses consume massive amounts of electricity and
            water, yet over <strong>23% of energy</strong> is lost to off-peak
            phantom loads, unthrottled computer laboratories, and hidden plumbing
            leaks.
          </p>
          <p style={{ marginTop: "1rem", color: "#94a3b8" }}>
            Developed for <strong>CSI Student Chapter SVVV Indore</strong> under
            Problem Statement PS-04, <em>Sentinel</em> pairs high-frequency spatial
            telemetry with machine learning to automate root-cause isolation and
            empower campus communities to report and resolve facilities issues.
          </p>
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS */}
      <section className="intro-section" id="how-it-works" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "5rem" }}>
        <div>
          <span className="section-kicker">
            02 — HOW IT WORKS
          </span>
          <h2>
            From raw signal
            <br />
            <span>to verified action.</span>
          </h2>
        </div>

        <p>
          Sentinel follows a continuous 3-stage closed-loop architecture:
          <br /><br />
          <strong>1. Signal Ingestion:</strong> Smart meter telemetry and student incident
          reports are ingested across all 8 campus blocks.
          <br /><br />
          <strong>2. Statistical & Outlier Triangulation:</strong> Readings are evaluated
          against canonical baselines to flag unexpected spikes.
          <br /><br />
          <strong>3. Dispatch & Loss Aversion:</strong> Facilities engineers receive
          instant remediation directives to engage virtual relay cutoffs and prevent
          rupee loss.
        </p>
      </section>

      {/* SECTION 3: MODEL USED */}
      <section className="intro-section" id="model" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "5rem" }}>
        <div>
          <span className="section-kicker">
            03 — MODEL ARCHITECTURE
          </span>
          <h2>
            IsolationForest &
            <br />
            <span>Generative AI Reasoning.</span>
          </h2>
        </div>

        <div>
          <p>
            At the heart of Sentinel's telemetry processing is a serialised
            <strong> Scikit-learn IsolationForest Pipeline</strong> trained on seasonal
            campus consumption patterns.
          </p>
          <ul style={{ marginTop: "1rem", color: "#94a3b8", lineHeight: "1.8", paddingLeft: "1.2rem" }}>
            <li><strong>Anomaly Scoring:</strong> Deviations exceeding 3 standard deviations (3σ) trigger priority alerts.</li>
            <li><strong>Multimodal Reasoning:</strong> Gemini AI structures natural-language explanations and identifies potential causes like server idling or stuck solenoid valves.</li>
            <li><strong>Financial Impact Engine:</strong> Calculates sustained loss per hour (₹/hr) and cumulative loss averted.</li>
          </ul>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="features-section" id="features">
        <div className="section-heading">
          <span className="section-kicker">
            04 — CORE CAPABILITIES
          </span>
          <h2>Intelligence in every signal.</h2>
        </div>

        <div className="features-grid">
          <article className="feature-card">
            <span className="feature-number">01</span>
            <span className="feature-icon">⌁</span>
            <h3>Resource Monitoring</h3>
            <p>
              Live electricity kW, water flow, and institutional carbon metrics
              across all campus zones.
            </p>
            <a href="/resources" onClick={(e) => { e.preventDefault(); navigate("/resources"); }}>
              EXPLORE RESOURCES <span>↗</span>
            </a>
          </article>

          <article className="feature-card">
            <span className="feature-number">02</span>
            <span className="feature-icon">◎</span>
            <h3>Anomaly Detection</h3>
            <p>
              Scikit-learn IsolationForest algorithms pinpoint off-hour phantom
              spikes and pipeline ruptures.
            </p>
            <a href="/anomalies" onClick={(e) => { e.preventDefault(); navigate("/anomalies"); }}>
              EXPLORE ANOMALIES <span>↗</span>
            </a>
          </article>

          <article className="feature-card">
            <span className="feature-number">03</span>
            <span className="feature-icon">📋</span>
            <h3>Problem Reporting Tab</h3>
            <p>
              Report campus problems with real-time status tracking (PENDING /
              SOLVED) and admin cutoff resolution.
            </p>
            <a href="/reports" onClick={(e) => { e.preventDefault(); navigate("/reports"); }}>
              OPEN REPORT TAB <span>↗</span>
            </a>
          </article>

          <article className="feature-card">
            <span className="feature-number">04</span>
            <span className="feature-icon">📊</span>
            <h3>Excel Graphical Visualizer</h3>
            <p>
              Upload any .xlsx or .csv dataset and generate interactive area trends,
              bar charts, and statistical breakdowns.
            </p>
            <a href="/analytics" onClick={(e) => { e.preventDefault(); navigate("/analytics"); }}>
              VISUALIZE DATA <span>↗</span>
            </a>
          </article>
        </div>
      </section>

      {/* CAMPUS DIRECTORY PREVIEW */}
      <section className="campus-section" id="campus">
        <div className="section-heading">
          <span className="section-kicker">
            05 — CAMPUS DIRECTORY
          </span>
          <h2>One campus. Monitored zones.</h2>
          <p>
            Explore the buildings included in the Sentinel SVVV Indore deployment.
          </p>
        </div>

        <div className="campus-grid">
          {[
            ["01", "Maa Saraswati Block", "Computer Centre & IT Labs"],
            ["02", "EEE Block", "High-voltage laboratories & classrooms"],
            ["03", "Architecture Block", "Design studios & fabrication"],
            ["04", "Central Library", "Research & learning stacks"],
            ["05", "Administration Wing", "Executive & registrar offices"],
            ["06", "Hostel Blocks (A & B)", "Residential student quarters"],
          ].map(([number, name, description]) => (
            <article className="campus-card" key={number}>
              <span className="campus-number">{number} / 06</span>
              <div className="campus-symbol">◇</div>
              <h3>{name}</h3>
              <p>{description}</p>

              <span className="demo-status">
                <span />
                ACTIVE TELEMETRY
              </span>

              <a
                href={`/building?name=${encodeURIComponent(name)}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/building?name=${encodeURIComponent(name)}`);
                }}
                className="campus-card-link"
              >
                VIEW BUILDING ↗
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="closing-section">
        <span className="section-kicker">
          06 — GET STARTED
        </span>
        <h2>
          Awareness is power.
          <br />
          <span>Action is everything.</span>
        </h2>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginTop: "1.5rem" }}>
          <a className="button-primary" href="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>
            OPEN DASHBOARD ↗
          </a>
          <a className="button-secondary" href="/reports" onClick={(e) => { e.preventDefault(); navigate("/reports"); }}>
            REPORT A PROBLEM +
          </a>
          <a className="button-secondary" href="/analytics" onClick={(e) => { e.preventDefault(); navigate("/analytics"); }}>
            EXCEL ANALYTICS 📊
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
          <span className="brand-mark">S</span>
          <span>
            SENTINEL<span className="brand-dot">.</span>
          </span>
        </a>
        <p>Autonomous Resource Intelligence for SVVV Indore · PS-04 Sustainable Tech Without Limits</p>
        <span>© SENTINEL PLATFORM</span>
      </footer>
    </main>
  );
}

export default App;
