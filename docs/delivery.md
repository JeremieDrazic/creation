# Delivery

## Confirmed workflow

Use a stable main branch, short-lived branches per coherent change, pull requests, appropriate
checks, visual previews and reproducible releases with rollback. No permanent develop branch. Public
repository publication is separate from production deployment.

The owner authorizes committing/publishing the cleaned conception work on October 8, 2026. Future
implementation proceeds in bounded increments with review. Production deployment requires its own
authorization.

## Hosting context

Host Creation on the owner's existing VPS, using Docker and Traefik. A read-only investigation
confirmed shared hosting with other active projects. Preserve existing services and shared
infrastructure. Access details, usernames, keys, application inventory and private filesystem paths
are intentionally excluded from public documentation.

A development-time resource snapshot showed a small shared host: roughly two logical CPUs and 4 GiB
RAM with limited spare capacity. Treat this as a planning observation, not a current health report;
verify resources before deployment. Do not run unlimited preview containers or heavy builds there.

## Proposed deployment model

- Static web assets with build-time per-route HTML metadata, served behind Traefik. No API service
  until a real feature needs it.
- A separate Creation Compose project identity, deployment directory and project-owned resources.
  Attach only its routed service to the existing external proxy network.
- Unique router/service names, no host-port collisions and no changes to unrelated stacks. Compose
  isolation is not separate hardware; capacity remains shared.
- Build in CI, deploy immutable identified images and retain the previous release for rollback.
- Bound preview lifetime/count and verify health before traffic handover.

No hosting image, registry or preview strategy is selected yet. See
[Compose networking](https://docs.docker.com/compose/how-tos/networking/) for project networks and
external-network attachment.

## Before publishing the site

Choose domain/DNS, routing/TLS conventions, serving/cache/error behavior, registry access, resource
limits, preview strategy and health/rollout/rollback commands. Validate direct experience URLs and
[social metadata](sharing.md). Do not infer server-mutation permission from read-only investigation
or a repository push.
