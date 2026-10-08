# Social sharing and metadata

Status: the owner accepts static route-specific HTML metadata and authored preview images for polished social sharing. Exact generation tools, tags, copy, domains and assets remain to design. No SSR runtime or TanStack Start is introduced by this requirement.

## Approved V1 direction

- Define route-specific title, description, canonical URL, Open Graph metadata and social-card image information in a small typed web route/experience manifest. Keep this pure so a build task can consume it without loading Three.js or browser APIs.
- At build time, emit an HTML entry with the appropriate head metadata for each public experience URL, using the same SPA assets. This is static metadata generation, not necessarily prerendering React content or the graphics scene.
- Serve the route's HTML on a direct HTTP request. Ensure canonical/trailing-slash and locale URL conventions are consistent, existing files are served correctly and unknown URLs do not impersonate a valid experience. Missing JS/images must not fall through to an HTML success response.
- Client-side navigation updates document metadata from the same manifest. Client updates alone are insufficient for crawlers that only read the initial response.
- Author a visually coherent preview card for Creation and a distinct card for Fireflies. Export suitable raster images accessible at absolute public URLs, with image metadata/alternative text. Do not promise automatic crawler screenshots of live WebGL or autoplay audio.
- Add a share control only after its placement/behavior is designed; native sharing where supported and link-copy fallback are candidates, not confirmed interactions.

Open Graph minimum information includes title, type, image and URL; descriptions, image dimensions/alt and locale metadata improve the presentation where supported. Platform-specific card tags and caches need real validation after deployment. No fixed preview aspect/size is approved here.

## Scope distinction

Sharing the experience's URL is in scope. Sharing a particular visitor word/seed, saved state or generated image is not confirmed. Personalized previews may require serialized URL state, a finite build strategy or a server image/metadata endpoint; do not create that backend merely for the general sharing requirement. Exact public copy, domain and locale routing remain open.

## Verification

Check direct HTTP HTML without JavaScript, metadata escaping, absolute public image URLs, localized labels and real platform previews after deployment. Social platforms may cache older metadata. Build-time generation must update image/HTML assets together.

Source: [Open Graph protocol](https://ogp.me/), reviewed 2026-10-07. Additional platform-specific requirements will be verified when implementing cards.
