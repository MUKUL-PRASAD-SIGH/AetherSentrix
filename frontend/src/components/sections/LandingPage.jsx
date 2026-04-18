import React, { useEffect, useRef, useState } from "react";
import {
  ENGINE_SURFACES,
  SIGNAL_LAYERS,
  THREAT_CATEGORIES,
  LEGACY_SCENARIO_STEPS,
} from "../../utils/constants";

/* ══════════════════════════════════════════════════════════════════════════
   NetworkVisualization — Animated SVG network topology for the hero
   ══════════════════════════════════════════════════════════════════════════ */
function NetworkVisualization() {
  const nodes = [
    { x: 80, y: 60, label: "FW" },
    { x: 220, y: 40, label: "IDS" },
    { x: 360, y: 55, label: "EP" },
    { x: 150, y: 160, label: "API" },
    { x: 290, y: 140, label: "SNN" },
    { x: 430, y: 130, label: "LNN" },
    { x: 200, y: 260, label: "COR" },
    { x: 340, y: 250, label: "SOC" },
  ];
  const edges = [
    [0, 1], [1, 2], [0, 3], [1, 4], [2, 5],
    [3, 4], [4, 5], [3, 6], [4, 6], [5, 7], [6, 7],
  ];

  return (
    <svg viewBox="0 0 500 320" className="lp-network-svg">
      {/* Grid background */}
      <defs>
        <pattern id="heroGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(77,214,255,0.06)" strokeWidth="0.5" />
        </pattern>
        <radialGradient id="nodeFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(77,214,255,0.25)" />
          <stop offset="100%" stopColor="rgba(77,214,255,0.05)" />
        </radialGradient>
      </defs>
      <rect width="500" height="320" fill="url(#heroGrid)" rx="16" opacity="0.5" />

      {/* Edges */}
      {edges.map(([a, b], i) => (
        <line
          key={`edge-${i}`}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="rgba(77,214,255,0.15)"
          strokeWidth="1"
        />
      ))}

      {/* Data pulses traveling along edges */}
      {edges.slice(0, 7).map(([a, b], i) => (
        <circle key={`pulse-${i}`} r="2.5" fill="#4dd6ff" opacity="0.8">
          <animateMotion
            dur={`${2 + i * 0.4}s`}
            repeatCount="indefinite"
            begin={`${i * 0.6}s`}
            path={`M${nodes[a].x},${nodes[a].y} L${nodes[b].x},${nodes[b].y}`}
          />
          <animate attributeName="opacity" values="0.3;1;0.3" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Nodes */}
      {nodes.map((node, i) => (
        <g key={`node-${i}`}>
          <circle cx={node.x} cy={node.y} r="18" fill="url(#nodeFill)" stroke="rgba(77,214,255,0.3)" strokeWidth="1">
            <animate attributeName="r" values="17;19;17" dur={`${3 + (i % 3)}s`} repeatCount="indefinite" />
          </circle>
          <circle cx={node.x} cy={node.y} r="4" fill="#4dd6ff" opacity="0.7">
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur={`${2.5 + (i % 4) * 0.5}s`} repeatCount="indefinite" />
          </circle>
          <text
            x={node.x} y={node.y + 1}
            textAnchor="middle" dominantBaseline="central"
            fill="rgba(200,220,240,0.6)"
            fontSize="7" fontFamily="IBM Plex Mono, monospace"
            letterSpacing="0.08em"
          >
            {node.label}
          </text>
        </g>
      ))}

      {/* Sweep arc for SOC node */}
      <circle cx={340} cy={250} r="30" fill="none" stroke="rgba(43,217,160,0.15)" strokeWidth="1" strokeDasharray="4 4">
        <animateTransform attributeName="transform" type="rotate" from="0 340 250" to="360 340 250" dur="8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ArchitectureDiagram — Animated flow: Normalize → Correlate → Explain → Dashboard
   ══════════════════════════════════════════════════════════════════════════ */
function ArchitectureDiagram() {
  const stages = [
    { x: 60, label: "NORMALIZE", sublabel: "Schema Unification" },
    { x: 260, label: "CORRELATE", sublabel: "Cross-Layer Nexus" },
    { x: 460, label: "EXPLAIN", sublabel: "AI Reasoning" },
    { x: 660, label: "DASHBOARD", sublabel: "SOC Console" },
  ];

  return (
    <div className="lp-arch-diagram">
      <svg viewBox="0 0 750 100" className="lp-arch-svg">
        {/* Connection line */}
        <line x1="110" y1="42" x2="620" y2="42" stroke="rgba(77,214,255,0.15)" strokeWidth="1.5" strokeDasharray="6 4" />

        {/* Traveling pulse */}
        <circle r="4" fill="#4dd6ff" opacity="0.9">
          <animateMotion dur="4s" repeatCount="indefinite" path="M110,42 L620,42" />
          <animate attributeName="opacity" values="0.3;1;0.3" dur="4s" repeatCount="indefinite" />
        </circle>

        {/* Stage nodes */}
        {stages.map((stage, i) => (
          <g key={i}>
            <rect x={stage.x - 48} y="18" width="96" height="48" rx="14" fill="rgba(77,214,255,0.06)" stroke="rgba(77,214,255,0.2)" strokeWidth="1">
              <animate attributeName="stroke-opacity" values="0.15;0.35;0.15" dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
            </rect>
            <text x={stage.x} y="39" textAnchor="middle" fill="#e0ecf8" fontSize="8" fontFamily="IBM Plex Mono, monospace" letterSpacing="0.1em">
              {stage.label}
            </text>
            <text x={stage.x} y="55" textAnchor="middle" fill="rgba(159,177,201,0.5)" fontSize="6.5" fontFamily="IBM Plex Sans, sans-serif">
              {stage.sublabel}
            </text>

            {/* Connector dots between stages */}
            {i < stages.length - 1 && (
              <circle cx={stage.x + 75} cy="42" r="3" fill="rgba(77,214,255,0.3)">
                <animate attributeName="fill-opacity" values="0.2;0.7;0.2" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
              </circle>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   useReveal — IntersectionObserver for scroll-triggered animations
   ══════════════════════════════════════════════════════════════════════════ */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

/* ══════════════════════════════════════════════════════════════════════════
   LandingPage — Main export
   ══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage({
  isConnected,
  metrics,
  scenarios,
  backendHealth,
  navigateSurface,
  setConsoleOpen,
  setActiveTab,
}) {
  const [enginesRef, enginesVisible] = useReveal();
  const [layersRef, layersVisible] = useReveal();
  const [threatsRef, threatsVisible] = useReveal();
  const [scenarioRef, scenarioVisible] = useReveal();
  const [metricsRef, metricsVisible] = useReveal();

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-copy">
          <div className="lp-badge">
            <span className="lp-badge-dot" />
            AetherSentrix AI
          </div>

          <h1>Real-Time Threat Detection & Explainable Simulation</h1>

          <div className="lp-hero-tagline">
            ⚡ Multi-Signal · Cross-Layer · MITRE-Mapped
          </div>

          <p>
            Transitioning SOC teams from reactive firefighting to proactive
            defense using cross-layer signal correlation, spiking neural
            networks, and liquid neural network classification.
          </p>

          <div className="lp-hero-actions">
            <button
              className="primary-button"
              onClick={() => {
                navigateSurface("console");
                setConsoleOpen(true);
                setActiveTab("overview");
              }}
            >
              Launch SOC Console
            </button>
            <button
              className="secondary-button"
              onClick={() => navigateSurface("portal")}
            >
              Open Test Portal
            </button>
          </div>
        </div>

        <div className="lp-hero-visual">
          <NetworkVisualization />
        </div>
      </section>

      {/* ── Section 1: Three Engine Surfaces ───────────────────────────── */}
      <section className="lp-section" ref={enginesRef}>
        <div className="lp-section-head">
          <div className={`lp-kicker lp-reveal ${enginesVisible ? "lp-visible" : ""}`}>
            Core Architecture
          </div>
          <h2 className={`lp-reveal ${enginesVisible ? "lp-visible" : ""}`}>
            The Three Engine Surfaces
          </h2>
          <p className={`lp-reveal lp-reveal-delay-1 ${enginesVisible ? "lp-visible" : ""}`}>
            Every threat passes through detection, classification, and simulation
            before it reaches an analyst's screen.
          </p>
        </div>

        <div className="lp-engines-grid">
          {ENGINE_SURFACES.map((engine, i) => (
            <div
              key={engine.id}
              className={`lp-engine-card color-${engine.color} lp-reveal lp-reveal-delay-${i + 1} ${enginesVisible ? "lp-visible" : ""}`}
            >
              <div className="lp-engine-icon">{engine.icon}</div>
              <h3>{engine.title}</h3>
              <span className="lp-engine-focus">{engine.focus}</span>
              <p>{engine.utility}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 2: Multi-Layer Signal Correlation ──────────────────── */}
      <section className="lp-section" ref={layersRef}>
        <div className="lp-section-head">
          <div className={`lp-kicker lp-reveal ${layersVisible ? "lp-visible" : ""}`}>
            Signal Intelligence
          </div>
          <h2 className={`lp-reveal ${layersVisible ? "lp-visible" : ""}`}>
            Multi-Layer Signal Correlation
          </h2>
          <p className={`lp-reveal lp-reveal-delay-1 ${layersVisible ? "lp-visible" : ""}`}>
            Noise becomes signal when patterns appear across 2+ layers simultaneously.
          </p>
        </div>

        <div className={`lp-layers-container lp-reveal ${layersVisible ? "lp-visible" : ""}`}>
          <div className="lp-layers-stack">
            {SIGNAL_LAYERS.map((layer) => (
              <div key={layer.id} className={`lp-layer-card color-${layer.color}`}>
                <div className="lp-layer-icon">{layer.icon}</div>
                <div className="lp-layer-info">
                  <h4>{layer.label}</h4>
                  <p>{layer.analysis}</p>
                  <span className="lp-layer-detect">Detects: {layer.detects}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="lp-nexus-connector">
            <div className="lp-nexus-line" />
            <div className="lp-nexus-dot" />
            <div className="lp-nexus-line" />
          </div>

          <div className="lp-nexus-card">
            <h3>🔗 The Nexus</h3>
            <p>
              Correlates noise into high-confidence incidents when patterns
              appear across 2+ layers simultaneously.
            </p>
          </div>
        </div>

        <ArchitectureDiagram />
      </section>

      {/* ── Section 3: Threat Classification (MITRE Mapped) ────────────── */}
      <section className="lp-section" ref={threatsRef}>
        <div className="lp-section-head">
          <div className={`lp-kicker lp-reveal ${threatsVisible ? "lp-visible" : ""}`}>
            MITRE ATT&CK Framework
          </div>
          <h2 className={`lp-reveal ${threatsVisible ? "lp-visible" : ""}`}>
            Threat Classification
          </h2>
          <p className={`lp-reveal lp-reveal-delay-1 ${threatsVisible ? "lp-visible" : ""}`}>
            Four mandatory threat categories detected in real time with
            explainable AI reasoning.
          </p>
        </div>

        <div className="lp-threats-grid">
          {THREAT_CATEGORIES.map((threat, i) => (
            <div
              key={threat.id}
              className={`lp-threat-card color-${threat.color} lp-reveal lp-reveal-delay-${i + 1} ${threatsVisible ? "lp-visible" : ""}`}
            >
              <div className="lp-threat-head">
                <div className="lp-threat-icon">{threat.icon}</div>
                <span className="lp-mitre-badge">{threat.mitre}</span>
              </div>
              <h4>{threat.title}</h4>
              <p>{threat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: Legacy Credential Scenario ──────────────────────── */}
      <section className="lp-section" ref={scenarioRef}>
        <div className="lp-section-head">
          <div className={`lp-kicker lp-reveal ${scenarioVisible ? "lp-visible" : ""}`}>
            Real-World Scenario
          </div>
          <h2 className={`lp-reveal ${scenarioVisible ? "lp-visible" : ""}`}>
            Legacy Credential Threat
          </h2>
          <p className={`lp-reveal lp-reveal-delay-1 ${scenarioVisible ? "lp-visible" : ""}`}>
            Watch the AI engine detect, classify, and respond to an insider
            threat in real time — from ingestion to automated playbook.
          </p>
        </div>

        <div className={`lp-scenario-container lp-reveal ${scenarioVisible ? "lp-visible" : ""}`}>
          <div className="lp-timeline">
            {LEGACY_SCENARIO_STEPS.map((step, i) => (
              <div key={i} className={`lp-tl-step status-${step.status}`}>
                <div className="lp-tl-marker">
                  <div className="lp-tl-dot">{step.icon}</div>
                </div>
                <div className="lp-tl-content">
                  <span className="lp-tl-phase">{step.phase}</span>
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Live SOC Metrics ────────────────────────────────── */}
      <section ref={metricsRef}>
        <div className={`lp-metrics-strip lp-reveal ${metricsVisible ? "lp-visible" : ""}`}>
          <div className="lp-metric-tile">
            <span className="lp-metric-value glow-accent">500+</span>
            <span className="lp-metric-label">Ingestion Rate</span>
            <span className="lp-metric-detail">Events Per Second</span>
          </div>
          <div className="lp-metric-tile">
            <span className="lp-metric-value glow-success">
              {isConnected ? scenarios.length || 2 : 2}
            </span>
            <span className="lp-metric-label">Active Scenarios</span>
            <span className="lp-metric-detail">Brute Force + C2 Beacon</span>
          </div>
          <div className="lp-metric-tile">
            <span className="lp-metric-value glow-warm">AI</span>
            <span className="lp-metric-label">False Positive Mitigation</span>
            <span className="lp-metric-detail">SNN + LNN Fusion</span>
          </div>
          <div className="lp-metric-tile">
            <span className={`lp-metric-value ${isConnected ? "glow-success" : "glow-danger"}`}>
              {isConnected ? "LIVE" : "OFFLINE"}
            </span>
            <span className="lp-metric-label">Backend Status</span>
            <span className="lp-metric-detail">
              {isConnected
                ? `${backendHealth?.service || "Risk Engine"} · ${metrics?.total_alerts || 0} alerts`
                : "CICIDS / UNSW-NB15 Ready"}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
