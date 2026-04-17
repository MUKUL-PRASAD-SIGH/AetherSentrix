import React, { useEffect, useState } from "react";

const DEFAULT_API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "alerts", label: "Alerts" },
  { id: "analytics", label: "Analytics" },
  { id: "simulation", label: "Simulation" },
  { id: "sandbox", label: "🎭 Sandbox" },
  { id: "ingestion", label: "Ingestion" },
  { id: "models", label: "Models" },
  { id: "assistant", label: "Assistant" },
  { id: "ops", label: "Ops" },
];

const ENDPOINT_COUNT = 16;

const DEFAULT_JSON_EVENTS = JSON.stringify(
  [
    {
      event_id: "evt-react-001",
      timestamp: "2026-04-14T10:35:00Z",
      event_type: "brute_force",
      source_ip: "10.0.0.5",
      user: "alice",
      host: "auth-node-01",
      metadata: {
        attempts: 12,
      },
    },
  ],
  null,
  2,
);

const DEFAULT_SYSLOG_LINE =
  "<34>2026-04-14T10:31:00Z host1 sshd[123]: Failed password for root from 10.0.0.13 port 22 ssh2";

const DEFAULT_ASSISTANT_QUERY =
  "Summarize the most important security findings from the latest alerts and tell me the next actions.";

const DEFAULT_BATCH_EVENTS = JSON.stringify(
  [
    [
      {
        event_id: "evt-batch-001",
        timestamp: "2026-04-14T10:40:00Z",
        event_type: "brute_force",
        source_ip: "10.0.0.10",
        host: "auth-node-02",
        metadata: {
          attempts: 9,
        },
      },
    ],
    [
      {
        event_id: "evt-batch-002",
        timestamp: "2026-04-14T10:40:45Z",
        event_type: "c2_beacon",
        destination_ip: "203.0.113.1",
        host: "workstation-07",
      },
    ],
  ],
  null,
  2,
);

export default function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE);
  const [apiToken, setApiToken] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [backendHealth, setBackendHealth] = useState(null);
  const [assistantHealth, setAssistantHealth] = useState(null);
  const [ingestionHealth, setIngestionHealth] = useState(null);
  const [mlStatus, setMlStatus] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [scenarioName, setScenarioName] = useState("phishing_to_exfiltration");
  const [simulationReport, setSimulationReport] = useState(null);
  const [simulationAlert, setSimulationAlert] = useState(null);
  const [jsonEditor, setJsonEditor] = useState(DEFAULT_JSON_EVENTS);
  const [syslogEditor, setSyslogEditor] = useState(DEFAULT_SYSLOG_LINE);
  const [batchEditor, setBatchEditor] = useState(DEFAULT_BATCH_EVENTS);
  const [ingestResult, setIngestResult] = useState(null);
  const [batchResult, setBatchResult] = useState(null);
  const [assistantQuery, setAssistantQuery] = useState(DEFAULT_ASSISTANT_QUERY);
  const [assistantAnswer, setAssistantAnswer] = useState(null);
  const [modelSourceMode, setModelSourceMode] = useState("synthetic");
  const [targetModelMode, setTargetModelMode] = useState("synthetic");
  const [selectedDatasetName, setSelectedDatasetName] = useState("");
  const [modelActionResult, setModelActionResult] = useState(null);
  const [banner, setBanner] = useState(null);
  const [connectionIssue, setConnectionIssue] = useState(null);
  const [loading, setLoading] = useState({
    bootstrap: false,
    demo: false,
    simulation: false,
    ingestion: false,
    models: false,
    assistant: false,
    archives: false,
  });

  useEffect(() => {
    bootstrap();
  }, []);

  const allAlerts = dashboardData?.alerts?.length
    ? dashboardData.alerts
    : recentAlerts;
  const severityDistribution =
    dashboardData?.severity_distribution || buildSeverityDistribution(allAlerts);
  const metrics = dashboardData?.metrics || buildMetrics(allAlerts);
  const selectedAlert =
    allAlerts.find((alert) => alert.alert_id === selectedAlertId) ||
    allAlerts[0] ||
    null;
  const isConnected = backendHealth?.status === "ok";

  useEffect(() => {
    if (allAlerts.length && !selectedAlertId) {
      setSelectedAlertId(allAlerts[0].alert_id);
    }
  }, [allAlerts, selectedAlertId]);

  async function bootstrap() {
    setLoading((current) => ({ ...current, bootstrap: true }));
    try {
      const [
        healthResponse,
        assistantResponse,
        ingestionResponse,
        mlResponse,
        scenariosResponse,
      ] =
        await Promise.all([
          apiGet("/health"),
          apiGet("/assistant/health"),
          apiGet("/ingestion/health"),
          apiGet("/ml/status"),
          apiGet("/scenarios"),
        ]);

      setBackendHealth(healthResponse);
      setAssistantHealth(assistantResponse.assistant || null);
      setIngestionHealth(ingestionResponse.ingestion || null);
      setMlStatus(mlResponse.ml || null);
      setTargetModelMode(mlResponse.ml?.active_mode || "synthetic");
      setSelectedDatasetName(mlResponse.ml?.available_datasets?.[0]?.name || "");
      setConnectionIssue(null);
      const liveScenarios = scenariosResponse.scenarios || [];
      setScenarios(liveScenarios);
      if (
        liveScenarios.length &&
        !liveScenarios.find((item) => item.name === scenarioName)
      ) {
        setScenarioName(liveScenarios[0].name);
      }
      await refreshArchives(false);
    } catch (error) {
      setBackendHealth(null);
      setAssistantHealth(null);
      setIngestionHealth(null);
      setMlStatus(null);
      setScenarios([]);
      setConnectionIssue(getConnectionIssue(apiBaseUrl, error));
      setBanner(null);
    } finally {
      setLoading((current) => ({ ...current, bootstrap: false }));
    }
  }

  async function refreshArchives(showSuccess = true) {
    setLoading((current) => ({ ...current, archives: true }));
    try {
      const [alertsResponse, eventsResponse, ingestionResponse, mlResponse] = await Promise.all([
        apiGet("/alerts/recent?limit=24"),
        apiGet("/events/recent?limit=24"),
        apiGet("/ingestion/health"),
        apiGet("/ml/status"),
      ]);
      setRecentAlerts(alertsResponse.alerts || []);
      setRecentEvents(eventsResponse.events || []);
      setIngestionHealth(ingestionResponse.ingestion || null);
      setMlStatus(mlResponse.ml || null);
      if (showSuccess) {
        setBanner({
          tone: "success",
          title: "Archives refreshed",
          message: "Recent persisted alerts and events are up to date.",
        });
      }
    } catch (error) {
      setBanner({
        tone: "danger",
        title: "Archive refresh failed",
        message: error.message,
      });
    } finally {
      setLoading((current) => ({ ...current, archives: false }));
    }
  }

  async function runDemo() {
    setLoading((current) => ({ ...current, demo: true }));
    try {
      const response = await apiPost("/demo/run", {});
      setConsoleOpen(true);
      setDashboardData(response.dashboard || null);
      setSelectedAlertId(response.dashboard?.alerts?.[0]?.alert_id || null);
      await refreshArchives(false);
      setBanner({
        tone: "success",
        title: "Live demo completed",
        message:
          "The React dashboard is now showing alerts generated by the real backend flow.",
      });
    } catch (error) {
      setBanner({
        tone: "danger",
        title: "Demo run failed",
        message: error.message,
      });
    } finally {
      setLoading((current) => ({ ...current, demo: false }));
    }
  }

  async function runScenario() {
    setLoading((current) => ({ ...current, simulation: true }));
    try {
      setConsoleOpen(true);
      const simulationResponse = await apiPost("/simulate", {
        scenario: scenarioName,
      });
      const report = simulationResponse.simulation || null;
      setSimulationReport(report);
      setSimulationAlert(null);

      if (report?.events?.length) {
        const detectResponse = await apiPost("/detect", {
          source_layer: "simulation",
          events: report.events,
        });
        setSimulationAlert(detectResponse.alert || null);
        await refreshArchives(false);
      }

      setBanner({
        tone: "success",
        title: "Scenario executed",
        message: `Scenario "${humanize(
          scenarioName,
        )}" ran through the live simulator and detector.`,
      });
    } catch (error) {
      setBanner({
        tone: "danger",
        title: "Simulation failed",
        message: error.message,
      });
    } finally {
      setLoading((current) => ({ ...current, simulation: false }));
    }
  }

  async function ingestJson(mode) {
    setLoading((current) => ({ ...current, ingestion: true }));
    try {
      const parsed = JSON.parse(jsonEditor);
      const events = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.events)
          ? parsed.events
          : [parsed];

      if (!events.length) {
        throw new Error("Provide at least one event in the JSON editor.");
      }

      const ingestResponse = await apiPost("/ingest", {
        source_layer: "react_console",
        events,
      });
      let alert = null;

      if (mode === "ingest-detect") {
        const detectResponse = await apiPost("/detect", {
          source_layer: "react_console",
          events,
        });
        alert = detectResponse.alert || null;
      }

      setIngestResult({
        ingested: ingestResponse.ingested || 0,
        events: ingestResponse.events || [],
        alert,
      });
      await refreshArchives(false);
      setBanner({
        tone: "success",
        title: alert ? "Events ingested and analyzed" : "Events ingested",
        message: alert
          ? "Normalization, persistence, and detection all completed successfully."
          : "The backend normalized and archived the events successfully.",
      });
    } catch (error) {
      setBanner({
        tone: "danger",
        title: "JSON ingestion failed",
        message: error.message,
      });
    } finally {
      setLoading((current) => ({ ...current, ingestion: false }));
    }
  }

  async function ingestSyslog(mode) {
    setLoading((current) => ({ ...current, ingestion: true }));
    try {
      const lines = syslogEditor
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (!lines.length) {
        throw new Error("Add at least one syslog line before submitting.");
      }

      const ingestResponse = await apiPost("/ingest/syslog", {
        source_layer: "syslog",
        lines,
      });
      let alert = null;
      const normalizedEvents = ingestResponse.events || [];

      if (mode === "ingest-detect" && normalizedEvents.length) {
        const detectResponse = await apiPost("/detect", {
          source_layer: "syslog",
          events: normalizedEvents,
        });
        alert = detectResponse.alert || null;
      }

      setIngestResult({
        ingested: ingestResponse.ingested || 0,
        events: normalizedEvents,
        alert,
      });
      await refreshArchives(false);
      setBanner({
        tone: "success",
        title: alert ? "Syslog analyzed" : "Syslog ingested",
        message: alert
          ? "The syslog payload was normalized, persisted, and passed to detection."
          : "The syslog payload was normalized and archived successfully.",
      });
    } catch (error) {
      setBanner({
        tone: "danger",
        title: "Syslog ingestion failed",
        message: error.message,
      });
    } finally {
      setLoading((current) => ({ ...current, ingestion: false }));
    }
  }

  async function runBatchDetection() {
    setLoading((current) => ({ ...current, ingestion: true }));
    try {
      const parsed = JSON.parse(batchEditor);
      const eventsBatch = Array.isArray(parsed) ? parsed : [];

      if (!eventsBatch.length || !eventsBatch.every(Array.isArray)) {
        throw new Error(
          "Provide a JSON array of event arrays for batch detection.",
        );
      }

      const response = await apiPost("/detect/batch", {
        source_layer: "react_batch_console",
        events_batch: eventsBatch,
      });

      setBatchResult({
        count: response.count || 0,
        alerts: response.alerts || [],
      });
      await refreshArchives(false);
      setBanner({
        tone: "success",
        title: "Batch detection completed",
        message:
          "The backend processed the event batches and returned live alert results.",
      });
    } catch (error) {
      setBanner({
        tone: "danger",
        title: "Batch detection failed",
        message: error.message,
      });
    } finally {
      setLoading((current) => ({ ...current, ingestion: false }));
    }
  }

  async function trainModels() {
    setLoading((current) => ({ ...current, models: true }));
    try {
      const payload = {
        source_mode: modelSourceMode,
        activate: true,
      };
      if (modelSourceMode === "real" && selectedDatasetName) {
        payload.dataset_name = selectedDatasetName;
      }

      const response = await apiPost("/ml/train", payload);
      const latest = response.ml?.status || null;
      setMlStatus(latest);
      setTargetModelMode(latest?.active_mode || modelSourceMode);
      setModelActionResult(response.ml?.run || null);
      await refreshArchives(false);
      setBanner({
        tone: "success",
        title: "Model training completed",
        message:
          modelSourceMode === "real"
            ? "Real-dataset training artifacts were saved and activated."
            : "Synthetic model artifacts were retrained and activated.",
      });
    } catch (error) {
      setBanner({
        tone: "danger",
        title: "Model training failed",
        message: error.message,
      });
    } finally {
      setLoading((current) => ({ ...current, models: false }));
    }
  }

  async function switchModelMode() {
    setLoading((current) => ({ ...current, models: true }));
    try {
      const response = await apiPost("/ml/mode", { mode: targetModelMode });
      setMlStatus(response.ml || null);
      setModelActionResult(null);
      setBanner({
        tone: "success",
        title: "Model mode updated",
        message: `Runtime detection is now using the ${targetModelMode} profile.`,
      });
    } catch (error) {
      setBanner({
        tone: "danger",
        title: "Model mode switch failed",
        message: error.message,
      });
    } finally {
      setLoading((current) => ({ ...current, models: false }));
    }
  }

  async function runAssistant() {
    setLoading((current) => ({ ...current, assistant: true }));
    try {
      const response = await apiPost("/assistant", {
        query: assistantQuery,
        alerts: allAlerts,
        alert: selectedAlert,
      });
      setAssistantAnswer(response.assistant || null);
      const healthResponse = await apiGet("/assistant/health");
      setAssistantHealth(healthResponse.assistant || null);
      setBanner({
        tone: "success",
        title: "Assistant response received",
        message:
          "The SOC assistant answered using the live OpenAI-backed integration.",
      });
    } catch (error) {
      setAssistantHealth((current) =>
        current
          ? {
              ...current,
              last_error: error.details
                ? { message: error.message, details: error.details }
                : { message: error.message },
            }
          : current,
      );
      setBanner({
        tone: "warning",
        title: "Assistant request failed",
        message: error.message,
      });
    } finally {
      setLoading((current) => ({ ...current, assistant: false }));
    }
  }

  async function apiGet(path) {
    try {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        headers: buildHeaders(false),
      });
      return parseResponse(response);
    } catch (error) {
      throw normalizeClientError(apiBaseUrl, error);
    }
  }

  async function apiPost(path, payload) {
    try {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(payload),
      });
      return parseResponse(response);
    } catch (error) {
      throw normalizeClientError(apiBaseUrl, error);
    }
  }

  function buildHeaders(includeJson) {
    const headers = {};
    if (includeJson) {
      headers["Content-Type"] = "application/json";
    }
    if (apiToken.trim()) {
      headers.Authorization = `Bearer ${apiToken.trim()}`;
    }
    return headers;
  }

  return (
    <div className="app-shell">
      <div className="app-backdrop" />
      <main className="app-container">
        <section className="landing-hero">
          <div className="landing-copy">
            <div className="eyebrow">AI SOC Platform</div>
            <div className="hero-kicker">
              <span className="live-dot" />
              Analyst-grade detection cockpit
            </div>
            <h1>
              Detect, simulate, explain, and operate from one cinematic
              security surface.
            </h1>
            <p>
              AetherSentrix combines live threat detection, MITRE-mapped
              simulation, analyst workflows, log ingestion, archived telemetry,
              and an OpenAI-backed SOC assistant in a single production-minded
              experience.
            </p>
            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() => {
                  setConsoleOpen(true);
                  setActiveTab("overview");
                  document
                    .getElementById("console-anchor")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Enter Workspace
              </button>
              <button
                className="secondary-button"
                onClick={runDemo}
                disabled={loading.demo}
              >
                {loading.demo ? "Running Demo..." : "Run Live Demo"}
              </button>
            </div>
            <div className="landing-pills">
              <span className="chip">Real API</span>
              <span className="chip">Batch Detection</span>
              <span className="chip">Attack Simulation</span>
              <span className="chip">SOC Assistant</span>
            </div>
            <SignalRibbon />
          </div>
          <div className="landing-visual">
            <HeroRadar isConnected={isConnected} alerts={allAlerts} />
            <div className="showcase-card threat">
              <span>Threat stream</span>
              <strong>{isConnected ? metrics.total_alerts || recentAlerts.length : "Standby"}</strong>
              <small>
                {isConnected
                  ? "Live alerts in the current operator view"
                  : "Waiting for a live backend connection"}
              </small>
            </div>
            <div className="showcase-card pulse">
              <span>Coverage</span>
              <strong>{ENDPOINT_COUNT}/{ENDPOINT_COUNT}</strong>
              <small>All current backend endpoints surfaced in the UI</small>
            </div>
            <div className="showcase-grid">
              <div className="showcase-mini">
                <strong>{isConnected ? scenarios.length : "Ready"}</strong>
                <span>{isConnected ? "scenarios" : "scenario engine"}</span>
              </div>
              <div className="showcase-mini">
                <strong>{isConnected ? recentEvents.length : "Cold"}</strong>
                <span>{isConnected ? "archived events" : "archive state"}</span>
              </div>
              <div className="showcase-mini">
                <strong>{assistantHealth?.configured ? "AI on" : "AI off"}</strong>
                <span>assistant state</span>
              </div>
              <div className="showcase-mini">
                <strong>{backendHealth?.status || "offline"}</strong>
                <span>backend health</span>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <span>Real-time detection</span>
          <span>MITRE ATT&CK mapping</span>
          <span>Analyst playbooks</span>
          <span>Simulation-driven validation</span>
          <span>Batch processing</span>
        </section>

        <section className="feature-marquee">
          <FeatureCard
            title="Ingest"
            description="Normalize JSON events and syslog lines, archive them, and inspect the transformed telemetry."
          />
          <FeatureCard
            title="Detect"
            description="Run single-event and batch detection with live risk scoring, MITRE mapping, and playbooks."
          />
          <FeatureCard
            title="Simulate"
            description="Trigger real attack scenarios and pass the generated events straight through the detection path."
          />
          <FeatureCard
            title="Operate"
            description="Review alerts, analytics, assistant output, health, and recent persisted artifacts from one UI."
          />
        </section>

        <div id="console-anchor" />
        {!isConnected ? (
          <ConnectionGuide
            apiBaseUrl={apiBaseUrl}
            loading={loading.bootstrap}
            issue={connectionIssue}
            onRetry={bootstrap}
            onOpenConsole={() => setConsoleOpen(true)}
          />
        ) : !consoleOpen ? (
          <ConsolePreview
            onOpen={() => {
              setConsoleOpen(true);
              setActiveTab("overview");
            }}
            alertsCount={allAlerts.length}
            scenariosCount={scenarios.length}
          />
        ) : null}

        {consoleOpen || isConnected ? (
          <>
        <section className="hero-panel">
          <div className="hero-copy">
            <div className="eyebrow">AetherSentrix</div>
            <h1>Interactive AI SOC Command Center</h1>
            <p>
              A real React operator console for the AetherSentrix backend. Run
              live demo flows, inspect archived alerts, trigger simulations,
              ingest telemetry, and query the assistant from one hot dashboard.
            </p>
          </div>
          <div className="hero-controls">
            <label className="field">
              <span>API Base URL</span>
              <input
                value={apiBaseUrl}
                onChange={(event) => setApiBaseUrl(event.target.value)}
                placeholder="http://127.0.0.1:8080"
              />
            </label>
            <label className="field">
              <span>Bearer Token</span>
              <input
                value={apiToken}
                onChange={(event) => setApiToken(event.target.value)}
                placeholder="Optional for protected POST routes"
                type="password"
              />
            </label>
            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={bootstrap}
                disabled={loading.bootstrap}
              >
                {loading.bootstrap ? "Connecting..." : "Reconnect Backend"}
              </button>
              <button
                className="secondary-button"
                onClick={runDemo}
                disabled={loading.demo}
              >
                {loading.demo ? "Running Demo..." : "Run Live Demo"}
              </button>
              <button
                className="ghost-button"
                onClick={() => refreshArchives()}
                disabled={loading.archives}
              >
                {loading.archives ? "Refreshing..." : "Refresh Archives"}
              </button>
            </div>
          </div>
        </section>

        {banner ? (
          <Banner banner={banner} onDismiss={() => setBanner(null)} />
        ) : null}

        <section className="status-strip">
          <StatTile
            label="Backend"
            value={backendHealth?.status || "offline"}
            tone={backendHealth?.status === "ok" ? "success" : "danger"}
            hint={backendHealth?.service || "API unavailable"}
          />
          <StatTile
            label="Assistant"
            value={
              isConnected
                ? assistantHealth?.configured
                  ? "configured"
                  : "not configured"
                : "pending"
            }
            tone={assistantHealth?.configured ? "accent" : "warning"}
            hint={assistantHealth?.model || "No model configured"}
          />
          <StatTile
            label="Scenarios"
            value={isConnected ? String(scenarios.length) : "pending"}
            tone="neutral"
            hint="MITRE-style attack paths"
          />
          <StatTile
            label="Ingestion"
            value={
              isConnected ? String(ingestionHealth?.ingested_events ?? 0) : "pending"
            }
            tone="accent"
            hint="Normalized events tracked"
          />
          <StatTile
            label="Persisted Alerts"
            value={isConnected ? String(recentAlerts.length) : "pending"}
            tone="neutral"
            hint="Loaded from archive"
          />
        </section>

        <nav className="tab-row" aria-label="Dashboard sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={tab.id === activeTab ? "tab active" : "tab"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        {activeTab === "overview" ? (
          <section className="content-grid">
            <div className="panel panel-span-two">
              <div className="panel-header">
                <div>
                  <div className="panel-title">Threat posture</div>
                  <div className="panel-subtitle">
                    Live metrics from the demo run or the persisted alert
                    archive.
                  </div>
                </div>
              </div>
              <div className="metric-grid">
                <MetricCard
                  label="Total alerts"
                  value={metrics.total_alerts}
                  accent="warm"
                />
                <MetricCard
                  label="High severity"
                  value={metrics.high_severity}
                  accent="danger"
                />
                <MetricCard
                  label="Detection rate"
                  value={`${Math.round((metrics.detection_rate || 0) * 100)}%`}
                  accent="success"
                />
                <MetricCard
                  label="Low-confidence alerts"
                  value={metrics.false_positives}
                  accent="cool"
                />
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Severity mix</div>
              </div>
              <SeverityDial distribution={severityDistribution} />
            </div>

            <div className="panel panel-span-two">
              <div className="panel-header">
                <div>
                  <div className="panel-title">Threat trend</div>
                  <div className="panel-subtitle">
                    Confidence and risk posture across the latest alert stream.
                  </div>
                </div>
              </div>
              <TrendChart alerts={allAlerts} />
            </div>

            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Entity heatmap</div>
              </div>
              <Heatmap alerts={allAlerts} />
            </div>

            <div className="panel panel-span-two">
              <div className="panel-header">
                <div>
                  <div className="panel-title">Attack graph</div>
                  <div className="panel-subtitle">
                    Relationship view derived from the alert entities and attack
                    graph payloads.
                    <br />
                    <span style={{ color: "var(--accent-color)" }}>
                      <strong>AIM:</strong> Visualizes entity relationships to
                      trace the path and scope of the attack.
                    </span>
                  </div>
                </div>
              </div>
              <AttackGraph alerts={allAlerts} />
            </div>

            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Recent alerts</div>
              </div>
              <AlertFeed
                alerts={allAlerts}
                selectedAlertId={selectedAlertId}
                onSelect={setSelectedAlertId}
              />
            </div>
          </section>
        ) : null}

        {activeTab === "alerts" ? (
          <section className="split-layout">
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Alert workbench</div>
              </div>
              <AlertFeed
                alerts={allAlerts}
                selectedAlertId={selectedAlertId}
                onSelect={setSelectedAlertId}
              />
            </div>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Alert detail</div>
              </div>
              <AlertWorkbench alert={selectedAlert} />
            </div>
          </section>
        ) : null}

        {activeTab === "analytics" ? (
          <section className="content-grid">
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Severity distribution</div>
              </div>
              <SeverityBars distribution={severityDistribution} />
            </div>
            <div className="panel panel-span-two">
              <div className="panel-header">
                <div className="panel-title">Analytics table</div>
              </div>
              <AnalyticsTable alerts={allAlerts} />
            </div>
          </section>
        ) : null}

        {activeTab === "simulation" ? (
          <section className="content-grid">
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Scenario runner</div>
              </div>
              <label className="field">
                <span>Scenario</span>
                <select
                  value={scenarioName}
                  onChange={(event) => setScenarioName(event.target.value)}
                >
                  {scenarios.map((scenario) => (
                    <option key={scenario.name} value={scenario.name}>
                      {humanize(scenario.name)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="primary-button block-button"
                onClick={runScenario}
                disabled={loading.simulation}
              >
                {loading.simulation ? "Executing..." : "Run Scenario"}
              </button>
              <ScenarioSummary scenarios={scenarios} scenarioName={scenarioName} />
            </div>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Simulation output</div>
              </div>
              <SimulationSummary report={simulationReport} alert={simulationAlert} />
            </div>
          </section>
        ) : null}

        {activeTab === "sandbox" ? (
          <SandboxPanel apiBaseUrl={apiBaseUrl} apiToken={apiToken} />
        ) : null}

        {activeTab === "ingestion" ? (
          <section className="content-grid">
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">JSON event console</div>
              </div>
              <label className="field">
                <span>Events payload</span>
                <textarea
                  value={jsonEditor}
                  onChange={(event) => setJsonEditor(event.target.value)}
                  rows={18}
                />
              </label>
              <div className="button-row">
                <button
                  className="secondary-button"
                  onClick={() => ingestJson("ingest")}
                  disabled={loading.ingestion}
                >
                  Ingest Only
                </button>
                <button
                  className="primary-button"
                  onClick={() => ingestJson("ingest-detect")}
                  disabled={loading.ingestion}
                >
                  Ingest + Detect
                </button>
              </div>
              <p className="panel-subtitle">
                Uses `/ingest` and can chain into `/detect` for a live
                normalized-event workflow.
              </p>
            </div>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Syslog console</div>
              </div>
              <label className="field">
                <span>Syslog lines</span>
                <textarea
                  value={syslogEditor}
                  onChange={(event) => setSyslogEditor(event.target.value)}
                  rows={10}
                />
              </label>
              <div className="button-row">
                <button
                  className="secondary-button"
                  onClick={() => ingestSyslog("ingest")}
                  disabled={loading.ingestion}
                >
                  Parse Only
                </button>
                <button
                  className="primary-button"
                  onClick={() => ingestSyslog("ingest-detect")}
                  disabled={loading.ingestion}
                >
                  Parse + Detect
                </button>
              </div>
              <IngestionResult result={ingestResult} />
            </div>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Batch detection console</div>
              </div>
              <label className="field">
                <span>Events batch payload</span>
                <textarea
                  value={batchEditor}
                  onChange={(event) => setBatchEditor(event.target.value)}
                  rows={18}
                />
              </label>
              <button
                className="primary-button block-button"
                onClick={runBatchDetection}
                disabled={loading.ingestion}
              >
                {loading.ingestion ? "Processing..." : "Run Batch Detection"}
              </button>
              <p className="panel-subtitle">
                Sends `events_batch` to `/detect/batch` and shows the resulting
                alerts.
              </p>
              <BatchResult result={batchResult} />
            </div>
          </section>
        ) : null}

        {activeTab === "models" ? (
          <section className="content-grid">
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Dataset Mode</div>
              </div>
              <label className="field">
                <span>Active runtime mode</span>
                <select
                  value={targetModelMode}
                  onChange={(event) => setTargetModelMode(event.target.value)}
                >
                  <option value="synthetic">Synthetic</option>
                  <option value="real">Real Dataset</option>
                </select>
              </label>
              <button
                className="primary-button block-button"
                onClick={switchModelMode}
                disabled={loading.models}
              >
                {loading.models ? "Switching..." : "Activate Mode"}
              </button>
              <p className="panel-subtitle">
                Toggle runtime detection between the built-in synthetic profile
                and the latest activated real-dataset artifact.
              </p>
              <ModeStatusCard status={mlStatus} />
            </div>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Train Models</div>
              </div>
              <label className="field">
                <span>Training source</span>
                <select
                  value={modelSourceMode}
                  onChange={(event) => setModelSourceMode(event.target.value)}
                >
                  <option value="synthetic">Synthetic baseline</option>
                  <option value="real">Local real dataset</option>
                </select>
              </label>
              <label className="field">
                <span>Dataset</span>
                <select
                  value={selectedDatasetName}
                  onChange={(event) => setSelectedDatasetName(event.target.value)}
                  disabled={modelSourceMode !== "real"}
                >
                  {(mlStatus?.available_datasets || []).length ? (
                    (mlStatus?.available_datasets || []).map((dataset) => (
                      <option key={dataset.name} value={dataset.name}>
                        {dataset.name} ({dataset.dataset_family})
                      </option>
                    ))
                  ) : (
                    <option value="">No local dataset found</option>
                  )}
                </select>
              </label>
              <button
                className="primary-button block-button"
                onClick={trainModels}
                disabled={
                  loading.models ||
                  (modelSourceMode === "real" && !selectedDatasetName)
                }
              >
                {loading.models ? "Training..." : "Train And Activate"}
              </button>
              <p className="panel-subtitle">
                This runs preprocessing, split evaluation, artifact versioning,
                and activation through the backend MLOps pipeline.
              </p>
              <TrainingResultCard run={modelActionResult} />
            </div>
            <div className="panel panel-span-two">
              <div className="panel-header">
                <div className="panel-title">Metrics & Recommendations</div>
              </div>
              <ModelMetricsCard status={mlStatus} />
            </div>
          </section>
        ) : null}

        {activeTab === "assistant" ? (
          <section className="content-grid">
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">SOC assistant</div>
              </div>
              <HealthCard health={assistantHealth} />
              <label className="field">
                <span>Query</span>
                <textarea
                  value={assistantQuery}
                  onChange={(event) => setAssistantQuery(event.target.value)}
                  rows={8}
                />
              </label>
              <button
                className="primary-button block-button"
                onClick={runAssistant}
                disabled={loading.assistant}
              >
                {loading.assistant ? "Thinking..." : "Ask Assistant"}
              </button>
            </div>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Assistant output</div>
              </div>
              {assistantAnswer ? (
                <div className="assistant-answer">
                  <div className="mini-row">
                    <span className="chip">{assistantAnswer.model}</span>
                    <span className="chip">
                      {assistantAnswer.raw_response_id || "no response id"}
                    </span>
                  </div>
                  <pre>{assistantAnswer.answer}</pre>
                </div>
              ) : (
                <EmptyState
                  title="No assistant answer yet"
                  description="Run a demo or load some alerts, then ask the assistant for a triage summary."
                />
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "ops" ? (
          <section className="content-grid">
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Platform health</div>
              </div>
              <JsonBlock value={backendHealth || { status: "offline" }} />
            </div>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Ingestion health</div>
              </div>
              <JsonBlock value={ingestionHealth || { ingested_events: 0 }} />
            </div>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Endpoint coverage</div>
              </div>
              <EndpointMatrix />
            </div>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Recent archived alerts</div>
              </div>
              <ArchiveList items={recentAlerts} type="alert" />
            </div>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Recent archived events</div>
              </div>
              <ArchiveList items={recentEvents} type="event" />
            </div>
          </section>
        ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorPayload =
      payload?.error && typeof payload.error === "object"
        ? payload.error
        : {
            message:
              payload?.error ||
              `Request failed with status ${response.status}`,
          };
    const error = new Error(errorPayload.message || "Request failed");
    error.status = response.status;
    error.details = errorPayload.details || null;
    throw error;
  }
  return payload;
}

function normalizeClientError(apiBaseUrl, error) {
  if (error instanceof Error && error.message !== "Failed to fetch") {
    return error;
  }
  return new Error(
    `Could not reach the backend at ${apiBaseUrl}. Start the API with "python api.py" and retry.`,
  );
}

function getConnectionIssue(apiBaseUrl, error) {
  return {
    message: normalizeClientError(apiBaseUrl, error).message,
  };
}

function Banner({ banner, onDismiss }) {
  return (
    <section className={`banner banner-${banner.tone || "neutral"}`}>
      <div>
        <strong>{banner.title}</strong>
        <p>{banner.message}</p>
      </div>
      <button className="ghost-button small-button" onClick={onDismiss}>
        Dismiss
      </button>
    </section>
  );
}

function StatTile({ label, value, hint, tone = "neutral" }) {
  return (
    <div className={`stat-tile tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className="feature-card">
      <span>Capability</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function SignalRibbon() {
  const items = [
    "Cross-layer telemetry",
    "Risk-scored alerts",
    "Guided playbooks",
    "Simulation-to-detection loop",
  ];

  return (
    <div className="signal-ribbon">
      {items.map((item) => (
        <div key={item} className="signal-pill">
          <span className="signal-dot" />
          {item}
        </div>
      ))}
    </div>
  );
}

function HeroRadar({ isConnected, alerts }) {
  const points = (alerts || []).slice(0, 6);

  return (
    <div className="radar-card">
      <div className="radar-head">
        <span>Threat radar</span>
        <strong>{isConnected ? "tracking" : "standby"}</strong>
      </div>
      <div className="radar-stage">
        <div className="radar-ring ring-1" />
        <div className="radar-ring ring-2" />
        <div className="radar-ring ring-3" />
        <div className="radar-sweep" />
        {points.map((alert, index) => (
          <span
            key={alert.alert_id || index}
            className={`radar-blip ${alert.severity || "medium"}`}
            style={{
              left: `${18 + ((index * 13) % 58)}%`,
              top: `${22 + ((index * 11) % 48)}%`,
            }}
          />
        ))}
      </div>
      <div className="radar-foot">
        <small>
          {isConnected
            ? "Live alert geometry pulsing from the current backend feed."
            : "Starts animating as soon as the backend returns alert data."}
        </small>
      </div>
    </div>
  );
}

function ConnectionGuide({ apiBaseUrl, issue, loading, onRetry, onOpenConsole }) {
  return (
    <section className="setup-panel">
      <div className="setup-copy">
        <div className="eyebrow">Getting Started</div>
        <h2>Connect the backend, then the full SOC workspace unlocks.</h2>
        <p>
          Right now the website cannot reach the API, so instead of showing dead
          charts and empty widgets, this screen gives you the exact next step.
        </p>
        <div className="setup-actions">
          <button className="primary-button" onClick={onRetry} disabled={loading}>
            {loading ? "Checking..." : "Retry Connection"}
          </button>
          <button className="ghost-button" onClick={onOpenConsole}>
            Open Console Anyway
          </button>
        </div>
      </div>
      <div className="setup-stack">
        <div className="setup-card">
          <span>Current target</span>
          <strong>{apiBaseUrl}</strong>
          <p>{issue?.message || "Backend connection has not succeeded yet."}</p>
        </div>
        <div className="setup-card">
          <span>Start the API</span>
          <pre>{`cd "c:\\Users\\Mukul Prasad\\Desktop\\PROJECTS\\AetherSentrix"\npython api.py`}</pre>
        </div>
        <div className="setup-card">
          <span>Then refresh</span>
          <p>
            Once `http://127.0.0.1:8080/health` responds, hit `Retry Connection`
            and the live console will populate.
          </p>
        </div>
      </div>
    </section>
  );
}

function ConsolePreview({ onOpen, alertsCount, scenariosCount }) {
  return (
    <section className="console-preview">
      <div>
        <div className="eyebrow">Workspace Ready</div>
        <h2>The landing page is live. Open the operator console when you want to work.</h2>
        <p>
          Keep the cinematic intro up front, then drop into the full analyst
          workspace only when needed.
        </p>
      </div>
      <div className="console-preview-side">
        <div className="preview-stat">
          <strong>{alertsCount}</strong>
          <span>alerts in memory</span>
        </div>
        <div className="preview-stat">
          <strong>{scenariosCount}</strong>
          <span>scenarios loaded</span>
        </div>
        <button className="primary-button block-button" onClick={onOpen}>
          Open Operator Console
        </button>
      </div>
    </section>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <div className={`metric-card accent-${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SeverityDial({ distribution }) {
  const total = Object.values(distribution || {}).reduce(
    (sum, value) => sum + value,
    0,
  );
  const low = distribution?.low || 0;
  const medium = distribution?.medium || 0;
  const high = distribution?.high || 0;
  const lowStop = total ? (low / total) * 360 : 0;
  const mediumStop = total ? ((low + medium) / total) * 360 : 0;

  return (
    <div className="dial-wrap">
      <div
        className="dial"
        style={{
          background: `conic-gradient(#2bd9a0 0deg ${lowStop}deg, #ffb74d ${lowStop}deg ${mediumStop}deg, #ff5d7a ${mediumStop}deg 360deg)`,
        }}
      >
        <div className="dial-core">
          <strong>{total}</strong>
          <span>alerts</span>
        </div>
      </div>
      <div className="legend-list">
        <Legend label="Low" value={low} tone="low" />
        <Legend label="Medium" value={medium} tone="medium" />
        <Legend label="High" value={high} tone="high" />
      </div>
    </div>
  );
}

function Legend({ label, value, tone }) {
  return (
    <div className="legend-row">
      <div className={`legend-dot ${tone}`} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TrendChart({ alerts }) {
  if (!alerts.length) {
    return (
      <EmptyState
        title="No alert trend yet"
        description="Run the demo or detect a scenario to populate this chart."
      />
    );
  }

  const width = 720;
  const height = 240;
  const pad = 20;
  const points = alerts.map((alert, index) => {
    const x =
      alerts.length === 1
        ? width / 2
        : pad + (index * (width - pad * 2)) / (alerts.length - 1);
    const score = Math.max(
      confidenceToScore(alert.confidence),
      (alert.risk_score || 0) / 100,
    );
    const y = height - pad - score * (height - pad * 2);
    return { x, y, alert };
  });

  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <svg
      className="trend-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Alert trend"
    >
      <defs>
        <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(255, 110, 110, 0.55)" />
          <stop offset="100%" stopColor="rgba(255, 110, 110, 0.03)" />
        </linearGradient>
      </defs>
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx="22"
        fill="rgba(10, 18, 36, 0.3)"
      />
      <polyline
        points={`${pad},${height - pad} ${polyline} ${width - pad},${
          height - pad
        }`}
        fill="url(#trendFill)"
        stroke="none"
      />
      <polyline
        points={polyline}
        fill="none"
        stroke="#ff7373"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((point) => (
        <circle
          key={point.alert.alert_id || point.x}
          cx={point.x}
          cy={point.y}
          r="6"
          className={`severity-${point.alert.severity || "low"}`}
        />
      ))}
    </svg>
  );
}

function Heatmap({ alerts }) {
  const matrix = buildHeatmap(alerts);
  if (!matrix.categories.length || !matrix.sources.length) {
    return (
      <EmptyState
        title="No entity heatmap yet"
        description="Heatmap cells appear once alerts with entities are available."
      />
    );
  }

  const gridStyle = {
    gridTemplateColumns: `1.1fr repeat(${Math.max(
      matrix.categories.length,
      1,
    )}, minmax(58px, 1fr))`,
  };

  return (
    <div className="heatmap">
      <div className="heatmap-header" style={gridStyle}>
        <div />
        {matrix.categories.map((category) => (
          <span key={category}>{humanize(category)}</span>
        ))}
      </div>
      {matrix.sources.map((source) => (
        <div key={source} className="heatmap-row" style={gridStyle}>
          <strong>{source}</strong>
          {matrix.categories.map((category) => {
            const value = matrix.counts[`${source}::${category}`] || 0;
            const strength = Math.min(1, value / 3);
            return (
              <div
                key={`${source}-${category}`}
                className="heatmap-cell"
                style={{ opacity: 0.25 + strength * 0.75 }}
                title={`${source} / ${category}: ${value}`}
              >
                {value}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function AttackGraph({ alerts }) {
  const graph = buildGraph(alerts);
  if (!graph.nodes.length) {
    return (
      <EmptyState
        title="No attack graph yet"
        description="Attack relationships appear after the backend emits graph entities."
      />
    );
  }

  const width = 720;
  const height = 280;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 95;
  const positions = graph.nodes.map((node, index) => {
    const angle = (Math.PI * 2 * index) / graph.nodes.length - Math.PI / 2;
    return {
      ...node,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });

  const positionMap = Object.fromEntries(
    positions.map((node) => [node.id, node]),
  );

  return (
    <svg
      className="graph-canvas"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Attack graph"
    >
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx="24"
        fill="rgba(10, 18, 36, 0.3)"
      />
      {graph.edges.map((edge) => {
        const source = positionMap[edge.source];
        const target = positionMap[edge.target];
        if (!source || !target) {
          return null;
        }
        return (
          <line
            key={`${edge.source}-${edge.target}-${edge.label}`}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1 + Math.min(edge.weight || 1, 4)}
          />
        );
      })}
      {positions.map((node) => (
        <g key={node.id}>
          <circle cx={node.x} cy={node.y} r="24" className="graph-node" />
          <text
            x={node.x}
            y={node.y + 4}
            textAnchor="middle"
            className="graph-label"
          >
            {truncate(node.label, 12)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function AlertFeed({ alerts, selectedAlertId, onSelect }) {
  if (!alerts.length) {
    return (
      <EmptyState
        title="No alerts loaded"
        description="Run the demo or the simulator to populate the live alert feed."
      />
    );
  }

  return (
    <div className="alert-feed">
      {alerts.map((alert) => (
        <button
          key={alert.alert_id}
          className={
            alert.alert_id === selectedAlertId ? "alert-card active" : "alert-card"
          }
          onClick={() => onSelect(alert.alert_id)}
        >
          <div className="alert-card-top">
            <span className={`severity-pill ${alert.severity || "low"}`}>
              {humanize(alert.severity || "low")}
            </span>
            <span className="alert-time">{formatTimestamp(alert.timestamp)}</span>
          </div>
          <strong>{humanize(alert.threat_category || "unknown")}</strong>
          <p>{buildAlertSummary(alert)}</p>
        </button>
      ))}
    </div>
  );
}

function AlertWorkbench({ alert }) {
  if (!alert) {
    return (
      <EmptyState
        title="Choose an alert"
        description="Select any alert in the feed to inspect the explanation, entities, and playbook."
      />
    );
  }

  return (
    <div className="alert-workbench">
      <div className="mini-row">
        <span className={`severity-pill ${alert.severity || "low"}`}>
          {humanize(alert.severity || "low")}
        </span>
        <span className="chip">Risk {Math.round(alert.risk_score || 0)}</span>
        <span className="chip">
          {Math.round(confidenceToScore(alert.confidence) * 100)}% confidence
        </span>
      </div>
      <h3>{humanize(alert.threat_category || "unknown")}</h3>
      <p>{buildAlertSummary(alert)}</p>
      <div className="detail-block">
        <h4>MITRE</h4>
        <div className="mini-row wrap">
          {(alert.mitre_ids || []).map((item) => (
            <span key={item} className="chip">
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="detail-block">
        <h4>Entities</h4>
        <JsonBlock value={alert.entities || {}} />
      </div>
      <div className="detail-block">
        <h4>Explanation</h4>
        <JsonBlock value={alert.explanation || {}} />
      </div>
      <div className="detail-block">
        <h4>Suggested playbook</h4>
        <ul className="flat-list">
          {(alert.suggested_playbook || []).map((step, index) => (
            <li key={`${step}-${index}`}>{String(step)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SeverityBars({ distribution }) {
  const entries = [
    { key: "low", label: "Low", value: distribution.low || 0 },
    { key: "medium", label: "Medium", value: distribution.medium || 0 },
    { key: "high", label: "High", value: distribution.high || 0 },
  ];
  const max = Math.max(...entries.map((entry) => entry.value), 1);

  return (
    <div className="severity-bars">
      {entries.map((entry) => (
        <div key={entry.key} className="bar-row">
          <span>{entry.label}</span>
          <div className="bar-track">
            <div
              className={`bar-fill ${entry.key}`}
              style={{ width: `${(entry.value / max) * 100}%` }}
            />
          </div>
          <strong>{entry.value}</strong>
        </div>
      ))}
    </div>
  );
}

function AnalyticsTable({ alerts }) {
  if (!alerts.length) {
    return (
      <EmptyState
        title="No analytics rows yet"
        description="Analytics rows appear after the alert archive has data."
      />
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Threat</th>
            <th>Severity</th>
            <th>Confidence</th>
            <th>Risk</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.alert_id}>
              <td>{formatTimestamp(alert.timestamp)}</td>
              <td>{humanize(alert.threat_category || "unknown")}</td>
              <td>{humanize(alert.severity || "low")}</td>
              <td>{Math.round(confidenceToScore(alert.confidence) * 100)}%</td>
              <td>{Math.round(alert.risk_score || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScenarioSummary({ scenarios, scenarioName }) {
  const scenario = scenarios.find((item) => item.name === scenarioName);
  if (!scenario) {
    return (
      <EmptyState
        title="No scenario selected"
        description="Load scenarios from the API to inspect the library."
      />
    );
  }

  return (
    <div className="scenario-summary">
      <p>{scenario.description}</p>
      <div className="mini-row wrap">
        <span className="chip">{scenario.steps} steps</span>
        {(scenario.mitre_techniques || []).slice(0, 4).map((item) => (
          <span key={item} className="chip">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function SimulationSummary({ report, alert }) {
  if (!report) {
    return (
      <EmptyState
        title="No simulation executed"
        description="Select a scenario and run it to see events and the resulting alert."
      />
    );
  }

  return (
    <div className="simulation-summary">
      <div className="mini-row wrap">
        <span className="chip">{report.simulation_id}</span>
        <span className="chip">{report.events_generated} events</span>
        <span className="chip">{humanize(report.scenario || "unknown")}</span>
      </div>
      <p>{report.description}</p>
      {alert ? (
        <div className="alert-inline">
          <strong>{humanize(alert.threat_category || "unknown")}</strong>
          <p>{buildAlertSummary(alert)}</p>
        </div>
      ) : null}
      <JsonBlock value={(report.events || []).slice(0, 6)} />
    </div>
  );
}

function IngestionResult({ result }) {
  if (!result) {
    return (
      <EmptyState
        title="No ingestion result yet"
        description="Submit JSON events or syslog lines to inspect normalized output."
      />
    );
  }

  return (
    <div className="ingest-result">
      <div className="mini-row wrap">
        <span className="chip">{result.ingested} ingested</span>
        {result.alert ? <span className="chip">alert generated</span> : null}
      </div>
      <JsonBlock value={result.events} />
      {result.alert ? <JsonBlock value={result.alert} /> : null}
    </div>
  );
}

function BatchResult({ result }) {
  if (!result) {
    return (
      <EmptyState
        title="No batch result yet"
        description="Submit an array of event arrays to exercise the live batch detection endpoint."
      />
    );
  }

  return (
    <div className="ingest-result">
      <div className="mini-row wrap">
        <span className="chip">{result.count} alerts returned</span>
      </div>
      <JsonBlock value={result.alerts} />
    </div>
  );
}

function ModeStatusCard({ status }) {
  if (!status) {
    return (
      <EmptyState
        title="Model status unavailable"
        description="Reconnect the backend to load active model mode and version information."
      />
    );
  }

  return (
    <div className="health-card">
      <div className="mini-row wrap">
        <span className="chip">{status.active_mode || "synthetic"}</span>
        <span className="chip">{status.active_version || "no real version yet"}</span>
        <span className="chip">
          {status.real_mode_available ? "real-ready" : "synthetic-only"}
        </span>
      </div>
      <JsonBlock
        value={{
          active_mode: status.active_mode,
          active_version: status.active_version,
          real_mode_available: status.real_mode_available,
        }}
      />
    </div>
  );
}

function TrainingResultCard({ run }) {
  if (!run) {
    return (
      <EmptyState
        title="No training run yet"
        description="Train a synthetic or real dataset profile to generate a versioned artifact."
      />
    );
  }

  return (
    <div className="ingest-result">
      <div className="mini-row wrap">
        <span className="chip">{run.version}</span>
        <span className="chip">{run.dataset_name}</span>
        <span className="chip">{run.source_mode}</span>
      </div>
      <JsonBlock value={run.metrics} />
    </div>
  );
}

function ModelMetricsCard({ status }) {
  if (!status?.active_run) {
    return (
      <EmptyState
        title="No active training metrics yet"
        description="Run a training job to view evaluation metrics, label distribution, and accuracy recommendations."
      />
    );
  }

  const classifierMetrics = status.active_run.metrics?.classifier || {};
  const anomalyMetrics = status.active_run.metrics?.anomaly || {};
  const recommendations = status.recommendations || [];

  return (
    <div className="model-metrics-grid">
      <div className="metric-card accent-success">
        <span>Classifier Accuracy</span>
        <strong>{formatMetric(classifierMetrics.accuracy)}</strong>
      </div>
      <div className="metric-card accent-cool">
        <span>Macro F1</span>
        <strong>{formatMetric(classifierMetrics.macro_f1)}</strong>
      </div>
      <div className="metric-card accent-warm">
        <span>Anomaly Recall</span>
        <strong>{formatMetric(anomalyMetrics.recall)}</strong>
      </div>
      <div className="metric-card accent-danger">
        <span>Anomaly F1</span>
        <strong>{formatMetric(anomalyMetrics.f1)}</strong>
      </div>
      <div className="panel-subsection">
        <h4>Latest Run</h4>
        <JsonBlock value={status.active_run} />
      </div>
      <div className="panel-subsection">
        <h4>Accuracy Improvement Notes</h4>
        {recommendations.length ? (
          <ul className="flat-list">
            {recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="panel-subtitle">
            No issues flagged yet. Keep adding real labeled traffic and retraining
            after feedback cycles.
          </p>
        )}
      </div>
    </div>
  );
}

function HealthCard({ health }) {
  if (!health) {
    return (
      <EmptyState
        title="Assistant health unavailable"
        description="Reconnect the backend to load assistant health information."
      />
    );
  }

  return (
    <div className="health-card">
      <div className="mini-row wrap">
        <span className="chip">
          {health.configured ? "configured" : "not configured"}
        </span>
        <span className="chip">{health.model || "unknown model"}</span>
        <span className="chip">
          {health.last_success_at || "no successful call yet"}
        </span>
      </div>
      {health.last_error ? <JsonBlock value={health.last_error} /> : null}
    </div>
  );
}

function EndpointMatrix() {
  const entries = [
    "GET /health",
    "GET /assistant/health",
    "GET /ingestion/health",
    "GET /scenarios",
    "GET /alerts/recent",
    "GET /events/recent",
    "GET /ml/status",
    "POST /ingest",
    "POST /ingest/syslog",
    "POST /detect",
    "POST /detect/batch",
    "POST /demo/run",
    "POST /simulate",
    "POST /ml/train",
    "POST /ml/mode",
    "POST /assistant",
  ];

  return (
    <div className="endpoint-matrix">
      {entries.map((entry) => (
        <div key={entry} className="endpoint-row">
          <span className="chip">wired</span>
          <strong>{entry}</strong>
        </div>
      ))}
    </div>
  );
}

function ArchiveList({ items, type }) {
  if (!items.length) {
    return (
      <EmptyState
        title="Nothing archived yet"
        description="Persisted records appear here after ingestion, detection, or demo runs."
      />
    );
  }

  return (
    <div className="archive-list">
      {items.map((item, index) => (
        <div key={`${type}-${index}`} className="archive-card">
          <strong>{formatTimestamp(item.timestamp)}</strong>
          <span>{humanize(item.threat_category || item.event_type || type)}</span>
          <small>{buildCompactEntity(item)}</small>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function JsonBlock({ value }) {
  return <pre className="json-block">{JSON.stringify(value, null, 2)}</pre>;
}

function buildMetrics(alerts) {
  const total = alerts.length;
  const high = alerts.filter((alert) => alert.severity === "high").length;
  const confidence = total
    ? alerts.reduce((sum, alert) => sum + confidenceToScore(alert.confidence), 0) /
      total
    : 0;
  const lowConfidence = alerts.filter(
    (alert) => confidenceToScore(alert.confidence) < 0.5,
  ).length;
  return {
    total_alerts: total,
    high_severity: high,
    detection_rate: confidence,
    false_positives: lowConfidence,
  };
}

function buildSeverityDistribution(alerts) {
  return alerts.reduce(
    (distribution, alert) => {
      const severity = (alert.severity || "low").toLowerCase();
      if (distribution[severity] !== undefined) {
        distribution[severity] += 1;
      }
      return distribution;
    },
    { low: 0, medium: 0, high: 0 },
  );
}

function buildHeatmap(alerts) {
  const categories = [
    ...new Set(alerts.map((alert) => alert.threat_category).filter(Boolean)),
  ];
  const sources = [
    ...new Set(
      alerts
        .map(
          (alert) =>
            alert.entities?.source_ip ||
            alert.entities?.host ||
            alert.entities?.destination_ip,
        )
        .filter(Boolean),
    ),
  ];
  const counts = {};
  alerts.forEach((alert) => {
    const source =
      alert.entities?.source_ip ||
      alert.entities?.host ||
      alert.entities?.destination_ip;
    const category = alert.threat_category;
    if (source && category) {
      const key = `${source}::${category}`;
      counts[key] = (counts[key] || 0) + 1;
    }
  });
  return { categories, sources, counts };
}

function buildGraph(alerts) {
  const nodeMap = new Map();
  const edgeMap = new Map();

  alerts.forEach((alert) => {
    const graph = alert.attack_graph || {};
    (graph.nodes || []).forEach((node) => {
      if (node?.id && !nodeMap.has(node.id)) {
        nodeMap.set(node.id, { id: node.id, label: node.label || node.id });
      }
    });
    (graph.edges || []).forEach((edge) => {
      if (!edge?.source || !edge?.target) {
        return;
      }
      const key = `${edge.source}|${edge.target}|${edge.label || "related_to"}`;
      const current = edgeMap.get(key) || {
        source: edge.source,
        target: edge.target,
        label: edge.label || "related_to",
        weight: 0,
      };
      current.weight += 1;
      edgeMap.set(key, current);
    });

    const source = alert.entities?.source_ip;
    const host = alert.entities?.host;
    const target = alert.entities?.destination_ip;
    if (source) {
      nodeMap.set(source, { id: source, label: source });
    }
    if (host) {
      nodeMap.set(host, { id: host, label: host });
    }
    if (target) {
      nodeMap.set(target, { id: target, label: target });
    }
    if (source && host) {
      edgeMap.set(`${source}|${host}|observed_on`, {
        source,
        target: host,
        label: "observed_on",
        weight: 1,
      });
    }
    if (host && target) {
      edgeMap.set(`${host}|${target}|communicates_with`, {
        source: host,
        target,
        label: "communicates_with",
        weight: 1,
      });
    }
  });

  return {
    nodes: Array.from(nodeMap.values()).slice(0, 8),
    edges: Array.from(edgeMap.values()).slice(0, 10),
  };
}

function buildAlertSummary(alert) {
  const evidence = alert.explanation?.summary || alert.explanation?.reason || "";
  if (evidence) {
    return String(evidence);
  }

  const user = alert.entities?.user;
  const source = alert.entities?.source_ip;
  const target = alert.entities?.destination_ip;
  return (
    [user, source, target].filter(Boolean).join(" | ") ||
    "Alert generated from the backend detection pipeline."
  );
}

function buildCompactEntity(item) {
  return (
    item.entities?.source_ip ||
    item.host ||
    item.source_ip ||
    item.destination_ip ||
    item.user ||
    "No primary entity"
  );
}

function confidenceToScore(confidence) {
  if (typeof confidence === "number") {
    return Math.max(0, Math.min(1, confidence));
  }
  const mapping = {
    low: 0.35,
    medium: 0.65,
    high: 0.9,
  };
  return mapping[String(confidence || "").toLowerCase()] || 0.5;
}

function formatTimestamp(value) {
  if (!value) {
    return "Unknown time";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

function humanize(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function truncate(value, maxLength) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function formatMetric(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "n/a";
  }
  return `${Math.round(value * 100)}%`;
}

function SandboxPanel({ apiBaseUrl, apiToken }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verdictNote, setVerdictNote] = useState("");

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const headers = apiToken ? { Authorization: `Bearer ${apiToken}` } : {};
      const res = await fetch(`${apiBaseUrl}/v1/sandbox/sessions`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to fetch sandbox sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (sessionId) => {
    try {
      const headers = apiToken ? { Authorization: `Bearer ${apiToken}` } : {};
      const res = await fetch(`${apiBaseUrl}/v1/sandbox/sessions/${sessionId}`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedSession(data);
      }
    } catch (err) {
      console.error("Failed to fetch session details:", err);
    }
  };

  const submitDecision = async (verdict) => {
    if (!selectedSession) return;
    try {
      const headers = { "Content-Type": "application/json" };
      if (apiToken) headers["Authorization"] = `Bearer ${apiToken}`;

      const res = await fetch(`${apiBaseUrl}/v1/sandbox/decision`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          session_id: selectedSession.session.session_id,
          verdict,
          note: verdictNote,
        }),
      });
      if (res.ok) {
        setVerdictNote("");
        fetchSessions();
        loadSessionDetails(selectedSession.session.session_id);
      }
    } catch (err) {
      console.error("Failed to submit verdict:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <section className="content-grid">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Active Sandboxed Sessions</div>
          <button className="ghost-button" onClick={fetchSessions}>
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="empty-state">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">No active sandbox sessions.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Source IP</th>
                <th>Trust Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.session_id}>
                  <td>{truncate(s.session_id, 12)}</td>
                  <td>{s.source_ip}</td>
                  <td>{formatMetric(s.current_trust_score)}</td>
                  <td>
                    <span className={`badge ${s.status === "ACTIVE" ? "badge-warning" : ""}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="ghost-button"
                      onClick={() => loadSessionDetails(s.session_id)}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Session Analysis & Verdict</div>
        </div>
        {selectedSession ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="alert-detail">
              <strong>User:</strong> {selectedSession.session.user_id} <br />
              <strong>Trust Score:</strong>{" "}
              {formatMetric(selectedSession.session.current_trust_score)} <br />
              <strong>Intent Label:</strong>{" "}
              <span className="badge badge-danger">
                {selectedSession.intent_classification.label}
              </span>{" "}
              ({formatMetric(selectedSession.intent_classification.confidence)} conf)
            </div>

            <div className="explanation-box" style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "8px" }}>
              <strong>Explainability Engine Narrative:</strong>
              <p style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>
                {selectedSession.explanation.narrative}
              </p>
            </div>

            {selectedSession.session.status === "ACTIVE" ? (
              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label className="field">
                  <span>Analyst Notes</span>
                  <input
                    type="text"
                    value={verdictNote}
                    onChange={(e) => setVerdictNote(e.target.value)}
                    placeholder="Enter reasoning for verdict..."
                  />
                </label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button
                    className="primary-button"
                    style={{ background: "var(--success-color)", color: "black" }}
                    onClick={() => submitDecision("ALLOW")}
                  >
                    Allow (False Positive)
                  </button>
                  <button
                    className="primary-button"
                    style={{ background: "var(--danger-color)" }}
                    onClick={() => submitDecision("BLOCK")}
                  >
                    Block (Confirmed Hacker)
                  </button>
                </div>
              </div>
            ) : (
              <div className="alert-detail" style={{ background: "var(--bg-accent)" }}>
                <strong>Final Verdict:</strong> {selectedSession.session.analyst_verdict} <br/>
                <strong>Note:</strong> {selectedSession.session.analyst_note || "None"}
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">Select a session to inspect.</div>
        )}
      </div>
    </section>
  );
}
