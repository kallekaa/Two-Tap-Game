# Project Context

Two-Tap-Game is a plain HTML/CSS/JavaScript static browser game. There is no build step, package manager, framework, backend, or test runner configured.

## Files

- `index.html`: semantic app layout, controls, rhythm lane, results, and history containers.
- `styles.css`: theme variables, responsive layout, compact mode, accessibility focus states, and score badge styling.
- `src/main.js`: all gameplay logic, including settings, 4-beat measure generation, countdown, Web Audio metronome, pause/resume, keyboard input, per-hand/per-onset scoring, rendering, and localStorage history.

## Implementation Notes

- Keep the app no-build unless the user explicitly asks for a framework or tooling.
- Prefer small, direct changes over introducing abstractions or dependencies.
- Use `localStorage` through the existing guarded storage helpers so the app remains playable when storage is unavailable.
- Preserve independent left/right scoring and the one-measure-per-row timing model.
- Each measure is fixed 4/4 and lasts four metronome beats.
- Score every note/rest onset inside a measure.
- Rest events expect no tap; tapping a rest is a Miss.
- Sustained note values are displayed as reading prompts, but scoring is onset-based only.

## Validation

Useful checks after changes:

```powershell
node --check src/main.js
python -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/index.html` and smoke test start, countdown, measure advancement, key taps, rest behavior, results, theme switching, and settings persistence.
