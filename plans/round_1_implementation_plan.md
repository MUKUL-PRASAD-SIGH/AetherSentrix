# AetherSentrix - Round 1 Implementation Plan
## Focus: Phase 1 - Alert Management & Workflow

This plan details the implementation of foundational SOC capabilities, specifically focusing on Alert Management & Workflow, flagged by difficulty level and broken down into execution steps.

### Batch 1: Easy Tasks (1 Step)

**Task 1.1: Alert Fatigue Prevention [Difficulty: Easy]**
*   **Step 1:** Implement an adaptive threshold module in the detection pipeline to suppress repetitive, low-confidence alerts based on configurable time windows and historical analyst feedback scores.

### Batch 2: Medium Tasks (1-2 Steps per Task)

**Task 1.2: Smart Deduplication [Difficulty: Medium]**
*   **Step 1:** Design and integrate an in-memory (or Redis-backed) deduplication cache for incoming events before they trigger new alerts.
*   **Step 2:** Implement a similarity scoring algorithm (e.g., matching source IP, destination IP, and event type) to intelligently group related events into a single alert payload.

**Task 1.3: Alert Prioritization Engine [Difficulty: Medium]**
*   **Step 1:** Develop a configuration schema and engine for defining business context and asset criticality weights (e.g., assigning higher risk scores to domain controllers).
*   **Step 2:** Integrate the prioritization engine into the threat classification output to dynamically calculate and append a final severity score (Critical, High, Medium, Low) to each alert.

### Batch 3: Hard Tasks (3-4 Steps, Executed Individually)

**Task 1.4: Case Management System [Difficulty: Hard]**
*   **Step 1 (Schema & Models):** Design and implement the database schema/ORM models for Incidents, Alert Groupings, and SLA tracking metrics.
*   **Step 2 (Core APIs):** Develop RESTful API endpoints (`/v1/incidents`, `/v1/incidents/{id}/alerts`) for incident creation, alert correlation, and status management.
*   **Step 3 (Workflow Automation):** Implement background task workers (e.g., using Celery or asyncio tasks) to monitor SLA breaches and trigger escalation workflows.
*   **Step 4 (Frontend Integration):** Update the SOC dashboard frontend to display the new case management views, allowing analysts to manually group alerts and update incident statuses.
