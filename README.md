# Two-Tap-Game

A browser-based rhythm game for training independent left- and right-hand tapping. Players follow a metronome and tap two assigned keys against paired 4-beat measure cards, then get timing feedback for each hand.

## Features

- Paired left-hand and right-hand 4/4 measure cards.
- One measure per row with automatic progression every four beats.
- Every note/rest onset inside a measure is scored.
- Web Audio metronome with visual beat pulse.
- Countdown before each run.
- Practice and scored modes.
- One-hand or two-hand gameplay.
- Per-hand ratings: Perfect, Good, Early, Late, Miss.
- Difficulty levels with complete measure patterns containing notes, rests, dotted notes, triplets, and rhythm groups.
- Tempo, measure count, hand selection, key binding, volume, mute, and compact-mode settings.
- Light, dark, and system theme modes.
- Local settings persistence and recent session history.

## Run Locally

This is a no-build static app. Open `index.html` directly in a browser, or serve the folder locally:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173/index.html
```

## How To Play

1. Choose tempo, difficulty, hand count, measure count, and mode.
2. Use the default keys `A` for left hand and `L` for right hand, or remap them.
3. In one-hand mode, choose whether to practice left or right hand.
4. Press Start and wait for the countdown.
5. Read each active hand's 4-beat measure card from left to right.
6. Tap the active hand key at every note onset in that measure.
7. Do not tap when a card shows a rest onset.
8. Review results at the end.

## Scoring

Timing is scored independently for every active hand and every onset inside a measure:

- Perfect: within 40 ms.
- Good: within 90 ms.
- Early: 91-150 ms before the beat.
- Late: 91-150 ms after the beat.
- Miss: no tap on a note, tap outside the scoring window, or tap on a rest.

Practice mode shows timing deltas during play. Scored mode hides exact timing deltas until the results screen.

## Project Structure

```text
.
|-- index.html      # App shell and controls
|-- styles.css      # Responsive UI, themes, badges, accessibility states
`-- src/
    `-- main.js     # Rhythm generation, timing, scoring, input, storage
```

## Notes

- No backend, account system, build pipeline, or external dependencies are required.
- Settings and recent sessions are stored in `localStorage` when available.
- Sustained note values are visual reading prompts; scoring measures onset timing only.
