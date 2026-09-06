---
name: taste
description: digital craftsmanship, premium taste, and frontend production rules (dashboard/product UI, generic across projects)
modeSlugs:
  - architect
  - architect-image
  - code
---

# SKILL: DIGITAL CRAFTSMANSHIP & PREMIUM TASTE (PRODUCT/DASHBOARD EDITION)

## CONTEXT
Activated during frontend structural planning, component creation, and visual styling for **product/dashboard UI** (not marketing landing pages, hero sections, marquees, or scroll-hijacking — those belong to a different class of skill entirely).

> Adapted for product/dashboard UI from the design-taste-frontend skill (Leonxlnx/taste-skill), which is scoped for landing pages/portfolios. Only the universally-applicable rules below were carried over.

## 0. PROJECT DESIGN REFERENCE TAKES PRIORITY (read this first, every project)
This skill file is **generic and shared across projects** — it intentionally contains no project-specific colors, fonts, filenames, or exact pixel values. Every actual project defines its own concrete design reference file(s) and states their exact name/location in that project's `CLAUDE.md` — never assume a filename (it varies per project: could be one file, two separate desktop/mobile files, or something else entirely).

**Before writing any UI code:**
1. Read the project's `CLAUDE.md` to find the exact name/location of its design reference file(s) — this is the ONLY place to look, do not guess a filename first.
2. Read those file(s) and extract the REAL tokens in use: exact hex colors, font, corner-radius values, spacing scale, icon approach (icon-font library vs custom-drawn SVG), and any color-coding logic (e.g. category colors, status escalation rules).
3. Apply the abstract principles below using those extracted real values — never substitute a generic guess (e.g. don't default to "Emerald for success" if the project's reference file actually uses Teal, or Blue, or anything else).
4. If the project's design reference conflicts with anything below, **the project's design reference file wins** — this document is a fallback for gaps it doesn't cover (e.g. a screen/state that isn't mockup'd yet).

If a project has no design reference file at all, fall back fully to the generic rules below.

## 1. Visual Minimalism & "The Invisible UI"
- **Less is Premium:** A premium interface feels light. Maximize whitespace (breathing room) to separate sections instead of using heavy borders or dividing lines.
- **Micro-Borders:** If a border or divider is absolutely necessary, use ultra-subtle values (barely-there tint of the background, not a hard gray line).
- **Shape Consistency Lock (mandatory):** Pick ONE corner-radius system for the whole app and apply it everywhere — extract the actual radius values from the project's design reference (outer containers vs cards vs small badges vs pills typically each get a distinct, proportionally smaller radius). Do not mix systems arbitrarily; nested elements must have proportional radii to prevent visual clipping.

## 2. High-Fidelity Typography & Hierarchy
- **Font Weight Contrast:** Rely heavily on font weights and scale rather than shifting colors to create contrast.
- **Muted Subtexts:** Primary text should be sharp/high-contrast; subtitles and descriptions use a clearly muted shade of the same neutral family. Never use pure black text on soft/tinted backgrounds.
- **Font choice:** For product/dashboard UI, a neutral, highly-legible grotesk (e.g. Inter or similar) is generally the right default — unlike marketing pages, a data tool benefits from being "boring in a good way." Check the project's design reference for the actual font in use; do not reach for display/editorial serif fonts unless the reference explicitly uses one.

## 3. Deliberate Micro-Interactions (The "Feels Good" Factor)
- **Smooth Transitions:** Every hover state, active click, or modal pop-up must have smooth native easing animations (a short, consistent transition duration used app-wide, not ad-hoc per component).
- **Button Aesthetics:** Interactive buttons must feel tactile — subtle depth (shadow/gradient) rather than flat, borderless blocks.
- **Tactile Feedback:** On `:active`, use a small scale-down or slight vertical shift to simulate a physical push.
- **Motion must be motivated, not decorative.** Every animation should serve hierarchy, feedback, or state transition (e.g. a progress bar filling, a saved-confirmation checkmark) — never add animation "because it looks cool." Dashboard/product UI has no landing-page-style choreography (no scroll-hijacking, no marquees).

## 4. Semantic Color Harmonies (project-specific values live in the design reference, not here)
- **Extract, don't assume:** the primary brand accent, any per-category or per-status color system, and the neutral/grayscale foundation must all come from the project's design reference file. Do not default to a generic scheme (e.g. "Emerald = success, Rose = danger") without confirming it against the actual reference — different projects may use Teal, Blue, or any other accent as primary.
- **If the reference shows a multi-stage status color system** (e.g. a warning color before an error color, rather than a simple binary), implement it exactly as escalation stages, not collapsed into "just 2 colors."
- **Color Consistency Lock:** once a color is assigned a meaning in one place (a category, a status, a brand accent), that mapping must be used identically everywhere in the app — tiles, charts, badges, notifications. Don't let the same concept use different colors on different screens.
- **No neon glows, no oversaturated accents** beyond what the project's actual reference shows. Desaturate rather than reaching for default "AI-purple" gradients or bright neon when no reference exists.

## 5. Icon & Component Discipline
- **One icon approach for the whole app** — check the project's design reference for whether it uses an icon-font library (e.g. Lucide, Phosphor, Radix Icons) or custom-drawn SVG paths, and stick to whichever it actually uses. Never mix icon families/approaches in the same component tree.
- **Default (only when the reference doesn't already establish an approach):** prefer an existing icon-font library over hand-rolling new SVG icon paths. If the project's reference already uses custom-drawn SVG icons (some projects deliberately do, e.g. for a bespoke illustrated icon set), follow that instead — extract and reuse the existing paths rather than switching to a font.
- **Standardize `strokeWidth`** globally across all icons.

## 6. Accessibility & Contrast (mandatory, not optional)
- **Button Contrast Check:** Every button's text must be readable against its background — verify WCAG AA (4.5:1 for body text, 3:1 for large text). No white-text-on-white-button, no ghost button with insufficient contrast against its section background.
- **Form Contrast Check:** Inputs, placeholder text, focus rings, helper text, and error text must all pass WCAG AA contrast against their background.

## 7. Dark Mode Protocol
- Design for both light and dark mode from the start whenever the project spec calls for a dark-mode toggle.
- Use the framework's standard dark-mode mechanism (e.g. Tailwind's `dark:` variant) paired with every color utility.
- **No pure black (`#000000`) or pure white (`#ffffff`)** — use an off-black and off-white for depth.
- **Page Theme Lock:** the whole app follows one active theme (light or dark) at a time — no single screen or card flips to the opposite theme mid-session.
- Test every new screen in both modes before considering it done. If the project's design reference only shows one mode, extend the same token logic (grayscale foundation + accent) to the other mode rather than inventing an unrelated dark palette.

## 8. Mobile-First Responsiveness & Layout Mechanics
- Layout execution must follow a strict mobile-first paradigm. Ensure seamless adaptability across breakpoints without layout breaking or unintended horizontal overflows.
- Standardize breakpoints across the app (a small/medium/large/extra-large scale, e.g. Tailwind's default `sm/md/lg/xl`).
- **Viewport stability:** never use a fixed `100vh`/`h-screen` for full-height sections; use the dynamic-viewport-unit equivalent (e.g. `min-h-[100dvh]`) to prevent layout jumping on mobile browser chrome.
- **Grid over flex-math:** never use complex flexbox percentage math for column layouts; use CSS Grid instead.
- **Spacing & Typography Hierarchy:** Spacing must conform to one proportional scale used consistently across parent containers vs. child cards. Maintain adequate visual breathing room.
- **If the project has separate desktop/mobile design references**, cross-check them for the ACTUAL responsive behavior used per section (e.g. a 4-column grid may become a 2-column grid, a different component entirely, or a scroll-list — don't assume any single default without checking) rather than improvising a generic collapse pattern.

## 9. Data Presentation Honesty
- **No fake-precise numbers in placeholder/demo content.** If showing example data during development, don't invent suspiciously round or suspiciously precise figures — use organic, plausible numbers.
- **Empty, loading, and error states are mandatory for every data view** — never ship only the "happy path with data" state. Use skeleton loaders matching the final layout shape rather than generic spinners.