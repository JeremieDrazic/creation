---
name: creation-session-end
description:
  Close a Creation session by updating current docs and saving a concise restart handoff. Use for
  session.end or a request to finish a Creation session.
---

# End a Creation session

Read repository AGENTS.md and the bounded-session protocol in apps/docs/collaboration.md. Verify Git
state, use the current conversation and actual checks to update authoritative documents, then
rewrite apps/docs/session-state.md. Record implementation versus POCs, owner feedback, tests
actually run and their limits, unresolved review, publication state and a concrete next objective.
Do not ask the owner to reconstruct facts already available; ask only about missing decisions.

Increment the completed-session count once when closing a distinct session, not again for repeated
handoff updates. Preserve the dependency-review checkpoint. A handoff request mid-session does not
close the session unless the owner says so. Do not label pending work completed.

Give a concise French wrap-up and a restart instruction invoking creation-session-start in the same
checkout. Do not commit, publish, deploy, clear context or create another chat solely because the
session ends. Learning exercises are optional; preserve uncertainties worth revisiting.
