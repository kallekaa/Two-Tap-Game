# Two-Tap-Game

A browser-based rhythm game for training independent left- and right-hand tapping. Players follow a metronome and tap two assigned keys against paired rhythm cards, then get timing feedback for each hand.

## Features

- Paired left-hand and right-hand rhythm rows.
- One beat per row with automatic progression.
- Web Audio metronome with visual beat pulse.
- Countdown before each run.
- Practice and scored modes.
- Per-hand ratings: Perfect, Good, Early, Late, Miss.
- Difficulty levels with notes, rests, dotted notes, triplets, and rhythm groups.
- Tempo, sequence length, key binding, volume, mute, and compact-mode settings.
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

1. Choose tempo, difficulty, sequence length, and mode.
2. Use the default keys `A` for left hand and `L` for right hand, or remap them.
3. Press Start and wait for the countdown.
4. Tap each hand's key on the metronome beat when that hand has a note or rhythm group.
5. Do not tap when a hand's card is a rest.
6. Review per-hand and combined results at the end.

## Scoring

Timing is scored independently for each hand:

- Perfect: within 40 ms.
- Good: within 90 ms.
- Early: 91-150 ms before the beat.
- Late: 91-150 ms after the beat.
- Miss: no tap, tap outside the scoring window, or tap on a rest.

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
- Long note values are currently rhythm-reading prompts; v1 scoring measures beat-onset timing only.
