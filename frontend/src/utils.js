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
