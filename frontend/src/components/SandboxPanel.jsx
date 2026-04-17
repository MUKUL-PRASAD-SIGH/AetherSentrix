import React, { useEffect, useState } from "react";
import {
  formatMetric, formatSandboxStatus, getSandboxSessionStatus,
  getSandboxStatusTone, getIntentTone, humanize, truncate,
} from "../utils.js";

// ─── Sandbox Analyst Console ──────────────────────────────────────────────────

export function SandboxPanel({ apiBaseUrl, apiToken }) {
  const [sessions,         setSessions]         = useState([]);
  const [selectedSession,  setSelectedSession]  = useState(null);
  const [loading,          setLoading]          = useState(false);
  const [submitting,       setSubmitting]       = useState(false);
  const [error,            setError]            = useState("");
  const [verdictNote,      setVerdictNote]      = useState("");

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
      const res = await fetch(`${apiBaseUrl}/v1/sandbox/sessions/${sessionId}`, { headers });
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
    if (!selectedSession) return;
    setSubmitting(true);
    setError("");
    try {
      const headers = { "Content-Type": "application/json" };
      if (apiToken) headers.Authorization = `Bearer ${apiToken}`;

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

  useEffect(() => { fetchSessions(); }, [apiBaseUrl, apiToken]);

  const ordered = [...sessions].sort((l, r) => {
    const ls = getSandboxSessionStatus(l), rs = getSandboxSessionStatus(r);
    if (ls !== rs) return ls === "active" ? -1 : 1;
    return (r.sandboxed_at || 0) - (l.sandboxed_at || 0);
  });

  const activeCount   = ordered.filter((s) => getSandboxSessionStatus(s) === "active").length;
  const resolvedCount = ordered.length - activeCount;
  const sessionState  = selectedSession ? getSandboxSessionStatus(selectedSession.session) : null;

  return (
    <section className="content-grid">
      {/* ── Left: session queue ── */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Sandbox Session Queue</div>
            <div className="panel-subtitle">{activeCount} active · {resolvedCount} resolved</div>
          </div>
          <button className="ghost-button" onClick={fetchSessions}>Refresh</button>
        </div>

        {error  && <div className="empty-state">{error}</div>}
        {loading && <div className="empty-state">Loading sessions…</div>}

        {!loading && ordered.length === 0 && (
          <div className="empty-state">No sandbox sessions have been recorded yet.</div>
        )}

        {!loading && ordered.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Source IP</th>
                  <th>Trust</th>
                  <th>Status</th>
                  <th>Verdict</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((s) => (
                  <tr key={s.session_id}>
                    <td><code>{truncate(s.session_id, 14)}</code></td>
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
          </div>
        )}
      </div>

      {/* ── Right: session detail + verdict ── */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Session Analysis &amp; Verdict</div>
        </div>

        {!selectedSession && (
          <div className="empty-state">Select a session to inspect.</div>
        )}

        {selectedSession && (
          <div className="sandbox-detail">
            {/* Summary strip */}
            <div className="detail-block">
              <div className="mini-row wrap" style={{ marginBottom: "0.75rem" }}>
                <span className="chip">User: {selectedSession.session.user_id}</span>
                <span className="chip">Trust: {formatMetric(selectedSession.session.current_trust_score)}</span>
                <span className="chip">{selectedSession.session.total_requests} requests</span>
                <span className="chip">{selectedSession.session.suspicious_requests} suspicious</span>
                <span className={`severity-pill ${getIntentTone(selectedSession.intent_classification.label)}`}>
                  {selectedSession.intent_classification.label}
                </span>
                <span className="chip">
                  {formatMetric(selectedSession.intent_classification.confidence)} conf
                </span>
              </div>
            </div>

            {/* Explainability narrative */}
            <div className="detail-block">
              <h4>Explainability Engine Narrative</h4>
              <p className="narrative-text" style={{ whiteSpace: "pre-wrap" }}>
                {selectedSession.explanation.narrative}
              </p>
            </div>

            {/* Verdict UI — only for active sessions */}
            {sessionState === "active" ? (
              <div className="detail-block verdict-row">
                <label className="field">
                  <span>Analyst Notes</span>
                  <input
                    type="text"
                    value={verdictNote}
                    onChange={(e) => setVerdictNote(e.target.value)}
                    placeholder="Enter reasoning for verdict…"
                  />
                </label>
                <div className="mini-row" style={{ marginTop: "0.75rem" }}>
                  <button
                    className="primary-button"
                    style={{ background: "var(--success)", color: "#07111f" }}
                    onClick={() => submitDecision("ALLOW")}
                    disabled={submitting}
                  >
                    {submitting ? "Recording…" : "Allow"}
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
              <div className="detail-block">
                <h4>Final Verdict</h4>
                <div className="mini-row">
                  <span className={`severity-pill ${getSandboxStatusTone(selectedSession.session)}`}>
                    {humanize(selectedSession.session.analyst_verdict)}
                  </span>
                  <span className="chip">{selectedSession.session.analyst_note || "No note"}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
