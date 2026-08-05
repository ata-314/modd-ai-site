# CODE_MAP — where everything lives

Quick map for editing the site. Every section is one file; every text is in `data/`.

## Run locally

```bash
npm run dev      # → http://localhost:3000
npm run build    # production check before pushing
```

Push to `main` → Vercel auto-deploys to https://modd-ai-site.vercel.app.

## Page order

Defined in `app/page.tsx` — reorder or remove sections there.

| # | Section (what you see) | Component file | Texts / items live in |
|---|---|---|---|
| — | Top navigation (glass capsule on scroll) | `components/layout/Header.tsx` | `data/siteContent.ts` |
| 01 | Hero — boot loader, headline, CTAs over the particle experience | `components/sections/Hero.tsx` | `data/siteContent.ts → hero` |
| 02 | Showreel video frame | `components/sections/Showreel.tsx` | `data/siteContent.ts → showreel` |
| 03 | Manifesto statement | `components/sections/Manifesto.tsx` | `data/siteContent.ts → manifesto` |
| 04 | Services accordion (glass cards) | `components/sections/Services.tsx` | `data/services.ts` |
| 05 | Before/After slider (glass) | `components/sections/BeforeAfter.tsx` | `data/transformations.ts → comparisons` |
| 06 | Pipeline stages | `components/sections/Pipeline.tsx` | `data/transformations.ts → pipelineStages` |
| 07 | Selected work grid (glass) | `components/sections/SelectedWork.tsx` | `data/projects.ts` |
| 08 | Process steps (glass detail panel) | `components/sections/Process.tsx` | `data/process.ts` |
| 09 | Philosophy (HUMAN × MACHINE) | `components/sections/Philosophy.tsx` | `data/siteContent.ts → philosophy` |
| 10 | Closing CTA (glass panel) | `components/sections/CTASection.tsx` | `data/siteContent.ts → cta` |
| — | Footer | `components/sections/Footer.tsx` | `data/siteContent.ts → footer` |

## The particle experience (`components/experience/`)

One fixed WebGL canvas behind everything. A single particle system morphs
**cyberpunk code valley → glyph building → galaxy → human brain** with
scroll. The sea phase is a ridged Matrix-glyph terrain: mountain ranges flank
a flat data-corridor, streaming toward the viewer, ridgelines glowing accent.
The building dissolves into a three-population galaxy — burning central
bulge, three arms tight at the core and frayed outward, sparse halo —
with differential rotation and layered breathing currents, warm/cool
starlight and lime accents. It pours downward with scroll and condenses
into a wrinkled brain deep in the page — fully reversible. The building
is the real GLB rendered as a legible hologram (`HoloBuilding.tsx` — lightly
cooled facade texture so the MODD signage reads, fresnel rim, gentle
scanlines, wireframe skeleton) wrapped in code glyphs in three architectural
layers sampled
from the real GLB (`public/models/building.glb` + `facade.jpg` luminance):
bright dense glyphs along EdgesGeometry structure lines, dimmer off-white/
pale-green fill on the facades, sparse rising particles inside the volume.
The solid model is never rendered. A computed cinematic camera frames it
front-left three-quarter (fov 38, entrance-level looking up, distance from
the model's Box3 so it fills ~60% of any viewport), with slow dolly-in, a
≤10° scroll orbit and a counterclockwise dissolve into the neural brain. ~30% of
the field never morphs — a permanent code sea flows behind everything.
Raw 35MB Meshy source lives untracked in `assets-src/`; the photo
(`public/building/bina.webp`) is the fallback sampler (failure logged,
never silent).

- `phases.ts` — the central scroll timeline (phase boundaries, hero scroll length `HERO_SCROLL_VH`, JS weight mirror of the shader math). Change the choreography here.
- `state.ts` — shared refs (hero/doc progress, pointer, scroll velocity) + loader-ready signal. Single source for scroll values.
- `quality.ts` — device tier detection → particle budgets, DPR caps, WebGL support check.
- `MorphField.tsx` — the shader: three deterministic position sets blended per particle, glyph atlas sprites, pointer repulsion, depth fog. Built once; uniforms only per frame.
- `ExperienceCanvas.tsx` — the single R3F canvas, camera rig, scroll/pointer driver, visibility pause, context-loss → fallback.
- `ExperienceRoot.tsx` — picks WebGL vs fallback (reduced-motion / no WebGL).
- `StaticCodeScene.tsx` — 2D fallback: animated code sea + static glyph building (still no photo).

## What to edit for common changes

- **Any text, link, label, email** → `data/siteContent.ts` (or the section's data file above).
- **Colors** → `app/globals.css` `:root`: `--bg`, `--accent` (acid `#c5ff21`), `--fg`, `--muted`; glass material tokens `--glass-*`.
- **Font sizes** → `--step-*` fluid scale; fonts load in `app/layout.tsx`.
- **SEO title/description** → `app/layout.tsx` metadata.
- **Glyph set** → `components/three/glyphAtlas.ts` (8×8 atlas, 64 chars).
- **Loader timing** → `useLoader` in `Hero.tsx` (min 4.5s first visit / 1.5s repeat / 0.9s reduced; 8s hard cap; type-on boot log).

## Other moving parts

- `components/ui/Cursor.tsx` — minimal futuristic cursor: instant accent dot + trailing hairline ring with a slow accent arc sweep. Fine pointers only; native cursor on touch.
- `components/three/MatrixRain.tsx` — loader's large falling glyphs.
- `components/three/CodeSeaCanvas.tsx` — 2D sea, now only used by the fallback scene.
- `components/three/sampleBuilding.ts` — offscreen alpha/edge/luminance sampling of the building image.
- `animations/SmoothScroll.tsx` — Lenis + GSAP ticker (single timing source); `animations/TextReveal.tsx` — scroll-in text.
- Scroll timelines: GSAP ScrollTrigger; UI micro-transitions: framer-motion. One job per lib.

## Rules that already apply

- Turkish-only copy when real content lands ("biz" voice, no exclamation marks, "otomasyon" banned) — current EN copy is placeholder direction.
- The building photo is data, never a visible texture.
- Never chain edits on generated images; regenerate fresh.
- Production deploys need human approval (`DEPLOY_QUEUE.md` in the Agentlar repo); staging is auto.
