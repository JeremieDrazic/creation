# Celestial veil 07 — detected point coordinates

Status: image-derived 2D candidates, with the reconstructed overall shape accepted as a good working
basis. Fine appearance and depth remain under review. The owner subsequently requested removing the
unused procedural layout; all analysis data and plates remain preserved. The later grain material
has a separate temporary validation image below.

## Files and coordinates

- [Enriched coordinates](07-celestial-veil-classified-points.json): all original detections with
  measurements, proposed appearance/color, reviewed groups and approximate staging depth.
- [Classification plate](07-celestial-veil-classification.png): source, type map, color map and
  depth hypothesis. Maps use fixed marker sizes for diagnosis, not reconstructed particle
  appearance.
- [Coordinates](07-celestial-veil-points.json): 5,676 detected positions, each with x and y in
  pixels.
- [Detection overlay](07-celestial-veil-detected-points.png): the lower reference frame with a small
  turquoise ring at each detected position. Rings are diagnostic marks, not particle sizes.
- [Original reference](07-celestial-veil.png): 1536 × 1024 pixels, containing two light states.

The extraction covers the illuminated lower half, a nominal 1536 × 512 frame. Coordinate (0, 0)
corresponds to full-image pixel (0, 512); x grows rightward and y downward. Add 512 to y to locate a
point in the full source. For normalized coordinates, divide x by 1536 and y by 512. The dataset
retains original integer pixel coordinates; it does not define resize or camera behavior.

Six top rows are excluded because the separator and its edge artifacts contaminate them. Manually
bounded rectangles mask Creation, FR/EN, the verse/reference and the Fireflies link. The exact
rectangles are recorded in the JSON. They may also conceal real grains; masked regions must not be
interpreted as empty scene regions.

## Detection method

Decode the actual PNG and compute mean RGB channel brightness on the 0–255 scale. This is an image
signal measure, not linear-light luminance. Retain local maxima in a 3 × 3 neighborhood with a
brightness of at least 12 and a local contrast of at least 2 above a surrounding square ring.
Equal-valued neighboring pixels use a deterministic coordinate tie break.

Two additional passes use box smoothing with radii 1 and 3 pixels to locate broader soft peaks.
Their contrast threshold is 2.5. Background-ring outer radius is 6 + 2 × smoothing radius and inner
radius is 2 + smoothing radius. Windows are clipped at image/mask boundaries. Merge distances are
1.5 pixels for raw candidates and 4 pixels for smoothed candidates against already retained points.
The raw pass is processed first; within each pass, higher contrast wins.

| Pass                    | Candidates | New retained positions |
| ----------------------- | ---------- | ---------------------- |
| Original pixel signal   | 5,666      | 5,666                  |
| Box smoothing, radius 1 | 2,710      | 0                      |
| Box smoothing, radius 3 | 1,504      | 10                     |
| Total                   |            | 5,676                  |

Results are sorted by y, then x. The JSON records thresholds, masks, merge settings and counts. No
randomly generated points or interpolated band positions are included. The local analysis script is
/private/tmp/creation-extract-veil-points.mjs; it uses the already installed pngjs 7.0.0 without
adding dependencies. It is exploratory tooling, not application code.

## What the image establishes

The diagonal band has uneven concentrations and gaps, plus isolated points far outside it. Its
lower-left extension appears softer and the upper-right extension finer. The left verse region
remains mostly dark. Warm and cool points coexist. Saturated centers can lose their original color.

The extraction provides visible 2D peak positions, not a physical particle inventory. Faint texture
or noise can contribute maxima under these permissive thresholds. Overlapping or subpixel grains
cannot all be separated; a cluster can yield one peak and a textured soft spot can yield several.
Per-particle diameter, opacity, depth and hidden/off-frame content have not been recovered.

## Verification and next review

The overlay was visually inspected against the source; separator artifacts prompted exclusion of six
rows. Automated data checks verify the recorded count, unique integer coordinates, frame bounds and
exclusion masks. This does not establish exact particle count or artistic acceptance.

### Grain-type calibration samples

The owner requested a proposed type for each coordinate and agreed to review representative
measurements first, before applying criteria to the complete dataset.

- [Sample plate](07-celestial-veil-grain-samples.png): 12 located examples, source patches and
  contrast-enhanced diagnostic patches. These are exploratory measurements for review.
- [Sample measurements](07-celestial-veil-grain-samples.json): coordinates, measured descriptors,
  proposed types and their rationale. The original 5,676-coordinate file is unchanged.

Each patch contains 25 × 25 source pixels, enlarged fivefold without smoothing. Local background is
the median mean-RGB signal in an annulus from radius 8 to 12 pixels. Contrast is the signal at the
coordinate minus this background. Measure the 8-connected region containing the coordinate above
20%, 50% and 80% of this local contrast, clipped to the patch. Equivalent diameter is the diameter
of a circle with that region's area, not a recovered physical particle diameter. D50 denotes the
half-height region's equivalent diameter.

| Sample | Proposed type        | Coordinate  | D50 px | Local contrast /255 |
| ------ | -------------------- | ----------- | ------ | ------------------- |
| F1     | Fine grain           | (1034, 34)  | 1.1    | 33.7                |
| F2     | Fine grain           | (957, 36)   | 1.6    | 57.0                |
| F3     | Fine grain           | (1219, 51)  | 2.0    | 189.3               |
| N1     | Sharp bright point   | (1081, 454) | 5.3    | 231.0               |
| N2     | Sharp bright point   | (627, 429)  | 5.0    | 230.0               |
| D1     | Diffuse dust         | (656, 486)  | 4.8    | 13.7                |
| D2     | Diffuse dust         | (553, 494)  | 5.0    | 8.7                 |
| D3     | Diffuse dust         | (770, 485)  | 3.9    | 32.7                |
| U1     | Undetermined         | (1225, 87)  | 6.8    | 69.0                |
| U2     | Bright point (owner) | (1417, 305) | 5.2    | 236.0               |
| U3     | Undetermined         | (544, 488)  | 3.2    | 2.0                 |
| U4     | Bright point (owner) | (906, 262)  | 7.3    | 165.5               |

U1 has six other detected maxima inside its half-height region. U3 is too close to the local
background for a stable appearance type.

The owner confirmed U2 as one visible grain: coordinate entries (1417, 305) and (1416, 307) belong
to that same grain. The owner also reads U4 as one very luminous grain: (906, 262) and (908, 263)
belong together. These decisions are recorded in the sample JSON without deleting or moving any
original detections. They do not authorize merging all connected maxima in clusters.

The owner observes more copper and blue particles than white in clusters. This remains a qualitative
interpretation, not measured proportions or a fixed palette ratio. Nearby source-center examples
support the presence of warm and cool signals: (1081, 202) is RGB (229, 205, 192), while (1066, 191)
is (63, 77, 83). The center at (1078, 198) is clipped to (255, 255, 255); it does not establish an
intrinsically white grain. These are source pixel colors, not recovered material colors.

Color needs a separate descriptor from apparent size and brightness. Evaluate unsaturated grain
shoulders relative to the local background; dense neighbors can contaminate the estimate. The
contrast-enhanced patches are grayscale diagnostic views and cannot establish color proportions. No
per-grain color classification or cluster-wide color count has been completed.

No automatic classification thresholds have been accepted. Source-center RGB is recorded but
saturated centers do not establish original color. Enhanced views subtract the background and map
the selected point's contrast to white; brighter neighbors may clip. They are diagnostic views, not
proposed rendering targets. A contaminated background or an overlapping contour can bias all size
estimates. No depth, physical size or opacity is assigned.

Sample checks verify membership in the original coordinates, finite positive footprint sizes and
nested 20%/50%/80% footprint areas. The rendered plate was visually inspected. Analysis scripts:
/private/tmp/creation-measure-veil-grains.mjs and /private/tmp/creation-veil-grain-samples.mjs.

### Complete candidate annotation and staging depth

The owner authorized full annotation and an approximate depth estimate to prepare the rendering
work. All 5,676 detections retain their original coordinates and order in the enriched JSON. Each
entry includes pixel/normalized position, grain identity, representative/duplicate status,
appearance, measurements, color, depth and uncertainty flags. The original coordinate file is
unchanged.

Only the two owner-reviewed pairs share a grain identity; their secondary entries reference the
primary entry and inherit its appearance/color/depth. This leaves 5,674 candidate groups, not a
validated physical-particle count. Other potentially shared spots remain unresolved.

| Proposed appearance | Candidate groups |
| ------------------- | ---------------- |
| Fine grain          | 2,860            |
| Bright point        | 349              |
| Diffuse dust        | 340              |
| Undetermined        | 2,125            |

Classification keeps weak, shared or clipped half-height contours unresolved. Otherwise, D50 up to
2.5 pixels suggests a fine grain; contrast at least 40 and D50 up to 8 suggests a bright point; a
broader footprint with D20/D80 at least 1.4 suggests diffuse dust. These are initial heuristics, not
artistic acceptance. Owner-reviewed U2/U4 override automatic ambiguity. The JSON records the exact
settings, decision order and descriptors, including null sizes for 20 nonpositive-contrast
representative entries.

Color uses unsaturated shoulders within four pixels, selected from 15–85% of local contrast and
excluding pixels nearer another grain. An unsaturated-center fallback is marked low confidence.
Family is estimated from the locally background-subtracted RGB signal. Shared contours, weak
contrast and possible neighboring halos can keep the family undetermined. Observed source color and
a tentative family hint remain separate. No intrinsically white material is inferred.

Candidate color counts are copper 1,098; blue 621; near-neutral 309; undetermined 3,646. These
describe heuristic candidate groups, not palette proportions, and do not establish the overall
predominance of copper/blue particles. No target color ratio was imposed from owner feedback.

Depth is an explicitly authored hypothesis: normalized 0 is far and 1 is near. It is neither camera
Z nor meters. Fine grains occupy roughly 0.19–0.27; bounded bright points roughly 0.45–0.55; diffuse
grains roughly 0.65–0.90. Their suggested authoring ranges are deliberately wide and are not
statistical confidence intervals. The 2,125 unresolved groups receive 0.5 with band unassigned and
range [0, 1], an explicit placeholder rather than a claimed estimate. All depth confidence is low.
Brightness and color alone do not determine distance; near/far defocus and overlapping halos remain
ambiguous. Exact mapping formulas are stored in the JSON.

The owner's hypothesis that a nearer grain's bloom can obscure another grain's color is preserved as
a plausible reconstruction explanation, not depth evidence. The neighboring-bright-point flag only
identifies possible contamination; it does not detect physical occlusion or prove bloom.

The full analysis script is /private/tmp/creation-classify-veil-points.mjs. It is exploratory local
tooling, not production application code; no dependencies or lint configuration were changed. The
enriched JSON includes source/raw-file SHA-256 hashes and complete method settings. Automated checks
cover original-coordinate preservation, counts, grouping, finite bounded staging depths and
measurement consistency. The rendered diagnostic plate was visually inspected.

The owner accepted this annotation as the working basis for the next rendering increment and
requested preserving the plates for a possible future case study. Retain the landmark preview,
complete detection overlay, sample plate, classification plate and associated JSON data alongside
the original reference. Distinguish measured image descriptors from classification/staging
hypotheses when explaining the process. This does not authorize case-study publication.

The first material now has a preserved [sharp/soft probe](07-celestial-veil-material-probe.png).
This is a temporary two-disk shader validation scene, not a composition or material art-direction
approval. It validates radial transparency and varying softness in a forced WebGL2 software draw;
native WebGPU and full-scene performance remain unverified.

The first assembled [static tableau](07-celestial-veil-first-tableau.png) draws 5,674 candidate
grains from the annotation using the production scene module in a temporary validation harness. This
is a preserved working comparison image, not final visual approval. Positions and proposed depth
order are retained. The current drawing lacks source halos and inter-grain diffuse light and appears
drier/sharper. Its orthographic camera preserves the image framing; no perspective, depth-of-field
effect, resize policy or camera motion has been introduced.

The owner requested moving fixed conversion work offline. The complete annotation is retained as
research provenance; the runtime now uses a separate generated compact asset under apps/web/src/
experiences/intro/assets/celestial-veil. Regenerate with pnpm --filter @creation/web prepare:veil.
The source measurements, heuristic labels and depth uncertainty remain authoritative here; the
prepared rows are renderer inputs, not new physical measurements. All analysis plates, the material
probe and first tableau must be kept for the potential case study. The unused procedural layout was
subsequently removed at the owner’s request.

The built-Storybook preview fetched the compact asset separately. Its 1536 × 512 canvas matched the
first tableau exactly (zero differing pixels). The
[prepared tableau](07-celestial-veil-prepared-tableau.png) is preserved alongside the original
comparison. This establishes rendering continuity, not artistic approval or native WebGPU support.

Next: study the offline preparation, compact format, loader and IntroCreation lifecycle with the
owner. Application framing, artistic refinements, bloom, camera motion and audio remain separate
increments.

## Display-density comparison

The temporary preview now follows window.devicePixelRatio with unchanged material and grain data.
Both captures below use the same simulated Retina display and 1536 × 512 CSS frame:

- [Ratio 1](07-celestial-veil-pixel-ratio-1.png): 1536 × 512 drawing buffer, enlarged by the
  browser.
- [Ratio 2](07-celestial-veil-pixel-ratio-2.png): 3072 × 1024 drawing buffer.

Both captures contain 3072 × 1024 physical screenshot pixels. The built-browser check reported no
page errors. This isolates display sampling from authored grain softness; it does not establish a
production pixel-ratio budget or native WebGPU performance.

## Temporary contour comparison

The same Storybook story now exposes Douceur des contours under Controls, scaling authored softness
from 0 (sharp) to 1 (original), with 0.5 as the intermediate preview default. It retains derivative
antialiasing and all other grain values. The annotated source, compact asset and production shader
remain unchanged. The earlier
[boolean comparison](07-celestial-veil-contour-comparison-storybook.png) and latest
[intermediate comparison](07-celestial-veil-intermediate-contours-storybook.png) are preserved. This
is a working diagnostic, not final appearance approval.

## Application projection correction

The [initial application integration](07-celestial-veil-application-integration.png) preserves the
earlier stretched reference projection. Orthographic camera framing now contains the complete
reference uniformly, keeping equal horizontal/vertical scale without changing grain data.

- [1024 × 768](07-celestial-veil-framing-1024x768.png)
- [1440 × 900](07-celestial-veil-framing-1440x900.png)
- [2560 × 1080](07-celestial-veil-framing-2560x1080.png)

These captures validate a projection correction, not the final composition. Space along the
unconstrained axis is intentional for this working baseline. The owner wants the band to enter and
leave through the top/bottom and appear more distant on compact screens; artistic placement,
perspective/parallax and lighting remain separate reviews.

## Numeric palette adapter probe

The [temporary data-gui probe](07-data-gui-control-probe.png) validates the real numeric slider
behind our adapter: direct property edits, live/finish callbacks, range clamping and cleanup. This
is a technical fixture, not a palette mounted in the experience or a new veil composition. The intro
framing controls will be connected in a separate reviewed increment.

## Extended-field framing comparison — exploratory

The [four-screen study](07-framing-study/README.md) compares current containment with a larger
synthetically extended field at baseline and 1.22× zoom. It retains all source grains and adds 8,000
proposed tail grains only in the study; no new source-image detections or production asset changes
are claimed. Full-resolution images and edge-crossing measurements are preserved for owner review.
The [refined development panel](07-development-panel-refined.png) now provides i18n, reset and
versioned JSON copy; its appearance and scope remain separate from the proposed field extension.
