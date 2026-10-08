# Research references

Consulted: 2026-10-06. Applications below are mentor proposals, not claims made by the sources or selected implementation choices.

## The Nature of Code — Daniel Shiffman

Primary source: https://natureofcode.com/

Use the book to understand generative behavior and natural simulation. It is a learning reference, not a selected production stack or a visual template.

| Source | Topic | Proposed application |
| --- | --- | --- |
| https://natureofcode.com/random/ | Random distributions and coherent noise | Individual variation and smooth wandering rather than jitter. |
| https://natureofcode.com/particles/ | Particle systems | Living populations and particle behavior. |
| https://natureofcode.com/autonomous-agents/ | Steering behavior and collective behavior | Returning toward letter targets, responding to a visitor, and future bird murmuration. |

For Fireflies, explore a balance between wandering, attraction toward text targets, and visitor influence. Adapt the algorithms to measured production needs instead of directly adopting the educational examples' object model. Credit reused material appropriately and review its license if code or assets are copied.

## Rendering and mobile performance

- MDN WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- Three.js responsive rendering: https://threejs.org/manual/pages/responsive.html

These references discuss rendering budgets and resolution management. High device pixel density can greatly increase rendering work. Creation targets desktop for V1 and presents an invitation to desktop on mobile. Measure frame times on the reference device matrix and adapt internal resolution and visual complexity; exact acceptance thresholds remain open. See [performance and quality](../performance-and-quality.md).
