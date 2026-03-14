---
description: Profolio Development Guidelines
---

# Profolio Development Guidelines

When developing features for the Profolio CRM application, strictly adhere to the following principles:

1.  **Offline-First & Standalone:** All solutions must be functional completely offline. Do not rely on external APIs, cloud services, complex external scripts, or AI agent inference during runtime.
2.  **Simplicity over Complexity:** Strive for the simplest possible implementation that solves the user's problem. Avoid over-engineering.
3.  **No Cost:** Solutions should not incur any recurring costs or require paid subscriptions.
4.  **Local Data:** Maintain the privacy-first approach by keeping all data local (e.g., using the existing SQLite database).
5.  **Phase Deferral:** If a feature cannot be implemented satisfactorily within these constraints (e.g., it absolutely requires a complex external service to be useful), defer it to a future phase and document the architectural blockers or recommended future approach. For example, complex data enrichment or social graph scraping should be deferred.
6.  **Artifact Synchronization:** At the conclusion of any major feature phase, all Antigravity artifacts (`task.md`, `implementation_plan.md`, `walkthrough.md`, and any generated media) must be copied from the local agent brain folder into the `.agent/history/<conversation-id>/` directory within the repository. Committing these artifacts ensures project posterity and context preservation across different agent instances.
