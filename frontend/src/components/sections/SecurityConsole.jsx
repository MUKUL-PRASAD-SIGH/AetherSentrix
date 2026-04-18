import React from 'react';
import { TABS } from '../../utils/constants';
import { humanize } from '../../utils/helpers';

import { Banner } from '../ui/Banner';
import { StatTile } from '../ui/StatTile';
import { MetricCard } from '../ui/MetricCard';
import { HealthyCard as HealthCard } from '../ui/HealthCard';
import { ArchiveList } from '../ui/ArchiveList';
import { EmptyState } from '../ui/EmptyState';
import { JsonBlock } from '../ui/JsonBlock';

import { SeverityDial } from '../visuals/SeverityDial';
import { TrendChart } from '../visuals/TrendChart';
import { Heatmap } from '../visuals/Heatmap';
import { AttackGraph } from '../visuals/AttackGraph';
import { SeverityBars } from '../visuals/SeverityBars';
import { HybridPipeline } from '../visuals/HybridPipeline/HybridPipeline';

import { SandboxPanel } from './SandboxPanel';

import { AlertFeed } from '../alerts/AlertFeed';
import { AlertWorkbench } from '../alerts/AlertWorkbench';
import { AnalyticsTable } from '../alerts/AnalyticsTable';

import { ScenarioSummary } from '../ml/ScenarioSummary';
import { SimulationSummary } from '../ml/SimulationSummary';
import { IngestionResult } from '../ml/IngestionResult';
import { BatchResult } from '../ml/BatchResult';
import { ModeStatusCard } from '../ml/ModeStatusCard';
import { TrainingResultCard } from '../ml/TrainingResultCard';
import { ModelMetricsCard } from '../ml/ModelMetricsCard';
import { EndpointMatrix } from '../ml/EndpointMatrix';

export function SecurityConsole(props) {
  const {
    apiBaseUrl, setApiBaseUrl, apiToken, setApiToken, bootstrap, loading, runDemo, refreshArchives,
    banner, setBanner, backendHealth, assistantHealth, scenarios, isConnected, consoleOpen,
    ingestionHealth, recentAlerts, activeTab, setActiveTab, allAlerts, metrics, severityDistribution,
    selectedAlertId, setSelectedAlertId, selectedAlert, scenarioName, setScenarioName, runScenario,
    simulationReport, simulationAlert, jsonEditor, setJsonEditor, ingestJson, syslogEditor, setSyslogEditor,
    ingestSyslog, batchEditor, setBatchEditor, runBatchDetection, ingestResult, batchResult,
    targetModelMode, setTargetModelMode, switchModelMode, mlStatus, modelSourceMode, setModelSourceMode,
    selectedDatasetName, setSelectedDatasetName, trainModels, modelActionResult, assistantQuery,
    setAssistantQuery, runAssistant, assistantAnswer, recentEvents
  } = props;

  return (
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
  );
}
