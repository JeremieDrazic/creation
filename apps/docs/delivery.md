# Delivery

## Confirmed workflow

Use a stable main branch, short-lived branches per coherent change, pull requests, appropriate
checks, visual previews and reproducible releases with rollback. No permanent develop branch. Public
repository publication is separate from production deployment.

The owner authorizes committing/publishing the cleaned conception work on October 8, 2026. Future
implementation proceeds in bounded increments with review. The owner requests deployment ownership
on October 9. Automatic production activation awaits explicit confirmation of the concrete workflow
after an automatic approval review rejection.

## Hosting context

Host Creation on the owner's existing VPS, using Docker and Traefik. A read-only investigation
confirmed shared hosting with other active projects. Preserve existing services and shared
infrastructure. Access details, usernames, keys, application inventory and private filesystem paths
are intentionally excluded from public documentation.

A development-time resource snapshot showed a small shared host: roughly two logical CPUs and 4 GiB
RAM with limited spare capacity. Treat this as a planning observation, not a current health report;
verify resources before deployment. Do not run unlimited preview containers or heavy builds there.

## Confirmed public URLs

- Experience website: https://creation.jerem.io/.
- Storybook: https://creation.jerem.io/design-system/.
- VitePress documentation: https://creation.jerem.io/docs/.

Source documentation lives in apps/docs; keep the Markdown authoritative and add technical
explanations there as the project develops. VitePress suits the current Markdown-first reference and
can host future interactive examples. Its Vue dependencies belong only to docs, not the React site.
Docusaurus's larger content/versioning ecosystem is not currently needed.

Serve the three static builds independently. Match /docs/ and /design-system/ before the web SPA
fallback, preserve their asset paths, redirect bare subpaths to trailing slashes, and avoid sharing
service-worker scope. Storybook uses relative asset URLs; its preview validates the public mount.
VitePress builds with base /docs/. No production deployment has occurred.

## Prepared deployment — activation pending

The assistant owns deployment setup and operation. The owner should focus on implementation and
learning, not repeat infrastructure tasks. Production activation is pending explicit approval of:

- CI validates the source, builds the three sites, builds/smoke-tests a digest-pinned unprivileged
  Nginx image and uploads an immutable image artifact. No build runs on the shared VPS.
- The inactive template deploy/workflow.example.yml listens only to successful push-to-main CI runs.
  PR runs never deploy. Download the artifact from that exact run and deploy its commit SHA.
- Create one dedicated SSH key, stored as CREATION_SSH_KEY, with host/user/verified known-host data
  in GitHub secrets. Restrict its server-side authorized-key entry to the Creation release script,
  with forwarding and interactive access disabled. Do not reuse Decksmith's deployment key.
- Only the creation Compose project changes. One static container joins the existing proxy network,
  uses existing websecure/le TLS conventions, publishes no host ports and caps memory/CPU/logging.
- The release script serializes changes, verifies the image revision and container health, then
  checks all three HTTPS entry points before recording the release. On failure it restores the
  previous Creation image when available. First release has no prior version to restore.
- Retain the preceding image for explicit rollback. Compose may briefly interrupt requests during
  recreation; zero-downtime handover is not implemented. Existing projects/Traefik are untouched.

The template is outside .github/workflows and therefore inactive. No production secrets, SSH keys or
server files have been provisioned. No site is deployed. The DNS already points to the VPS; SSH
access, architecture, shared proxy network and TLS resolver were verified read-only.

Local validation covers image startup under read-only/capability constraints, entry routes, subpath
redirects, deep docs links and missing assets. Production TLS and automatic rollback still require
server validation after approval. Existing artistic and social-metadata work remains deferred.

## Deployment model

- Static web assets with build-time per-route HTML metadata, served behind Traefik. No API service
  until a real feature needs it.
- A separate Creation Compose project identity, deployment directory and project-owned resources.
  Attach only its routed service to the existing external proxy network.
- Unique router/service names, no host-port collisions and no changes to unrelated stacks. Compose
  isolation is not separate hardware; capacity remains shared.
- Build in CI, transfer the verified image artifact by SSH and retain the previous release for
  rollback.
- Bound preview lifetime/count and verify health before traffic handover.

The Nginx hosting image is pinned by digest. Image artifacts avoid needing a registry account or
long-lived registry credential for this small static deployment. Preview infrastructure remains
deferred. See [Compose networking](https://docs.docker.com/compose/how-tos/networking/) for project
networks and external-network attachment.

## Before publishing the site

Configure the confirmed domain/DNS, routing/TLS conventions, serving/cache/error behavior, registry
access, resource limits, preview strategy and health/rollout/rollback commands. Validate direct
experience URLs and [social metadata](sharing.md). Do not infer server-mutation permission from
read-only investigation or a repository push.
