import React, { useState, useEffect } from "react";
import "./HybridPipeline.css";

export function HybridPipeline({ alerts = [] }) {
  const [pulseKey, setPulseKey] = useState(0);

  // Grab the latest alert to drive the visualization
  const latestAlert = alerts.length > 0 ? alerts[alerts.length - 1] : null;

  // React to new alerts by triggering a brief re-animation
  useEffect(() => {
    if (latestAlert) setPulseKey((prev) => prev + 1);
  }, [latestAlert]);

  // Determine active state and extracted intel
  const riskScore = latestAlert ? latestAlert.risk_score || 0.0 : 0.0;
  const isHighRisk = riskScore > 0.6;
  const activeClass = isHighRisk ? "hp-active-high" : "";

  const confidence = latestAlert ? latestAlert.confidence : "baseline";
  const threatCat = latestAlert
    ? latestAlert.threat_category || "None detected"
    : "Monitoring...";

  // Parse evidence from explanation payload if available
  const evidenceList =
    latestAlert && latestAlert.explanation && latestAlert.explanation.evidence
      ? latestAlert.explanation.evidence
      : [];

  return (
    <div className={`hybrid-pipeline ${activeClass}`} key={`hp-${pulseKey}`}>
      <div className="hp-stages">
        {/* Stage 1: Ingestion & Feature Extraction */}
        <div className="hp-stage">
          <div className="hp-stage-title">
            <span>Data Ingestion</span>
            <div className="status-indicator"></div>
          </div>
          <div className="hp-ingest-list">
            <div className="hp-event-packet">API Gateway Logs</div>
            <div className="hp-event-packet">Authentication Events</div>
            <div className="hp-event-packet">Endpoint Metrics</div>
          </div>
          <div className="hp-intel" style={{ marginTop: "auto" }}>
            <div className="hp-intel-metric">
              <span className="hp-intel-label">Vector Size</span>
              <span className="hp-intel-value">128 dims</span>
            </div>
          </div>
        </div>

        <div className="hp-conn-arrow">→</div>

        {/* Stage 2: Neuromorphic Processing Core */}
        <div className="hp-stage" style={{ flex: 1.5 }}>
          <div className="hp-stage-title">
            <span>Neuromorphic Cores</span>
            <div className="status-indicator"></div>
          </div>
          <div className="hp-network-core">
            <div className="hp-nn-module">
              <h4>Spiking NN (SNN)</h4>
              <div className="hp-nodes">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={`snn-${i}`}
                    className="hp-node snn-node"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  ></div>
                ))}
              </div>
              <div className="hp-intel-metric" style={{ marginTop: "1rem", width: "100%" }}>
                <span className="hp-intel-label">Spatial Burst</span>
                <span className="hp-intel-value">Active</span>
              </div>
            </div>

            <div className="hp-nn-module">
              <h4>Liquid NN (LNN)</h4>
              <div className="hp-nodes">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`lnn-${i}`}
                    className="hp-node lnn-node"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  ></div>
                ))}
              </div>
              <div className="hp-intel-metric" style={{ marginTop: "1rem", width: "100%" }}>
                <span className="hp-intel-label">Temp. Drift</span>
                <span className="hp-intel-value">Tracking</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hp-conn-arrow">→</div>

        {/* Stage 3: Confidence Fusion & Output */}
        <div className="hp-stage">
          <div className="hp-stage-title">
            <span>Confidence Fusion</span>
            <div className="status-indicator"></div>
          </div>
          <div className="hp-intel">
            <div className="hp-intel-metric">
              <span className="hp-intel-label">Risk Score</span>
              <span
                className={`hp-intel-value ${isHighRisk ? "danger" : ""}`}
              >
                {(riskScore * 100).toFixed(1)}%
              </span>
            </div>
            <div className="hp-intel-metric">
              <span className="hp-intel-label">Confidence</span>
              <span className={`hp-intel-value ${confidence === 'high' ? 'danger' : ''}`}>{confidence}</span>
            </div>
            <div className="hp-intel-metric">
              <span className="hp-intel-label">Classification</span>
              <span className="hp-intel-value" style={{ textTransform: "capitalize", fontSize: "0.8rem" }}>
                {threatCat.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <div className="hp-evidence-log">
            {evidenceList.length > 0 ? (
              evidenceList.map((item, idx) => (
                <div key={idx} className="hp-evidence-item">
                  {item.reason}: {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
                </div>
              ))
            ) : (
              <div style={{ opacity: 0.5 }}>Waiting for anomalous signals...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
