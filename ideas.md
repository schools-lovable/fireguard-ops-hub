# FireGuard Operations Hub — Visual System Direction

## Ground-Truth Reference

The supplied finance-operations dashboard is the **authoritative visual reference** for this FireGuard Operations Hub rollout. Its defining characteristics are a full-bleed, warm-white application canvas; a compact horizontal command bar; a narrow icon rail; crisp black typography; fine neutral rules; soft card elevation; generous but controlled whitespace; and one restrained mint-green status accent. The implementation translates that visual grammar into fire-safety operations content without copying the reference's finance labels or inventing decorative complexity.

## Chosen Approach: Quiet Incident Command

### Design Movement

**Soft-utilitarian product design** with editorial restraint. The interface borrows the composure of a premium operations workspace rather than the visual intensity of a control room. Fire-safety information is treated as critical but never alarmist.

### Core Principles

1. **Calm is operational.** High-priority signals use isolated ember red and clear language; everything else recedes into warm neutrals and graphite.
2. **One shell, many workflows.** The top command bar, icon rail, page heading cadence, card surface, and control shape repeat across overview, clients, service, reviews, exceptions, and staffing.
3. **Space clarifies risk.** Cards have roomy internal padding, large data, and breathing room between clusters so users can scan quickly.
4. **Function earns ornament.** Every border, label, status dot, and shadow supports hierarchy or interaction; no faux-system chrome, decorative glow, or dense dashboard filler is used.

### Color Philosophy

The canvas is warm limestone rather than clinical pure gray. White cards create a calm working surface. Graphite anchors navigation and primary actions. **Ember red** is FireGuard's single high-attention signal, used only for active risk, overdue work, and the logo mark. A pale **signal mint** expresses verified and in-control states, echoing the reference's green card without reading as generic "success" decoration.

### Layout Paradigm

A **full-bleed command desk** replaces a centered-page template. A shallow top bar frames global navigation, while a narrow vertical rail establishes location. Each page follows an offset editorial header followed by a responsive, purpose-built work surface: overview cards on an asymmetric grid, queues as clear wide lists, and detail work as split panes. On mobile, the rail becomes a bottom navigation and cards recompose into a single reading column instead of merely shrinking.

### Signature Elements

- A compact, dark **command pill** for the current top-level work area.
- Large white **field cards** with a 20px radius, quiet borders, and a barely perceptible charcoal shadow.
- A **signal tile**—a singular soft mint or ember-red panel used once per screen to make the most important state immediately legible.

### Interaction Philosophy

Interactions are immediate and grounded: controls lift by one pixel on hover and compress slightly on press; navigation selects with a concise fill change; filters and row actions remain discoverable through text or meaningful icons. Destructive or risk-bearing actions are explicitly named and separated from routine actions.

### Animation

Motion is restrained and only appears when it improves orientation. Cards fade and rise 8px in a short 220ms stagger on first page entry; menus and dialogs use opacity plus a 0.97-to-1 scale with a quick custom ease-out; no looping, glowing, or alarm-like animation is permitted. All nonessential motion disables under `prefers-reduced-motion`.

### Typography System

**Manrope** provides the operational sans: calm, compact, and highly legible in tables. **DM Sans** acts as the high-weight display companion for page headings and key values. Headings are near-black with tight tracking; metadata uses a smaller, softer gray but never falls below an accessible size. Large numbers carry visual hierarchy through scale and weight rather than color alone.

### Brand Essence

**FireGuard is the calm operating system for teams responsible for real-world fire readiness.**

Personality: **composed, exacting, protective**.

### Brand Voice

Headlines are direct and outcome-oriented. CTAs describe the next operational step, and microcopy explains current status without generic reassurance.

Examples:

> "Every site ready for inspection."

> "Review the three items needing an owner."

### Wordmark & Logo

The FireGuard mark is a compact geometric shield that holds a cut-out flame and a single protective spark. It sits beside a clean wordmark with a subtle custom split: **Fire** in graphite, **Guard** in ember red. The mark is visible at a useful 32–36px size in the command bar and provides the favicon.

### Signature Brand Color

**Ember Signal — #D94A3A.** It is reserved for alerts, pending review, and the brand mark, making it recognizable without overwhelming the interface.

## Interface Contract

Every application screen must share the same shell, type scale, dark control treatment, card rhythm, status language, and responsive re-composition. When a choice is uncertain, the deciding question is: **Does this make a safety team feel more oriented, not more alerted?**
