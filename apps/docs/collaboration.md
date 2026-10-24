# Collaboration

## Working agreement

The assistant prepares code; the owner and assistant then study, challenge and refine it together.
The owner is an advanced frontend developer. Explain meaningful architecture, GPU/shader/math,
motion, audio, design and performance tradeoffs at a senior level; do not default to introductory
frontend tutorials.

Discuss in French. Write code, comments and persistent documentation in English. The public site is
FR/EN. Work in bounded increments, maintain dialogue between meaningful stages and give progress
updates during sustained work.

Tooling and infrastructure proceed in coherent batches, with explanations of meaningful choices;
they do not require file-by-file study. Experience implementation follows the process below,
including navigation, localization, UI, interactions, graphics and audio. Selecting a library or
confirming a feature requirement does not authorize implementing that feature without discussion.
The initial route/localization placeholders already exist; review them when their feature is next
addressed. Artistic choices and changes to scope remain topics for dialogue throughout the project.

Prepare and study one file at a time. Explain its purpose, contents and tradeoffs, then leave room
for dialogue before proceeding to the next file. Do not deliver a large implementation or document
dump for the owner to review afterward. Discuss internal package folder organization before adding
more structure. A requested small correction may update its necessary configuration alongside it.

1. Define the purpose, scope, relevant decisions and review evidence.
2. Explain the unfamiliar concepts through their role in the project.
3. Write the code and run meaningful checks.
4. Review the result together, including visuals/motion or profiling where relevant.
5. Update the documentation with current decisions and remaining work.

Use routine implementation judgment within an agreed increment. Explain architectural decisions and
discuss changes to scope or artistic direction; do not turn every reversible edit into an approval
request. Targeted exercises are optional, not compulsory.

Summarize what tests verify and whether checks pass. Do not walk through test code unless the owner
asks; file-by-file study focuses on implementation.

## Git and publication

On October 8, the owner authorizes cleaning, committing and publishing the conception work. This
supersedes the earlier no-commit restriction for that work. Follow
[the delivery workflow](delivery.md) for subsequent implementation increments; agree their scope
before starting. No production deployment is authorized by repository publication.

On October 20, the owner requests a PR containing the reviewed rendering foundation and related
tooling/docs. Committing and publishing that branch/PR is authorized. This does not authorize
merging it into main or deploying it; main CI triggers the approved automatic deployment workflow.

The owner also requests the reviewed intro UI PR: commit/publish the intro composition, navigation,
localization, interaction stories/utilities and related docs. Keep sound persistence/application
integration for a separate PR. This authorizes the branch and PR, not merging or deployment.

On October 24, the owner requests committing and opening pull requests for the current celestial
veil work and developer palette. This authorizes publishing the shared utilities/browser-test
foundations, persistent selection/status store, image-derived static veil and research assets, and
the first data-gui adapter as coherent review increments. The veil and GUI remain draft review work
where indicated; opening PRs does not accept final artwork, authorize merging or deploy them.
Deferred sound work stays outside this publication.

## Continuity

### Bounded sessions

Use one concrete objective per working session. Repository skills provide repeatable entry points:
creation-session-start, creation-session-end and creation-session-dependencies. Select them from the
app's slash menu or mention them with the $ prefix. Plain-language requests also work. Sessions can
span several reviewed files; an objective must not silently expand into another subsystem. Session
boundaries do not replace file-by-file dialogue for production experience code.

At the start, or after any context reset:

1. Read AGENTS.md, [session state](session-state.md), the brief, current decisions and the relevant
   task documents. Load targeted references rather than the entire documentation tree.
2. Verify branch, working tree and required tooling. Documentation is a handoff, not proof of the
   current checkout or running processes. Do not silently update dependencies as session setup.
3. Give a short briefing: verified state, proposed next objective, pending review and limitations.
   Discuss the first file's responsibilities before implementation.

At the end, or when the owner requests a handoff:

1. Update the authoritative requirements, standards and contracts affected by the session. Keep
   confirmed decisions distinct from proposals; capture useful corrected mistakes in their owning
   technical document.
2. Rewrite session-state.md with current branch/changes, implemented versus exploratory work,
   verification evidence and limits, owner feedback, unresolved reviews and a concrete next step.
   Keep only current state, not an accumulating transcript or duplicated design specifications.
3. Report completion or remaining work accurately. Flag concepts worth revisiting when the owner
   expressed uncertainty; learning exercises remain optional. Do not require a quiz to close.
4. Provide a short restart instruction referencing the saved handoff. Do not commit, create a PR,
   deploy or start another conversation merely because the session ends.

### Dependency maintenance

Include dedicated maintenance sessions rather than upgrading dependencies during every feature
session. Default checkpoint: after five completed sessions since the previous review, or before a
runtime milestone/PR when versions need verification. These are manual checkpoints, not scheduled
automation; urgent compatibility/security fixes can justify an earlier review. Adjust cadence with
the owner as the project develops.

The maintenance skill reviews available versions, official migration notes and compatibility, then
updates coherent groups through pnpm catalogs and the lockfile. Respect supply-chain controls. Run
the complete project checks; graphics/UI upgrades also need relevant browser or visual evidence.
Explain migrations and preserve experience-code dialogue. Record the review date, session counter,
changes, deferred versions and verification limits in session-state.md and the owning technical
docs. Maintenance does not imply automatic publication or deployment.

### Fresh context in Codex

End the session and save its handoff before starting a blank chat in the same Creation checkout. The
app documents /new when available and Command+N for a new chat. /compact summarizes the current chat
instead of starting fresh; /fork retains history. Repo skills appear in the slash selector; if
discovery does not refresh, restart Codex and verify that the selected workspace is Creation. See
the official [slash commands](https://learn.chatgpt.com/docs/reference/slash-commands),
[keyboard commands](https://learn.chatgpt.com/docs/reference/commands) and
[skill discovery](https://learn.chatgpt.com/docs/build-skills) references. App availability can
vary.

POCs and temporary test scenes must be labeled before presentation. They validate bounded behavior;
their organization is not a production reference. Before real implementation, apply the agreed
standards from the first draft and review responsibility boundaries with the owner. Do not promote
the rendering probe wholesale into the production runtime.

Maintain concise Markdown references rather than conversation transcripts. Distinguish confirmed
decisions, proposals and open questions. Preserve useful rationale, resource/lifecycle contracts and
visual targets. Code and verification artifacts should explain the work without depending on chat
history.

Preserve other projects on the shared VPS. Never place credentials or access instructions in this
public repository.
