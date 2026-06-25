# Two-Tap-Game

Two-Tap-Game is a no-build browser rhythm game for training independent left- and right-hand tapping. Players follow a metronome, read paired 4/4 measure cards, tap assigned keys on note onsets, and get per-hand timing feedback.

## Features

- Paired left-hand and right-hand 4/4 measure cards, with one measure per row.
- Automatic measure progression every four metronome beats.
- Onset-based scoring for every active-hand note or rest event.
- Web Audio metronome with adjustable volume, mute, beat pulse, and countdown.
- Practice mode with live timing deltas, plus scored mode that hides deltas until results.
- One-hand and two-hand gameplay. In one-hand mode, the inactive hand is shown as a placeholder and is not scored.
- Beginner, intermediate, and advanced rhythm pools with notes, rests, dotted notes, triplets, and grouped rhythms.
- Configurable tempo, measure count, hand selection, key bindings, mode, theme, and compact cards.
- Per-hand result summaries, combined accuracy, rating counts, max streak, and recent session history.
- Guarded `localStorage` persistence for settings, theme, and up to 10 completed sessions.

## Run Locally

This project is plain HTML, CSS, and JavaScript. There is no package manager, framework, build step, backend, or test runner.

Open `index.html` directly in a browser, or serve the folder locally:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173/index.html
```

## How To Play

1. Choose tempo, difficulty, hand count, measure count, and mode.
2. Use the default keys `A` for left hand and `L` for right hand, or select a key button and press a new input.
3. In one-hand mode, choose whether to practice the left or right hand.
4. Press Start and wait for the four-beat countdown.
5. Read each active hand's measure card from left to right.
6. Tap the active hand key at every note onset.
7. Do not tap on rest onsets.
8. Use Pause, Resume, Restart, or Play Again as needed.
9. Review per-hand results and recent session history after a completed run.

## Scoring

Each measure is fixed 4/4 and lasts four metronome beats. Sustained note values are displayed as reading prompts, but scoring is based only on event onsets.

Timing is scored independently for every active hand and every onset inside a measure:

- Perfect: within 40 ms.
- Good: within 90 ms.
- Early: 91-150 ms before the beat.
- Late: 91-150 ms after the beat.
- Miss: no tap on a note, tap outside the scoring window, or tap on a rest.

Rest events expect silence. Tapping a rest is scored as Miss; correctly leaving a rest untapped is scored as Perfect.

## Project Structure

```text
.
|-- index.html      # App shell and controls
|-- styles.css      # Responsive UI, themes, badges, accessibility states
`-- src/
    `-- main.js     # Rhythm generation, timing, scoring, input, storage
```

## Validation

Check the JavaScript syntax:

```powershell
node --check src/main.js
```

Run a local server:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then smoke test `http://127.0.0.1:4173/index.html`:

- Start, countdown, pause/resume, restart, and play again.
- One-hand and two-hand modes.
- Measure advancement and progress display.
- Key taps, key remapping, inactive-hand behavior, and rest behavior.
- Practice and scored result displays.
- Theme switching, compact cards, audio settings, settings persistence, and history clearing.

## Notes

- No backend, account system, build pipeline, or external dependencies are required.
- Settings and recent sessions are stored with `localStorage` when available.
- Sustained note values are visual reading prompts; scoring measures onset timing only.
