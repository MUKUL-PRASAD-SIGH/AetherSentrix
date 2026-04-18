import React, { useEffect, useState } from "react";
import LandingPage from "./components/sections/LandingPage";
import "./landing.css";
import "./portal.css";
import {
  DEFAULT_API_BASE,
  APP_SURFACES,
  DEFAULT_JSON_EVENTS,
  DEFAULT_SYSLOG_LINE,
  DEFAULT_ASSISTANT_QUERY,
  DEFAULT_BATCH_EVENTS
} from "./utils/constants";
import {
  buildSeverityDistribution,
  buildMetrics,
  humanize,
  normalizeClientError,
  getConnectionIssue,
  parseResponse
} from "./utils/helpers";
import { ProductSurfaceNav } from "./components/ui/ProductSurfaceNav";
import { BankPortalSandbox } from "./components/sections/BankPortalSandbox";
import { ConnectionGuide } from "./components/sections/ConnectionGuide";
import { ConsolePreview } from "./components/sections/ConsolePreview";
import { SecurityConsole } from "./components/sections/SecurityConsole";

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
          <SecurityConsole
            apiBaseUrl={apiBaseUrl}
            setApiBaseUrl={setApiBaseUrl}
            apiToken={apiToken}
            setApiToken={setApiToken}
            bootstrap={bootstrap}
            loading={loading}
            runDemo={runDemo}
            refreshArchives={refreshArchives}
            banner={banner}
            setBanner={setBanner}
            backendHealth={backendHealth}
            assistantHealth={assistantHealth}
            scenarios={scenarios}
            isConnected={isConnected}
            consoleOpen={consoleOpen}
            ingestionHealth={ingestionHealth}
            recentAlerts={recentAlerts}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            allAlerts={allAlerts}
            metrics={metrics}
            severityDistribution={severityDistribution}
            selectedAlertId={selectedAlertId}
            setSelectedAlertId={setSelectedAlertId}
            selectedAlert={selectedAlert}
            scenarioName={scenarioName}
            setScenarioName={setScenarioName}
            runScenario={runScenario}
            simulationReport={simulationReport}
            simulationAlert={simulationAlert}
            jsonEditor={jsonEditor}
            setJsonEditor={setJsonEditor}
            ingestJson={ingestJson}
            syslogEditor={syslogEditor}
            setSyslogEditor={setSyslogEditor}
            ingestSyslog={ingestSyslog}
            batchEditor={batchEditor}
            setBatchEditor={setBatchEditor}
            runBatchDetection={runBatchDetection}
            ingestResult={ingestResult}
            batchResult={batchResult}
            targetModelMode={targetModelMode}
            setTargetModelMode={setTargetModelMode}
            switchModelMode={switchModelMode}
            mlStatus={mlStatus}
            modelSourceMode={modelSourceMode}
            setModelSourceMode={setModelSourceMode}
            selectedDatasetName={selectedDatasetName}
            setSelectedDatasetName={setSelectedDatasetName}
            trainModels={trainModels}
            modelActionResult={modelActionResult}
            assistantQuery={assistantQuery}
            setAssistantQuery={setAssistantQuery}
            runAssistant={runAssistant}
            assistantAnswer={assistantAnswer}
            recentEvents={recentEvents}
          />
        ) : null}
      </main>
    </div>
  );
}
