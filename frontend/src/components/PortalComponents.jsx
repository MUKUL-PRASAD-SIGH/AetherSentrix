import React, { useEffect, useState } from "react";
import {
  BANK_TEMPLATES,
  PORTAL_ROLES,
  PORTAL_SCENARIOS,
  DEFAULT_PORTAL_ISSUES,
  BANKTHINK_ENDPOINTS,
  BANKTHINK_GUIDES,
  BANK_PERSONAS,
  BANK_WORKSPACES,
  LEGACY_ACCESS_STEPS,
  BANK_JOURNEYS,
} from "../constants.js";
import { buildPortalModules, buildSimulatedIssues, buildPortalActivity, buildPortalWorkspace } from "../utils.js";

export function HeroRadar({ isConnected, alerts }) {
  const points = (alerts || []).slice(0, 6);

  return (
    <div className="radar-card">
      <div className="radar-head">
        <span>Access and risk radar</span>
        <strong>{isConnected ? "monitoring" : "standby"}</strong>
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
            ? "Live risk signals pulsing from the backend while the bank portal story plays on top."
            : "Starts animating once the backend returns alert and session data."}
        </small>
      </div>
    </div>
  );
}

export function BankRolePanel() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Identity Layers</div>
          <p className="panel-subtitle">
            The portal separates real customer journeys from internal bank work
            while still modeling the risky in-between state of stale access.
          </p>
        </div>
      </div>
      <div className="persona-grid">
        {BANK_PERSONAS.map((persona) => (
          <article key={persona.title} className="persona-card">
            <div className="persona-head">
              <strong>{persona.title}</strong>
              <span>{persona.handle}</span>
            </div>
            <p>{persona.summary}</p>
            <div className="mini-row wrap">
              {persona.badges.map((badge) => (
                <span key={badge} className="chip">
                  {badge}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function WorkspaceMatrixPanel() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">App Surfaces</div>
          <p className="panel-subtitle">
            Each surface represents a bank app or module you can showcase
            inside one unified website.
          </p>
        </div>
      </div>
      <div className="workspace-list">
        {BANK_WORKSPACES.map((workspace) => (
          <article key={workspace.title} className="workspace-row">
            <div className="workspace-copy">
              <strong>{workspace.title}</strong>
              <p>{workspace.description}</p>
            </div>
            <span className="chip">{workspace.audience}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export function LegacyAccessPanel({ isConnected, alertsCount }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Legacy Credential Scenario</div>
          <p className="panel-subtitle">
            This is the story hook that makes the whole portal feel real instead
            of just decorative.
          </p>
        </div>
      </div>
      <div className="legacy-strip">
        <span className="chip">Dormant employee account</span>
        <span className="chip">{isConnected ? `${alertsCount} live signals` : "backend optional"}</span>
      </div>
      <div className="timeline-list">
        {LEGACY_ACCESS_STEPS.map((step, index) => (
          <article key={step.title} className="timeline-step">
            <div className="timeline-index">0{index + 1}</div>
            <div className="timeline-copy">
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="journey-note">
        {BANK_JOURNEYS.map((journey) => (
          <div key={journey} className="journey-row">
            {journey}
          </div>
        ))}
      </div>
    </section>
  );
}

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
  const template = BANK_TEMPLATES.find((item) => item.id === activeTemplateId) || BANK_TEMPLATES[0];
  const role = PORTAL_ROLES.find((item) => item.id === activeRoleId) || PORTAL_ROLES[0];
  const modules = buildPortalModules(template, role.id);
  const [activeModuleId, setActiveModuleId] = useState(modules[0]?.id || "overview");
  const [activeScenarioId, setActiveScenarioId] = useState(
    role.id === "legacy"
      ? "threat-hunt"
      : role.id === "employee"
        ? "ops-control"
        : "journey-qc",
  );
  const [selectedEndpointId, setSelectedEndpointId] = useState(BANKTHINK_ENDPOINTS[0].id);
  const [issueDraft, setIssueDraft] = useState(DEFAULT_PORTAL_ISSUES.join("\\n"));
  const [simulatedIssues, setSimulatedIssues] = useState(() =>
    buildSimulatedIssues(DEFAULT_PORTAL_ISSUES.join("\\n"), role.id, activeScenarioId),
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
    setSimulatedIssues(buildSimulatedIssues(issueDraft, role.id, activeScenarioId));
  }, [role.id, activeScenarioId]);

  const activeModule = modules.find((item) => item.id === activeModuleId) || modules[0];
  const activeScenario =
    PORTAL_SCENARIOS.find((item) => item.id === activeScenarioId) || PORTAL_SCENARIOS[0];
  const activity = buildPortalActivity(role.id, template.name, activeModule?.label);
  const selectedEndpoint =
    BANKTHINK_ENDPOINTS.find((item) => item.id === selectedEndpointId) || BANKTHINK_ENDPOINTS[0];
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
  const issueCountMetric = {
    label: "Issues in lab",
    value: String(simulatedIssues.length).padStart(2, "0"),
  };

  function handleIssueSimulation() {
    setSimulatedIssues(buildSimulatedIssues(issueDraft, role.id, activeScenario.id));
  }

  function resetIssueSimulation() {
    const nextDraft = DEFAULT_PORTAL_ISSUES.join("\\n");
    setIssueDraft(nextDraft);
    setSimulatedIssues(buildSimulatedIssues(nextDraft, role.id, activeScenario.id));
  }

  return (
    <section className="portal-lab portal-theme-pesitm">
      <div className="portal-hero">
        <div>
          <div className="eyebrow">Tenant Test Portal</div>
          <div className="portal-logo-lockup">
            <div className="portal-logo-mark">BP</div>
            <div>
              <span>Sunrise retail shell</span>
              <strong>{template.name}</strong>
              <small>{template.profile}</small>
            </div>
          </div>
          <h1>BankThink-guided banking simulation for {template.name}</h1>
          <p>
            Explore the bank like a live portal: product dashboards, internal
            operations, stale-access scenarios, endpoint guidance, and issue
            triage all sit inside the same branded tenant experience.
          </p>
          <div className="landing-pills">
            <span className="chip">Orange and yellow tenant theme</span>
            <span className="chip">Endpoint-led testing</span>
            <span className="chip">Multi-issue simulation board</span>
            <span className="chip">Customer, employee, and legacy access views</span>
          </div>
        </div>
        <div className="portal-hero-actions">
          <button className="primary-button" onClick={onOpenConsole}>
            Inspect Security Layer
          </button>
          <div className="portal-runtime-card">
            <strong>{backendStatus}</strong>
            <span>{isConnected ? `${alertsCount} live risk signals` : "frontend simulation ready"}</span>
          </div>
          <div className="portal-runtime-card portal-runtime-card-emphasis">
            <strong>{activeScenario.title}</strong>
            <span>{activeScenario.subtitle}</span>
          </div>
        </div>
      </div>

      <section className="portal-control-grid">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Choose Bank Template</div>
          </div>
          <div className="switch-grid">
            {BANK_TEMPLATES.map((item) => (
              <button
                key={item.id}
                className={item.id === template.id ? "switch-card active" : "switch-card"}
                onClick={() => onChangeTemplate(item.id)}
              >
                <strong>{item.name}</strong>
                <span>{item.profile}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Choose Role Surface</div>
          </div>
          <div className="switch-grid compact">
            {PORTAL_ROLES.map((item) => (
              <button
                key={item.id}
                className={item.id === role.id ? "switch-card active" : "switch-card"}
                onClick={() => onChangeRole(item.id)}
              >
                <strong>{item.label}</strong>
                <span>{item.subtitle}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Scenario Lens</div>
          </div>
          <div className="switch-grid compact">
            {PORTAL_SCENARIOS.map((item) => (
              <button
                key={item.id}
                className={item.id === activeScenario.id ? "switch-card active" : "switch-card"}
                onClick={() => setActiveScenarioId(item.id)}
              >
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Tenant Summary</div>
          </div>
          <p className="panel-subtitle">{template.summary}</p>
          <div className="mini-row wrap">
            {template.integrations.map((item) => (
              <span key={item} className="chip">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="portal-app-shell">
        <aside className="portal-sidebar">
          <div className="portal-brand-card">
            <span>Bank of Pesitm shell</span>
            <strong>{role.label}</strong>
            <small>{role.subtitle}</small>
            <div className="portal-brand-tags">
              <span className="chip">Live look and feel</span>
              <span className="chip">{activeScenario.title}</span>
            </div>
          </div>
          <div className="portal-nav-list">
            {modules.map((item) => (
              <button
                key={item.id}
                className={item.id === activeModule.id ? "portal-nav-item active" : "portal-nav-item"}
                onClick={() => setActiveModuleId(item.id)}
              >
                <strong>{item.label}</strong>
                <span>{item.caption}</span>
              </button>
            ))}
          </div>
          <article className="portal-card">
            <div className="panel-title">Portal Coverage</div>
            <div className="journey-note">
              <div className="journey-row">{template.modules.length} banking modules staged</div>
              <div className="journey-row">{BANKTHINK_ENDPOINTS.length} backend endpoints explained</div>
              <div className="journey-row">{simulatedIssues.length} issues ready for triage</div>
            </div>
          </article>
        </aside>

        <div className="portal-main">
          <div className="portal-metric-grid">
            {[...role.metrics, issueCountMetric].map((metric) => (
              <div key={metric.label} className="portal-stat-card">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>

          <article className="portal-card portal-card-wide portal-page-header">
            <div>
              <div className="panel-title">{activeModule.label}</div>
              <p className="panel-subtitle">{workspace.summary}</p>
            </div>
            <div className="mini-row wrap">
              <span className="chip">{activeScenario.title}</span>
              <span className="chip">{selectedEndpoint.method}</span>
              <span className="chip">{selectedEndpoint.path}</span>
            </div>
          </article>

          <div className="portal-focus-grid">
            {workspace.highlights.map((item) => (
              <article key={item.title} className="portal-focus-card">
                <span>{item.kicker}</span>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>

          <div className="portal-card-grid">
            <article className="portal-card">
              <div className="panel-title">Quick Actions</div>
              <div className="mini-row wrap">
                {role.actions.map((action) => (
                  <button key={action} className="ghost-button small-button">
                    {action}
                  </button>
                ))}
              </div>
              <div className="journey-note">
                {workspace.quickNotes.map((item) => (
                  <div key={item} className="journey-row">
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <article className="portal-card">
              <div className="panel-title">Workflow Preview</div>
              <div className="journey-note">
                {role.workflows.map((item) => (
                  <div key={item} className="journey-row">
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <article className="portal-card">
              <div className="panel-title">Feature Surfaces</div>
              <div className="portal-product-grid">
                {workspace.features.map((item) => (
                  <div key={item.title} className="portal-product-card">
                    <span>{item.kicker}</span>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="portal-card">
              <div className="panel-title">BankThink Test Trail</div>
              <div className="journey-note">
                {workspace.checkpoints.map((item) => (
                  <div key={item} className="journey-row">
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <article className="portal-card portal-card-wide">
              <div className="panel-title">Session and Activity Feed</div>
              <div className="portal-activity-list">
                {activity.map((item) => (
                  <div key={item.title} className="portal-activity-row">
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </div>
                    <span className="chip">{item.status}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>

        <aside className="portal-sidepanel">
          <article className="portal-card portal-bankthink-card">
            <div className="panel-title">BankThink Guide</div>
            <p className="panel-subtitle">{activeScenario.summary}</p>
            <div className="journey-note">
              {guide.map((item) => (
                <div key={item} className="journey-row">
                  {item}
                </div>
              ))}
            </div>
          </article>
          <article className="portal-card">
            <div className="panel-title">Endpoint Navigator</div>
            <label className="field">
              <span>BankThink endpoint focus</span>
              <select
                value={selectedEndpoint.id}
                onChange={(event) => setSelectedEndpointId(event.target.value)}
              >
                {BANKTHINK_ENDPOINTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.method} {item.path}
                  </option>
                ))}
              </select>
            </label>
            <div className="portal-endpoint-detail">
              <span>{selectedEndpoint.owner}</span>
              <strong>
                {selectedEndpoint.method} {selectedEndpoint.path}
              </strong>
              <p>{selectedEndpoint.purpose}</p>
              <div className="journey-note">
                <div className="journey-row">Test flow: {selectedEndpoint.test}</div>
                <div className="journey-row">Watch for: {selectedEndpoint.risk}</div>
              </div>
            </div>
          </article>
          <article className="portal-card">
            <div className="panel-title">Security Overlay</div>
            <div className="journey-note">
              <div className="journey-row">Backend: {backendStatus}</div>
              <div className="journey-row">Assistant: {assistantConfigured ? "configured" : "optional"}</div>
              <div className="journey-row">Legacy scenario support: enabled</div>
              <div className="journey-row">Simulation lens: {activeScenario.title}</div>
            </div>
          </article>
          <article className="portal-card">
            <div className="panel-title">Compatibility Notes</div>
            <div className="mini-row wrap">
              {template.modules.map((item) => (
                <span key={item} className="chip">
                  {item}
                </span>
              ))}
            </div>
            <p className="panel-subtitle">
              Swap tenant branding, modules, and integration adapters while
              keeping the same portal shell.
            </p>
          </article>
        </aside>
      </section>

      <section className="portal-simulation-grid">
        <article className="portal-card">
          <div className="panel-header">
            <div className="panel-title">Issue Intake Lab</div>
          </div>
          <p className="panel-subtitle">
            Paste one issue per line to simulate broken journeys, workflow drift,
            fraud cases, or stale-access problems across the bank portal.
          </p>
          <label className="field">
            <span>Issue list</span>
            <textarea
              className="issue-textarea"
              value={issueDraft}
              onChange={(event) => setIssueDraft(event.target.value)}
              placeholder="One issue per line"
              rows={8}
            />
          </label>
          <div className="button-row wrap">
            <button className="primary-button" onClick={handleIssueSimulation}>
              Simulate Issues
            </button>
            <button className="ghost-button" onClick={resetIssueSimulation}>
              Reset Sample Batch
            </button>
          </div>
        </article>

        <article className="portal-card">
          <div className="panel-header">
            <div className="panel-title">Simulation Triage Board</div>
          </div>
          <div className="portal-issue-list">
            {simulatedIssues.map((item) => (
              <div key={item.id} className="portal-issue-card">
                <div className="alert-card-top">
                  <strong>{item.title}</strong>
                  <span className={`severity-pill ${item.severity}`}>{item.severity}</span>
                </div>
                <p>{item.summary}</p>
                <div className="mini-row wrap">
                  <span className="chip">{item.owner}</span>
                  <span className="chip">{item.surface}</span>
                  <span className="chip">{item.status}</span>
                </div>
                <div className="journey-note">
                  <div className="journey-row">Suggested endpoint: {item.endpoint}</div>
                  <div className="journey-row">Next step: {item.nextAction}</div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="portal-endpoint-grid">
        {BANKTHINK_ENDPOINTS.map((item) => (
          <button
            key={item.id}
            className={item.id === selectedEndpoint.id ? "portal-endpoint-card active" : "portal-endpoint-card"}
            onClick={() => setSelectedEndpointId(item.id)}
          >
            <span>
              {item.method} {item.path}
            </span>
            <strong>{item.owner}</strong>
            <small>{item.purpose}</small>
          </button>
        ))}
      </section>
    </section>
  );
}
