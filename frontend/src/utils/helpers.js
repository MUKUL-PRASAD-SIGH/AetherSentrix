export function humanize(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function truncate(value, maxLength) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export function formatMetric(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "n/a";
  }
  return `${Math.round(value * 100)}%`;
}

export function formatTimestamp(value) {
  if (!value) {
    return "Unknown time";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

export function confidenceToScore(confidence) {
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

export function buildAlertSummary(alert) {
  const evidence =
    alert.explanation?.summary || alert.explanation?.reason || "";
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

export function buildMetrics(alerts) {
  const total = alerts.length;
  const high = alerts.filter((alert) => alert.severity === "high").length;
  const confidence = total
    ? alerts.reduce(
        (sum, alert) => sum + confidenceToScore(alert.confidence),
        0,
      ) / total
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

export function buildSeverityDistribution(alerts) {
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

export function buildHeatmap(alerts) {
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

export function buildPortalModules(template, roleId) {
  if (roleId === "customer") {
    return [
      { id: "overview", label: "Overview", caption: "Portfolio and balances" },
      { id: "accounts", label: "Accounts", caption: "CASA and deposits" },
      {
        id: "payments",
        label: "Payments",
        caption: "Transfers and beneficiaries",
      },
      { id: "cards", label: "Cards", caption: "Controls and disputes" },
      { id: "loans", label: "Loans", caption: "EMI and applications" },
      { id: "service", label: "Service Hub", caption: "Tickets and requests" },
    ];
  }
  if (roleId === "employee") {
    return [
      {
        id: "desk",
        label: "Relationship Desk",
        caption: "360 customer service",
      },
      { id: "approvals", label: "Approvals", caption: "Maker-checker queues" },
      {
        id: "kyc",
        label: "KYC Desk",
        caption: "Document and onboarding review",
      },
      { id: "cases", label: "Cases", caption: "Disputes and servicing" },
      {
        id: "limits",
        label: "Limits",
        caption: "Cards, payouts, and overrides",
      },
      { id: "audit", label: "Audit Trail", caption: "Notes, trace, and sign-off" },
    ];
  }
  return [
    {
      id: "sandbox",
      label: "Session Sandbox",
      caption: "Contained session view",
    },
    {
      id: "privileged",
      label: "Privileged Access",
      caption: "Role drift and risky reach",
    },
    { id: "policy", label: "Policy Checks", caption: "Controls and exceptions" },
    { id: "analyst", label: "Analyst Review", caption: "Verdict workflow" },
    {
      id: "forensics",
      label: "Forensics",
      caption: "Device, IP, and sequence evidence",
    },
    {
      id: "offboarding",
      label: "Offboarding",
      caption: "Identity retirement gaps",
    },
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
        detail:
          "A high-value transfer and a card-control request are both ready for step-up or service-desk review.",
        status: "open",
      },
      {
        title: "Service case watch",
        detail:
          "BankThink is watching for broken self-service flows before they spill into branch or call-center queues.",
        status: "review",
      },
    ];
  }

  if (roleId === "employee") {
    return [
      {
        title: `${moduleLabel} queue updated`,
        detail:
          "Fresh operational work has landed and requires maker-checker confirmation with full audit context.",
        status: "queued",
      },
      {
        title: "Privilege-sensitive approval",
        detail:
          "An employee is reviewing a request that touches customer servicing, limits, and branch escalation notes.",
        status: "review",
      },
      {
        title: "Case handoff",
        detail:
          "Support, operations, and fraud teams are exchanging notes without losing auditability.",
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
      detail:
        "The session attempted to reach staff-only modules outside the expected role boundary.",
      status: "sandboxed",
    },
    {
      title: "Analyst decision pending",
      detail:
        "The trust engine isolated the session and sent the final verdict to the console.",
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
  const moduleLabel = module?.label || "Overview";
  const issueCount = issues.length;
  const liveState = isConnected
    ? `${alertsCount} live risk signals available`
    : "guided simulation mode";

  if (roleId === "customer") {
    return {
      summary: `${moduleLabel} shows how ${template.name} handles day-to-day retail banking while BankThink keeps pointing you to the right backend checks.`,
      highlights: [
        {
          kicker: "Customer runway",
          title: "Accounts, cards, and payments stay within one portal shell",
          detail:
            "Explore savings, salary, beneficiary, card-control, and loan touchpoints without leaving the branded tenant.",
        },
        {
          kicker: "Test focus",
          title: "Service issues surface before trust issues do",
          detail:
            "Use the issue lab to pressure-test broken journeys such as delayed statements, stuck transfers, and card hotlisting.",
        },
        {
          kicker: "Runtime",
          title: liveState,
          detail:
            "The portal can stay explorable even when the backend is offline, then switch back to live telemetry when connected.",
        },
      ],
      features: [
        {
          kicker: "Products",
          title: "Savings and salary stack",
          detail:
            "Balances, sweep rules, and downloadable statements are surfaced beside transfer actions.",
        },
        {
          kicker: "Payments",
          title: "Beneficiary and transfer controls",
          detail:
            "Cooling periods, step-up prompts, and transaction status tracking are visible in one place.",
        },
        {
          kicker: "Cards",
          title: "Freeze, unblock, and dispute simulation",
          detail:
            "Model the card hotlist path and see where call-center or fraud teams would take over.",
        },
        {
          kicker: "Support",
          title: "Ticket-first self-service",
          detail:
            "Customers can raise issues without losing context on accounts, cards, or recent payments.",
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
          detail:
            "Approvals, KYC notes, and customer change requests remain connected to their audit trail.",
        },
        {
          kicker: "Testing",
          title: `${issueCount} queued issues can be pushed through servicing paths`,
          detail:
            "Use bulk issue entry to simulate queue spikes, missing handoffs, or stale privilege boundaries.",
        },
        {
          kicker: "Observation",
          title: liveState,
          detail:
            "Pair workflow checks with event and alert archives to confirm operations are observable.",
        },
      ],
      features: [
        {
          kicker: "Desk",
          title: "360 customer search",
          detail:
            "Employees can inspect profile, documents, and case state without losing queue position.",
        },
        {
          kicker: "Approvals",
          title: "Threshold and exception routing",
          detail:
            "High-value or policy-sensitive requests fan out to the correct servicing lane.",
        },
        {
          kicker: "KYC",
          title: "Document review and remediation",
          detail:
            "Missing proofs, retries, and branch escalations remain tied to onboarding state.",
        },
        {
          kicker: "Audit",
          title: "Case notes and sign-off",
          detail:
            "The portal shows how internal work remains explainable when analysts or auditors review it later.",
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
        detail:
          "Instead of hiding the risk story, the tenant makes the drift, trust score, and containment path explorable.",
      },
      {
        kicker: "Endpoint focus",
        title: "Simulation, detection, and assistant flows stay linked",
        detail:
          "Use the endpoint navigator to move from scenario generation into alerting and guided triage.",
      },
      {
        kicker: "Containment",
        title: liveState,
        detail:
          "Even without a live backend, you can rehearse the exact journey from risky login to sandbox verdict.",
      },
    ],
    features: [
      {
        kicker: "Trust",
        title: "Privilege mismatch tracking",
        detail:
          "Role drift, unmanaged devices, and stale sessions stay visible across privileged modules.",
      },
      {
        kicker: "Sandbox",
        title: "Session isolation playbook",
        detail:
          "Containment, step-up auth, and analyst review are presented as first-class interactions.",
      },
      {
        kicker: "Forensics",
        title: "Device and IP storyline",
        detail:
          "The portal keeps evidence ready for analyst review instead of burying it in raw logs.",
      },
      {
        kicker: "Offboarding",
        title: "Identity retirement gaps",
        detail:
          "Use entered issues to model where offboarding, RBAC, or session expiry controls fail.",
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
    severity === "high"
      ? "triage now"
      : severity === "medium"
        ? "investigate"
        : "monitor";

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
  if (
    /legacy|stale|privilege|sandbox|offboarding/.test(text) ||
    scenarioId === "threat-hunt"
  ) {
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

export function normalizeClientError(apiBaseUrl, error) {
  if (error instanceof TypeError) {
    return new Error(
      `Unable to reach ${apiBaseUrl}. Ensure the backend is running and CORS is enabled.`,
    );
  }
  return error;
}

export function getConnectionIssue(apiBaseUrl, error) {
  return {
    message: error.message,
    details: error.details,
    hint: `Verify your VITE_API_BASE_URL (currently ${apiBaseUrl}) and check the backend logs.`,
  };
}

export async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorPayload =
      payload?.error && typeof payload.error === "object"
        ? payload.error
        : payload;
    const error = new Error(
      errorPayload.message || `API error (${response.status})`,
    );
    error.details = errorPayload.details || null;
    throw error;
  }
  return payload;
}
