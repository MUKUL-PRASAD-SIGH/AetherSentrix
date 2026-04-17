import React, { useEffect, useState, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════
   LANDING PAGE — AetherSentrix
   Full-page immersive experience explaining the hybrid
   SNN × LNN FinTech threat detection pipeline.
   ═══════════════════════════════════════════════════════ */

export default function LandingPage({ onEnterWorkspace, onRunDemo, demoLoading }) {
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const sectionsRef = useRef({});

  // Smooth scroll tracking
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Intersection observer for scroll-reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    Object.values(sectionsRef.current).forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const registerSection = useCallback((id) => (el) => {
    if (el) sectionsRef.current[id] = el;
  }, []);

  const isVisible = (id) => visibleSections.has(id);

  return (
    <div className="landing-page" style={{ "--scroll": scrollY }}>
      {/* ═══ VIDEO BACKGROUND ═══ */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="lp-video-bg"
      >
        <source src="/_High-fidelity_landing_page_202604172146.mp4" type="video/mp4" />
      </video>

      {/* ═══ FLOATING PARTICLES BACKGROUND ═══ */}
      <div className="lp-particles">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="lp-particle"
            style={{
              "--x": `${8 + (i * 37) % 88}%`,
              "--y": `${5 + (i * 23) % 78}%`,
              "--size": `${2 + (i % 4)}px`,
              "--dur": `${12 + (i % 7) * 3}s`,
              "--delay": `${(i % 5) * -2}s`,
              "--drift": `${-20 + (i % 8) * 6}px`,
            }}
          />
        ))}
      </div>

      {/* ═══ SECTION 1: HERO ═══ */}
      <section className="lp-hero">
        <div className="lp-hero-bg" style={{ transform: `translateY(${scrollY * 0.25}px)` }} />
        <div className="lp-hero-inner">
          <div className="lp-badge">
            <span className="lp-badge-dot" />
            AI-Powered FinTech Security
          </div>
          <h1 className="lp-title">
            <span className="lp-title-line">Protecting Financial</span>
            <span className="lp-title-line lp-title-accent">Infrastructure</span>
            <span className="lp-title-line">in Real Time</span>
          </h1>
          <p className="lp-subtitle">
            AetherSentrix uses a hybrid Spiking Neural Network and Liquid Neural
            Network to detect account takeovers, insider threats, and data
            exfiltration before they cause damage.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn lp-btn-primary" onClick={onEnterWorkspace}>
              <span>Enter Command Center</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className="lp-btn lp-btn-ghost" onClick={onRunDemo} disabled={demoLoading}>
              {demoLoading ? "Running..." : "Live Demo"}
            </button>
          </div>
          {/* Scroll indicator */}
          <div className="lp-scroll-hint">
            <div className="lp-scroll-mouse">
              <div className="lp-scroll-wheel" />
            </div>
            <span>Scroll to explore</span>
          </div>
        </div>
        {/* Hero visual — animated neural mesh */}
        <div className="lp-hero-visual">
          <NeuralMesh />
        </div>
      </section>

      {/* ═══ SECTION 2: PROBLEM STATEMENT ═══ */}
      <section
        id="lp-problem"
        ref={registerSection("lp-problem")}
        className={`lp-section lp-problem ${isVisible("lp-problem") ? "lp-visible" : ""}`}
      >
        <div className="lp-section-inner">
          <div className="lp-eyebrow">The Challenge</div>
          <h2>Financial institutions face<br /><span className="lp-gradient-text">2,200 attacks per day</span></h2>
          <p className="lp-section-desc">
            Traditional rule-based systems generate thousands of false positives,
            overwhelming SOC analysts while sophisticated threats slip through
            undetected.
          </p>
          <div className="lp-stats-row">
            <StatBlock value="$4.88M" label="Average breach cost in banking" delay={0} visible={isVisible("lp-problem")} />
            <StatBlock value="277" label="Days to identify a breach" delay={1} visible={isVisible("lp-problem")} />
            <StatBlock value="95%" label="Alert fatigue rate in SOCs" delay={2} visible={isVisible("lp-problem")} />
            <StatBlock value="68%" label="Attacks that are insider threats" delay={3} visible={isVisible("lp-problem")} />
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3: THE SOLUTION — PIPELINE ═══ */}
      <section
        id="lp-pipeline"
        ref={registerSection("lp-pipeline")}
        className={`lp-section lp-pipeline ${isVisible("lp-pipeline") ? "lp-visible" : ""}`}
      >
        <div className="lp-section-inner">
          <div className="lp-eyebrow">How It Works</div>
          <h2>A 7-stage detection pipeline<br /><span className="lp-gradient-text">powered by two neural networks</span></h2>
          <p className="lp-section-desc">
            Every security event flows through our intelligent pipeline — from
            raw log ingestion to a fully enriched, explainable alert.
          </p>
          <PipelineFlow visible={isVisible("lp-pipeline")} />
        </div>
      </section>

      {/* ═══ SECTION 4: SNN vs LNN DEEP DIVE ═══ */}
      <section
        id="lp-models"
        ref={registerSection("lp-models")}
        className={`lp-section lp-models ${isVisible("lp-models") ? "lp-visible" : ""}`}
      >
        <div className="lp-section-inner">
          <div className="lp-eyebrow">The Hybrid Engine</div>
          <h2><span className="lp-gradient-text">SNN × LNN</span> — Better Together</h2>
          <p className="lp-section-desc">
            Two fundamentally different neural architectures collaborate to
            eliminate blind spots that either would have alone.
          </p>
          <div className="lp-model-grid">
            <ModelCard
              type="snn"
              icon="⚡"
              name="Spiking Neural Network"
              role="Anomaly Detector"
              how="Processes events as temporal spikes. Detects anomalies by analyzing when things happen — unusual timing patterns, burst frequencies, and periodic beaconing."
              strengths={["Temporal pattern detection", "Energy-efficient inference", "Sub-millisecond reaction", "Real-time spike analysis"]}
              visual={<SNNWaveform />}
              visible={isVisible("lp-models")}
              delay={0}
            />
            <div className={`lp-fusion-bridge ${isVisible("lp-models") ? "lp-visible" : ""}`}>
              <div className="lp-fusion-ring">
                <div className="lp-fusion-core">×</div>
              </div>
              <div className="lp-fusion-label">Confidence<br />Fusion</div>
              <div className="lp-fusion-beams">
                <div className="lp-beam lp-beam-left" />
                <div className="lp-beam lp-beam-right" />
              </div>
            </div>
            <ModelCard
              type="lnn"
              icon="🧠"
              name="Liquid Neural Network"
              role="Threat Classifier"
              how="Continuously adapts its internal state as new events flow in. Classifies threats by understanding evolving context, not static rules."
              strengths={["Adaptive real-time learning", "Context-aware classification", "12 threat categories", "MITRE ATT&CK mapping"]}
              visual={<LNNLiquid />}
              visible={isVisible("lp-models")}
              delay={1}
            />
          </div>
        </div>
      </section>

      {/* ═══ SECTION 5: USE CASE — BANKING ═══ */}
      <section
        id="lp-usecase"
        ref={registerSection("lp-usecase")}
        className={`lp-section lp-usecase ${isVisible("lp-usecase") ? "lp-visible" : ""}`}
      >
        <div className="lp-section-inner">
          <div className="lp-eyebrow">In Action</div>
          <h2>Catching a data breach<br /><span className="lp-gradient-text">before it happens</span></h2>
          <UseCaseTimeline visible={isVisible("lp-usecase")} />
        </div>
      </section>

      {/* ═══ SECTION 6: CAPABILITIES ═══ */}
      <section
        id="lp-caps"
        ref={registerSection("lp-caps")}
        className={`lp-section lp-caps ${isVisible("lp-caps") ? "lp-visible" : ""}`}
      >
        <div className="lp-section-inner">
          <div className="lp-eyebrow">Platform Capabilities</div>
          <h2>Everything a SOC team needs,<br /><span className="lp-gradient-text">in one surface</span></h2>
          <div className="lp-cap-grid">
            {[
              { icon: "📡", title: "Multi-Source Ingestion", desc: "JSON events, syslog lines, and batch payloads — normalized and archived automatically." },
              { icon: "🔍", title: "Real-Time Detection", desc: "Single-event and batch detection with live risk scoring and parallel enrichment." },
              { icon: "🗺️", title: "Attack Graph Mapping", desc: "Entity relationship graphs show how users, IPs, and hosts connect across an attack." },
              { icon: "🎭", title: "Attack Simulation", desc: "Trigger real MITRE-mapped scenarios and pass generated events through the live pipeline." },
              { icon: "📊", title: "Explainable AI", desc: "Every alert comes with a cause chain explaining why it fired — not just a score." },
              { icon: "🛡️", title: "Temporal Stability", desc: "Anti-flicker logic prevents oscillating alerts from overwhelming your analysts." },
            ].map((cap, i) => (
              <CapCard key={cap.title} {...cap} delay={i} visible={isVisible("lp-caps")} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 7: TECH STACK ═══ */}
      <section
        id="lp-stack"
        ref={registerSection("lp-stack")}
        className={`lp-section lp-stack ${isVisible("lp-stack") ? "lp-visible" : ""}`}
      >
        <div className="lp-section-inner">
          <div className="lp-eyebrow">Built With</div>
          <h2><span className="lp-gradient-text">Production-grade</span> technology</h2>
          <div className="lp-stack-grid">
            {[
              { layer: "ML Engine", techs: ["Scikit-learn", "Isolation Forest", "Random Forest", "NumPy", "Pandas"] },
              { layer: "API Layer", techs: ["FastAPI", "Uvicorn", "Pydantic", "JWT Auth", "RBAC"] },
              { layer: "Frontend", techs: ["React 18", "Vite", "WebSocket", "SVG Animations"] },
              { layer: "Detection", techs: ["Batch Processing", "Thread Pool", "Event Normalizer", "SHAP"] },
            ].map((group) => (
              <div key={group.layer} className="lp-stack-group">
                <div className="lp-stack-label">{group.layer}</div>
                <div className="lp-stack-tags">
                  {group.techs.map((t) => (
                    <span key={t} className="lp-stack-tag">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 8: CTA ═══ */}
      <section
        id="lp-cta"
        ref={registerSection("lp-cta")}
        className={`lp-section lp-cta ${isVisible("lp-cta") ? "lp-visible" : ""}`}
      >
        <div className="lp-section-inner lp-cta-inner">
          <h2>Ready to see it in action?</h2>
          <p>Enter the operator workspace to run live detections, trigger attack simulations, and explore the full SOC experience.</p>
          <div className="lp-hero-actions">
            <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={onEnterWorkspace}>
              <span>Launch Command Center</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════ */

function NeuralMesh() {
  const nodes = Array.from({ length: 24 }, (_, i) => ({
    x: 15 + (i % 6) * 15 + (Math.sin(i) * 5),
    y: 12 + Math.floor(i / 6) * 22 + (Math.cos(i) * 4),
    r: 2 + (i % 3),
  }));

  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < 25) {
        edges.push([i, j]);
      }
    }
  }

  return (
    <svg viewBox="0 0 100 100" className="lp-mesh-svg">
      <defs>
        <radialGradient id="meshGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(77,214,255,0.15)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#meshGlow)" />
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="rgba(77,214,255,0.15)"
          strokeWidth="0.3"
        >
          <animate attributeName="opacity" values="0.1;0.35;0.1" dur={`${2 + (i % 4)}s`} repeatCount="indefinite" begin={`${(i % 5) * 0.4}s`} />
        </line>
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.r * 0.4} fill="#4dd6ff" opacity="0.6">
          <animate attributeName="r" values={`${n.r * 0.3};${n.r * 0.6};${n.r * 0.3}`} dur={`${2.5 + (i % 3)}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.9;0.4" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {/* Traveling data pulse */}
      {edges.slice(0, 6).map(([a, b], i) => (
        <circle key={`pulse-${i}`} r="1" fill="#2bd9a0" opacity="0.8">
          <animateMotion
            dur={`${1.5 + i * 0.3}s`}
            repeatCount="indefinite"
            begin={`${i * 0.5}s`}
            path={`M${nodes[a].x},${nodes[a].y} L${nodes[b].x},${nodes[b].y}`}
          />
        </circle>
      ))}
    </svg>
  );
}

function StatBlock({ value, label, delay, visible }) {
  return (
    <div
      className={`lp-stat ${visible ? "lp-visible" : ""}`}
      style={{ "--delay": `${delay * 150}ms` }}
    >
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function PipelineFlow({ visible }) {
  const [active, setActive] = useState(0);
  const stages = [
    { icon: "📡", label: "Ingest", desc: "Raw security events stream in from firewalls, endpoints, and bank APIs." },
    { icon: "🔄", label: "Normalize", desc: "Events are cleaned, timestamped, and tagged with a standard schema." },
    { icon: "🧬", label: "Extract Features", desc: "Login rates, data volumes, IP diversity, and timing metrics are calculated." },
    { icon: "⚡", label: "SNN Analysis", desc: "The Spiking Neural Network scores temporal anomalies — how weird is this behavior?" },
    { icon: "🧠", label: "LNN Classification", desc: "The Liquid Neural Network classifies the threat type: brute force, exfiltration, C2, etc." },
    { icon: "🔗", label: "Confidence Fusion", desc: "Both models vote. Temporal stability smooths out flickering alerts." },
    { icon: "🚨", label: "Alert & Explain", desc: "An enriched alert is generated with attack graph, MITRE mapping, and playbook." },
  ];

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setActive((p) => (p + 1) % stages.length), 2800);
    return () => clearInterval(t);
  }, [visible]);

  return (
    <div className="lp-flow">
      <div className="lp-flow-track">
        <div className="lp-flow-line">
          <div className="lp-flow-progress" style={{ width: `${((active + 1) / stages.length) * 100}%` }} />
        </div>
        {stages.map((s, i) => (
          <button
            key={i}
            className={`lp-flow-node ${i === active ? "active" : ""} ${i < active ? "done" : ""}`}
            onClick={() => setActive(i)}
            aria-label={s.label}
          >
            <div className="lp-flow-icon">{s.icon}</div>
            {i === active && <div className="lp-flow-pulse" />}
            <span className="lp-flow-label">{s.label}</span>
          </button>
        ))}
      </div>
      <div className="lp-flow-detail" key={active}>
        <div className="lp-flow-detail-icon">{stages[active].icon}</div>
        <div>
          <div className="lp-flow-detail-step">Step {active + 1} / {stages.length}</div>
          <h3>{stages[active].label}</h3>
          <p>{stages[active].desc}</p>
        </div>
      </div>
    </div>
  );
}

function ModelCard({ type, icon, name, role, how, strengths, visual, visible, delay }) {
  return (
    <div
      className={`lp-model-card lp-model-${type} ${visible ? "lp-visible" : ""}`}
      style={{ "--delay": `${delay * 200}ms` }}
    >
      <div className="lp-model-head">
        <span className={`lp-model-badge lp-badge-${type}`}>{icon} {type.toUpperCase()}</span>
        <span className="lp-model-role">{role}</span>
      </div>
      <h3>{name}</h3>
      <p>{how}</p>
      <div className="lp-model-visual">{visual}</div>
      <div className="lp-model-strengths">
        {strengths.map((s) => (
          <span key={s} className="lp-strength">{s}</span>
        ))}
      </div>
    </div>
  );
}

function SNNWaveform() {
  return (
    <svg viewBox="0 0 300 80" className="lp-wave-svg">
      <polyline
        points="0,65 20,65 21,15 22,65 50,65 51,10 52,65 85,65 86,20 87,65 110,65 111,8 112,65 150,65 151,25 152,65 185,65 186,12 187,65 220,65 221,18 222,65 260,65 261,10 262,65 300,65"
        fill="none" stroke="#ffbe5c" strokeWidth="2" strokeLinejoin="round" strokeDasharray="800" strokeDashoffset="800"
      >
        <animate attributeName="stroke-dashoffset" from="800" to="0" dur="2.5s" fill="freeze" />
      </polyline>
      <text x="150" y="78" textAnchor="middle" fill="rgba(159,177,201,0.7)" fontSize="7" fontFamily="IBM Plex Mono">temporal spike train</text>
    </svg>
  );
}

function LNNLiquid() {
  return (
    <svg viewBox="0 0 300 80" className="lp-wave-svg">
      {[
        { cx: 50, cy: 35, r: 14 },
        { cx: 120, cy: 40, r: 18 },
        { cx: 200, cy: 30, r: 12 },
        { cx: 260, cy: 42, r: 16 },
      ].map((c, i) => (
        <g key={i}>
          <circle cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke="#ff8d5c" strokeWidth="1.2" opacity="0.5">
            <animate attributeName="r" values={`${c.r - 4};${c.r + 4};${c.r - 4}`} dur={`${2.2 + i * 0.4}s`} repeatCount="indefinite" />
          </circle>
          <circle cx={c.cx} cy={c.cy} r="2.5" fill="#ff8d5c" opacity="0.7">
            <animate attributeName="opacity" values="0.4;1;0.4" dur={`${1.8 + i * 0.3}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      {[[50,35,120,40],[120,40,200,30],[200,30,260,42]].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ff8d5c" strokeWidth="0.8" opacity="0.3">
          <animate attributeName="opacity" values="0.15;0.6;0.15" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
        </line>
      ))}
      <text x="150" y="78" textAnchor="middle" fill="rgba(159,177,201,0.7)" fontSize="7" fontFamily="IBM Plex Mono">adaptive liquid state</text>
    </svg>
  );
}

function UseCaseTimeline({ visible }) {
  const steps = [
    { time: "10:31 AM", icon: "🔐", title: "Normal Login", desc: "User j_doe logs into the internal banking API from their usual workstation.", status: "normal" },
    { time: "10:34 AM", icon: "📈", title: "Spike Detected", desc: "SNN detects an unusual burst — j_doe is querying 5,000 customer records at 50 req/sec.", status: "warning" },
    { time: "10:35 AM", icon: "🧠", title: "Threat Classified", desc: "LNN classifies the pattern as Data Exfiltration (T1041) with 92% confidence.", status: "danger" },
    { time: "10:35 AM", icon: "🔗", title: "Fusion: HIGH", desc: "Both models agree. Temporal stability confirms sustained activity over 4 minutes.", status: "danger" },
    { time: "10:36 AM", icon: "🚨", title: "Alert Dispatched", desc: "Alert sent to SOAR. j_doe's session revoked. External IP flagged in firewall.", status: "critical" },
  ];

  return (
    <div className="lp-timeline">
      {steps.map((step, i) => (
        <div
          key={i}
          className={`lp-tl-item lp-tl-${step.status} ${visible ? "lp-visible" : ""}`}
          style={{ "--delay": `${i * 200}ms` }}
        >
          <div className="lp-tl-time">{step.time}</div>
          <div className="lp-tl-dot">
            <div className="lp-tl-dot-inner" />
            {i < steps.length - 1 && <div className="lp-tl-connector" />}
          </div>
          <div className="lp-tl-content">
            <div className="lp-tl-icon">{step.icon}</div>
            <h4>{step.title}</h4>
            <p>{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CapCard({ icon, title, desc, delay, visible }) {
  return (
    <div
      className={`lp-cap-card ${visible ? "lp-visible" : ""}`}
      style={{ "--delay": `${delay * 100}ms` }}
    >
      <div className="lp-cap-icon">{icon}</div>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  );
}
