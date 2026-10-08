# Performance and visitor quality

Confirmed: desktop-first V1, minimum 60 fps objective, visitor-selectable lighter rendering/assets, capability-informed initial recommendation and targeted preparation workers. Exact profiles, budgets and thresholds remain proposals to measure.

## Quality policy — proposed details

| Profile | Intent |
| --- | --- |
| Auto | Conservative supported starting profile, refined from sustained observations. |
| Light | Lower resolution/effect cost and lighter real assets; preserve core interaction/art. |
| Balanced | Coherent reference middle profile. |
| Enhanced | Richest supported resolution/detail within resource limits. |

Names and FR/EN copy are provisional. Offer discreet settings, not a blocking configuration dialog. Manual preference outranks heuristics within actual capability limits; suggest a downgrade instead of silently replacing it. Session/cross-visit retention and exact Auto behavior are open.

Separate backend support, rendering cost, transfer budget and accessibility. Network speed is not GPU speed; encoded bytes are not decoded/GPU memory. Missing capability hints mean unknown, not weak hardware.

## Detection and adaptation

Validate actual renderer/features, not navigator.gpu presence alone. Viewport/DPR determine pixel work; cap internal resolution by profile. hardwareConcurrency is a thread hint, deviceMemory coarse system RAM, and Network Information optional transfer hints; none provides free GPU memory or guarantees performance.

Use bounded frame observations after warm-up, excluding hidden time, known preparation and interrupted samples. Frame intervals alone do not distinguish CPU/GPU bottlenecks. Optional valid GPU timing helps diagnosis but is not universally available.

Auto should use sustained evidence, hysteresis/cooldown and minimum artistic quality to avoid oscillation. Prefer stable resolution/effect adjustments; prepare structural/asset changes for a safe moment. Do not repeatedly rebuild buffers, download every tier or silently change composition.

Fireflies profiles preserve summer-night blue, readable reverie word, meaningful blurred foreground depth, interaction and musical response. Intro profiles preserve the approved veil and illumination. Reduced motion is independent of quality; unsupported graphics needs a separate fallback. Light does not enable interactive mobile V1.

## Measurement

60 fps corresponds to approximately 16.7 ms between frames at 60 Hz. Assess sustained/slow-frame distribution and transition behavior, not just averages. Record entry/preparation stalls, download bytes, render dimensions, resource counts and retained-scene returns separately. CPU/GPU may overlap; do not blindly sum timings.

Run intro illumination, formation/reverie, music/return, editing, both navigation directions, rapid navigation, resize, hidden/resume, recovery and quality changes. Compare seeds/tracks/gestures where useful and judge visual preservation alongside timing. Headless software-GPU runs are functional evidence, not the reference performance baseline.

## Available reference devices

The owner reports a Windows i5 PC, GPU described as RTX 6040 8 GB, with a 1080p display; Mac chip described as v4 and clarified as Max. Exact GPU/chip generations are unverified; do not normalize them to other models. RAM, CPU generation, Mac resolution and browser versions will be supplied later; proceed with current information.

Proposed browser coverage: Chrome/Firefox on Windows, Safari/Chrome on Mac. Record actual OS/browser, viewport, DPR, internal resolution, refresh rate, backend and chosen/resolved profile. Test native WebGPU and WebGL2 where supported by pinned versions.

Neither machine is the declared minimum. Add a concrete modest-hardware reference before claiming a support floor. Lowering resolution does not emulate a slower CPU/GPU. Agree percentile/stall targets, memory/cache limits and asset budgets from actual implementation evidence.

## Worker preparation

Keep rendering on the main thread initially. Use bounded worker jobs for substantial word-target sampling, procedural buffers/parsing and suitable bitmap preparation when profiling warrants them. Worker fetch alone does not improve bandwidth. Shader compilation/upload stays with the renderer; asynchronous preparation cannot guarantee eliminating GPU stalls. Audio decoding uses supported native APIs; live feature latency/AudioWorklet use are separate decisions.

Transfer suitable buffers/bitmaps rather than cloning large data; sender buffers detach, so define ownership/source retention. Never transfer scene graphs/GPU objects as plain data. Version jobs so stale word/navigation results cannot replace current intent. Cancellation messages do not interrupt synchronous long work; use cooperative checkpoints or deliberate termination. Limit concurrency to leave capacity for the visible scene.

Offscreen rendering and service-worker/offline caching are not selected. Revisit off-thread rendering only for a measured main-thread bottleneck; it does not solve GPU-bound overdraw by itself.

## Sources

[Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers), [transferables](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects), [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas), [decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData), [renderer preparation](https://threejs.org/docs/pages/Renderer.html).

[deviceMemory](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory), [hardwareConcurrency](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency), [Network Information](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation), [DPR](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio), [reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion). Reviewed October 7, 2026; verify pinned/browser-specific behavior during implementation.
