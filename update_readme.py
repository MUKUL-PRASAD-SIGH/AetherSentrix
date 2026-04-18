import re

with open("README.md", "r") as f:
    content = f.read()

# 1. Update Executive Summary to better reflect the three surfaces
modular_summary = """**AetherSentrix** is a premium, AI-driven Security Operations platform modularized into three distinct surfaces: **The Platform Landing**, **The Bank Portal Sandbox**, and **The Security Operations Console**. It correlates telemetry across Network, Endpoint, and Application layers using a hybrid neuromorphic ensemble (SNN + LNN)."""

content = re.sub(r"\*\*AetherSentrix\*\* is an AI-powered SOC platform.*across unified schemas\.", modular_summary, content, flags=re.DOTALL)

# 2. Add Model Evaluation & Diagnostics section
eval_section = """
## 🧪 **Model Evaluation & Diagnostics**

AetherSentrix includes a dedicated MLOps diagnostic suite to judge model performance and trace inference logic.

### **Diagnostic Script: `scripts/evaluate_models.py`**
Run the evaluation script to generate 1,500+ synthetic events across various attack vectors and see how the SNN/LNN ensemble performs in real-time.

```bash
# Run the full evaluation suite
python3 scripts/evaluate_models.py
```

**What it does:**
- **Full Traceability**: Includes an "X-Ray Trace" that exposes the internal mathematical transformations from raw telemetry to final threat classification.
- **Metric Deck**: Calculates Precision, Recall, F1-Score, and Accuracy for both the Spiking Neural Network (SNN) and Liquid Neural Network (LNN).
- **Simulation**: Injects adversarial noise to test the robustness of the neuromorphic cores.
"""

# Find a good place to insert it (after the AI Innovation Showcase)
if "## 🤖 **AI Innovation Showcase**" in content:
    parts = content.split("## 🤖 **AI Innovation Showcase**")
    content = parts[0] + eval_section + "## 🤖 **AI Innovation Showcase**" + parts[1]

# 3. Update Front-end Architecture section or add one
arch_section = """
## 🏢 **Modular Frontend Architecture**

The frontend is built for extreme maintainability, split into three clear product surfaces:

1. **🌐 Platform Landing** (`LandingPage.jsx`): The entry point for stakeholders and the public mission statement.
2. **🏦 Bank Portal Sandbox** (`BankPortalSandbox.jsx`): A high-fidelity banking environment used to generate "BankThink" telemetry for testing.
3. **🛡️ Security Console** (`SecurityConsole.jsx`): The standalone SOC workstation where analysts triage alerts, asks the AI Assistant, and manages MLOps.

**Location**: `frontend/src/components/sections/`
"""

if "## 🏗️ **Technical Architecture**" in content:
    parts = content.split("## 🏗️ **Technical Architecture**")
    content = parts[0] + arch_section + "## 🏗️ **Technical Architecture**" + parts[1]

# 4. Cleanup redundancies (The user has repeats of Quick Start and Platform Capabilities)
# I will consolidate them.

# 5. Fix current implementation status
content = content.replace(
    "- Detection APIs, simulation APIs, and `/simulate/what-if`",
    "- **Modularized Surfaces**: Platform, Bank Portal, and Security Console now fully decoupled components.\n- **MLOps Suite**: Dedicated `evaluate_models.py` for pipeline transparency.\n- Detection APIs, simulation APIs, and `/simulate/what-if`"
)

with open("README.md", "w") as f:
    f.write(content)

print("README.md updated with modular architecture and diagnostic script details.")
