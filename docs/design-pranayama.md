# Pranayama design philosophy (locked)

The design north-star for the breath timer / patterns work. Brainstormed and locked 2026-06-02/03,
proven in real practice. This is the document to re-read before changing anything about how the
breath timer sounds or behaves.

## The grid model (core insight)

The pranayama timer is not a slow metronome — it is a **grid**: a uniform, invariant audio tick
the practitioner maps themselves onto. When they slip, the grid is still there; they rejoin at
the next click. There is no "behind." This forgiving fall-off-and-rejoin property IS the
feature's value and must be preserved. Anything that destroys grid uniformity (chimes at
irregular phase boundaries) creates pressure. **The audio grid stays uniform; patterns live on
the screen, not in the chime cadence.**

## The practitioner principles

- **The app is a guide, not a coach.** Chimes are invitations, not deadlines.
- **Fall-off-and-rejoin is sacred.** Never punish falling off the rhythm; often the app
  shouldn't even know it happened.
- **Audio is primary; visual is secondary.** The user practices eyes-closed. Visuals must be
  glance-friendly, never demand reading.
- **The practitioner counting in their head IS the practice.** The app's job is to *coarsen the
  counting granularity* (count 8 chimes at 2s instead of 16 seconds), not to count for them.
  Too much help from the app is not good pranayama.
- Pranayama timing is traditionally embodied/approximate ("trace a circle on your thigh"), not
  chronometric. The app should feel permissive, not metric.

## The aperiodic grid (conceptual keystone)

Jarvis's framing, via Christopher Alexander with a Mondrian wink: the architecture is a
*periodic substrate* (uniform forgiving click grid) with *aperiodic events on top* (e.g.
Viloma's phases don't tile evenly; a long hold drops the chime entirely). The long hold is a
*syncopation — a held note over a steady pulse* — it never "leaves" the grid. Penrose tiling is
the math permission (aperiodic ≠ random); Mondrian's *Broadway Boogie Woogie* is the aesthetic
permission (wholeness via proportion, not repetition). Practical payoff: a visual for a long
hold should be a *composed proportion occupying its space calmly* (a wide Mondrian block), not a
progress bar racing a clock. Decouple visual pace from literal duration. Open question: does
this stay an internal north-star, or become the visible identity (patterns rendered as
proportioned blocks)?

## Two product categories

- **Grid practices** (Viloma, box, ratios like 1:4:2:3 Sukha): uniform audio grid; visual phase
  guidance overlays; forgiving, ambient.
- **Lock-in practices** (4-7-8): chimes AT phase boundaries — the boundary is the practice.
  Deliberately less forgiving; its own category. (This is why 4-7-8's counts are locked in the
  current implementation.)

## Library vision (future)

Curated with progressions, not a flat list or a knob-builder: Box (Standard/Long), Sukha
(Unit 3/4/5), Viloma (Beginner / With Top Hold / Full), 4-7-8, blank slot for custom patterns.
Levels are first-class — Iyengar's "you grow into the count" tradition plus an approachability
lever. Two audiences simultaneously: Denver yoga-studio newcomers (need an invitation) and
advanced Iyengar practitioners (need real capability). The first-open UX does disproportionate
work.

## Sound design decisions

- Each boundary click lives "in its own little time container" (~0.3s slot) — mirrors the
  natural biological pause between breath phases; keeps the grid periodic with breathing room.
- Ambience beds sit a few LU *under* the click (the click is the loudness anchor). Beds are
  short seamless WAV loops (mono, crossfaded) rendered in Sound Lab — see project-state.md.
- Jarvis tunes final loudness by ear in practice (e.g. ocean ~-48 LUFS); the tuning is
  intentional, don't "normalize" it away.
- Candidate enhancement: end-of-cycle softer chime as a milestone marker.
- Out of scope: bandhas, watch integration.
