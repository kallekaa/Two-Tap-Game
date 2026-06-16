(function () {
  "use strict";

  const STORAGE_KEYS = {
    settings: "twoTap.settings",
    theme: "twoTap.theme",
    history: "twoTap.history"
  };

  const DEFAULT_SETTINGS = {
    bpm: 80,
    difficulty: "beginner",
    sequenceLength: 16,
    mode: "practice",
    leftKey: "a",
    rightKey: "l",
    theme: "system",
    metronomeVolume: 0.65,
    metronomeMuted: false,
    compactMode: false
  };

  const TIMING = {
    perfectMs: 40,
    goodMs: 90,
    windowMs: 150
  };

  const SCORE_WEIGHTS = {
    Perfect: 1,
    Good: 0.75,
    Early: 0.45,
    Late: 0.45,
    Miss: 0
  };

  const RATING_ORDER = ["Perfect", "Good", "Early", "Late", "Miss"];
  const HANDS = ["left", "right"];

  const RHYTHMS = {
    beginner: [
      rhythm("quarter-note", "♩", "Quarter note", "tap", "Single beat", 7),
      rhythm("quarter-rest", "𝄽", "Quarter rest", "rest", "Silent beat", 3),
      rhythm("half-note", "𝅗𝅥", "Half note", "tap", "Long value", 3),
      rhythm("half-rest", "𝄼", "Half rest", "rest", "Long silence", 2)
    ],
    intermediate: [
      rhythm("quarter-note", "♩", "Quarter note", "tap", "Single beat", 6),
      rhythm("quarter-rest", "𝄽", "Quarter rest", "rest", "Silent beat", 3),
      rhythm("half-note", "𝅗𝅥", "Half note", "tap", "Long value", 2),
      rhythm("half-rest", "𝄼", "Half rest", "rest", "Long silence", 2),
      rhythm("eighth-pair", "♫", "Eighth pair", "tap", "Subdivision group", 4),
      rhythm("eighth-rest", "𝄾", "Eighth rest", "rest", "Short silence", 2),
      rhythm("dotted-quarter", "♩.", "Dotted quarter", "tap", "Dotted value", 3),
      rhythm("dotted-half", "𝅗𝅥.", "Dotted half", "tap", "Dotted long value", 2)
    ],
    advanced: [
      rhythm("quarter-note", "♩", "Quarter note", "tap", "Single beat", 5),
      rhythm("quarter-rest", "𝄽", "Quarter rest", "rest", "Silent beat", 3),
      rhythm("half-note", "𝅗𝅥", "Half note", "tap", "Long value", 2),
      rhythm("half-rest", "𝄼", "Half rest", "rest", "Long silence", 2),
      rhythm("eighth-pair", "♫", "Eighth pair", "tap", "Subdivision group", 4),
      rhythm("eighth-rest", "𝄾", "Eighth rest", "rest", "Short silence", 2),
      rhythm("dotted-quarter", "♩.", "Dotted quarter", "tap", "Dotted value", 3),
      rhythm("dotted-half", "𝅗𝅥.", "Dotted half", "tap", "Dotted long value", 2),
      rhythm("whole-note", "𝅝", "Whole note", "tap", "Full measure value", 2),
      rhythm("whole-rest", "𝄻", "Whole rest", "rest", "Full measure silence", 2),
      rhythm("triplet", "3: ♪♪♪", "Triplet", "tap", "Three-note group", 4),
      rhythm("mixed-eighths", "♪ ♩ ♪", "Mixed rhythm group", "tap", "Mixed group", 3),
      rhythm("triplet-rest", "3: ♪𝄾♪", "Triplet with rest", "tap", "Interrupted group", 2)
    ]
  };

  const state = {
    settings: { ...DEFAULT_SETTINGS },
    rows: [],
    status: "idle",
    currentIndex: -1,
    countdownValue: 0,
    timers: new Set(),
    keyCaptureHand: null,
    audioContext: null,
    masterGain: null,
    pauseStartedAt: null,
    lastSummary: null
  };

  const el = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    state.settings = loadSettings();
    sanitizeSettings(state.settings);
    applyTheme(state.settings.theme);
    applySettingsToControls();
    bindEvents();
    renderAll();
  }

  function cacheElements() {
    Object.assign(el, {
      themeSelect: document.getElementById("themeSelect"),
      sessionStatus: document.getElementById("sessionStatus"),
      bpmReadout: document.getElementById("bpmReadout"),
      bpmRange: document.getElementById("bpmRange"),
      bpmNumber: document.getElementById("bpmNumber"),
      difficultyInputs: Array.from(document.querySelectorAll("input[name='difficulty']")),
      sequenceLength: document.getElementById("sequenceLength"),
      modeSelect: document.getElementById("modeSelect"),
      leftKeyButton: document.getElementById("leftKeyButton"),
      rightKeyButton: document.getElementById("rightKeyButton"),
      keyRemapHelp: document.getElementById("keyRemapHelp"),
      volumeRange: document.getElementById("volumeRange"),
      volumeReadout: document.getElementById("volumeReadout"),
      muteToggle: document.getElementById("muteToggle"),
      compactToggle: document.getElementById("compactToggle"),
      startButton: document.getElementById("startButton"),
      pauseButton: document.getElementById("pauseButton"),
      restartButton: document.getElementById("restartButton"),
      leftKeyHint: document.getElementById("leftKeyHint"),
      rightKeyHint: document.getElementById("rightKeyHint"),
      clearHistoryButton: document.getElementById("clearHistoryButton"),
      historyList: document.getElementById("historyList"),
      playSubhead: document.getElementById("playSubhead"),
      beatPulse: document.getElementById("beatPulse"),
      beatCounter: document.getElementById("beatCounter"),
      progressBar: document.getElementById("progressBar"),
      countdownOverlay: document.getElementById("countdownOverlay"),
      rhythmLane: document.getElementById("rhythmLane"),
      resultsPanel: document.getElementById("resultsPanel"),
      playAgainButton: document.getElementById("playAgainButton"),
      scoreSummary: document.getElementById("scoreSummary"),
      ratingBreakdown: document.getElementById("ratingBreakdown")
    });
  }

  function bindEvents() {
    el.themeSelect.addEventListener("change", () => {
      state.settings.theme = el.themeSelect.value;
      applyTheme(state.settings.theme);
      saveSettings();
    });

    el.bpmRange.addEventListener("input", () => updateBpm(el.bpmRange.value));
    el.bpmNumber.addEventListener("input", () => updateBpm(el.bpmNumber.value));
    el.bpmNumber.addEventListener("blur", () => updateBpm(el.bpmNumber.value, true));

    el.difficultyInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) {
          state.settings.difficulty = input.value;
          saveSettings();
        }
      });
    });

    el.sequenceLength.addEventListener("change", () => {
      state.settings.sequenceLength = Number(el.sequenceLength.value);
      saveSettings();
    });

    el.modeSelect.addEventListener("change", () => {
      state.settings.mode = el.modeSelect.value;
      saveSettings();
      renderLane();
    });

    el.volumeRange.addEventListener("input", () => {
      state.settings.metronomeVolume = Number(el.volumeRange.value);
      saveSettings();
      updateVolumeReadout();
      updateAudioVolume();
    });

    el.muteToggle.addEventListener("change", () => {
      state.settings.metronomeMuted = el.muteToggle.checked;
      saveSettings();
      updateAudioVolume();
    });

    el.compactToggle.addEventListener("change", () => {
      state.settings.compactMode = el.compactToggle.checked;
      document.body.classList.toggle("compact-mode", state.settings.compactMode);
      saveSettings();
    });

    el.leftKeyButton.addEventListener("click", () => beginKeyCapture("left"));
    el.rightKeyButton.addEventListener("click", () => beginKeyCapture("right"));
    el.startButton.addEventListener("click", startNewSession);
    el.pauseButton.addEventListener("click", togglePause);
    el.restartButton.addEventListener("click", restartCurrentSequence);
    el.playAgainButton.addEventListener("click", startNewSession);
    el.clearHistoryButton.addEventListener("click", clearHistory);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeunload", clearTimers);
  }

  function rhythm(id, symbol, label, type, category, weight) {
    return { id, symbol, label, type, category, weight };
  }

  function updateBpm(value, forceClamp) {
    const parsed = Number(value);
    const bpm = forceClamp || Number.isFinite(parsed) ? clamp(parsed || DEFAULT_SETTINGS.bpm, 40, 180) : parsed;

    if (!Number.isFinite(bpm)) {
      return;
    }

    state.settings.bpm = Math.round(bpm);
    el.bpmRange.value = String(state.settings.bpm);
    el.bpmNumber.value = String(state.settings.bpm);
    el.bpmReadout.textContent = String(state.settings.bpm);
    saveSettings();
  }

  function startNewSession() {
    readControlsToSettings();
    saveSettings();
    clearTimers();
    state.rows = generateSequence(state.settings.sequenceLength, state.settings.difficulty);
    resetRowsForRun();
    state.lastSummary = null;
    el.resultsPanel.hidden = true;
    startCountdown();
  }

  function restartCurrentSequence() {
    readControlsToSettings();
    saveSettings();
    clearTimers();

    if (!state.rows.length) {
      state.rows = generateSequence(state.settings.sequenceLength, state.settings.difficulty);
    }

    resetRowsForRun();
    state.lastSummary = null;
    el.resultsPanel.hidden = true;
    startCountdown();
  }

  function resetRowsForRun() {
    state.currentIndex = -1;
    state.pauseStartedAt = null;
    state.rows = state.rows.map((row) => ({
      ...row,
      beatTime: null,
      taps: { left: null, right: null },
      extraTaps: { left: 0, right: 0 },
      results: { left: null, right: null }
    }));
  }

  async function startCountdown() {
    state.status = "countdown";
    state.countdownValue = 4;
    await ensureAudio();
    renderAll();
    showCountdown();
    playClick(true);
    scheduleCountdownTick();
  }

  function scheduleCountdownTick() {
    setManagedTimeout(() => {
      state.countdownValue -= 1;

      if (state.countdownValue > 0) {
        showCountdown();
        playClick(false);
        scheduleCountdownTick();
        return;
      }

      el.countdownOverlay.hidden = true;
      beginRun();
    }, beatIntervalMs());
  }

  function showCountdown() {
    el.countdownOverlay.textContent = String(state.countdownValue);
    el.countdownOverlay.hidden = false;
    pulseBeat();
  }

  function beginRun() {
    const firstBeat = performance.now();
    const interval = beatIntervalMs();

    state.rows.forEach((row, index) => {
      row.beatTime = firstBeat + index * interval;
    });

    state.status = "running";
    state.currentIndex = -1;
    renderAll();
    activateRow(0);
  }

  function activateRow(index) {
    if (state.status !== "running") {
      return;
    }

    finalizeDueRows(performance.now());

    if (index >= state.rows.length) {
      finishGame();
      return;
    }

    state.currentIndex = index;
    playClick(index % 4 === 0);
    pulseBeat();
    renderAll();
    scrollActiveRowIntoView();

    const row = state.rows[index];
    setManagedTimeout(() => {
      finalizeRow(index);
      renderAll();
    }, row.beatTime + TIMING.windowMs + 8 - performance.now());

    if (index < state.rows.length - 1) {
      const nextTime = state.rows[index + 1].beatTime;
      setManagedTimeout(() => activateRow(index + 1), nextTime - performance.now());
    } else {
      setManagedTimeout(() => finishGame(), row.beatTime + TIMING.windowMs + 70 - performance.now());
    }
  }

  function togglePause() {
    if (state.status === "running") {
      pauseGame();
      return;
    }

    if (state.status === "paused") {
      resumeGame();
    }
  }

  function pauseGame() {
    state.status = "paused";
    state.pauseStartedAt = performance.now();
    clearTimers();

    if (state.audioContext && state.audioContext.state === "running") {
      state.audioContext.suspend().catch(() => {});
    }

    renderAll();
  }

  async function resumeGame() {
    if (state.status !== "paused") {
      return;
    }

    const pausedFor = performance.now() - state.pauseStartedAt;
    state.rows.forEach((row, index) => {
      if (row.beatTime !== null && index >= state.currentIndex) {
        row.beatTime += pausedFor;
      }
    });

    state.status = "running";
    state.pauseStartedAt = null;
    await ensureAudio();
    renderAll();
    scheduleAfterResume();
  }

  function scheduleAfterResume() {
    const now = performance.now();
    const current = state.rows[state.currentIndex];

    if (current && current.beatTime + TIMING.windowMs > now) {
      setManagedTimeout(() => {
        finalizeRow(state.currentIndex);
        renderAll();
      }, current.beatTime + TIMING.windowMs + 8 - now);
    } else {
      finalizeDueRows(now);
    }

    const nextIndex = state.rows.findIndex((row, index) => index > state.currentIndex && row.beatTime > now);

    if (nextIndex >= 0) {
      setManagedTimeout(() => activateRow(nextIndex), state.rows[nextIndex].beatTime - now);
    } else if (current) {
      setManagedTimeout(() => finishGame(), current.beatTime + TIMING.windowMs + 70 - now);
    }
  }

  function handleKeyDown(event) {
    const key = normalizeKey(event);

    if (state.keyCaptureHand) {
      event.preventDefault();
      completeKeyCapture(key);
      return;
    }

    if (event.repeat || !key || state.status !== "running") {
      return;
    }

    if (key === state.settings.leftKey) {
      event.preventDefault();
      recordTap("left");
      return;
    }

    if (key === state.settings.rightKey) {
      event.preventDefault();
      recordTap("right");
    }
  }

  function beginKeyCapture(hand) {
    if (state.status === "running" || state.status === "countdown" || state.status === "paused") {
      return;
    }

    state.keyCaptureHand = hand;
    el.leftKeyButton.classList.toggle("is-listening", hand === "left");
    el.rightKeyButton.classList.toggle("is-listening", hand === "right");
    el.keyRemapHelp.textContent = `Press a key for the ${hand} hand. Escape cancels.`;
  }

  function completeKeyCapture(key) {
    if (key === "Escape") {
      endKeyCapture("Key change canceled.");
      return;
    }

    if (!key || isModifierKey(key)) {
      el.keyRemapHelp.textContent = "Choose a letter, number, space, enter, or arrow key.";
      return;
    }

    const hand = state.keyCaptureHand;
    const otherHand = hand === "left" ? "right" : "left";
    const otherKey = state.settings[`${otherHand}Key`];

    if (key === otherKey) {
      el.keyRemapHelp.textContent = `${displayKey(key)} is already assigned to the ${otherHand} hand.`;
      return;
    }

    state.settings[`${hand}Key`] = key;
    saveSettings();
    applySettingsToControls();
    endKeyCapture(`${capitalize(hand)} hand set to ${displayKey(key)}.`);
  }

  function endKeyCapture(message) {
    state.keyCaptureHand = null;
    el.leftKeyButton.classList.remove("is-listening");
    el.rightKeyButton.classList.remove("is-listening");
    el.keyRemapHelp.textContent = message || "Select a key, then press the new input.";
  }

  function recordTap(hand) {
    const now = performance.now();
    const candidate = findTapCandidate(hand, now);

    if (!candidate) {
      showTapWarning(hand);
      return;
    }

    const { row, deltaMs } = candidate;

    if (row.results[hand]) {
      row.extraTaps[hand] += 1;
      renderAll();
      return;
    }

    row.taps[hand] = {
      at: now,
      deltaMs
    };
    row.results[hand] = scoreTap(row[hand], deltaMs);
    renderAll();
  }

  function findTapCandidate(hand, now) {
    const possibleIndexes = [state.currentIndex, state.currentIndex + 1];
    let best = null;

    possibleIndexes.forEach((index) => {
      const row = state.rows[index];

      if (!row || row.beatTime === null || row.results[hand]) {
        return;
      }

      const deltaMs = now - row.beatTime;

      if (Math.abs(deltaMs) > TIMING.windowMs) {
        return;
      }

      if (!best || Math.abs(deltaMs) < Math.abs(best.deltaMs)) {
        best = { row, index, deltaMs };
      }
    });

    return best;
  }

  function showTapWarning(hand) {
    if (state.settings.mode !== "practice") {
      return;
    }

    const row = state.rows[state.currentIndex];
    if (!row) {
      return;
    }

    row.extraTaps[hand] += 1;
    renderAll();
  }

  function scoreTap(card, deltaMs) {
    if (card.type === "rest") {
      return {
        rating: "Miss",
        deltaMs,
        expectedTap: false,
        actualTap: true
      };
    }

    const absDelta = Math.abs(deltaMs);
    let rating = "Miss";

    if (absDelta <= TIMING.perfectMs) {
      rating = "Perfect";
    } else if (absDelta <= TIMING.goodMs) {
      rating = "Good";
    } else if (absDelta <= TIMING.windowMs) {
      rating = deltaMs < 0 ? "Early" : "Late";
    }

    return {
      rating,
      deltaMs,
      expectedTap: true,
      actualTap: true
    };
  }

  function finalizeDueRows(now) {
    state.rows.forEach((row, index) => {
      if (row.beatTime !== null && index <= state.currentIndex && row.beatTime + TIMING.windowMs <= now) {
        finalizeRow(index);
      }
    });
  }

  function finalizeRow(index) {
    const row = state.rows[index];

    if (!row) {
      return;
    }

    HANDS.forEach((hand) => {
      if (row.results[hand]) {
        return;
      }

      const card = row[hand];
      row.results[hand] = card.type === "rest"
        ? {
            rating: "Perfect",
            deltaMs: null,
            expectedTap: false,
            actualTap: false
          }
        : {
            rating: "Miss",
            deltaMs: null,
            expectedTap: true,
            actualTap: false
          };
    });
  }

  function finishGame() {
    if (state.status === "finished") {
      return;
    }

    clearTimers();
    state.rows.forEach((_, index) => finalizeRow(index));
    state.status = "finished";
    state.currentIndex = state.rows.length;
    state.lastSummary = buildSessionSummary();
    saveHistoryItem(state.lastSummary);
    renderAll();
  }

  function generateSequence(length, difficulty) {
    const pool = RHYTHMS[difficulty] || RHYTHMS.beginner;

    return Array.from({ length }, (_, index) => ({
      index,
      left: cloneRhythm(weightedPick(pool), index, "left"),
      right: cloneRhythm(weightedPick(pool), index, "right"),
      beatTime: null,
      taps: { left: null, right: null },
      extraTaps: { left: 0, right: 0 },
      results: { left: null, right: null }
    }));
  }

  function cloneRhythm(card, index, hand) {
    return {
      id: `${card.id}-${hand}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      symbol: card.symbol,
      label: card.label,
      type: card.type,
      category: card.category,
      difficulty: state.settings.difficulty
    };
  }

  function weightedPick(items) {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let cursor = Math.random() * total;

    for (const item of items) {
      cursor -= item.weight;
      if (cursor <= 0) {
        return item;
      }
    }

    return items[items.length - 1];
  }

  function buildSessionSummary() {
    const leftResults = state.rows.map((row) => row.results.left);
    const rightResults = state.rows.map((row) => row.results.right);
    const allResults = state.rows.flatMap((row) => [row.results.left, row.results.right]);
    const counts = countRatings(allResults);

    return {
      completedAt: new Date().toISOString(),
      bpm: state.settings.bpm,
      difficulty: state.settings.difficulty,
      sequenceLength: state.settings.sequenceLength,
      mode: state.settings.mode,
      leftAccuracy: calculateAccuracy(leftResults),
      rightAccuracy: calculateAccuracy(rightResults),
      combinedAccuracy: calculateAccuracy(allResults),
      maxStreak: calculateMaxStreak(allResults),
      counts
    };
  }

  function calculateAccuracy(results) {
    if (!results.length) {
      return 0;
    }

    const earned = results.reduce((sum, result) => sum + SCORE_WEIGHTS[result.rating], 0);
    return Math.round((earned / results.length) * 100);
  }

  function countRatings(results) {
    return RATING_ORDER.reduce((counts, rating) => {
      counts[rating] = results.filter((result) => result.rating === rating).length;
      return counts;
    }, {});
  }

  function calculateMaxStreak(results) {
    let current = 0;
    let best = 0;

    results.forEach((result) => {
      if (result.rating === "Perfect" || result.rating === "Good") {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    });

    return best;
  }

  function renderAll() {
    renderStatus();
    renderControls();
    renderKeys();
    renderLane();
    renderProgress();
    renderResults();
    renderHistory();
    updateVolumeReadout();
    document.body.classList.toggle("compact-mode", state.settings.compactMode);
  }

  function renderStatus() {
    const total = state.rows.length;
    const current = Math.min(Math.max(state.currentIndex + 1, 0), total);

    if (state.status === "idle") {
      el.sessionStatus.textContent = "Ready";
      el.playSubhead.textContent = "Configure a session, then start the metronome.";
    } else if (state.status === "countdown") {
      el.sessionStatus.textContent = "Counting in";
      el.playSubhead.textContent = "Get ready for the first beat.";
    } else if (state.status === "running") {
      el.sessionStatus.textContent = `Playing row ${current} of ${total}`;
      el.playSubhead.textContent = state.settings.mode === "practice"
        ? "Practice mode shows timing deltas as you play."
        : "Scored mode hides timing deltas until the end.";
    } else if (state.status === "paused") {
      el.sessionStatus.textContent = `Paused at row ${current} of ${total}`;
      el.playSubhead.textContent = "Resume to continue from the same timing position.";
    } else {
      el.sessionStatus.textContent = "Finished";
      el.playSubhead.textContent = "Review the per-hand scores and recent session history.";
    }
  }

  function renderControls() {
    const locked = state.status === "countdown" || state.status === "running" || state.status === "paused";
    const hasRows = state.rows.length > 0;

    el.startButton.disabled = locked;
    el.pauseButton.disabled = !(state.status === "running" || state.status === "paused");
    el.pauseButton.textContent = state.status === "paused" ? "Resume" : "Pause";
    el.restartButton.disabled = !hasRows || state.status === "idle";

    [
      el.bpmRange,
      el.bpmNumber,
      ...el.difficultyInputs,
      el.sequenceLength,
      el.modeSelect,
      el.leftKeyButton,
      el.rightKeyButton
    ].forEach((control) => {
      control.disabled = locked;
    });
  }

  function renderKeys() {
    const left = displayKey(state.settings.leftKey);
    const right = displayKey(state.settings.rightKey);

    el.leftKeyButton.querySelector("strong").textContent = left;
    el.rightKeyButton.querySelector("strong").textContent = right;
    el.leftKeyHint.textContent = left;
    el.rightKeyHint.textContent = right;
  }

  function renderLane() {
    if (!state.rows.length) {
      el.rhythmLane.innerHTML = `<p class="empty-state">No rhythm sequence yet. Start a session to generate paired cards.</p>`;
      return;
    }

    el.rhythmLane.innerHTML = state.rows.map((row, index) => {
      const active = state.status === "running" && index === state.currentIndex;
      const complete = row.results.left && row.results.right;
      return `
        <article class="rhythm-row${active ? " is-active" : ""}${complete ? " is-complete" : ""}" data-row="${index + 1}">
          ${renderCard(row, "left")}
          ${renderCard(row, "right")}
        </article>
      `;
    }).join("");
  }

  function renderCard(row, hand) {
    const card = row[hand];
    const result = row.results[hand];
    const extraCount = row.extraTaps[hand];
    const badge = result ? renderResultBadge(result) : `<span class="badge">Waiting</span>`;
    const delta = state.settings.mode === "practice" && result && result.deltaMs !== null
      ? `<span class="delta">${formatDelta(result.deltaMs)}</span>`
      : "";
    const extra = state.settings.mode === "practice" && extraCount > 0
      ? `<span class="delta">${extraCount} extra tap${extraCount === 1 ? "" : "s"}</span>`
      : "";

    return `
      <div class="note-card ${card.type === "rest" ? "rest-card" : "tap-card"}">
        <div class="note-symbol" aria-hidden="true">${escapeHtml(card.symbol)}</div>
        <div class="note-content">
          <div class="note-label">${escapeHtml(card.label)}</div>
          <div class="note-category">${escapeHtml(card.category)} · ${hand === "left" ? "Left" : "Right"} hand</div>
          <div class="result-line">${badge}${delta}${extra}</div>
        </div>
      </div>
    `;
  }

  function renderResultBadge(result) {
    return `<span class="badge ${result.rating.toLowerCase()}">${result.rating}</span>`;
  }

  function renderProgress() {
    const total = state.rows.length;
    const current = total ? Math.min(Math.max(state.currentIndex + 1, 0), total) : 0;
    const percent = total ? Math.round((current / total) * 100) : 0;

    el.beatCounter.textContent = `${current} / ${total}`;
    el.progressBar.style.width = `${percent}%`;
  }

  function renderResults() {
    if (state.status !== "finished" || !state.lastSummary) {
      return;
    }

    const summary = state.lastSummary;
    el.resultsPanel.hidden = false;
    el.scoreSummary.innerHTML = `
      <div class="score-tile"><span>Left</span><strong>${summary.leftAccuracy}%</strong></div>
      <div class="score-tile"><span>Right</span><strong>${summary.rightAccuracy}%</strong></div>
      <div class="score-tile"><span>Combined</span><strong>${summary.combinedAccuracy}%</strong></div>
      <div class="score-tile"><span>Max streak</span><strong>${summary.maxStreak}</strong></div>
    `;
    el.ratingBreakdown.innerHTML = RATING_ORDER.map((rating) => `
      <div class="rating-tile">
        <strong>${summary.counts[rating]}</strong>
        <span>${rating}</span>
      </div>
    `).join("");
  }

  function renderHistory() {
    const history = loadHistory();

    if (!history.length) {
      el.historyList.innerHTML = `<li class="empty-state">Completed sessions will appear here.</li>`;
      return;
    }

    el.historyList.innerHTML = history.map((item) => {
      const completedAt = new Date(item.completedAt);
      return `
        <li>
          <strong>${item.combinedAccuracy}% combined</strong>
          <div class="history-meta">
            <span>L ${item.leftAccuracy}%</span>
            <span>R ${item.rightAccuracy}%</span>
            <span>${item.bpm} BPM</span>
            <span>${capitalize(item.difficulty)}</span>
            <span>${completedAt.toLocaleDateString()} ${completedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </li>
      `;
    }).join("");
  }

  function scrollActiveRowIntoView() {
    window.requestAnimationFrame(() => {
      const active = el.rhythmLane.querySelector(".rhythm-row.is-active");
      if (active) {
        active.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  function pulseBeat() {
    el.beatPulse.classList.add("is-on");
    window.setTimeout(() => {
      el.beatPulse.classList.remove("is-on");
    }, 130);
  }

  async function ensureAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    if (!state.audioContext) {
      state.audioContext = new AudioContext();
      state.masterGain = state.audioContext.createGain();
      state.masterGain.connect(state.audioContext.destination);
      updateAudioVolume();
    }

    if (state.audioContext.state === "suspended") {
      await state.audioContext.resume().catch(() => {});
    }
  }

  function updateAudioVolume() {
    if (!state.masterGain) {
      return;
    }

    state.masterGain.gain.value = state.settings.metronomeMuted ? 0 : state.settings.metronomeVolume;
  }

  function playClick(accent) {
    if (!state.audioContext || !state.masterGain) {
      return;
    }

    const now = state.audioContext.currentTime;
    const oscillator = state.audioContext.createOscillator();
    const envelope = state.audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(accent ? 1046.5 : 784, now);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(0.75, now + 0.005);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    oscillator.connect(envelope);
    envelope.connect(state.masterGain);
    oscillator.start(now);
    oscillator.stop(now + 0.065);
  }

  function setManagedTimeout(callback, delayMs) {
    const timeout = window.setTimeout(() => {
      state.timers.delete(timeout);
      callback();
    }, Math.max(0, delayMs));

    state.timers.add(timeout);
    return timeout;
  }

  function clearTimers() {
    state.timers.forEach((timeout) => window.clearTimeout(timeout));
    state.timers.clear();
  }

  function beatIntervalMs() {
    return 60000 / state.settings.bpm;
  }

  function readControlsToSettings() {
    state.settings.bpm = clamp(Number(el.bpmNumber.value) || DEFAULT_SETTINGS.bpm, 40, 180);
    state.settings.difficulty = el.difficultyInputs.find((input) => input.checked)?.value || DEFAULT_SETTINGS.difficulty;
    state.settings.sequenceLength = Number(el.sequenceLength.value) || DEFAULT_SETTINGS.sequenceLength;
    state.settings.mode = el.modeSelect.value;
    state.settings.theme = el.themeSelect.value;
    state.settings.metronomeVolume = Number(el.volumeRange.value);
    state.settings.metronomeMuted = el.muteToggle.checked;
    state.settings.compactMode = el.compactToggle.checked;
    applySettingsToControls();
  }

  function applySettingsToControls() {
    el.themeSelect.value = state.settings.theme;
    el.bpmRange.value = String(state.settings.bpm);
    el.bpmNumber.value = String(state.settings.bpm);
    el.bpmReadout.textContent = String(state.settings.bpm);
    el.difficultyInputs.forEach((input) => {
      input.checked = input.value === state.settings.difficulty;
    });
    el.sequenceLength.value = String(state.settings.sequenceLength);
    el.modeSelect.value = state.settings.mode;
    el.volumeRange.value = String(state.settings.metronomeVolume);
    el.muteToggle.checked = state.settings.metronomeMuted;
    el.compactToggle.checked = state.settings.compactMode;
    updateVolumeReadout();
    renderKeys();
  }

  function updateVolumeReadout() {
    el.volumeReadout.textContent = `${Math.round(state.settings.metronomeVolume * 100)}%`;
  }

  function loadSettings() {
    const savedSettings = parseJson(storageGet(STORAGE_KEYS.settings), {});
    const savedTheme = storageGet(STORAGE_KEYS.theme);
    return {
      ...DEFAULT_SETTINGS,
      ...savedSettings,
      theme: savedTheme || savedSettings.theme || DEFAULT_SETTINGS.theme
    };
  }

  function saveSettings() {
    sanitizeSettings(state.settings);
    storageSet(STORAGE_KEYS.settings, JSON.stringify(state.settings));
    storageSet(STORAGE_KEYS.theme, state.settings.theme);
  }

  function sanitizeSettings(settings) {
    settings.bpm = clamp(Number(settings.bpm) || DEFAULT_SETTINGS.bpm, 40, 180);
    settings.sequenceLength = [8, 16, 32, 64].includes(Number(settings.sequenceLength))
      ? Number(settings.sequenceLength)
      : DEFAULT_SETTINGS.sequenceLength;
    settings.difficulty = RHYTHMS[settings.difficulty] ? settings.difficulty : DEFAULT_SETTINGS.difficulty;
    settings.mode = settings.mode === "scored" ? "scored" : "practice";
    settings.theme = ["system", "light", "dark"].includes(settings.theme) ? settings.theme : DEFAULT_SETTINGS.theme;
    settings.leftKey = settings.leftKey || DEFAULT_SETTINGS.leftKey;
    settings.rightKey = settings.rightKey || DEFAULT_SETTINGS.rightKey;

    if (settings.leftKey === settings.rightKey) {
      settings.leftKey = DEFAULT_SETTINGS.leftKey;
      settings.rightKey = DEFAULT_SETTINGS.rightKey;
    }

    settings.metronomeVolume = clamp(Number(settings.metronomeVolume), 0, 1);
    if (!Number.isFinite(settings.metronomeVolume)) {
      settings.metronomeVolume = DEFAULT_SETTINGS.metronomeVolume;
    }

    settings.metronomeMuted = Boolean(settings.metronomeMuted);
    settings.compactMode = Boolean(settings.compactMode);
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
  }

  function loadHistory() {
    const history = parseJson(storageGet(STORAGE_KEYS.history), []);
    return Array.isArray(history) ? history : [];
  }

  function saveHistoryItem(summary) {
    const history = [summary, ...loadHistory()].slice(0, 10);
    storageSet(STORAGE_KEYS.history, JSON.stringify(history));
  }

  function clearHistory() {
    storageRemove(STORAGE_KEYS.history);
    renderHistory();
  }

  function getStorage() {
    try {
      return window.localStorage || null;
    } catch {
      return null;
    }
  }

  function storageGet(key) {
    const storage = getStorage();
    if (!storage) {
      return null;
    }

    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  function storageSet(key, value) {
    const storage = getStorage();
    if (!storage) {
      return;
    }

    try {
      storage.setItem(key, value);
    } catch {
      // Persistence is optional; the game remains playable without it.
    }
  }

  function storageRemove(key) {
    const storage = getStorage();
    if (!storage) {
      return;
    }

    try {
      storage.removeItem(key);
    } catch {
      // Persistence is optional; the game remains playable without it.
    }
  }

  function normalizeKey(event) {
    if (event.code === "Space") {
      return " ";
    }

    if (event.key.length === 1) {
      return event.key.toLowerCase();
    }

    return event.key;
  }

  function displayKey(key) {
    if (key === " ") {
      return "Space";
    }

    if (key.length === 1) {
      return key.toUpperCase();
    }

    return key.replace("Arrow", "");
  }

  function isModifierKey(key) {
    return ["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"].includes(key);
  }

  function formatDelta(deltaMs) {
    const rounded = Math.round(deltaMs);
    if (rounded === 0) {
      return "0 ms";
    }

    return `${rounded > 0 ? "+" : ""}${rounded} ms`;
  }

  function parseJson(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function capitalize(value) {
    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
