// ─── Pure utility functions — no React, no state ────────────────────────────

// ── Data builders ────────────────────────────────────────────────────────────

export function buildMetrics(alerts) {
  const total = alerts.length;
  const high = alerts.filter((a) => a.severity === "high").length;
  const confidence = total
    ? alerts.reduce((sum, a) => sum + confidenceToScore(a.confidence), 0) / total
    : 0;
  const lowConfidence = alerts.filter(
    (a) => confidenceToScore(a.confidence) < 0.5,
  ).length;
  return {
    total_alerts:    total,
    high_severity:   high,
    detection_rate:  confidence,
    false_positives: lowConfidence,
  };
}

export function buildSeverityDistribution(alerts) {
  return alerts.reduce(
    (dist, alert) => {
      const sev = (alert.severity || "low").toLowerCase();
      if (dist[sev] !== undefined) dist[sev] += 1;
      return dist;
    },
    { low: 0, medium: 0, high: 0 },
  );
}

export function buildHeatmap(alerts) {
  const categories = [
    ...new Set(alerts.map((a) => a.threat_category).filter(Boolean)),
  ];
  const sources = [
    ...new Set(
      alerts
        .map(
          (a) =>
            a.entities?.source_ip ||
            a.entities?.host ||
            a.entities?.destination_ip,
        )
        .filter(Boolean),
    ),
  ];
  const counts = {};
  alerts.forEach((alert) => {
    const src = alert.entities?.source_ip || alert.entities?.host || alert.entities?.destination_ip;
    const cat = alert.threat_category;
    if (src && cat) {
      const key = `${src}::${cat}`;
      counts[key] = (counts[key] || 0) + 1;
    }
  });
  return { categories, sources, counts };
}

export function buildGraph(alerts) {
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
      if (!edge?.source || !edge?.target) return;
      const key = `${edge.source}|${edge.target}|${edge.label || "related_to"}`;
      const current = edgeMap.get(key) || {
        source: edge.source,
        target: edge.target,
        label:  edge.label || "related_to",
        weight: 0,
      };
      current.weight += 1;
      edgeMap.set(key, current);
    });

    const src  = alert.entities?.source_ip;
    const host = alert.entities?.host;
    const tgt  = alert.entities?.destination_ip;
    if (src)  nodeMap.set(src,  { id: src,  label: src  });
    if (host) nodeMap.set(host, { id: host, label: host });
    if (tgt)  nodeMap.set(tgt,  { id: tgt,  label: tgt  });
    if (src  && host) edgeMap.set(`${src}|${host}|observed_on`,     { source: src,  target: host, label: "observed_on",     weight: 1 });
    if (host && tgt)  edgeMap.set(`${host}|${tgt}|communicates_with`, { source: host, target: tgt,  label: "communicates_with", weight: 1 });
  });

  return {
    nodes: Array.from(nodeMap.values()).slice(0, 8),
    edges: Array.from(edgeMap.values()).slice(0, 10),
  };
}

export function buildAlertSummary(alert) {
  const evidence = alert.explanation?.summary || alert.explanation?.reason || "";
  if (evidence) return String(evidence);
  const user   = alert.entities?.user;
  const source = alert.entities?.source_ip;
  const target = alert.entities?.destination_ip;
  return (
    [user, source, target].filter(Boolean).join(" | ") ||
    "Alert generated from the backend detection pipeline."
  );
}

export function buildCompactEntity(item) {
  return (
    item.entities?.source_ip ||
    item.host ||
    item.source_ip ||
    item.destination_ip ||
    item.user ||
    "No primary entity"
  );
}

// ── Format helpers ────────────────────────────────────────────────────────────

export function confidenceToScore(confidence) {
  if (typeof confidence === "number") return Math.max(0, Math.min(1, confidence));
  const mapping = { low: 0.35, medium: 0.65, high: 0.9 };
  return mapping[String(confidence || "").toLowerCase()] || 0.5;
}

export function formatTimestamp(value) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export function humanize(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function truncate(value, maxLength) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export function formatMetric(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "n/a";
  return `${Math.round(value * 100)}%`;
}

// ── Sandbox helpers ───────────────────────────────────────────────────────────

export function getSandboxSessionStatus(session) {
  return session?.analyst_verdict ? "resolved" : "active";
}

export function getSandboxStatusTone(session) {
  if (!session?.analyst_verdict) return "medium";
  if (session.analyst_verdict === "BLOCK") return "high";
  if (session.analyst_verdict === "ALLOW") return "low";
  return "medium";
}

export function formatSandboxStatus(session) {
  if (!session?.analyst_verdict) return "Active";
  return `Resolved • ${humanize(session.analyst_verdict)}`;
}

export function getIntentTone(label) {
  if (label === "HACKER")       return "high";
  if (label === "LEGIT_ANOMALY") return "low";
  return "medium";
}

// ── Connection helpers ────────────────────────────────────────────────────────

export function normalizeClientError(apiBaseUrl, error) {
  if (error instanceof Error && error.message !== "Failed to fetch") return error;
  return new Error(
    `Could not reach the backend at ${apiBaseUrl}. Start the API with "python -m core.api" and retry.`,
  );
}

export function getConnectionIssue(apiBaseUrl, error) {
  return { message: normalizeClientError(apiBaseUrl, error).message };
}


export async function parseResponse(response) {
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

export function buildPortalModules(template, roleId) {
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

export function buildPortalActivity(roleId, templateName, moduleLabel) {
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

export function buildPortalWorkspace({
  roleId,
  template,
  module,
  scenario,
  issues,
  isConnected,
  alertsCount,
}) {
  const safeTemplate = template || { name: "the tenant", modules: [], integrations: [] };
  const safeModule = module || { label: "Overview", caption: "Primary banking journey" };
  const safeScenario = scenario || { title: "Journey QA", subtitle: "Customer flow validation" };
  const safeIssues = Array.isArray(issues) ? issues : [];
  const highPriorityIssues = safeIssues.filter((item) => item.severity === "high").length;
  const mediumPriorityIssues = safeIssues.filter((item) => item.severity === "medium").length;
  const connectedLabel = isConnected
    ? `${alertsCount} live security signal${alertsCount === 1 ? "" : "s"}`
    : "frontend-driven simulation mode";

  if (roleId === "employee") {
    return {
      summary: `${safeModule.label} is framed as an internal bank workspace inside ${safeTemplate.name}, tuned for ${safeScenario.title.toLowerCase()} and maker-checker operations.`,
      highlights: [
        {
          kicker: "Workspace mode",
          title: `${safeModule.label} command surface`,
          detail: `Staff users can move through ${safeModule.caption.toLowerCase()} while BankThink keeps the workflow anchored to operational controls and service quality.`,
        },
        {
          kicker: "Risk pressure",
          title: `${highPriorityIssues} high-priority internal issues`,
          detail: "Queue stalls, approval drift, and KYC defects are surfaced alongside the security layer so operational defects do not hide privileged misuse.",
        },
        {
          kicker: "Runtime context",
          title: connectedLabel,
          detail: "The employee view stays compatible with the backend archive, scenario runner, and analyst console instead of becoming a disconnected mockup.",
        },
      ],
      quickNotes: [
        "Review queue ownership before escalating friction into the fraud or support lanes.",
        "Use the endpoint navigator to pair each workflow issue with archive visibility and API coverage.",
        `Current scenario lens: ${safeScenario.subtitle}.`,
      ],
      features: [
        {
          kicker: "Operations",
          title: "Maker-checker workflow rail",
          detail: "Approvals, overrides, and servicing tasks stay grouped with clear handoff points for branch and central teams.",
        },
        {
          kicker: "Compliance",
          title: "Audit-first servicing trace",
          detail: "Every operational action is described as if it should stand up to audit, dispute review, and analyst reconstruction.",
        },
        {
          kicker: "Triage",
          title: "Issue board linkage",
          detail: `${mediumPriorityIssues} medium-priority issue${mediumPriorityIssues === 1 ? "" : "s"} can be pushed into batch detection, archives, or analyst review from the same tenant shell.`,
        },
      ],
      checkpoints: [
        "Validate KYC/document paths against real queue ownership and expected archive signals.",
        "Confirm high-risk operational actions still map cleanly into detection and analyst review.",
        `Verify the ${safeModule.label.toLowerCase()} surface still fits within ${safeTemplate.modules.length || 0} staged banking modules.`,
      ],
    };
  }

  if (roleId === "legacy") {
    return {
      summary: `${safeModule.label} is now treated as a risky stale-access surface inside ${safeTemplate.name}, blending portal realism with containment and analyst review.`,
      highlights: [
        {
          kicker: "Containment story",
          title: "Legacy identity under observation",
          detail: "The experience intentionally looks believable while framing every privileged reach attempt as evidence for the trust and sandbox layers.",
        },
        {
          kicker: "Security pressure",
          title: `${highPriorityIssues} high-risk access concern${highPriorityIssues === 1 ? "" : "s"}`,
          detail: "Dormant credentials, privilege mismatch, and offboarding failures are kept front and center instead of being buried in decorative UI.",
        },
        {
          kicker: "Runtime context",
          title: connectedLabel,
          detail: "When the backend is reachable, the tenant story can pivot directly into sandbox sessions, analyst verdicts, and recent alerts.",
        },
      ],
      quickNotes: [
        "Treat every privileged screen as containment-friendly, not as an endorsement that the access is legitimate.",
        "Use the scenario lens and issue lab together to stress offboarding, step-up auth, and privilege drift.",
        "If the backend is offline, keep the portal in walkthrough mode and avoid claiming live verdicts.",
      ],
      features: [
        {
          kicker: "Security",
          title: "Privileged reach visibility",
          detail: "The module shell emphasizes where a stale identity should never be able to navigate without review.",
        },
        {
          kicker: "Forensics",
          title: "Analyst-ready sequence clues",
          detail: "Each issue suggests an investigation route through simulate, detect, archives, and the sandbox console.",
        },
        {
          kicker: "Governance",
          title: "Offboarding control check",
          detail: `Template integrations such as ${safeTemplate.integrations.slice(0, 3).join(", ") || "identity, audit, and fraud"} are framed as likely sources of policy drift.`,
        },
      ],
      checkpoints: [
        "Verify sandbox and analyst endpoints stay reachable from the same API base as the main console.",
        "Confirm dormant-access journeys still read as suspicious even when no live data is loaded.",
        `Cross-check ${safeScenario.title.toLowerCase()} outputs with trust, detection, and archive behaviour.`,
      ],
    };
  }

  return {
    summary: `${safeModule.label} presents a customer-safe banking journey inside ${safeTemplate.name}, while ${safeScenario.title.toLowerCase()} keeps the experience tied to real platform checks.`,
    highlights: [
      {
        kicker: "Customer flow",
        title: `${safeModule.label} ready for walkthrough`,
        detail: `Balances, servicing, and payment flows stay grounded in ${safeModule.caption.toLowerCase()} rather than feeling like a placeholder tenant.`,
      },
      {
        kicker: "Product QA",
        title: `${safeIssues.length} issue${safeIssues.length === 1 ? "" : "s"} staged for validation`,
        detail: "The issue lab lets you model friction, missing service behaviour, and suspicious journeys without leaving the portal shell.",
      },
      {
        kicker: "Security backdrop",
        title: connectedLabel,
        detail: "The customer portal remains distinct from the analyst console, but it still reflects the same telemetry and investigation surface underneath.",
      },
    ],
    quickNotes: [
      "Start with a normal customer action, then pivot into the issue lab to model friction or abuse.",
      "Use endpoint guidance to decide whether a problem belongs in ingestion, detection, or assistant review.",
      `Scenario focus: ${safeScenario.subtitle}.`,
    ],
    features: [
      {
        kicker: "Banking",
        title: "Self-service module set",
        detail: `${safeTemplate.modules.slice(0, 4).join(", ") || "Accounts, payments, cards, and support"} stay visible as part of one tenant-specific shell.`,
      },
      {
        kicker: "Operations",
        title: "Escalation-friendly journey",
        detail: "Customer actions are written so staff review, fraud checks, and service handoffs can be demonstrated without rebuilding the UI.",
      },
      {
        kicker: "Quality",
        title: "Portal issue simulation",
        detail: `${mediumPriorityIssues} medium-priority issue${mediumPriorityIssues === 1 ? "" : "s"} can be converted into targeted backend test flows from inside the same screen.`,
      },
    ],
    checkpoints: [
      "Validate that customer actions can escalate into support, fraud, or analyst review without breaking the tenant story.",
      "Check the recent event/archive endpoints after simulating customer-facing problems.",
      `Confirm ${safeTemplate.name} branding still stays separate from the shared security console.`,
    ],
  };
}

export function buildSimulatedIssues(draft, roleId, scenarioId) {
  return String(draft || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item, index) => classifyPortalIssue(item, index, roleId, scenarioId));
}

export function classifyPortalIssue(text, index, roleId, scenarioId) {
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

export function inferIssueSeverity(text) {
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

export function inferIssueSurface(text, roleId) {
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

export function inferIssueEndpoint(text, scenarioId) {
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

export function inferIssueOwner(text, roleId) {
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
