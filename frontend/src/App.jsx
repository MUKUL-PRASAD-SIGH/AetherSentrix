import React, { useEffect, useState } from "react";
import LandingPage from "./LandingPage";
import "./landing.css";
import "./portal.css";

// Constants
import {
  DEFAULT_API_BASE,
  APP_SURFACES,
  TABS,
  ENDPOINT_COUNT,
  DEFAULT_JSON_EVENTS,
  DEFAULT_SYSLOG_LINE,
  DEFAULT_ASSISTANT_QUERY,
  DEFAULT_BATCH_EVENTS,
  BANK_TEMPLATES,
  SAAS_CAPABILITIES,
  BANK_JOURNEYS,
  COMPATIBILITY_AREAS,
} from "./utils/constants";

// Helpers
import {
  buildSeverityDistribution,
  buildMetrics,
  humanize,
  normalizeClientError,
  getConnectionIssue,
  parseResponse,
} from "./utils/helpers";

// UI Components
import { Banner } from "./components/ui/Banner";
import { StatTile } from "./components/ui/StatTile";
import { FeatureCard } from "./components/ui/FeatureCard";
import { ProductSurfaceNav } from "./components/ui/ProductSurfaceNav";
import { SignalRibbon } from "./components/ui/SignalRibbon";
import { MetricCard } from "./components/ui/MetricCard";
import { HealthyCard as HealthCard } from "./components/ui/HealthCard";
import { ArchiveList } from "./components/ui/ArchiveList";
import { EmptyState } from "./components/ui/EmptyState";
import { JsonBlock } from "./components/ui/JsonBlock";

// Visual Components
import { HeroRadar } from "./components/visuals/HeroRadar";
import { SeverityDial } from "./components/visuals/SeverityDial";
import { TrendChart } from "./components/visuals/TrendChart";
import { Heatmap } from "./components/visuals/Heatmap";
import { AttackGraph } from "./components/visuals/AttackGraph";
import { SeverityBars } from "./components/visuals/SeverityBars";
import { HybridPipeline } from "./components/visuals/HybridPipeline/HybridPipeline";

// Section Components
import { CompatibilityPanel } from "./components/sections/CompatibilityPanel";
import { SaaSReadinessPanel } from "./components/sections/SaaSReadinessPanel";
import { DeploymentPanel } from "./components/sections/DeploymentPanel";
import { BankPortalSandbox } from "./components/sections/BankPortalSandbox";
import { BankRolePanel } from "./components/sections/BankRolePanel";
import { WorkspaceMatrixPanel } from "./components/sections/WorkspaceMatrixPanel";
import { LegacyAccessPanel } from "./components/sections/LegacyAccessPanel";
import { ConnectionGuide } from "./components/sections/ConnectionGuide";
import { ConsolePreview } from "./components/sections/ConsolePreview";
import { SandboxPanel } from "./components/sections/SandboxPanel";

// Alert Components
import { AlertFeed } from "./components/alerts/AlertFeed";
import { AlertWorkbench } from "./components/alerts/AlertWorkbench";
import { AnalyticsTable } from "./components/alerts/AnalyticsTable";

// ML Components
import { ScenarioSummary } from "./components/ml/ScenarioSummary";
import { SimulationSummary } from "./components/ml/SimulationSummary";
import { IngestionResult } from "./components/ml/IngestionResult";
import { BatchResult } from "./components/ml/BatchResult";
import { ModeStatusCard } from "./components/ml/ModeStatusCard";
import { TrainingResultCard } from "./components/ml/TrainingResultCard";
import { ModelMetricsCard } from "./components/ml/ModelMetricsCard";
import { EndpointMatrix } from "./components/ml/EndpointMatrix";

function readSurfaceFromHash() {
  if (typeof window === "undefined") {
    return "saas";
  }
  const hash = window.location.hash.replace("#", "").trim().toLowerCase();
  return APP_SURFACES.some((surface) => surface.id === hash) ? hash : "saas";
}

export default function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE);
  const [apiToken, setApiToken] = useState("");
  const [activeSurface, setActiveSurface] = useState(readSurfaceFromHash);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTemplateId, setSelectedTemplateId] = useState("pesitm");
  const [selectedPortalRole, setSelectedPortalRole] = useState("customer");
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const syncSurface = () => {
      setActiveSurface(readSurfaceFromHash());
    };
    window.addEventListener("hashchange", syncSurface);
    return () => window.removeEventListener("hashchange", syncSurface);
  }, []);

  const allAlerts = dashboardData?.alerts?.length
    ? dashboardData.alerts
    : recentAlerts;
  const severityDistribution =
    dashboardData?.severity_distribution ||
    buildSeverityDistribution(allAlerts);
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

  function navigateSurface(surfaceId) {
    setActiveSurface(surfaceId);
    if (
      typeof window !== "undefined" &&
      window.location.hash !== `#${surfaceId}`
    ) {
      window.history.replaceState(null, "", `#${surfaceId}`);
    }
  }

  async function bootstrap() {
    setLoading((current) => ({ ...current, bootstrap: true }));
    try {
      const [
        healthResponse,
        assistantResponse,
        ingestionResponse,
        mlResponse,
        scenariosResponse,
      ] = await Promise.all([
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
      setSelectedDatasetName(
        mlResponse.ml?.available_datasets?.[0]?.name || "",
      );
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
      const [alertsResponse, eventsResponse, ingestionResponse, mlResponse] =
        await Promise.all([
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
        <ProductSurfaceNav
          activeSurface={activeSurface}
          onChange={navigateSurface}
        />

        {activeSurface === "saas" ? (
          <LandingPage
            isConnected={isConnected}
            metrics={metrics}
            scenarios={scenarios}
            backendHealth={backendHealth}
            navigateSurface={navigateSurface}
            setConsoleOpen={setConsoleOpen}
            setActiveTab={setActiveTab}
          />
        ) : null}

        {activeSurface === "portal" ? (
          <BankPortalSandbox
            activeTemplateId={selectedTemplateId}
            activeRoleId={selectedPortalRole}
            alertsCount={allAlerts.length}
            assistantConfigured={Boolean(assistantHealth?.configured)}
            backendStatus={backendHealth?.status || "offline"}
            isConnected={isConnected}
            onChangeRole={setSelectedPortalRole}
            onChangeTemplate={setSelectedTemplateId}
            onOpenConsole={() => {
              navigateSurface("console");
              setConsoleOpen(true);
              setActiveTab("overview");
            }}
          />
        ) : null}

        {activeSurface === "console" ? (
          <>
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
          </>
        ) : null}

        {activeSurface === "console" && (consoleOpen || isConnected) ? (
          <>
            <section className="hero-panel">
              <div className="hero-copy">
                <div className="eyebrow">AetherSentrix</div>
                <h1>Bank Security Operations Console</h1>
                <p>
                  Under the simulated bank experience, this is still the live
                  operator console. Run demos, inspect alerts, simulate attacks,
                  ingest telemetry, and review high-risk sessions from one
                  place.
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
                  isConnected
                    ? String(ingestionHealth?.ingested_events ?? 0)
                    : "pending"
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
                
                {/* NEW HYBRID PIPELINE DIAGRAM */}
                <div className="panel panel-span-two">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Real-Time Core Pipeline</div>
                      <div className="panel-subtitle">
                        Visually tracing the live inference through the SNN + LNN ensemble.
                      </div>
                    </div>
                  </div>
                  <HybridPipeline alerts={allAlerts} />
                </div>

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
                        Confidence and risk posture across the latest alert
                        stream.
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
                        Relationship view derived from the alert entities and
                        attack graph payloads.
                        <br />
                        <span style={{ color: "var(--accent-color)" }}>
                          <strong>AIM:</strong> Visualizes entity relationships
                          to trace the path and scope of the attack.
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
                  <ScenarioSummary
                    scenarios={scenarios}
                    scenarioName={scenarioName}
                  />
                </div>
                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">Simulation output</div>
                  </div>
                  <SimulationSummary
                    report={simulationReport}
                    alert={simulationAlert}
                  />
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
                    {loading.ingestion
                      ? "Processing..."
                      : "Run Batch Detection"}
                  </button>
                  <p className="panel-subtitle">
                    Sends `events_batch` to `/detect/batch` and shows the
                    resulting alerts.
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
                      onChange={(event) =>
                        setTargetModelMode(event.target.value)
                      }
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
                    Toggle runtime detection between the built-in synthetic
                    profile and the latest activated real-dataset artifact.
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
                      onChange={(event) =>
                        setModelSourceMode(event.target.value)
                      }
                    >
                      <option value="synthetic">Synthetic baseline</option>
                      <option value="real">Local real dataset</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Dataset</span>
                    <select
                      value={selectedDatasetName}
                      onChange={(event) =>
                        setSelectedDatasetName(event.target.value)
                      }
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
                    This runs preprocessing, split evaluation, artifact
                    versioning, and activation through the backend MLOps
                    pipeline.
                  </p>
                  <TrainingResultCard run={modelActionResult} />
                </div>
                <div className="panel panel-span-two">
                  <div className="panel-header">
                    <div className="panel-title">
                      Metrics & Recommendations
                    </div>
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
                      onChange={(event) =>
                        setAssistantQuery(event.target.value)
                      }
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
