# MenteMaestra Studio — Brand Guidelines v1.0

> **Last updated:** 2026-04-09  
> **Status:** Active — aligned with the live Next.js frontend (`frontend/`)  
> **Primary locales:** Spanish (`es`, default UI copy), English (`en`)

This document is the **source of truth** for brand expression. Implementation tokens live in `frontend/src/app/globals.css` (`:root` CSS variables) and `frontend/tailwind.config.ts` (Tailwind theme extensions).

---

## Quick reference

| Element | Value |
|---------|--------|
| **Brand name** | MenteMaestra (footer wordmark split: “Mente” / “Maestra”) |
| **Legal entity (footer)** | MenteMaestra SPA |
| **Primary accent** | `hsl(24 100% 50%)` (~`#FF6600`) — CTAs, focus rings, highlights |
| **Page background** | `hsl(0 0% 4%)` (~`#0A0A0A`) — near-black |
| **Body text** | `hsl(0 0% 98%)` (~`#FAFAFA`) on dark surfaces |
| **Display / headings** | Syne (Google Fonts) |
| **Body** | DM Sans (Google Fonts) |
| **Optional UI / system** | Geist Sans + Geist Mono (`next/font`, CSS variables on `<html>`) |
| **Voice (summary)** | Clear, confident, senior-craft — partner, not vendor |

---

## 1. Color palette

### 1.1 Core tokens (CSS variables)

These are defined in `frontend/src/app/globals.css` and exposed through Tailwind as `background`, `foreground`, `primary`, `accent`, `muted`, `border`, etc.

| Token | HSL (source) | Approx. hex | Usage |
|-------|----------------|-------------|--------|
| `--background` | `0 0% 4%` | `#0A0A0A` | Default page / section background |
| `--foreground` | `0 0% 98%` | `#FAFAFA` | Primary text on dark UI |
| `--card` | `0 0% 7%` | `#121212` | Elevated surfaces |
| `--muted` | `0 0% 15%` | `#262626` | Muted fills |
| `--muted-foreground` | `0 0% 65%` | `#A3A3A3` | Secondary text, captions |
| `--border` / `--input` | `0 0% 15%` | `#262626` | Dividers, inputs |
| `--primary` | `24 100% 50%` | `#FF6600` | Primary actions, brand accent |
| `--accent` | `24 100% 50%` | `#FF6600` | Same as primary in current theme |
| `--ring` | `24 100% 50%` | `#FF6600` | Focus rings |
| `--destructive` | `0 62% 30%` | — | Error / destructive (sparingly) |

### 1.2 Extended neutrals (Tailwind usage)

Components also use **zinc** scale utilities (e.g. `text-zinc-400`, `border-zinc-800`, `bg-zinc-950/40`) for hierarchy, cards, and borders. Treat **zinc** as the secondary neutral family layered on top of the HSL base.

**Guideline:** Prefer CSS variable colors for “brand shell”; use zinc for fine-grained contrast within sections (pricing cards, FAQs, labels).

### 1.3 Semantic usage

| Role | Implementation |
|------|----------------|
| **Primary CTA** | `primary` / `accent` (orange), white or near-white label text |
| **Links & focus** | Orange ring; hover moves toward white text on nav |
| **Body** | `foreground` on `background`; secondary lines `muted-foreground` or zinc-400/500 |
| **Success / booking** | Keep calm, neutral confirmations; reserve strong orange for primary actions |

### 1.4 Accessibility

- Maintain **AA contrast** for body copy vs background (near-white on ~4% luminance black generally passes for large/normal text; validate when using orange as **text** on dark backgrounds).
- **Never** rely on orange alone to convey state; pair with text or icons.
- Respect **`prefers-reduced-motion`** for animations (site implements reduced-motion paths in several components).

---

## 2. Typography

### 2.1 Families

| Role | Font | Source | Notes |
|------|------|--------|--------|
| **Headings** (`h1`–`h6`) | **Syne** | Google Fonts (`globals.css` import) | Distinctive, modern display |
| **Body** | **DM Sans** | Google Fonts | Applied to `body` in `globals.css` |
| **System / variable** | **Geist Sans** | `next/font` in `layout.tsx` | `--font-geist-sans` on `<html>` |
| **Monospace** | **Geist Mono** | `next/font` in `layout.tsx` | Code, technical labels if needed |

**Stack (reference):**

```css
/* Headings — matches globals.css */
font-family: 'Syne', sans-serif;

/* Body */
font-family: 'DM Sans', sans-serif;
```

### 2.2 Scale & hierarchy (implementation-led)

The site uses responsive `text-*` and `clamp()` patterns (hero, footer wordmark, sections) rather than a single fixed type scale. Follow these **principles**:

| Principle | Guidance |
|-----------|----------|
| **Headlines** | Syne, bold/extrabold, tight leading; section labels often uppercase with tracking (`tracking-[0.2em]` style) |
| **Supporting copy** | DM Sans, smaller sizes, relaxed leading, zinc-muted color for de-emphasis |
| **Marquee / ribbon** | Uppercase, spaced tracking — energetic, productized list of capabilities |
| **Bilingual** | Same hierarchy in ES/EN; avoid different line lengths breaking layout — use `text-balance` where already applied |

### 2.3 Loading

- Syne + DM Sans: loaded via `globals.css` `@import` from Google Fonts (weights 400–800 as imported).
- Geist: self-hosted through Next.js font optimization.

---

## 3. Logo & wordmark

### 3.1 Primary logo asset

| Asset | Path | Use |
|-------|------|-----|
| **Wordmark (SVG)** | `frontend/public/MM_logo_NB-01.svg` | Header, transitions, primary digital use |

“NB” in the filename indicates a **no-background** suitable mark for dark UI.

### 3.2 Footer typographic wordmark

Footer renders **“Mente” / “Maestra”** as large custom typography (`font-footer-wordmark` in CSS), not necessarily the SVG — keep **spelling and two-line split** consistent with footer copy.

### 3.3 Clear space & minimum size

| Context | Guideline |
|---------|-----------|
| **Clear space** | ≥ height of the logo cap-height around all sides when placing the SVG |
| **Minimum width (digital)** | ~**120px** full wordmark where legibility allows (adjust for retina) |
| **Favicon / small** | Use simplified mark only if a dedicated icon asset is added; today prefer scaling SVG only to readable sizes |

### 3.4 Don’ts

- Do not recolor the SVG outside **white / near-white** on dark, or **dark** on light backgrounds without a formal light-theme audit.
- Do not stretch, skew, or add heavy shadows that break flat premium look.
- Do not place on **low-contrast** busy imagery without a scrim.

---

## 4. Voice & tone

Derived from `frontend/src/i18n/messages.ts` (canonical copy).

### 4.1 Brand personality

| Trait | What it means for MenteMaestra |
|-------|--------------------------------|
| **Clear** | Short sentences, concrete outcomes; “claridad”, “criterio”, “menos ruido, más impacto”. |
| **Senior / craft** | Emphasis on judgment, consistency, execution — not hype. |
| **Partner** | “Socio creativo”, “design partner”, subscription and continuity — embedded in workflow. |
| **Confident, grounded** | Awards and proof points stated matter-of-factly; not boastful adjectives. |

### 4.2 Voice chart

| Dimension | We are | We are not |
|-----------|--------|------------|
| **Expertise** | Precise, experienced, systematic | Jargon-heavy or gatekeep-y |
| **Offering** | Transparent pricing paths, flexible engagement | Aggressive sales pressure |
| **Relationship** | Long-term partner, clarity at touchpoints | One-off transactional tone |
| **Bilingual** | Natural ES; professional EN | Mixed-language UI strings |

### 4.3 Tone by context

| Context | Tone | Example direction (from copy) |
|---------|------|--------------------------------|
| **Hero / value prop** | Aspirational but concrete | “Socio de diseño para empresas que escalan.” |
| **Services** | Benefit + craft | Strategy → systems → scale |
| **Pricing / FAQ** | Transparent, reassuring | Plain language about billing, scope, pause |
| **Booking / errors** | Calm, actionable | Retry, pick another slot, check spam — no blame |
| **Marquee** | Bold, repetitive, category-defining | ALL CAPS capability strips |

### 4.4 Messaging pillars (recurring themes)

- **Clarity + innovation** — “Where clarity meets innovation” / “Donde la claridad encuentra la innovación”
- **End-to-end creative system** — strategy, design, code, growth in one partnership
- **Speed without chaos** — on-demand design, fast turnaround, no freelance roulette
- **Proof** — awards list, testimonials, “est. 2022”

### 4.5 Words & patterns to avoid

| Avoid | Prefer |
|-------|--------|
| Empty superlatives (“#1 in the world”) | Specific outcomes, scope, or proof |
| Vague “full-service” without scope | Named deliverables (web, brand, content, etc.) |
| Punitive error copy | Short reason + next step |

**Marquee / labels:** ALL CAPS is **intentional** for ribbon text; do not use ALL CAPS for long body paragraphs.

---

## 5. Imagery & motion

### 5.1 Photography & illustration

- **Default UI:** Dark, minimal, **premium** feel; generous whitespace; zinc borders and subtle gradients acceptable.
- **Featured work:** Project thumbnails and case imagery — high quality, consistent aspect treatment per components.
- **3D / WebGL:** Brain experience and interactive demos reinforce **innovation + depth**; keep performance and reduced-motion in mind.

### 5.2 Iconography

- **UI icons:** Lucide React — stroke icons aligned to text size; default **white/zinc** on dark.
- **Brands (stack):** Logo assets under `frontend/public/imgs/stack_images/` — use **consistent height** and monochrome/dark-friendly variants where provided.

### 5.3 Motion

- **Lenis** smooth scrolling sitewide; **page transitions** between routes (loader + blur).
- **Principle:** Motion supports orientation; never block core actions. Honor `prefers-reduced-motion`.

---

## 6. UI patterns & layout

### 6.1 Shape & radius

- Base radius token: `--radius: 0.5rem` (8px). Cards and buttons often use **rounded-2xl / rounded-3xl** for a soft, productized look.

### 6.2 Spacing

- Tailwind spacing; container padding from `tailwind.config.ts` (`center: true`, responsive horizontal padding).
- Sections: consistent vertical rhythm (`py-24`, `mt-8`, etc. in components).

### 6.3 Key routes (for messaging alignment)

| Route | Role |
|-------|------|
| `/` | Full story: hero → services → work → stack → booking → experience → onboarding CTA |
| `/onboarding` | Pricing + FAQ + conversion |
| `/book` | Meeting flow |

---

## 7. Asset organization (reference)

| Location | Contents |
|----------|----------|
| `frontend/public/` | Static public assets (logo SVG, media) |
| `frontend/public/imgs/` | Marketing images, stack logos |
| `frontend/public/3dbrain/` | 3D experience assets (models, fonts for Three.js) |
| `frontend/src/data/` | Featured projects and portfolio data |

**Naming:** Prefer lowercase, hyphenated filenames for new web assets; keep stack logos descriptive (`*_logo_black.png` pattern in use).

---

## 8. AI & external content generation

When generating images or copy “on brand”:

**Visual:** Dark near-black background (`#0A0A0A`), subtle zinc separation, **orange accent** only for emphasis, Syne-like bold headlines (do not output copyrighted fonts—describe as “geometric grotesque display”), DM Sans-like body, minimal clutter, premium studio aesthetic.

**Copy:** Bilingual awareness; Spanish default for local market; voice per section 4.

---

## 9. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-09 | Initial guidelines from live frontend tokens, copy, and assets |

---

## 10. Maintenance

- **Design token changes:** Update `globals.css` first, then reflect tables in §1 here.
- **Voice changes:** Update `messages.ts` (both `es` and `en`), then summarize shifts in §4.
- **CKM skill sync:** This file is intended to work with the `ckm:brand` workflow (`docs/brand-guidelines.md` as source of truth per skill README).
