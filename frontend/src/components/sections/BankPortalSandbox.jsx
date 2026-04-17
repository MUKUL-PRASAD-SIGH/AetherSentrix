import React, { useEffect, useState } from "react";
import {
  BANK_TEMPLATES,
  PORTAL_ROLES,
  PORTAL_SCENARIOS,
  PORTAL_TABS,
  DEFAULT_PORTAL_ISSUES,
  BANKTHINK_ENDPOINTS,
  BANKTHINK_GUIDES,
} from "../../utils/constants";
import {
  buildPortalModules,
  buildSimulatedIssues,
  buildPortalActivity,
  buildPortalWorkspace,
} from "../../utils/helpers";

export function BankPortalSandbox({
  activeTemplateId,
  activeRoleId,
  alertsCount,
  assistantConfigured,
  backendStatus,
  isConnected,
  onChangeRole,
  onChangeTemplate,
  onOpenConsole,
}) {
  const template =
    BANK_TEMPLATES.find((item) => item.id === activeTemplateId) ||
    BANK_TEMPLATES[0];
  const role =
    PORTAL_ROLES.find((item) => item.id === activeRoleId) || PORTAL_ROLES[0];
  const modules = buildPortalModules(template, role.id);
  const [activeModuleId, setActiveModuleId] = useState(
    modules[0]?.id || "overview",
  );
  const [activeScenarioId, setActiveScenarioId] = useState(
    role.id === "legacy"
      ? "threat-hunt"
      : role.id === "employee"
        ? "ops-control"
        : "journey-qc",
  );
  const [activePortalTab, setActivePortalTab] = useState("overview");
  const [selectedEndpointId, setSelectedEndpointId] = useState(
    BANKTHINK_ENDPOINTS[0].id,
  );
  const [issueDraft, setIssueDraft] = useState(
    DEFAULT_PORTAL_ISSUES.join("\n"),
  );
  const [simulatedIssues, setSimulatedIssues] = useState(() =>
    buildSimulatedIssues(
      DEFAULT_PORTAL_ISSUES.join("\n"),
      role.id,
      activeScenarioId,
    ),
  );

  useEffect(() => {
    setActiveModuleId(modules[0]?.id || "overview");
    setActiveScenarioId(
      role.id === "legacy"
        ? "threat-hunt"
        : role.id === "employee"
          ? "ops-control"
          : "journey-qc",
    );
  }, [role.id, template.id]);

  useEffect(() => {
    setSimulatedIssues(
      buildSimulatedIssues(issueDraft, role.id, activeScenarioId),
    );
  }, [role.id, activeScenarioId]);

  const activeModule =
    modules.find((item) => item.id === activeModuleId) || modules[0];
  const activeScenario =
    PORTAL_SCENARIOS.find((item) => item.id === activeScenarioId) ||
    PORTAL_SCENARIOS[0];
  const activity = buildPortalActivity(
    role.id,
    template.name,
    activeModule?.label,
  );
  const selectedEndpoint =
    BANKTHINK_ENDPOINTS.find((item) => item.id === selectedEndpointId) ||
    BANKTHINK_ENDPOINTS[0];
  const workspace = buildPortalWorkspace({
    roleId: role.id,
    template,
    module: activeModule,
    scenario: activeScenario,
    issues: simulatedIssues,
    isConnected,
    alertsCount,
  });
  const guide = BANKTHINK_GUIDES[role.id] || BANKTHINK_GUIDES.customer;

  function handleIssueSimulation() {
    setSimulatedIssues(
      buildSimulatedIssues(issueDraft, role.id, activeScenarioId),
    );
  }

  function resetIssueSimulation() {
    const nextDraft = DEFAULT_PORTAL_ISSUES.join("\n");
    setIssueDraft(nextDraft);
    setSimulatedIssues(
      buildSimulatedIssues(nextDraft, role.id, activeScenarioId),
    );
  }

  return (
    <section className="portal-lab portal-theme-pesitm">
      {/* ── Dashboard Header ──────────────────────────────────────────── */}
      <div className="bp-header">
        <div className="bp-header-left">
          <div className="bp-logo">BP</div>
          <div className="bp-header-info">
            <h2>{template.name}</h2>
            <span>{template.profile}</span>
          </div>
        </div>
        <div className="bp-header-right">
          <span className="bp-header-pill bp-pill-role">
            {role.label}
          </span>
          <span className="bp-header-pill bp-pill-scenario">
            {activeScenario.title}
          </span>
          <span
            className={`bp-header-pill bp-pill-status ${isConnected ? "" : "offline"}`}
          >
            <span className="bp-status-dot" />
            {isConnected ? backendStatus : "offline"}
          </span>
          <button className="primary-button" onClick={onOpenConsole}>
            SOC Console
          </button>
        </div>
      </div>

      {/* ── Control Switchers ─────────────────────────────────────────── */}
      <div className="bp-controls">
        <div className="bp-control-group">
          <span className="bp-control-label">Bank Template</span>
          <div className="bp-control-options">
            {BANK_TEMPLATES.map((item) => (
              <button
                key={item.id}
                className={`bp-control-btn ${item.id === template.id ? "active" : ""}`}
                onClick={() => onChangeTemplate(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
        <div className="bp-control-group">
          <span className="bp-control-label">Role Surface</span>
          <div className="bp-control-options">
            {PORTAL_ROLES.map((item) => (
              <button
                key={item.id}
                className={`bp-control-btn ${item.id === role.id ? "active" : ""}`}
                onClick={() => onChangeRole(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="bp-control-group">
          <span className="bp-control-label">Scenario Lens</span>
          <div className="bp-control-options">
            {PORTAL_SCENARIOS.map((item) => (
              <button
                key={item.id}
                className={`bp-control-btn ${item.id === activeScenario.id ? "active" : ""}`}
                onClick={() => setActiveScenarioId(item.id)}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3-Column Dashboard ────────────────────────────────────────── */}
      <div className="bp-dashboard">
        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className="bp-sidebar">
          <div className="bp-sidebar-card">
            <span className="bp-sidebar-card-title">Modules</span>
            <div className="bp-module-list">
              {modules.map((item) => (
                <button
                  key={item.id}
                  className={`bp-module-btn ${item.id === activeModule.id ? "active" : ""}`}
                  onClick={() => setActiveModuleId(item.id)}
                >
                  <strong>{item.label}</strong>
                  <span>{item.caption}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bp-sidebar-card">
            <span className="bp-sidebar-card-title">Role Metrics</span>
            {role.metrics.map((metric) => (
              <div key={metric.label} className="bp-stat-mini">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
            <div className="bp-stat-mini">
              <span>Issues in lab</span>
              <strong>{String(simulatedIssues.length).padStart(2, "0")}</strong>
            </div>
          </div>

          <div className="bp-sidebar-card">
            <span className="bp-sidebar-card-title">Quick Actions</span>
            <div className="bp-quick-actions">
              {role.actions.map((action) => (
                <button key={action} className="bp-action-btn">
                  {action}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main Workspace ───────────────────────────────────────────── */}
        <div className="bp-main">
          {/* Tab Bar */}
          <div className="bp-tab-bar">
            {PORTAL_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`bp-tab ${tab.id === activePortalTab ? "active" : ""}`}
                onClick={() => setActivePortalTab(tab.id)}
              >
                <span className="bp-tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Overview ───────────────────────────────────────── */}
          {activePortalTab === "overview" && (
            <>
              {/* Metrics */}
              <div className="bp-metrics-row">
                {[...role.metrics, { label: "Issues", value: String(simulatedIssues.length).padStart(2, "0") }].map(
                  (metric) => (
                    <div key={metric.label} className="bp-metric-card">
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                    </div>
                  ),
                )}
              </div>

              {/* Active Module */}
              <div className="bp-card">
                <span className="bp-card-title">{activeModule.label}</span>
                <p className="bp-card-summary">{workspace.summary}</p>
                <div className="bp-features-grid">
                  {workspace.features.map((item) => (
                    <div key={item.title} className="bp-feature-tile">
                      <span>{item.kicker}</span>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div className="bp-card">
                <span className="bp-card-title">Workspace Highlights</span>
                <div className="bp-features-grid">
                  {workspace.highlights.map((item) => (
                    <div key={item.title} className="bp-feature-tile">
                      <span>{item.kicker}</span>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Feed */}
              <div className="bp-card">
                <span className="bp-card-title">Session Activity</span>
                <div className="bp-feed">
                  {activity.map((item) => (
                    <div key={item.title} className="bp-feed-item">
                      <div
                        className={`bp-feed-dot status-${item.status.toLowerCase().replace(/\s/g, "-")}`}
                      />
                      <div className="bp-feed-body">
                        <strong>{item.title}</strong>
                        <p>{item.detail}</p>
                      </div>
                      <span className="bp-feed-status">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workflow + Checkpoints */}
              <div className="bp-card">
                <span className="bp-card-title">Workflow Preview</span>
                <div className="bp-notes-list">
                  {role.workflows.map((item) => (
                    <div key={item} className="bp-note-item">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bp-card">
                <span className="bp-card-title">BankThink Test Trail</span>
                <div className="bp-notes-list">
                  {workspace.checkpoints.map((item) => (
                    <div key={item} className="bp-note-item">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Tab: Endpoints ──────────────────────────────────────── */}
          {activePortalTab === "endpoints" && (
            <>
              <div className="bp-endpoint-grid">
                {BANKTHINK_ENDPOINTS.map((item) => (
                  <button
                    key={item.id}
                    className={`bp-endpoint-btn ${item.id === selectedEndpoint.id ? "active" : ""}`}
                    onClick={() => setSelectedEndpointId(item.id)}
                  >
                    <span
                      className={`bp-endpoint-method ${item.method.toLowerCase()}`}
                    >
                      {item.method}
                    </span>
                    <strong>{item.path}</strong>
                    <small>{item.owner} — {item.purpose}</small>
                  </button>
                ))}
              </div>

              <div className="bp-endpoint-detail">
                <div className="bp-endpoint-detail-method">
                  <span
                    className={`bp-endpoint-method ${selectedEndpoint.method.toLowerCase()}`}
                  >
                    {selectedEndpoint.method}
                  </span>
                  {selectedEndpoint.path}
                </div>
                <h4>{selectedEndpoint.owner}: {selectedEndpoint.purpose}</h4>
                <p>{selectedEndpoint.purpose}</p>
                <div className="bp-notes-list">
                  <div className="bp-note-item">
                    <strong style={{ color: "var(--portal-copy)" }}>Test: </strong>
                    {selectedEndpoint.test}
                  </div>
                  <div className="bp-note-item">
                    <strong style={{ color: "var(--portal-copy)" }}>Risk: </strong>
                    {selectedEndpoint.risk}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Tab: Issue Lab ──────────────────────────────────────── */}
          {activePortalTab === "issues" && (
            <div className="bp-issue-layout">
              <div className="bp-card">
                <span className="bp-card-title">Issue Intake</span>
                <p className="bp-card-summary">
                  Paste one issue per line to simulate broken journeys, workflow
                  drift, fraud cases, or stale-access problems.
                </p>
                <textarea
                  className="bp-issue-textarea"
                  value={issueDraft}
                  onChange={(event) => setIssueDraft(event.target.value)}
                  placeholder="One issue per line"
                  rows={8}
                />
                <div className="bp-issue-actions">
                  <button
                    className="primary-button"
                    onClick={handleIssueSimulation}
                  >
                    Simulate
                  </button>
                  <button
                    className="ghost-button"
                    onClick={resetIssueSimulation}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="bp-card">
                <span className="bp-card-title">
                  Triage Board ({simulatedIssues.length})
                </span>
                <div className="bp-issue-list">
                  {simulatedIssues.map((item) => (
                    <div key={item.id} className="bp-issue-card">
                      <div className="bp-issue-card-head">
                        <strong>{item.title}</strong>
                        <span className={`bp-severity ${item.severity}`}>
                          {item.severity}
                        </span>
                      </div>
                      <p>{item.summary}</p>
                      <div className="bp-issue-tags">
                        <span className="bp-issue-tag">{item.owner}</span>
                        <span className="bp-issue-tag">{item.surface}</span>
                        <span className="bp-issue-tag">{item.status}</span>
                        <span className="bp-issue-tag">{item.endpoint}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Security Panel (right sidebar) ───────────────────────────── */}
        <aside className="bp-security">
          <div className="bp-security-card">
            <div className="bp-security-card-title">
              <span className="bp-sec-icon">🛡️</span>
              AetherSentrix Monitoring
            </div>
            <div className="bp-threat-indicator">
              <span className="bp-threat-score">
                {role.id === "legacy" ? "34%" : role.id === "employee" ? "82%" : "91%"}
              </span>
              <p>
                {role.id === "legacy"
                  ? "Low trust — privilege drift detected"
                  : role.id === "employee"
                    ? "Moderate trust — internal ops"
                    : "High trust — standard session"}
              </p>
            </div>
            <div className="bp-threat-indicator">
              <span className="bp-threat-score">{alertsCount || 0}</span>
              <p>Live risk signals across all layers</p>
            </div>
          </div>

          <div className="bp-security-card">
            <div className="bp-security-card-title">
              <span className="bp-sec-icon">📡</span>
              System Status
            </div>
            <div className="bp-security-stat">
              <span>Backend</span>
              <strong className={isConnected ? "status-ok" : "status-danger"}>
                {backendStatus}
              </strong>
            </div>
            <div className="bp-security-stat">
              <span>Assistant</span>
              <strong className={assistantConfigured ? "status-ok" : "status-warn"}>
                {assistantConfigured ? "configured" : "optional"}
              </strong>
            </div>
            <div className="bp-security-stat">
              <span>Scenario</span>
              <strong>{activeScenario.title}</strong>
            </div>
            <div className="bp-security-stat">
              <span>Legacy control</span>
              <strong className="status-ok">enabled</strong>
            </div>
          </div>

          <div className="bp-security-card">
            <div className="bp-security-card-title">
              <span className="bp-sec-icon">🧠</span>
              BankThink Guide
            </div>
            <p style={{ margin: "0 0 10px", fontSize: "0.8rem", color: "var(--portal-muted)" }}>
              {activeScenario.summary}
            </p>
            {guide.map((item) => (
              <div key={item} className="bp-guide-item">
                {item}
              </div>
            ))}
          </div>

          <div className="bp-security-card">
            <div className="bp-security-card-title">
              <span className="bp-sec-icon">🏷️</span>
              Tenant Modules
            </div>
            <div className="bp-quick-actions">
              {template.modules.map((item) => (
                <span key={item} className="bp-issue-tag">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
