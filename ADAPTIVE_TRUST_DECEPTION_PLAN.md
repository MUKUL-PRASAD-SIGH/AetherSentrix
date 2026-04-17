# 🧠 AetherSentrix — Adaptive Trust & Deception Engine
## Codebase Audit + Build Plan

---

## ✅ WHAT IS ALREADY BUILT

These modules exist and are functional. They form the **base detection pipeline**.

| Module | File(s) | What it does |
|---|---|---|
| **Multi-layer event ingestion** | `pipeline/ingestion/event_ingestor.py` | Normalizes JSON & syslog events |
| **Anomaly Detection** | `pipeline/anomaly_detector.py` | Isolation-Forest anomaly scoring |
| **Threat Classification** | `pipeline/threat_classifier.py` | XGBoost+RF ensemble, classifies threat |
| **Confidence Fusion** | `pipeline/confidence_fusion.py` | Merges anomaly score + classifier confidence |
| **Attack Graph Builder** | `pipeline/attack_graph.py` | Node/edge map from alert entities |
| **Explainability Engine** | `pipeline/explainability.py` | Human-readable cause-chain per alert |
| **Temporal Stability Filter** | `pipeline/temporal_stability.py` | Reduces alert flickering |
| **Alert Fatigue / Adaptive Threshold** | `pipeline/alert_fatigue/adaptive_threshold.py` | Suppresses high-freq low-conf alerts |
| **Playbook Generator** | `pipeline/playbooks/playbook_generator.py` | Response steps per threat category |
| **SOC Assistant (LLM)** | `pipeline/llm/soc_assistant.py` | OpenAI-backed threat analysis |
| **Attack Simulator** | `pipeline/simulation/attack_simulator.py` | Brute force, C2, exfiltration, lateral movement |
| **Attacker vs Defender** | `pipeline/simulation/attacker_defender.py` | Adversarial game model |
| **Feedback System** | `pipeline/feedback/feedback_system.py` | Analyst feedback → model adjustment |
| **False Positive Handler** | `pipeline/false_positives/false_positive_handler.py` | Marks and suppresses known FP patterns |
| **JWT Auth + RBAC** | `pipeline/security/auth_manager.py`, `rbac.py` | Bearer token auth, role-based permissions |
| **Encryption** | `pipeline/security/encryption.py` | AES-256 at rest |
| **ML Ops Stack** | `pipeline/mlops/` (7 files) | Model registry, evaluator, training pipeline |
| **FastAPI Backend (v2)** | `api_v2.py` | 10+ endpoints: detect, alerts, login, models |
| **React Frontend** | `frontend/src/App.jsx` | SOC dashboard: overview, alerts, analytics, simulation, ingestion, models, assistant, ops |

### Pipeline Flow (Already Working):
```
Event Ingestion → Feature Extraction → Anomaly Detection → Threat Classification
→ Confidence Fusion → Temporal Stability → Attack Graph → Explainability
→ Alert Fatigue Filter → Playbook Generation → SOC Dashboard
```

---

## 🟡 PARTIALLY BUILT (Exists but incomplete)

| Module | Gap |
|---|---|
| `pipeline/prioritization/` | **Empty** — `__init__.py` only. Alert prioritization logic missing. |
| `pipeline/feature_extraction/` | Exists — but no **behavioral sequence features** (inter-event timing, access entropy) |
| `pipeline/deduplication/` | Exists — basic dedup, no cross-session dedup |

---

## ❌ WHAT IS NOT BUILT YET (The Deception Engine)

This is the **entire new module** to build. Nothing below exists yet.

---

### 🔴 BLOCK 1 — Trust Scoring Engine
**Goal:** Replace binary block/allow with a continuous risk score per session.

Files to create:
```
pipeline/trust/
    __init__.py
    context_scorer.py       # Layer 1: known user/device/IP/geo → baseline_trust_score
    behavioral_scorer.py    # Layer 2: deviation from historical patterns (speed, volume)
    spike_scorer.py         # Layer 3: rapid bursts → SNN-style temporal spike detection
    intent_signals.py       # Layer 4: probing patterns, repeated failure+success, escalation
    trust_engine.py         # Aggregator: combines all 4 layers into final trust_score
```

Trust score output:
```python
trust_score: float (0.0 to 1.0)
# > 0.7  → legit
# 0.4–0.7 → suspicious → sandbox
# < 0.4  → malicious → block + escalate
```

---

### 🔴 BLOCK 2 — Deception Sandbox (Honey Environment)
**Goal:** Route suspicious sessions to a fake but realistic environment.

Files to create:
```
pipeline/sandbox/
    __init__.py
    sandbox_router.py       # Proxy layer: intercepts requests, decides real vs fake routing
    honey_api.py            # Fake API responses: /admin/data, /export, /users
    session_tracker.py      # Tracks sandboxed sessions with full behavior log
    sandbox_data_gen.py     # Generates realistic fake datasets, fake user lists
```

API change in `api_v2.py`:
- Add middleware to check trust_score per request
- If sandboxed → route to honey_api responses

---

### 🔴 BLOCK 3 — Behavior Analysis Inside Sandbox
**Goal:** Watch what sandboxed user does and score intent.

Files to create:
```
pipeline/sandbox/
    behavior_analyzer.py    # Observes: endpoint probing, payload injection, privilege escalation
    intent_classifier.py    # Classifies session as: HACKER | LEGIT_ANOMALY | UNCERTAIN
```

Signals scored:
- Endpoint breadth (how many unique paths tried)
- Payload entropy (injection attempts)
- Auth probing (repeated 401s)
- Rate of access (requests/sec)
- Whether user stops after failure (legit) vs escalates (malicious)

---

### 🔴 BLOCK 4 — Decision Engine
**Goal:** Final verdict on sandboxed session.

File to create:
```
pipeline/trust/
    decision_engine.py      # Thresholds + logic: keep_sandbox | require_human | allow | block
```

Logic:
```python
if trust_score < 0.3:       → BLOCK + alert SOC
elif trust_score < 0.5:     → KEEP IN SANDBOX + flag for human review
elif trust_score < 0.7:     → REQUIRE MFA / human approval
else:                        → ALLOW real access
```

---

### 🔴 BLOCK 5 — Human-in-the-Loop Analyst Panel
**Goal:** SOC analyst sees a sandboxed session card with behavior log, intent score, decision buttons.

Frontend changes in `frontend/src/App.jsx`:
- New sub-section in "Alerts" tab: **Sandboxed Sessions**
- Session Card: shows sandboxed user, trust score timeline, behavior log
- Analyst Actions: Allow | Block | Continue Monitoring
- New backend endpoint: `POST /sandbox/decision` — analyst submits verdict

---

### 🔴 BLOCK 6 — Explainability for Sandbox Decision
**Goal:** Every sandbox action has a plain-English explanation.

Extend `pipeline/explainability.py` to output:
```
User moved to sandbox because:
- Abnormal data transfer volume (+4800%)
- Unknown IP geolocation (flagged)
- Spike in API access attempts (47 in 2 min)

Observed sandbox behavior:
- Attempted to access /admin/export 3 times
- Injected SQL fragment in query param
- Escalated from read-only to admin endpoint

Conclusion: HIGH likelihood of malicious intent
Trust Score: 0.18 → BLOCK recommended
```

---

### 🔴 BLOCK 7 — Demo Scenarios (For judges)
Extend `pipeline/simulation/attack_simulator.py`:

Scenario A — False Positive (Legit Admin):
```python
# Simulates: bulk upload → flagged → sandboxed → stops → scored as LEGIT_ANOMALY
```

Scenario B — Confirmed Attacker:
```python
# Simulates: login failure → probing → payload injection → sandboxed → scored as MALICIOUS
```

---

### 🔴 BLOCK 8 — Frontend: Attack Graph with Annotation
**Goal:** Add a short explanatory note near the Attack Graph in the Alerts tab.

In `frontend/src/App.jsx` near the AttackGraph component, add:
```jsx
<div className="graph-annotation">
  <span>⬡</span>
  <p>
    Relationship view derived from alert entities and attack graph payloads.
    Nodes = users, hosts, IPs. Edges = observed actions (brute force, C2 beacon, lateral move).
    Edge thickness = risk weight.
  </p>
</div>
```

---

## 🗓️ BUILD ORDER (Strict sequence)

| # | Task | Est. Time | Location |
|---|---|---|---|
| 1 | `context_scorer.py` — baseline trust from IP/user/device | 30 min | `pipeline/trust/` |
| 2 | `behavioral_scorer.py` — volume/freq anomaly vs history | 45 min | `pipeline/trust/` |
| 3 | `spike_scorer.py` — burst detection (SNN-inspired) | 30 min | `pipeline/trust/` |
| 4 | `intent_signals.py` — probing/escalation detection | 45 min | `pipeline/trust/` |
| 5 | `trust_engine.py` — aggregator, weighted score | 20 min | `pipeline/trust/` |
| 6 | `honey_api.py` — fake API response layer | 45 min | `pipeline/sandbox/` |
| 7 | `sandbox_router.py` — request proxy/intercept | 30 min | `pipeline/sandbox/` |
| 8 | `session_tracker.py` — sandbox session state | 20 min | `pipeline/sandbox/` |
| 9 | `behavior_analyzer.py` — sandbox observation engine | 45 min | `pipeline/sandbox/` |
| 10 | `intent_classifier.py` — HACKER/LEGIT/UNCERTAIN label | 30 min | `pipeline/sandbox/` |
| 11 | `decision_engine.py` — final verdict logic | 20 min | `pipeline/trust/` |
| 12 | Extend `explainability.py` — sandbox explanation block | 30 min | `pipeline/` |
| 13 | Add sandbox middleware to `api_v2.py` | 30 min | root |
| 14 | Add demo scenarios A+B to `attack_simulator.py` | 30 min | `pipeline/simulation/` |
| 15 | Frontend: Sandbox analyst panel + session cards | 60 min | `frontend/src/App.jsx` |
| 16 | Frontend: Attack graph annotation note | 10 min | `frontend/src/App.jsx` |

**Total: ~8 hours of focused build work**

---

## 🏆 JUDGE-FACING STATEMENT

> "Instead of immediately blocking suspicious users, AetherSentrix uses **deception-based sandboxing** to observe intent — distinguishing between benign anomalies and real attackers through multi-layer behavioral analysis, continuous trust scoring, and human-in-the-loop validation."

---

## 📁 Final New Folder Structure

```
pipeline/
├── trust/                    ← NEW
│   ├── __init__.py
│   ├── context_scorer.py
│   ├── behavioral_scorer.py
│   ├── spike_scorer.py
│   ├── intent_signals.py
│   ├── trust_engine.py
│   └── decision_engine.py
│
├── sandbox/                  ← NEW
│   ├── __init__.py
│   ├── sandbox_router.py
│   ├── honey_api.py
│   ├── session_tracker.py
│   ├── sandbox_data_gen.py
│   ├── behavior_analyzer.py
│   └── intent_classifier.py
│
└── (all existing modules stay unchanged)
```
