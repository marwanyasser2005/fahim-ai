# Fahim Verified Learning OS — Design System 3.0

## Active specification — 10 September 2026

The current user-requested UI overhaul supersedes the historical 2.0 palette below. Use `src/styles/tokens.css` as the source of truth and `src/styles/learning-os.css` for shared product surfaces. The older sections are retained as migration context, not instructions to restore the previous cream/navy interface.

- App: `#F7F8FC` light / `#0C0D12` dark.
- Surface: white light / `#12141B` dark.
- Primary action: `#5B5CE2` light / `#818CF8` dark.
- Controls 8px, inputs 10px, cards 14px, panels 18px radius.
- Arabic currently uses Cairo with calm heading weights and increased line height; IBM Plex Arabic remains an unimplemented font migration option.
- Assessment stays the primary mobile action; Ask Fahim remains directly accessible.
- Recorded activity is not automatically verified learning. Unknown evidence must remain explicitly untested or not recorded.
- Avoid decorative fog overlays, high-opacity gradients over content, and excessive offset shadows.
- Product navigation and responsive content must use logical properties for Arabic RTL and English LTR.

See `UPDATED_PRODUCT_REVIEW_2026-09-10.md` for implementation scope and verification limits.

## Historical 2.0 reference

**Product:** Fahim AI  
**Positioning:** An operating system for evidence-based learning  
**Personality:** Egyptian, editorial, rigorous, warm, human — never a generic AI dashboard

## Design principles

1. Evidence before decoration: every badge, chart, and status explains a real learning state.
2. Bilingual by design: Arabic and English have separate rhythm, tracking, and line-height rules.
3. Calm confidence: use the four identity colors deliberately; avoid neon AI gradients and excessive glass.
4. Progressive disclosure: show the next learning action first, details on demand.
5. Production truth: never expose enum names, internal codes, fake statistics, or unverifiable claims.

## Identity palette

| Role | Light | Dark | Purpose |
|---|---:|---:|---|
| Canvas | `#F4F1E9` | `#080D12` | App background |
| Paper | `#F7F0E4` | `#0B1116` | Editorial sections |
| Panel | `#FFFDF8` | `#101820` | Cards and controls |
| Ink / text | `#14213D` | `#F7F0E4` | Primary typography |
| Muted text | `#596577` | `#AEB6C2` | Secondary copy |
| Lapis | `#173F5F` | `#75A9C8` | Navigation and primary actions |
| Nile | `#0F766E` | `#69D4C9` | Evidence, success, links |
| Saffron | `#F2B84B` | `#F2B84B` | Learning energy and focus |
| Vermilion | `#D95D39` | `#F08A69` | Attention, sequence, mistakes |

Do not use purple/cyan AI gradients as a primary identity. Gradients are reserved for subtle depth inside hero backgrounds and charts.

## Typography

- Arabic UI and display: self-hosted `Cairo`; display line-height `1.22–1.32`, body `1.75–1.95`, letter-spacing `0`.
- English UI: `Segoe UI Variable`, system UI; display line-height `1.02–1.10`, body `1.55–1.75`.
- Metadata: minimum 12px. Uppercase and tracking are English-only and limited to short labels.
- Display sizes use `clamp()` and `text-wrap: balance`; Arabic uses normal word wrapping and must never use negative tracking.
- Body text defaults to 16px. Never use 7–10px for visible product content.

## Shape, depth, and spacing

- Radius scale: 10px controls, 14px buttons, 18px cards, 24px feature surfaces, full radius for pills.
- Use 1px low-contrast borders and soft ambient shadows. The offset Saffron shadow is a signature accent for one featured object per viewport, not every component.
- Minimum target: 44×44px; primary actions: 48px high.
- Base spacing: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Content container: 1280px for product pages; 1600px only for the landing hero and dense admin screens.

## Components

- Buttons: clear icon + label, 14px minimum type, 48px primary height, transform/opacity transitions only.
- Cards: 18px radius, no nested heavy borders, state expressed with icon + text + color.
- Icons: Lucide only, 1.8–2px stroke, 18–22px standard size, 44–48px touch container.
- Inputs: 52px high, 16px input text on mobile, persistent label, explicit error/help region.
- Navigation: 72px desktop, compact responsive content, active state uses both color and underline/surface.
- Status labels: map internal enums to localized human language. `VERIFIED_SOURCE` becomes “موثّق بمصدر” / “Verified source”.
- Empty/loading/error states: explain what happened, what remains safe, and the next action.

## Motion

- Micro interaction: 160–200ms; page/overlay: 220–320ms; easing `cubic-bezier(.22,1,.36,1)`.
- Animate opacity and transform. Never animate layout size for decorative effects.
- Respect `prefers-reduced-motion`; no autoplay decorative bounce or pulse.

## Responsive and accessibility contract

- Verify 375, 768, 1024, and 1440px in light and dark modes.
- No horizontal overflow, clipped Arabic diacritics, overlapping headings, or content under sticky navigation.
- WCAG AA contrast, visible `:focus-visible`, semantic headings, accessible names, live status/error regions.
- Language and direction are set on the document. Bidirectional IDs and references use `<bdi>`.
- Mobile navigation and controls remain reachable above safe-area insets.

## Forbidden patterns

- Generic AI glassmorphism everywhere, purple glow, floating orbs, fake dashboards, emoji icons.
- Raw database enums, snake_case labels, unexplained acronyms, or provider/model names in user-facing AI output.
- Arabic with negative tracking, uppercase transformation, or English line-height.
- Click targets below 44px, visible product type below 12px, or hover effects that shift surrounding layout.
- Placeholder numbers, claims of accreditation, or “verified” without a source/version/location contract.

## Pre-delivery checklist

- [ ] Arabic display lines do not overlap at 375/768/1024/1440px.
- [ ] All internal states are localized and human-readable.
- [ ] Lucide icons are consistent and all controls are at least 44px.
- [ ] Keyboard, reduced-motion, dark-mode, loading, empty, and error states are verified.
- [ ] No horizontal scrolling or content hidden behind navigation/mobile dock.
- [ ] Build, lint, tests, security checks, and production browser smoke pass.
