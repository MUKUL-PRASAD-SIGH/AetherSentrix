import React, { useState, useEffect } from "react";
import { humanize, truncate, formatMetric } from "../../utils/helpers";

function getSandboxSessionStatus(session) {
  if (!session?.analyst_verdict) {
    return "active";
  }
  return "resolved";
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

export function SandboxPanel({ apiBaseUrl, apiToken }) {
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
      const res = await fetch(
        `${apiBaseUrl}/v1/sandbox/sessions/${sessionId}`,
        {
          headers,
        },
      );
      if (res.ok) {
        const data = await res.json();
        setSelectedSession(data);
        return;
      }
      setError(
        `Unable to load session ${truncate(sessionId, 12)} (${res.status}).`,
      );
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
  const sessionState = selectedSession
    ? getSandboxSessionStatus(selectedSession.session)
    : null;

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
          <div className="empty-state">
            No sandbox sessions have been recorded yet.
          </div>
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
                    <span
                      className={`severity-pill ${getSandboxStatusTone(s)}`}
                    >
                      {formatSandboxStatus(s)}
                    </span>
                  </td>
                  <td>
                    {s.analyst_verdict ? humanize(s.analyst_verdict) : "Pending"}
                  </td>
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
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div className="alert-detail">
              <strong>User:</strong> {selectedSession.session.user_id} <br />
              <strong>Trust Score:</strong>{" "}
              {formatMetric(selectedSession.session.current_trust_score)} <br />
              <strong>Requests observed:</strong>{" "}
              {selectedSession.session.total_requests} <br />
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
              ({formatMetric(selectedSession.intent_classification.confidence)}{" "}
              conf)
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
                <strong>Note:</strong>{" "}
                {selectedSession.session.analyst_note || "None"}
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
