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
| — | Top navigation bar | `components/layout/Header.tsx` | `data/siteContent.ts` |
| 01 | Hero — loader, code sea, building, headline, CTAs | `components/sections/Hero.tsx` | `data/siteContent.ts → hero` |
| 02 | Showreel video frame | `components/sections/Showreel.tsx` | `data/siteContent.ts → showreel` |
| 03 | Manifesto statement | `components/sections/Manifesto.tsx` | `data/siteContent.ts → manifesto` |
| 04 | Services accordion | `components/sections/Services.tsx` | `data/services.ts` |
| 05 | Before/After slider | `components/sections/BeforeAfter.tsx` | `data/transformations.ts → comparisons` |
| 06 | Pipeline stages | `components/sections/Pipeline.tsx` | `data/transformations.ts → pipelineStages` |
| 07 | Selected work grid | `components/sections/SelectedWork.tsx` | `data/projects.ts` |
| 08 | Process steps | `components/sections/Process.tsx` | `data/process.ts` |
| 09 | Philosophy (HUMAN × MACHINE) | `components/sections/Philosophy.tsx` | `data/siteContent.ts → philosophy` |
| 10 | Closing CTA | `components/sections/CTASection.tsx` | `data/siteContent.ts → cta` |
| — | Footer | `components/sections/Footer.tsx` | `data/siteContent.ts → footer` |

## What to edit for common changes

- **Any text, link, label, email** → `data/siteContent.ts` (or the section's data file above). Components almost never contain copy.
- **Colors** → `app/globals.css` `:root` block: `--bg` (background), `--accent` (acid green `#c5ff21`), `--fg` (text), `--muted`, `--panel`, `--line`.
- **Font sizes** → `app/globals.css` `--step-*` fluid type scale.
- **Fonts themselves** → loaded in `app/layout.tsx` (Space Grotesk display · Inter body · JetBrains Mono · Instrument Serif).
- **SEO title/description** → `app/layout.tsx` metadata.
- **Building image in hero** → `public/building/bina.png` (path set in `data/siteContent.ts → hero.building`).

## The moving parts (leave unless intentional)

- `components/three/` — WebGL hero: `BuildingScene` (particle building), `CodeSeaCanvas` (perspective Matrix code ocean; density/speed tied to hero scroll), `MatrixRain` (loader's big falling glyphs), `NeuralBackground` (scroll-driven neuron web behind all post-hero sections), plus camera/sampling helpers. Heavy parts only load on desktop, non-reduced-motion.
- `components/ui/Cursor.tsx` — futuristic custom cursor (3D-tilting accent ring + dot); styles in `globals.css` `.cursor-*`.
- `animations/SmoothScroll.tsx` — Lenis smooth scrolling wrapper around the whole page.
- `animations/TextReveal.tsx` — reusable scroll-in text animation.
- `components/ui/Marquee.tsx` — infinite scrolling strip (hero bottom).
- Scroll timelines use GSAP ScrollTrigger inside each section; UI micro-transitions use framer-motion. One job per lib.

## Rules that already apply

- Turkish-only copy when real content lands ("biz" voice, no exclamation marks, "otomasyon" banned) — current EN copy is placeholder direction.
- Never chain edits on generated images; regenerate fresh.
- Production deploys need human approval (`DEPLOY_QUEUE.md` in the Agentlar repo); staging is auto.
