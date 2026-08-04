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
**code sea → glyph building → galaxy → human brain** with scroll; the galaxy
persists below the hero and condenses into a wrinkled two-hemisphere brain at
~50–78% of the page (Philosophy territory), fully reversible. The building is
drawn *entirely from Matrix glyphs*, sampled from the real 3D model at
`public/models/building.glb` (slimmed Meshy export — geometry only, never
rendered; raw 35MB source lives untracked in `assets-src/`). The photo
(`public/building/bina.webp`) is the automatic fallback sampling source.

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

- `components/ui/Cursor3D.tsx` — procedural 3D cursor (glass icosahedron + acid torus on a 96px canvas). Fine pointers only; static glass ring under reduced motion; native cursor on touch.
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
