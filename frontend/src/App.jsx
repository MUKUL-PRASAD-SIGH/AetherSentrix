import React, { useEffect, useState } from "react";
import LandingPage from "./LandingPage";
import "./landing.css";

const DEFAULT_API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080";

const APP_SURFACES = [
  { id: "saas", label: "SaaS Platform" },
  { id: "portal", label: "Bank Portal" },
  { id: "console", label: "Security Console" },
];

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

const BANK_PERSONAS = [
  {
    title: "External Users",
    handle: "Retail and business customers",
    summary:
      "Customers use one portal for balances, transfers, cards, loans, statements, and support requests.",
    badges: ["Accounts", "Payments", "Cards", "Loans"],
  },
  {
    title: "Internal Users",
    handle: "Branch, ops, fraud, and support teams",
    summary:
      "Employees work from internal tools for approvals, KYC review, dispute handling, customer servicing, and risk operations.",
    badges: ["CRM", "KYC", "Approvals", "Fraud Desk"],
  },
  {
    title: "Legacy Users",
    handle: "Former employee or stale internal identity",
    summary:
      "Simulates the dangerous case where an old employee still has working credentials and tries to access privileged flows.",
    badges: ["Dormant Creds", "Privilege Drift", "Step-up Auth", "Sandbox"],
  },
];

const BANK_WORKSPACES = [
  {
    title: "Customer Banking",
    audience: "External",
    description:
      "Savings/current accounts, beneficiaries, transfers, bill pay, cards, FD/RD, and service tickets.",
  },
  {
    title: "Relationship Desk",
    audience: "Internal",
    description:
      "360-degree customer profile, KYC review, onboarding queues, document checks, and case notes.",
  },
  {
    title: "Payments Hub",
    audience: "Shared",
    description:
      "NEFT, RTGS, IMPS, UPI-style flows, limits, approval ladders, and transaction monitoring.",
  },
  {
    title: "Credit and Loans",
    audience: "External + Internal",
    description:
      "Loan applications, underwriting checkpoints, disbursement tracking, EMI schedules, and collections notes.",
  },
  {
    title: "Fraud and Trust",
    audience: "Internal",
    description:
      "Risk scoring, suspicious session reviews, account locks, analyst verdicts, and adaptive access controls.",
  },
  {
    title: "Admin and Treasury",
    audience: "Internal",
    description:
      "Privileged staff tools for limits, liquidity visibility, policy updates, audit trails, and maker-checker workflows.",
  },
];

const BANK_JOURNEYS = [
  "Customer logs in, checks balances, transfers funds, raises a card-block request.",
  "Branch employee reviews KYC, updates contact details, and approves a service case.",
  "Fraud analyst investigates a risky session and routes the user into a controlled sandbox.",
  "Former employee signs in with stale credentials and trips trust-score, intent, and sandbox checks.",
];

const LEGACY_ACCESS_STEPS = [
  {
    title: "Dormant identity reappears",
    detail:
      "A retired operations user signs in with valid but outdated credentials from an unfamiliar device and network.",
  },
  {
    title: "Access crosses role boundaries",
    detail:
      "The account attempts internal screens like customer search, approval queues, and privileged staff-only controls.",
  },
  {
    title: "Trust engine intervenes",
    detail:
      "AetherSentrix can step up auth, isolate the session, raise an alert, and hand the case to an analyst for review.",
  },
];

const BANK_TEMPLATES = [
  {
    id: "pesitm",
    name: "Bank of Pesitm",
    profile: "Retail, SME, and treasury-ready digital bank",
    summary:
      "A guided simulation tenant for exploring customer banking, internal servicing, high-risk access, and endpoint-led testing from one bank shell.",
    modules: ["Accounts", "Cards", "Payments", "Loans", "Service Hub", "Treasury"],
    integrations: ["Core banking", "CRM", "Payment switch", "AML and fraud", "Document vault"],
  },
  {
    id: "universal",
    name: "NorthStar Universal Bank",
    profile: "Universal retail and corporate bank",
    summary:
      "Designed for banks that need retail journeys, internal servicing, and multi-step approvals in one digital estate.",
    modules: ["Accounts", "Cards", "Payments", "Loans", "KYC", "Treasury"],
    integrations: ["Core banking", "CRM", "Payment switch", "AML and fraud", "Document vault"],
  },
  {
    id: "digital",
    name: "Aquila Digital Bank",
    profile: "Digital-first and neo-bank model",
    summary:
      "Optimized for mobile onboarding, instant payments, embedded lending, and high-volume support automation.",
    modules: ["Onboarding", "Wallet", "UPI rails", "Virtual cards", "Micro-loans", "Disputes"],
    integrations: ["Identity provider", "Risk engine", "Card processor", "Notification hub", "Data lake"],
  },
  {
    id: "cooperative",
    name: "Harbor Cooperative Bank",
    profile: "Regional and branch-led bank",
    summary:
      "Supports maker-checker branch operations, local approvals, and customer servicing with stricter human review loops.",
    modules: ["Deposits", "Branch servicing", "Approvals", "Locker requests", "Recovery", "Audit"],
    integrations: ["CBS", "Branch ops", "SMS gateway", "Audit trail", "Loan servicing"],
  },
];

const PORTAL_ROLES = [
  {
    id: "customer",
    label: "Customer View",
    subtitle: "External user self-service",
    metrics: [
      { label: "Accounts", value: "04" },
      { label: "Pending transfers", value: "02" },
      { label: "Active cards", value: "03" },
    ],
    actions: ["Transfer funds", "Manage beneficiaries", "Block card", "Download statement"],
    workflows: [
      "View balances, statements, cards, loans, and recent payments from a single dashboard.",
      "Raise service requests and track their status without leaving the portal.",
      "Trigger step-up authentication when transaction patterns become unusual.",
    ],
  },
  {
    id: "employee",
    label: "Employee View",
    subtitle: "Internal servicing and operations",
    metrics: [
      { label: "Cases in queue", value: "18" },
      { label: "Approvals waiting", value: "07" },
      { label: "KYC reviews", value: "11" },
    ],
    actions: ["Search customer", "Review KYC", "Approve limit change", "Resolve dispute"],
    workflows: [
      "Use a staff-only workspace for customer search, document review, and maker-checker approvals.",
      "Handle disputes, contact-detail updates, and branch escalation notes with audit trails.",
      "Route high-risk sessions directly to fraud operations for review.",
    ],
  },
  {
    id: "legacy",
    label: "Legacy Access View",
    subtitle: "Former employee with stale credentials",
    metrics: [
      { label: "Trust score", value: "34%" },
      { label: "Privilege mismatch", value: "High" },
      { label: "Analyst verdict", value: "Pending" },
    ],
    actions: ["Step-up auth", "Move to sandbox", "Freeze session", "Escalate to analyst"],
    workflows: [
      "Model a dormant internal identity signing in successfully from an unmanaged device.",
      "Detect role drift when the account reaches customer search, approvals, or treasury screens.",
      "Contain the session with trust-scoring, sandbox routing, and analyst sign-off.",
    ],
  },
];

const PORTAL_SCENARIOS = [
  {
    id: "journey-qc",
    title: "Journey QA",
    subtitle: "Customer friction and service quality",
    summary:
      "Exercise balances, transfers, statements, service requests, and approval checkpoints like a product QA bench.",
  },
  {
    id: "ops-control",
    title: "Ops Control",
    subtitle: "Internal workflow and maker-checker resilience",
    summary:
      "Trace queue health, approvals, KYC delays, staff controls, and document handoffs across bank operations.",
  },
  {
    id: "threat-hunt",
    title: "Threat Hunt",
    subtitle: "Dormant access, policy drift, and containment",
    summary:
      "Model stale identities, privilege mismatch, unmanaged devices, and sandbox routing from a defender perspective.",
  },
];

const DEFAULT_PORTAL_ISSUES = [
  "Dormant employee credentials still reach approval queue after offboarding.",
  "KYC document verification takes too long for SME onboarding journeys.",
  "Card freeze request does not hotlist quickly on the payment switch.",
];

const BANKTHINK_ENDPOINTS = [
  {
    id: "health",
    method: "GET",
    path: "/health",
    owner: "Platform",
    purpose: "Checks whether the backend is reachable before live testing starts.",
    test: "Call this first and expect an ok service status before moving into live demos.",
    risk: "If unavailable, stay in simulation mode and verify API base URL or backend startup.",
  },
  {
    id: "assistant-health",
    method: "GET",
    path: "/assistant/health",
    owner: "BankThink",
    purpose: "Shows whether the assistant layer is configured and ready to answer triage prompts.",
    test: "Verify model name, configuration state, and the last successful assistant call.",
    risk: "If misconfigured, keep portal guidance local and avoid assuming generated recommendations are live.",
  },
  {
    id: "ingestion-health",
    method: "GET",
    path: "/ingestion/health",
    owner: "Telemetry",
    purpose: "Confirms ingestion totals and archive readiness for the simulation shell.",
    test: "Check ingested event count before and after posting test telemetry.",
    risk: "A stalled counter suggests events are not being normalized or persisted correctly.",
  },
  {
    id: "scenarios",
    method: "GET",
    path: "/scenarios",
    owner: "Simulation",
    purpose: "Lists the backend attack or workflow scenarios available for testing.",
    test: "Use it to validate that the frontend scenario selector is aligned with the live backend.",
    risk: "A mismatch here means the UI may advertise scenarios the backend cannot run.",
  },
  {
    id: "alerts-recent",
    method: "GET",
    path: "/alerts/recent",
    owner: "Security Console",
    purpose: "Pulls the latest alerts to power analyst review and tenant overlays.",
    test: "Refresh after demo or simulate runs and confirm new alerts appear with timestamps.",
    risk: "Missing alerts can hide real detections from the portal security layer.",
  },
  {
    id: "events-recent",
    method: "GET",
    path: "/events/recent",
    owner: "Archive",
    purpose: "Shows recent normalized events that back alerts and audit trails.",
    test: "Compare posted payloads with the normalized event archive to catch parsing drift.",
    risk: "If records look incomplete, field normalization or storage may be dropping context.",
  },
  {
    id: "ml-status",
    method: "GET",
    path: "/ml/status",
    owner: "Models",
    purpose: "Exposes the active model mode, version, and training status.",
    test: "Check the active mode before evaluating detection quality or false positives.",
    risk: "Review results can be misleading if you think real mode is live but synthetic mode is active.",
  },
  {
    id: "ingest",
    method: "POST",
    path: "/ingest",
    owner: "Telemetry",
    purpose: "Submits structured JSON events into the ingestion pipeline.",
    test: "Send a small batch from the issue lab and verify the archive count increases.",
    risk: "Malformed arrays or missing required fields will quietly break downstream analysis quality.",
  },
  {
    id: "ingest-syslog",
    method: "POST",
    path: "/ingest/syslog",
    owner: "Telemetry",
    purpose: "Normalizes raw syslog lines into event records that the portal can inspect.",
    test: "Use it to test branch-device, auth-node, or firewall text logs quickly.",
    risk: "Bad parser assumptions can hide indicators inside noisy raw log lines.",
  },
  {
    id: "detect",
    method: "POST",
    path: "/detect",
    owner: "Detection",
    purpose: "Runs the detector on a single event set and returns an alert when warranted.",
    test: "Post suspicious sequences after ingesting them to verify the trust story end to end.",
    risk: "Low-confidence alerts may need retraining, threshold changes, or better feature coverage.",
  },
  {
    id: "detect-batch",
    method: "POST",
    path: "/detect/batch",
    owner: "Detection",
    purpose: "Processes multiple event batches to stress the live detection pipeline.",
    test: "Use it for payment spikes, branch bursts, or card-rail noise simulation.",
    risk: "Batch gaps can reveal scaling or queueing problems that single-event tests miss.",
  },
  {
    id: "demo-run",
    method: "POST",
    path: "/demo/run",
    owner: "Showcase",
    purpose: "Triggers the backend demo flow and repopulates the live dashboard.",
    test: "Run this after major changes to confirm the end-to-end product narrative still works.",
    risk: "If demo data fails to appear, the portal may look fine while the backend story is broken.",
  },
  {
    id: "simulate",
    method: "POST",
    path: "/simulate",
    owner: "Simulation",
    purpose: "Executes a named scenario and returns the generated event path.",
    test: "Start here for legacy access or fraud stories, then feed the events into detection.",
    risk: "If scenario payloads drift, your portal walkthrough no longer reflects the true backend flow.",
  },
  {
    id: "ml-train",
    method: "POST",
    path: "/ml/train",
    owner: "Models",
    purpose: "Trains or retrains a synthetic or real-profiled model version.",
    test: "Use after gathering enough labeled issues to verify whether accuracy improves.",
    risk: "Training on weak or biased data can make the simulation feel better while detection worsens.",
  },
  {
    id: "ml-mode",
    method: "POST",
    path: "/ml/mode",
    owner: "Models",
    purpose: "Switches runtime detection between model profiles.",
    test: "Toggle before a scenario run to compare synthetic and real readiness.",
    risk: "Unexpected mode flips can invalidate comparisons and analyst trust.",
  },
  {
    id: "assistant",
    method: "POST",
    path: "/assistant",
    owner: "BankThink",
    purpose: "Sends alerts and a prompt to the assistant for triage guidance.",
    test: "Ask for next steps on a risky session or on the issue batch you just entered.",
    risk: "Treat responses as guidance, not policy, unless the assistant health endpoint is healthy.",
  },
];

const BANKTHINK_GUIDES = {
  customer: [
    "Start with balances, transfers, cards, and service tickets to validate the front-door banking journey.",
    "Use the issue intake lab for friction such as delayed statements, failed payees, or broken card controls.",
    "When a customer scenario feels risky, pivot into detection endpoints to see whether security catches it.",
  ],
  employee: [
    "Focus on queue health, maker-checker approvals, KYC review, and case notes across internal tools.",
    "Enter operational issues in bulk to simulate backlog, handoff delays, and privileged workflow drift.",
    "Pair each workflow issue with archive and alert endpoints to verify that servicing is still observable.",
  ],
  legacy: [
    "Model stale or former-employee access that lands inside staff-only modules from unmanaged devices.",
    "Test simulate, detect, sandbox, and analyst-oriented endpoints together to see the containment story.",
    "Use the issue board to pressure-test offboarding, trust score drops, and privilege mismatch handling.",
  ],
};

const SAAS_CAPABILITIES = [
  {
    title: "Multi-tenant and white-label",
    description:
      "Run one product with tenant-specific branding, modules, policy rules, and identity boundaries for each bank.",
  },
  {
    title: "API-first integration",
    description:
      "Attach to core banking, CRM, payment switches, AML systems, LOS, card processors, and event buses without rewriting the portal.",
  },
  {
    title: "Risk-aware access",
    description:
      "Use the same trust and sandbox engine across customers, staff, vendors, and suspicious legacy identities.",
  },
  {
    title: "Production-minded delivery",
    description:
      "Keep clear separation between the customer portal, bank workspaces, and the analyst console while sharing telemetry underneath.",
  },
];

const COMPATIBILITY_AREAS = [
  "Core banking systems",
  "Loan origination and servicing",
  "Card management and dispute systems",
  "AML, fraud, and case management",
  "Identity providers and SSO",
  "Notifications, document vaults, and audit archives",
];

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
  const [showLanding, setShowLanding] = useState(true);
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

  function navigateSurface(surfaceId) {
    setActiveSurface(surfaceId);
    if (typeof window !== "undefined" && window.location.hash !== `#${surfaceId}`) {
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
        <ProductSurfaceNav
          activeSurface={activeSurface}
          onChange={navigateSurface}
        />

        {activeSurface === "saas" ? (
          <>
            <section className="landing-hero">
              <div className="landing-copy">
                <div className="eyebrow">Banking SaaS Platform</div>
                <div className="hero-kicker">
                  <span className="live-dot" />
                  Multi-tenant product plus separate testable bank portal
                </div>
                <h1>
                  Ship a bank-ready SaaS platform and a separate tenant portal
                  without hardcoding it to one bank.
                </h1>
                <p>
                  AetherSentrix now frames itself as a SaaS foundation for
                  banks: white-label portals, internal staff workspaces,
                  privileged-access controls, and a dedicated security console
                  running underneath the product.
                </p>
                <div className="hero-actions">
                  <button
                    className="primary-button"
                    onClick={() => navigateSurface("portal")}
                  >
                    Launch Test Portal
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      navigateSurface("console");
                      setConsoleOpen(true);
                      setActiveTab("overview");
                    }}
                  >
                    Open Security Console
                  </button>
                </div>
                <div className="landing-pills">
                  <span className="chip">White-label tenants</span>
                  <span className="chip">Customer and staff journeys</span>
                  <span className="chip">Legacy credential controls</span>
                  <span className="chip">API-first integrations</span>
                </div>
                <SignalRibbon />
              </div>
              <div className="landing-visual">
                <HeroRadar isConnected={isConnected} alerts={allAlerts} />
                <div className="showcase-card threat">
                  <span>Supported tenant shapes</span>
                  <strong>{BANK_TEMPLATES.length}</strong>
                  <small>
                    Universal, digital-first, and branch-led bank models ready
                    for the same platform shell
                  </small>
                </div>
                <div className="showcase-card pulse">
                  <span>SaaS capabilities</span>
                  <strong>{SAAS_CAPABILITIES.length}</strong>
                  <small>
                    Product, integration, identity, and operations layers
                    exposed in one frontend
                  </small>
                </div>
                <div className="showcase-grid">
                  <div className="showcase-mini">
                    <strong>{BANK_JOURNEYS.length}</strong>
                    <span>role journeys</span>
                  </div>
                  <div className="showcase-mini">
                    <strong>{isConnected ? metrics.total_alerts || recentAlerts.length : "Live"}</strong>
                    <span>{isConnected ? "active risk signals" : "risk engine"}</span>
                  </div>
                  <div className="showcase-mini">
                    <strong>{COMPATIBILITY_AREAS.length}</strong>
                    <span>integration zones</span>
                  </div>
                  <div className="showcase-mini">
                    <strong>{assistantHealth?.configured ? "guarded" : "manual"}</strong>
                    <span>decision mode</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="trust-strip">
              <span>Multi-tenant product shell</span>
              <span>Separate test portal</span>
              <span>Internal maker-checker flows</span>
              <span>Legacy credential detection</span>
              <span>Simulation-driven validation</span>
            </section>

            <section className="feature-marquee">
              {SAAS_CAPABILITIES.map((capability) => (
                <FeatureCard
                  key={capability.title}
                  title={capability.title}
                  description={capability.description}
                />
              ))}
            </section>

            <section className="content-grid bank-story-grid">
              <BankRolePanel />
              <WorkspaceMatrixPanel />
              <LegacyAccessPanel isConnected={isConnected} alertsCount={allAlerts.length} />
            </section>

            <section className="content-grid saas-proof-grid">
              <CompatibilityPanel />
              <SaaSReadinessPanel />
              <DeploymentPanel
                backendStatus={backendHealth?.status || "offline"}
                alertsCount={allAlerts.length}
                endpointCount={ENDPOINT_COUNT}
              />
            </section>
          </>
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
              ingest telemetry, and review high-risk sessions from one place.
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
          </>
        )}
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
    `Could not reach the backend at ${apiBaseUrl}. Start the API with "python -m core.api" and retry.`,
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

function ProductSurfaceNav({ activeSurface, onChange }) {
  return (
    <section className="surface-switcher">
      <div>
        <div className="eyebrow">Product Shell</div>
        <h2>One codebase, three clear surfaces.</h2>
      </div>
      <div className="surface-actions" role="tablist" aria-label="Product surfaces">
        {APP_SURFACES.map((surface) => (
          <button
            key={surface.id}
            className={surface.id === activeSurface ? "surface-button active" : "surface-button"}
            onClick={() => onChange(surface.id)}
          >
            {surface.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function CompatibilityPanel() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Compatibility Envelope</div>
          <p className="panel-subtitle">
            The product is shaped to plug into common bank-side systems instead
            of pretending every bank works the same way.
          </p>
        </div>
      </div>
      <div className="workspace-list">
        {COMPATIBILITY_AREAS.map((area) => (
          <article key={area} className="workspace-row">
            <div className="workspace-copy">
              <strong>{area}</strong>
              <p>Expose adapters, policies, and workflow mappings per tenant.</p>
            </div>
            <span className="chip">compatible</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function SaaSReadinessPanel() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">SaaS Readiness</div>
          <p className="panel-subtitle">
            These are the product layers that make the bank experience feel
            reusable, not one-off.
          </p>
        </div>
      </div>
      <div className="persona-grid">
        {SAAS_CAPABILITIES.map((item) => (
          <article key={item.title} className="persona-card">
            <div className="persona-head">
              <strong>{item.title}</strong>
              <span>foundation</span>
            </div>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function DeploymentPanel({ backendStatus, alertsCount, endpointCount }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Delivery Slice</div>
          <p className="panel-subtitle">
            Separate product surfaces share one backend telemetry layer and one
            operator console.
          </p>
        </div>
      </div>
      <div className="metric-grid deployment-grid">
        <MetricCard label="Surfaces" value={APP_SURFACES.length} accent="cool" />
        <MetricCard label="Tenant templates" value={BANK_TEMPLATES.length} accent="success" />
        <MetricCard label="Endpoints" value={endpointCount} accent="warm" />
        <MetricCard label="Live alerts" value={alertsCount} accent="danger" />
      </div>
      <div className="journey-note">
        <div className="journey-row">Backend status: {backendStatus}</div>
        <div className="journey-row">Customer portal stays separate from the analyst console.</div>
        <div className="journey-row">Tenant templates keep the same product shell adaptable across bank types.</div>
      </div>
    </section>
  );
}

function SignalRibbon() {
  const items = [
    "Customer and staff journeys",
    "Privileged access guardrails",
    "Risk-scored session review",
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

function BankPortalSandbox({
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
  const [issueDraft, setIssueDraft] = useState(DEFAULT_PORTAL_ISSUES.join("\n"));
  const [simulatedIssues, setSimulatedIssues] = useState(() =>
    buildSimulatedIssues(DEFAULT_PORTAL_ISSUES.join("\n"), role.id, activeScenarioId),
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
    const nextDraft = DEFAULT_PORTAL_ISSUES.join("\n");
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

function HeroRadar({ isConnected, alerts }) {
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

function BankRolePanel() {
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

function WorkspaceMatrixPanel() {
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

function LegacyAccessPanel({ isConnected, alertsCount }) {
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

function ConnectionGuide({ apiBaseUrl, issue, loading, onRetry, onOpenConsole }) {
  return (
    <section className="setup-panel">
      <div className="setup-copy">
        <div className="eyebrow">Getting Started</div>
        <h2>Connect the backend, then the full bank-security workspace unlocks.</h2>
        <p>
          Right now the website cannot reach the API, so instead of showing dead
          charts and empty bank modules, this screen gives you the exact next
          step.
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
          <pre>{`cd "c:\\Users\\Mukul Prasad\\Desktop\\PROJECTS\\AS\\AetherSentrix"\npython -m core.api`}</pre>
        </div>
        <div className="setup-card">
          <span>Then refresh</span>
          <p>
            Once `http://127.0.0.1:8080/health` responds, hit `Retry Connection`
            and the live portal plus operator console will populate.
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
        <h2>The bank simulation is live. Open the operator console when you want to inspect the security layer.</h2>
        <p>
          Keep the experience user-facing up front, then drop into the analyst
          side only when you want to prove how risky sessions are handled.
        </p>
      </div>
      <div className="console-preview-side">
        <div className="preview-stat">
          <strong>{alertsCount}</strong>
          <span>alerts in memory</span>
        </div>
        <div className="preview-stat">
          <strong>{scenariosCount}</strong>
          <span>risk scenarios loaded</span>
        </div>
        <button className="primary-button block-button" onClick={onOpen}>
          Open Security Console
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

function buildPortalModules(template, roleId) {
  if (roleId === "customer") {
    return [
      { id: "overview", label: "Overview", caption: "Portfolio and balances" },
      { id: "accounts", label: "Accounts", caption: "CASA and deposits" },
      { id: "payments", label: "Payments", caption: "Transfers and beneficiaries" },
      { id: "cards", label: "Cards", caption: "Controls and disputes" },
      { id: "loans", label: "Loans", caption: "EMI and applications" },
      { id: "service", label: "Service Hub", caption: "Tickets and requests" },
    ];
  }
  if (roleId === "employee") {
    return [
      { id: "desk", label: "Relationship Desk", caption: "360 customer service" },
      { id: "approvals", label: "Approvals", caption: "Maker-checker queues" },
      { id: "kyc", label: "KYC Desk", caption: "Document and onboarding review" },
      { id: "cases", label: "Cases", caption: "Disputes and servicing" },
      { id: "limits", label: "Limits", caption: "Cards, payouts, and overrides" },
      { id: "audit", label: "Audit Trail", caption: "Notes, trace, and sign-off" },
    ];
  }
  return [
    { id: "sandbox", label: "Session Sandbox", caption: "Contained session view" },
    { id: "privileged", label: "Privileged Access", caption: "Role drift and risky reach" },
    { id: "policy", label: "Policy Checks", caption: "Controls and exceptions" },
    { id: "analyst", label: "Analyst Review", caption: "Verdict workflow" },
    { id: "forensics", label: "Forensics", caption: "Device, IP, and sequence evidence" },
    { id: "offboarding", label: "Offboarding", caption: "Identity retirement gaps" },
  ];
}

function buildPortalActivity(roleId, templateName, moduleLabel) {
  if (roleId === "customer") {
    return [
      {
        title: `${moduleLabel} touchpoint opened`,
        detail: `A customer session moved into ${moduleLabel} within ${templateName} and is being tracked for friction and trust anomalies.`,
        status: "pending",
      },
      {
        title: "Payment and card handoff",
        detail: "A high-value transfer and a card-control request are both ready for step-up or service-desk review.",
        status: "open",
      },
      {
        title: "Service case watch",
        detail: "BankThink is watching for broken self-service flows before they spill into branch or call-center queues.",
        status: "review",
      },
    ];
  }

  if (roleId === "employee") {
    return [
      {
        title: `${moduleLabel} queue updated`,
        detail: "Fresh operational work has landed and requires maker-checker confirmation with full audit context.",
        status: "queued",
      },
      {
        title: "Privilege-sensitive approval",
        detail: "An employee is reviewing a request that touches customer servicing, limits, and branch escalation notes.",
        status: "review",
      },
      {
        title: "Case handoff",
        detail: "Support, operations, and fraud teams are exchanging notes without losing auditability.",
        status: "handoff",
      },
    ];
  }

  return [
    {
      title: "Dormant account sign-in",
      detail: `A former employee credential set became active inside ${moduleLabel} from an unmanaged device.`,
      status: "high risk",
    },
    {
      title: "Privilege mismatch detected",
      detail: "The session attempted to reach staff-only modules outside the expected role boundary.",
      status: "sandboxed",
    },
    {
      title: "Analyst decision pending",
      detail: "The trust engine isolated the session and sent the final verdict to the console.",
      status: "pending",
    },
  ];
}

function buildPortalWorkspace({
  roleId,
  template,
  module,
  scenario,
  issues,
  isConnected,
  alertsCount,
}) {
  const moduleLabel = module?.label || "Overview";
  const issueCount = issues.length;
  const liveState = isConnected ? `${alertsCount} live signals available` : "guided simulation mode";

  if (roleId === "customer") {
    return {
      summary: `${moduleLabel} shows how ${template.name} handles day-to-day retail banking while BankThink keeps pointing you to the right backend checks.`,
      highlights: [
        {
          kicker: "Customer runway",
          title: "Accounts, cards, and payments stay within one portal shell",
          detail: "Explore savings, salary, beneficiary, card-control, and loan touchpoints without leaving the branded tenant.",
        },
        {
          kicker: "Test focus",
          title: "Service issues surface before trust issues do",
          detail: "Use the issue lab to pressure-test broken journeys such as delayed statements, stuck transfers, and card hotlisting.",
        },
        {
          kicker: "Runtime",
          title: liveState,
          detail: "The portal can stay explorable even when the backend is offline, then switch back to live telemetry when connected.",
        },
      ],
      features: [
        {
          kicker: "Products",
          title: "Savings and salary stack",
          detail: "Balances, sweep rules, and downloadable statements are surfaced beside transfer actions.",
        },
        {
          kicker: "Payments",
          title: "Beneficiary and transfer controls",
          detail: "Cooling periods, step-up prompts, and transaction status tracking are visible in one place.",
        },
        {
          kicker: "Cards",
          title: "Freeze, unblock, and dispute simulation",
          detail: "Model the card hotlist path and see where call-center or fraud teams would take over.",
        },
        {
          kicker: "Support",
          title: "Ticket-first self-service",
          detail: "Customers can raise issues without losing context on accounts, cards, or recent payments.",
        },
      ],
      quickNotes: [
        `Scenario lens: ${scenario.title} keeps the walkthrough grounded in realistic bank testing.`,
        "Check /health before relying on live data, then compare with /alerts/recent after risky actions.",
        "Treat self-service failures as both UX defects and security-signal opportunities.",
      ],
      checkpoints: [
        "Review balances and transfer rails, then simulate a failed payee or delayed transfer.",
        "Switch to card controls and confirm a freeze request maps to a back-office follow-up.",
        "Open service issues in bulk and verify that the right owner and endpoint are suggested.",
      ],
    };
  }

  if (roleId === "employee") {
    return {
      summary: `${moduleLabel} models internal servicing for ${template.name}, where staff workflows, approvals, and auditability matter as much as customer polish.`,
      highlights: [
        {
          kicker: "Operations",
          title: "Maker-checker flows stay visible",
          detail: "Approvals, KYC notes, and customer change requests remain connected to their audit trail.",
        },
        {
          kicker: "Testing",
          title: `${issueCount} queued issues can be pushed through servicing paths`,
          detail: "Use bulk issue entry to simulate queue spikes, missing handoffs, or stale privilege boundaries.",
        },
        {
          kicker: "Observation",
          title: liveState,
          detail: "Pair workflow checks with event and alert archives to confirm operations are observable.",
        },
      ],
      features: [
        {
          kicker: "Desk",
          title: "360 customer search",
          detail: "Employees can inspect profile, documents, and case state without losing queue position.",
        },
        {
          kicker: "Approvals",
          title: "Threshold and exception routing",
          detail: "High-value or policy-sensitive requests fan out to the correct servicing lane.",
        },
        {
          kicker: "KYC",
          title: "Document review and remediation",
          detail: "Missing proofs, retries, and branch escalations remain tied to onboarding state.",
        },
        {
          kicker: "Audit",
          title: "Case notes and sign-off",
          detail: "The portal shows how internal work remains explainable when analysts or auditors review it later.",
        },
      ],
      quickNotes: [
        "Use /events/recent after submitting workflow defects to see whether the archive captured the right operational signal.",
        "When approvals misroute, compare /simulate and /detect outcomes to measure whether the backend story notices it.",
        "Employee tools should feel fast, but they also need guardrails on privileged modules and stale identities.",
      ],
      checkpoints: [
        "Open KYC and approval queues, then enter several queue-delay issues in the lab.",
        "Validate that each issue suggests the right owner and next operational action.",
        "Switch role surfaces to legacy access to ensure staff-only tools are still properly defended.",
      ],
    };
  }

  return {
    summary: `${moduleLabel} turns the stale-access story into a hands-on containment simulation for ${template.name}, with policy, routing, and analyst checkpoints exposed in the portal.`,
    highlights: [
      {
        kicker: "Threat posture",
        title: "Dormant access is treated like a product surface",
        detail: "Instead of hiding the risk story, the tenant makes the drift, trust score, and containment path explorable.",
      },
      {
        kicker: "Endpoint focus",
        title: "Simulation, detection, and assistant flows stay linked",
        detail: "Use the endpoint navigator to move from scenario generation into alerting and guided triage.",
      },
      {
        kicker: "Containment",
        title: liveState,
        detail: "Even without a live backend, you can rehearse the exact journey from risky login to sandbox verdict.",
      },
    ],
    features: [
      {
        kicker: "Trust",
        title: "Privilege mismatch tracking",
        detail: "Role drift, unmanaged devices, and stale sessions stay visible across privileged modules.",
      },
      {
        kicker: "Sandbox",
        title: "Session isolation playbook",
        detail: "Containment, step-up auth, and analyst review are presented as first-class interactions.",
      },
      {
        kicker: "Forensics",
        title: "Device and IP storyline",
        detail: "The portal keeps evidence ready for analyst review instead of burying it in raw logs.",
      },
      {
        kicker: "Offboarding",
        title: "Identity retirement gaps",
        detail: "Use entered issues to model where offboarding, RBAC, or session expiry controls fail.",
      },
    ],
    quickNotes: [
      "Start with /simulate for dormant-access stories, then move to /detect and /assistant for triage guidance.",
      "Capture offboarding defects in bulk so the board shows how many issues become security-critical immediately.",
      "Legacy access testing should verify both containment speed and the quality of analyst evidence.",
    ],
    checkpoints: [
      "Choose a privileged module, then model a former employee landing there from an unmanaged device.",
      "Use the issue board to add role drift, stale MFA, or incomplete offboarding cases.",
      "Inspect alerts and archived events to confirm the backend narrative matches the portal story.",
    ],
  };
}

function buildSimulatedIssues(draft, roleId, scenarioId) {
  return String(draft || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item, index) => classifyPortalIssue(item, index, roleId, scenarioId));
}

function classifyPortalIssue(text, index, roleId, scenarioId) {
  const lower = text.toLowerCase();
  const severity = inferIssueSeverity(lower);
  const surface = inferIssueSurface(lower, roleId);
  const endpoint = inferIssueEndpoint(lower, scenarioId);
  const owner = inferIssueOwner(lower, roleId);
  const status =
    severity === "high" ? "triage now" : severity === "medium" ? "investigate" : "monitor";

  return {
    id: `issue-${index}-${surface}`,
    title: text,
    summary: `BankThink tagged this as a ${severity} ${surface.toLowerCase()} issue for the ${owner.toLowerCase()} lane.`,
    severity,
    surface,
    endpoint,
    owner,
    status,
    nextAction:
      severity === "high"
        ? "Reproduce immediately, review access boundaries, and compare alert output."
        : severity === "medium"
          ? "Validate workflow state, archive visibility, and queue ownership."
          : "Document the behavior and keep it in regression or smoke coverage.",
  };
}

function inferIssueSeverity(text) {
  if (
    /legacy|stale|privilege|fraud|sandbox|breach|offboarding|dormant|mismatch/.test(
      text,
    )
  ) {
    return "high";
  }
  if (/slow|delay|stuck|fail|kyc|dispute|approval|missing/.test(text)) {
    return "medium";
  }
  return "low";
}

function inferIssueSurface(text, roleId) {
  if (/card|payment|transfer|beneficiary/.test(text)) {
    return "Payments";
  }
  if (/kyc|onboarding|document/.test(text)) {
    return "KYC";
  }
  if (/legacy|stale|privilege|offboarding|sandbox|mfa/.test(text)) {
    return "Security";
  }
  if (roleId === "employee") {
    return "Operations";
  }
  if (roleId === "legacy") {
    return "Access";
  }
  return "Service";
}

function inferIssueEndpoint(text, scenarioId) {
  if (/legacy|stale|privilege|sandbox|offboarding/.test(text) || scenarioId === "threat-hunt") {
    return "POST /simulate -> POST /detect -> POST /assistant";
  }
  if (/log|syslog|firewall/.test(text)) {
    return "POST /ingest/syslog -> GET /events/recent";
  }
  if (/batch|burst|queue|payment/.test(text)) {
    return "POST /detect/batch -> GET /alerts/recent";
  }
  if (/model|false positive|accuracy/.test(text)) {
    return "GET /ml/status -> POST /ml/train -> POST /ml/mode";
  }
  return "POST /ingest -> POST /detect";
}

function inferIssueOwner(text, roleId) {
  if (/legacy|stale|privilege|sandbox|fraud|offboarding/.test(text)) {
    return "Security Operations";
  }
  if (/kyc|document|approval|queue/.test(text)) {
    return "Operations Desk";
  }
  if (/card|payment|transfer/.test(text)) {
    return "Payments Team";
  }
  if (roleId === "employee") {
    return "Service Operations";
  }
  return "Digital Banking";
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

function getSandboxSessionStatus(session) {
  return session?.analyst_verdict ? "resolved" : "active";
}

function getSandboxStatusTone(session) {
  if (!session?.analyst_verdict) {
    return "medium";
  }
  if (session.analyst_verdict === "BLOCK") {
    return "high";
  }
  if (session.analyst_verdict === "ALLOW") {
    return "low";
  }
  return "medium";
}

function formatSandboxStatus(session) {
  if (!session?.analyst_verdict) {
    return "Active";
  }
  return `Resolved • ${humanize(session.analyst_verdict)}`;
}

function getIntentTone(label) {
  if (label === "HACKER") {
    return "high";
  }
  if (label === "LEGIT_ANOMALY") {
    return "low";
  }
  return "medium";
}

function SandboxPanel({ apiBaseUrl, apiToken }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [verdictNote, setVerdictNote] = useState("");

  const fetchSessions = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = apiToken ? { Authorization: `Bearer ${apiToken}` } : {};
      const res = await fetch(`${apiBaseUrl}/v1/sandbox/sessions`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        return;
      }
      setError(`Unable to load sandbox sessions (${res.status}).`);
    } catch (err) {
      console.error("Failed to fetch sandbox sessions:", err);
      setError("Unable to reach the sandbox API.");
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (sessionId) => {
    setError("");
    try {
      const headers = apiToken ? { Authorization: `Bearer ${apiToken}` } : {};
      const res = await fetch(`${apiBaseUrl}/v1/sandbox/sessions/${sessionId}`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedSession(data);
        return;
      }
      setError(`Unable to load session ${truncate(sessionId, 12)} (${res.status}).`);
    } catch (err) {
      console.error("Failed to fetch session details:", err);
      setError("Unable to load sandbox session details.");
    }
  };

  const submitDecision = async (verdict) => {
    if (!selectedSession) {
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const headers = { "Content-Type": "application/json" };
      if (apiToken) {
        headers.Authorization = `Bearer ${apiToken}`;
      }

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
        await fetchSessions();
        await loadSessionDetails(selectedSession.session.session_id);
        return;
      }
      setError(`Unable to record analyst verdict (${res.status}).`);
    } catch (err) {
      console.error("Failed to submit verdict:", err);
      setError("Unable to submit the analyst verdict.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [apiBaseUrl, apiToken]);

  const orderedSessions = [...sessions].sort((left, right) => {
    const leftStatus = getSandboxSessionStatus(left);
    const rightStatus = getSandboxSessionStatus(right);
    if (leftStatus !== rightStatus) {
      return leftStatus === "active" ? -1 : 1;
    }
    return (right.sandboxed_at || 0) - (left.sandboxed_at || 0);
  });

  const activeCount = orderedSessions.filter(
    (session) => getSandboxSessionStatus(session) === "active",
  ).length;
  const resolvedCount = orderedSessions.length - activeCount;
  const sessionState = selectedSession ? getSandboxSessionStatus(selectedSession.session) : null;

  return (
    <section className="content-grid">
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Sandbox Session Queue</div>
            <div className="panel-subtitle">
              {activeCount} active, {resolvedCount} resolved
            </div>
          </div>
          <button className="ghost-button" onClick={fetchSessions}>
            Refresh
          </button>
        </div>
        {error ? <div className="empty-state">{error}</div> : null}
        {loading ? (
          <div className="empty-state">Loading sessions...</div>
        ) : orderedSessions.length === 0 ? (
          <div className="empty-state">No sandbox sessions have been recorded yet.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Source IP</th>
                <th>Trust Score</th>
                <th>Status</th>
                <th>Verdict</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orderedSessions.map((s) => (
                <tr key={s.session_id}>
                  <td>{truncate(s.session_id, 12)}</td>
                  <td>{s.source_ip}</td>
                  <td>{formatMetric(s.current_trust_score)}</td>
                  <td>
                    <span className={`severity-pill ${getSandboxStatusTone(s)}`}>
                      {formatSandboxStatus(s)}
                    </span>
                  </td>
                  <td>{s.analyst_verdict ? humanize(s.analyst_verdict) : "Pending"}</td>
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
              <strong>Requests observed:</strong> {selectedSession.session.total_requests} <br />
              <strong>Suspicious requests:</strong>{" "}
              {selectedSession.session.suspicious_requests} <br />
              <strong>Intent Label:</strong>{" "}
              <span
                className={`severity-pill ${getIntentTone(
                  selectedSession.intent_classification.label,
                )}`}
              >
                {selectedSession.intent_classification.label}
              </span>{" "}
              ({formatMetric(selectedSession.intent_classification.confidence)} conf)
            </div>

            <div
              className="explanation-box"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                padding: "1rem",
                borderRadius: "8px",
              }}
            >
              <strong>Explainability Engine Narrative:</strong>
              <p style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>
                {selectedSession.explanation.narrative}
              </p>
            </div>

            {sessionState === "active" ? (
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
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
                    style={{ background: "var(--success)", color: "#07111f" }}
                    onClick={() => submitDecision("ALLOW")}
                    disabled={submitting}
                  >
                    {submitting ? "Recording..." : "Allow"}
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => submitDecision("MONITOR")}
                    disabled={submitting}
                  >
                    Monitor
                  </button>
                  <button
                    className="primary-button"
                    style={{ background: "var(--danger)" }}
                    onClick={() => submitDecision("BLOCK")}
                    disabled={submitting}
                  >
                    Block
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="alert-detail"
                style={{ background: "rgba(255, 255, 255, 0.04)" }}
              >
                <strong>Final Verdict:</strong>{" "}
                {humanize(selectedSession.session.analyst_verdict)} <br />
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
