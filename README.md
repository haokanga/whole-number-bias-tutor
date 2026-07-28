# Ocean Adventure: Specter’s Whole-Number Trap · V3

This repository contains the standalone HTML prototype of the approved V3 instructional script. It is a pre-battle sequence for Ocean Adventure’s existing **Contain the Plasma Orbs** mission. It does not require CTAT or a build step.

## Authoritative source

This Git repository is the single editable source for both local experimentation and the public GitHub Pages tutor. Make future V3 changes here; every push to `main` deploys this same source state.

## Public site

Open the tutor at **https://haokanga.github.io/whole-number-bias-tutor/**.

The app runs entirely in the browser. Progress and experiment logs remain in that browser's local storage; the app does not transmit them to a server.

## Open it locally

Double-click `index.html`, or drag it into a current browser. Progress and the experiment log stay in that browser’s local storage.

If a browser restricts local-file storage or downloads, start a temporary local server from this folder:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8765/`.

## V3 sequence

The complete fourteen-scene path is retained:

1. Bellum opens a recovered recording of Specter’s prior encounter with another agent.
2. Inside the clearly labeled archive, the prior agent succeeds on the whole-number comparison `7` versus `52`.
3. Specter immediately reuses that successful method with `0.7` versus `0.52`; the prior agent chooses `0.52`, and containment fails.
4. **MY WHOLE-NUMBER TRAP WORKED!**, **CONTAINMENT FAILED**, an X icon, containment behavior, and the enlarged existing Specter artwork communicate the failure without relying on red alone.
5. Bellum freezes the archived replay and begins the repair. The learner taps both decimal points and aligns `0.7` with `0.52`; the empty hundredths place remains empty.
6. The learner selects `7` tenths and `5` tenths and locks `0.7 > 0.52`. The central repair never rewrites `0.7` as `0.70`.
7. Bellum names the whole-number boundary and activates the SAIL Place-Value Radar.
8. Full radar and SAIL support guide `0.53` versus `0.433` without adding trailing zeros.
9. Alert-only support guides `0.6` versus `0.60`, including the meaning of an empty hundredths place as `0 hundredths`.
10. Bellum intentionally powers down the training support and announces Manual Mode. There is no accidental battery failure or time pressure.
11. Independent Round A removes the number-type badge and requires the proof path `1 = 1`, then `2 > 1`, for `1.2 > 1.109`.
12. Independent Round B keeps that support absent and requires the proof path `4 = 4`, then `7 < 8`, for `0.47 < 0.482`.
13. A final boundary statement preserves the useful positive-whole-number rule while withholding digit count for decimal comparison.
14. The prototype returns to the present-day Ocean Adventure mission and reaches the local handoff boundary before CTAT.

Scene 12 is a counterbalanced transfer check: paired with `0.7` versus `0.52`, it reverses the relationship between displayed length and magnitude and requires the learner to continue beyond equal tenths. Because digit count happens to agree with the correct final answer in Scene 12, the selected place-value path—not correctness alone—is the relevant observable evidence. The prototype does not present “shorter decimal wins” as a diagnosed learner misconception.

## Interaction and accessibility

- Decimal points and place-value digits are real buttons, operable by keyboard, with visible focus.
- No drag-and-drop is required.
- Orb motion pauses while the learner reads and compares values.
- The dramatic reveal is brief and can be left immediately; reduced-motion preferences replace movement with static states.
- Text, icons, shapes, and containment behavior carry status information in addition to color.
- Incorrect proof selections receive place-specific feedback. In Manual Round A, a second error reveals place-value headings while still requiring the learner to select the evidence.

## Researcher controls and local logging

Expand **Researcher controls** below the mission to jump to a scene, export JSON or CSV, or clear all V3 local data. A normal learner run should not use scene jumping.

The log records the initial comparison separately from the subsequent proof path. Important fields include:

- session, scene, item, case type, and scaffold level;
- response part and evidence role;
- initial comparison;
- alignment selections;
- selected proof digits and their relation;
- final comparison lock;
- correctness, per-step attempt, selection/deselection state, and response latency.

These are observable responses in this prototype. A selected answer or proof is not treated as definitive evidence of an internal misconception. Restarting creates a new session while retaining earlier events; **Clear all local data** removes progress and the full local log after confirmation.

## Files and boundaries

- `index.html`: accessible application shell
- `styles.css`: Ocean Adventure presentation, interactions, responsive states, and reduced-motion behavior
- `app.js`: V3 scene sequence, feedback, scaffold fading, local persistence, and exports
- `assets/`: reused Ocean Adventure artwork copied from the downloaded source package

The downloaded package and its CTAT content are not modified. The **Begin Contain the Plasma Orbs** button records that the handoff was reached and explicitly stops where the existing CTAT mission would begin. There are no app-initiated network calls or personal-data prompts.

## Deployment

GitHub Actions publishes the repository root to GitHub Pages after each push to `main`. The workflow can also be run manually from the repository's **Actions** tab.
