export const DEFAULT_API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080";

export const APP_SURFACES = [
  { id: "saas", label: "SaaS Platform" },
  { id: "portal", label: "Bank Portal" },
  { id: "console", label: "Security Console" },
];

export const TABS = [
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

export const ENDPOINT_COUNT = 16;

export const DEFAULT_JSON_EVENTS = JSON.stringify(
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

export const DEFAULT_SYSLOG_LINE =
  "<34>2026-04-14T10:31:00Z host1 sshd[123]: Failed password for root from 10.0.0.13 port 22 ssh2";

export const DEFAULT_ASSISTANT_QUERY =
  "Summarize the most important security findings from the latest alerts and tell me the next actions.";

export const DEFAULT_BATCH_EVENTS = JSON.stringify(
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

export const BANK_PERSONAS = [
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

export const BANK_WORKSPACES = [
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

export const BANK_JOURNEYS = [
  "Customer logs in, checks balances, transfers funds, raises a card-block request.",
  "Branch employee reviews KYC, updates contact details, and approves a service case.",
  "Fraud analyst investigates a risky session and routes the user into a controlled sandbox.",
  "Former employee signs in with stale credentials and trips trust-score, intent, and sandbox checks.",
];

export const LEGACY_ACCESS_STEPS = [
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

export const BANK_TEMPLATES = [
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

export const PORTAL_ROLES = [
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

export const PORTAL_SCENARIOS = [
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

export const DEFAULT_PORTAL_ISSUES = [
  "Dormant employee credentials still reach approval queue after offboarding.",
  "KYC document verification takes too long for SME onboarding journeys.",
  "Card freeze request does not hotlist quickly on the payment switch.",
];

export const BANKTHINK_ENDPOINTS = [
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

export const BANKTHINK_GUIDES = {
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

export const SAAS_CAPABILITIES = [
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

export const COMPATIBILITY_AREAS = [
  "Core banking systems",
  "Loan origination and servicing",
  "Card management and dispute systems",
  "AML, fraud, and case management",
  "Identity providers and SSO",
  "Notifications, document vaults, and audit archives",
];
