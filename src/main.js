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
    handMode: "two",
    activeHand: "left",
    sequenceLength: 8,
    mode: "practice",
    leftKey: "a",
    rightKey: "l",
    theme: "system",
    metronomeVolume: 0.65,
    metronomeMuted: false,
    compactMode: false
  };

  const TIMING = {
    beatsPerMeasure: 4,
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

  const MEASURE_PATTERNS = {
    beginner: [
      pattern("whole-note", "Whole note", "One onset held for the measure", 4, [
        event(0, 4, "tap", "𝅝", "Whole note")
      ]),
      pattern("whole-rest", "Whole rest", "Silence for all four beats", 3, [
        event(0, 4, "rest", "𝄻", "Whole rest")
      ]),
      pattern("two-halves", "Two half notes", "Tap on beats 1 and 3", 5, [
        event(0, 2, "tap", "𝅗𝅥", "Half note"),
        event(2, 2, "tap", "𝅗𝅥", "Half note")
      ]),
      pattern("four-quarters", "Four quarter notes", "Tap every beat", 6, [
        event(0, 1, "tap", "♩", "Quarter note"),
        event(1, 1, "tap", "♩", "Quarter note"),
        event(2, 1, "tap", "♩", "Quarter note"),
        event(3, 1, "tap", "♩", "Quarter note")
      ]),
      pattern("quarter-rest-alternating", "Quarter notes and rests", "Tap beats 1 and 3", 4, [
        event(0, 1, "tap", "♩", "Quarter note"),
        event(1, 1, "rest", "𝄽", "Quarter rest"),
        event(2, 1, "tap", "♩", "Quarter note"),
        event(3, 1, "rest", "𝄽", "Quarter rest")
      ]),
      pattern("half-rest-half-note", "Half rest, half note", "Wait, then tap beat 3", 3, [
        event(0, 2, "rest", "𝄼", "Half rest"),
        event(2, 2, "tap", "𝅗𝅥", "Half note")
      ])
    ],
    intermediate: [
      pattern("four-quarters", "Four quarter notes", "Tap every beat", 4, [
        event(0, 1, "tap", "♩", "Quarter note"),
        event(1, 1, "tap", "♩", "Quarter note"),
        event(2, 1, "tap", "♩", "Quarter note"),
        event(3, 1, "tap", "♩", "Quarter note")
      ]),
      pattern("eight-eighths", "Eight eighth notes", "Tap on every subdivision", 4, [
        event(0, 0.5, "tap", "♪", "Eighth note"),
        event(0.5, 0.5, "tap", "♪", "Eighth note"),
        event(1, 0.5, "tap", "♪", "Eighth note"),
        event(1.5, 0.5, "tap", "♪", "Eighth note"),
        event(2, 0.5, "tap", "♪", "Eighth note"),
        event(2.5, 0.5, "tap", "♪", "Eighth note"),
        event(3, 0.5, "tap", "♪", "Eighth note"),
        event(3.5, 0.5, "tap", "♪", "Eighth note")
      ]),
      pattern("dotted-quarter-eighth-half", "Dotted quarter, eighth, half", "Long-short-long", 4, [
        event(0, 1.5, "tap", "♩.", "Dotted quarter"),
        event(1.5, 0.5, "tap", "♪", "Eighth note"),
        event(2, 2, "tap", "𝅗𝅥", "Half note")
      ]),
      pattern("half-quarter-quarter", "Half, quarter, quarter", "Tap beats 1, 3, and 4", 4, [
        event(0, 2, "tap", "𝅗𝅥", "Half note"),
        event(2, 1, "tap", "♩", "Quarter note"),
        event(3, 1, "tap", "♩", "Quarter note")
      ]),
      pattern("eighths-with-rests", "Eighths with rests", "Tap off and on around rests", 3, [
        event(0, 0.5, "tap", "♪", "Eighth note"),
        event(0.5, 0.5, "tap", "♪", "Eighth note"),
        event(1, 1, "rest", "𝄽", "Quarter rest"),
        event(2, 0.5, "tap", "♪", "Eighth note"),
        event(2.5, 0.5, "tap", "♪", "Eighth note"),
        event(3, 1, "tap", "♩", "Quarter note")
      ]),
      pattern("quarter-rest-eighth-pair", "Quarter rest, eighth pair", "Rest beat 2, subdivide beat 3", 3, [
        event(0, 1, "tap", "♩", "Quarter note"),
        event(1, 1, "rest", "𝄽", "Quarter rest"),
        event(2, 0.5, "tap", "♪", "Eighth note"),
        event(2.5, 0.5, "tap", "♪", "Eighth note"),
        event(3, 1, "tap", "♩", "Quarter note")
      ])
    ],
    advanced: [
      pattern("triplet-entry", "Triplet entry", "Triplet on beat 1, then quarters", 4, [
        event(0, 1 / 3, "tap", "♪", "Triplet note"),
        event(1 / 3, 1 / 3, "tap", "♪", "Triplet note"),
        event(2 / 3, 1 / 3, "tap", "♪", "Triplet note"),
        event(1, 1, "tap", "♩", "Quarter note"),
        event(2, 1, "rest", "𝄽", "Quarter rest"),
        event(3, 1, "tap", "♩", "Quarter note")
      ]),
      pattern("triplet-with-rest", "Triplet with rest", "Middle triplet is silent", 4, [
        event(0, 1 / 3, "tap", "♪", "Triplet note"),
        event(1 / 3, 1 / 3, "rest", "𝄾", "Triplet rest"),
        event(2 / 3, 1 / 3, "tap", "♪", "Triplet note"),
        event(1, 1, "tap", "♩", "Quarter note"),
        event(2, 1, "rest", "𝄽", "Quarter rest"),
        event(3, 1, "tap", "♩", "Quarter note")
      ]),
      pattern("syncopated-eighths", "Syncopated eighths", "Offbeat taps through the bar", 4, [
        event(0, 0.5, "tap", "♪", "Eighth note"),
        event(0.5, 0.5, "tap", "♪", "Eighth note"),
        event(1, 0.5, "rest", "𝄾", "Eighth rest"),
        event(1.5, 0.5, "tap", "♪", "Offbeat eighth"),
        event(2, 0.5, "rest", "𝄾", "Eighth rest"),
        event(2.5, 0.5, "tap", "♪", "Offbeat eighth"),
        event(3, 1, "tap", "♩", "Quarter note")
      ]),
      pattern("mixed-eighth-quarter", "Mixed eighth-quarter group", "Dense opening, steady close", 4, [
        event(0, 0.5, "tap", "♪", "Eighth note"),
        event(0.5, 0.5, "tap", "♪", "Eighth note"),
        event(1, 1, "tap", "♩", "Quarter note"),
        event(2, 0.5, "tap", "♪", "Eighth note"),
        event(2.5, 0.5, "tap", "♪", "Eighth note"),
        event(3, 1, "rest", "𝄽", "Quarter rest")
      ]),
      pattern("dotted-syncopation", "Dotted syncopation", "Dotted value into offbeat", 3, [
        event(0, 1.5, "tap", "♩.", "Dotted quarter"),
        event(1.5, 0.5, "tap", "♪", "Eighth note"),
        event(2, 0.5, "rest", "𝄾", "Eighth rest"),
        event(2.5, 0.5, "tap", "♪", "Offbeat eighth"),
        event(3, 1, "tap", "♩", "Quarter note")
      ]),
      pattern("full-triplet-bar", "Triplet pulse measure", "Triplets on beats 1 and 3", 3, [
        event(0, 1 / 3, "tap", "♪", "Triplet note"),
        event(1 / 3, 1 / 3, "tap", "♪", "Triplet note"),
        event(2 / 3, 1 / 3, "tap", "♪", "Triplet note"),
        event(1, 1, "rest", "𝄽", "Quarter rest"),
        event(2, 1 / 3, "tap", "♪", "Triplet note"),
        event(2 + 1 / 3, 1 / 3, "tap", "♪", "Triplet note"),
        event(2 + 2 / 3, 1 / 3, "tap", "♪", "Triplet note"),
        event(3, 1, "tap", "♩", "Quarter note")
      ])
    ]
  };

  const state = {
    settings: { ...DEFAULT_SETTINGS },
    measures: [],
    status: "idle",
    currentMeasureIndex: -1,
    currentBeatInMeasure: 0,
    countdownValue: 0,
    timers: new Set(),
    keyCaptureHand: null,
    audioContext: null,
    masterGain: null,
    pauseStartedAt: null,
    lastSummary: null,
    sequenceConfig: null,
    runToken: 0
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
      handModeInputs: Array.from(document.querySelectorAll("input[name='handMode']")),
      activeHandInputs: Array.from(document.querySelectorAll("input[name='activeHand']")),
      activeHandField: document.getElementById("activeHandField"),
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
      tapHint: document.getElementById("tapHint"),
      leftKeyHint: document.getElementById("leftKeyHint"),
      tapHintJoin: document.getElementById("tapHintJoin"),
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
          if (state.status === "paused") {
            resetPausedSessionForSettingsChange();
          } else {
            renderControls();
          }
        }
      });
    });

    el.handModeInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) {
          state.settings.handMode = input.value;
          saveSettings();
          applySettingsToControls();
          renderAll();
        }
      });
    });

    el.activeHandInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) {
          state.settings.activeHand = input.value;
          saveSettings();
          applySettingsToControls();
          renderAll();
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

  function pattern(id, label, category, weight, events) {
    return { id, label, category, weight, events };
  }

  function event(beatOffset, durationBeats, type, symbol, label) {
    return { beatOffset, durationBeats, type, symbol, label };
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
    state.runToken += 1;
    generateCurrentSequence();
    resetMeasuresForRun();
    state.lastSummary = null;
    el.resultsPanel.hidden = true;
    startCountdown(state.runToken);
  }

  function restartCurrentSequence() {
    readControlsToSettings();
    saveSettings();
    clearTimers();
    state.runToken += 1;

    if (!state.measures.length || hasSequenceConfigChanged()) {
      generateCurrentSequence();
    }

    resetMeasuresForRun();
    state.lastSummary = null;
    el.resultsPanel.hidden = true;
    startCountdown(state.runToken);
  }

  function resetMeasuresForRun() {
    state.currentMeasureIndex = -1;
    state.currentBeatInMeasure = 0;
    state.pauseStartedAt = null;
    state.measures = state.measures.map((measure) => ({
      ...measure,
      startTime: null,
      taps: { left: [], right: [] },
      extraTaps: { left: 0, right: 0 },
      results: { left: [], right: [] },
      targets: { left: [], right: [] }
    }));
  }

  function resetPausedSessionForSettingsChange() {
    clearTimers();
    hideCountdown();
    state.status = "idle";
    state.measures = [];
    state.currentMeasureIndex = -1;
    state.currentBeatInMeasure = 0;
    state.countdownValue = 0;
    state.pauseStartedAt = null;
    state.lastSummary = null;
    state.sequenceConfig = null;
    state.runToken += 1;
    el.resultsPanel.hidden = true;
    renderAll();
  }

  async function startCountdown(runToken) {
    state.status = "countdown";
    state.countdownValue = TIMING.beatsPerMeasure;
    await ensureAudio();

    if (runToken !== state.runToken || state.status !== "countdown") {
      return;
    }

    renderAll();
    showCountdown();
    playClick(true);
    scheduleCountdownTick(runToken);
  }

  function scheduleCountdownTick(runToken) {
    setManagedTimeout(() => {
      if (runToken !== state.runToken || state.status !== "countdown") {
        return;
      }

      state.countdownValue -= 1;

      if (state.countdownValue > 0) {
        showCountdown();
        playClick(false);
        scheduleCountdownTick(runToken);
        return;
      }

      beginRun(runToken);
    }, beatIntervalMs());
  }

  function showCountdown() {
    el.countdownOverlay.textContent = String(state.countdownValue);
    el.countdownOverlay.hidden = false;
    pulseBeat();
  }

  function beginRun(runToken) {
    if (runToken !== state.runToken || state.status !== "countdown") {
      return;
    }

    hideCountdown();
    const firstBeat = performance.now();
    const interval = beatIntervalMs();

    state.measures.forEach((measure, measureIndex) => {
      measure.startTime = firstBeat + measureIndex * measureDurationMs();
      getActiveHands().forEach((hand) => {
        measure.targets[hand] = measure[hand].events.map((measureEvent) => ({
          measureIndex,
          hand,
          event: measureEvent,
          targetTime: measure.startTime + measureEvent.beatOffset * interval,
          result: null
        }));
      });
    });

    state.status = "running";
    state.currentMeasureIndex = -1;
    state.currentBeatInMeasure = 0;
    renderAll();
    scheduleRunTimers();
  }

  function scheduleRunTimers() {
    const now = performance.now();
    const interval = beatIntervalMs();
    const totalBeats = state.measures.length * TIMING.beatsPerMeasure;

    for (let beatIndex = 0; beatIndex < totalBeats; beatIndex += 1) {
      const beatTime = state.measures[0].startTime + beatIndex * interval;
      if (beatTime >= now - 5) {
        setManagedTimeout(() => handleBeatTick(beatIndex), beatTime - now);
      }
    }

    getAllTargets().forEach((target) => {
      const finalizeTime = target.targetTime + TIMING.windowMs + 8;
      if (!target.result && finalizeTime >= now - 5) {
        setManagedTimeout(() => {
          finalizeTarget(target);
          renderAll();
        }, finalizeTime - now);
      }
    });

    const finishTime = state.measures[0].startTime + totalBeats * interval + TIMING.windowMs + 70;
    setManagedTimeout(finishGame, finishTime - now);
  }

  function handleBeatTick(beatIndex) {
    if (state.status !== "running") {
      return;
    }

    finalizeDueTargets(performance.now());
    state.currentMeasureIndex = Math.floor(beatIndex / TIMING.beatsPerMeasure);
    state.currentBeatInMeasure = beatIndex % TIMING.beatsPerMeasure + 1;
    playClick(state.currentBeatInMeasure === 1);
    pulseBeat();
    renderAll();

    if (state.currentBeatInMeasure === 1) {
      scrollActiveMeasureIntoView();
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
    state.measures.forEach((measure, index) => {
      if (measure.startTime !== null && index >= state.currentMeasureIndex) {
        measure.startTime += pausedFor;
      }

      getActiveHands().forEach((hand) => {
        measure.targets[hand].forEach((target) => {
          if (!target.result) {
            target.targetTime += pausedFor;
          }
        });
      });
    });

    state.status = "running";
    state.pauseStartedAt = null;
    await ensureAudio();
    renderAll();
    scheduleRunTimers();
  }

  function handleKeyDown(eventObject) {
    const key = normalizeKey(eventObject);

    if (state.keyCaptureHand) {
      eventObject.preventDefault();
      completeKeyCapture(key);
      return;
    }

    if (eventObject.repeat || !key || state.status !== "running") {
      return;
    }

    if (key === state.settings.leftKey) {
      eventObject.preventDefault();
      if (isHandActive("left")) {
        recordTap("left");
      }
      return;
    }

    if (key === state.settings.rightKey) {
      eventObject.preventDefault();
      if (isHandActive("right")) {
        recordTap("right");
      }
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
    if (!isHandActive(hand)) {
      return;
    }

    const now = performance.now();
    const candidate = findTapCandidate(hand, now);
    const activeMeasure = state.measures[state.currentMeasureIndex];

    if (!candidate) {
      if (state.settings.mode === "practice" && activeMeasure) {
        activeMeasure.extraTaps[hand] += 1;
        renderAll();
      }
      return;
    }

    const { target, deltaMs } = candidate;
    const measure = state.measures[target.measureIndex];

    if (target.result) {
      measure.extraTaps[hand] += 1;
      renderAll();
      return;
    }

    measure.taps[hand].push({
      at: now,
      deltaMs,
      eventId: target.event.id
    });
    target.result = scoreTarget(target, deltaMs, true);
    measure.results[hand].push(target.result);
    renderAll();
  }

  function findTapCandidate(hand, now) {
    let best = null;

    getAllTargets(hand).forEach((target) => {
      if (target.result) {
        return;
      }

      const deltaMs = now - target.targetTime;
      if (Math.abs(deltaMs) > TIMING.windowMs) {
        return;
      }

      if (!best || Math.abs(deltaMs) < Math.abs(best.deltaMs)) {
        best = { target, deltaMs };
      }
    });

    return best;
  }

  function scoreTarget(target, deltaMs, actualTap) {
    if (target.event.type === "rest") {
      return {
        eventId: target.event.id,
        rating: actualTap ? "Miss" : "Perfect",
        deltaMs,
        expectedTap: false,
        actualTap,
        targetTime: target.targetTime
      };
    }

    if (!actualTap) {
      return {
        eventId: target.event.id,
        rating: "Miss",
        deltaMs: null,
        expectedTap: true,
        actualTap: false,
        targetTime: target.targetTime
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
      eventId: target.event.id,
      rating,
      deltaMs,
      expectedTap: true,
      actualTap: true,
      targetTime: target.targetTime
    };
  }

  function finalizeDueTargets(now) {
    getAllTargets().forEach((target) => {
      if (!target.result && target.targetTime + TIMING.windowMs <= now) {
        finalizeTarget(target);
      }
    });
  }

  function finalizeTarget(target) {
    if (target.result) {
      return;
    }

    const measure = state.measures[target.measureIndex];
    target.result = scoreTarget(target, null, false);
    measure.results[target.hand].push(target.result);
  }

  function finishGame() {
    if (state.status === "finished") {
      return;
    }

    clearTimers();
    hideCountdown();
    getAllTargets().forEach(finalizeTarget);
    state.status = "finished";
    state.currentMeasureIndex = state.measures.length;
    state.currentBeatInMeasure = 0;
    state.lastSummary = buildSessionSummary();
    saveHistoryItem(state.lastSummary);
    renderAll();
  }

  function generateSequence(length, difficulty) {
    const pool = MEASURE_PATTERNS[difficulty] || MEASURE_PATTERNS.beginner;

    return Array.from({ length }, (_, index) => ({
      index,
      startTime: null,
      left: isHandActive("left") ? clonePattern(weightedPick(pool), index, "left") : createInactivePattern("left"),
      right: isHandActive("right") ? clonePattern(weightedPick(pool), index, "right") : createInactivePattern("right"),
      taps: { left: [], right: [] },
      extraTaps: { left: 0, right: 0 },
      results: { left: [], right: [] },
      targets: { left: [], right: [] }
    }));
  }

  function generateCurrentSequence() {
    state.measures = generateSequence(state.settings.sequenceLength, state.settings.difficulty);
    state.sequenceConfig = getSequenceConfig();
  }

  function getSequenceConfig() {
    return {
      difficulty: state.settings.difficulty,
      handMode: state.settings.handMode,
      activeHand: state.settings.activeHand,
      sequenceLength: state.settings.sequenceLength
    };
  }

  function hasSequenceConfigChanged() {
    const currentConfig = state.sequenceConfig;
    const nextConfig = getSequenceConfig();

    return !currentConfig || Object.keys(nextConfig).some((key) => currentConfig[key] !== nextConfig[key]);
  }

  function createInactivePattern(hand) {
    return {
      inactive: true,
      id: `${hand}-inactive`,
      label: `${capitalize(hand)} hand inactive`,
      category: "Not scored",
      events: []
    };
  }

  function clonePattern(sourcePattern, index, hand) {
    return {
      id: `${sourcePattern.id}-${hand}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      label: sourcePattern.label,
      category: sourcePattern.category,
      difficulty: state.settings.difficulty,
      events: sourcePattern.events.map((sourceEvent, eventIndex) => ({
        id: `${sourcePattern.id}-${hand}-${index}-${eventIndex}`,
        beatOffset: sourceEvent.beatOffset,
        durationBeats: sourceEvent.durationBeats,
        type: sourceEvent.type,
        symbol: sourceEvent.symbol,
        label: sourceEvent.label
      }))
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
    const leftResults = collectResults("left");
    const rightResults = collectResults("right");
    const activeResults = getActiveHands()
      .flatMap((hand) => collectResults(hand))
      .sort((a, b) => a.targetTime - b.targetTime);
    const allResults = isOneHandMode()
      ? activeResults
      : [...leftResults, ...rightResults].sort((a, b) => a.targetTime - b.targetTime);
    const counts = countRatings(allResults);
    const activeHandAccuracy = isOneHandMode() ? calculateAccuracy(collectResults(state.settings.activeHand)) : null;

    return {
      completedAt: new Date().toISOString(),
      bpm: state.settings.bpm,
      difficulty: state.settings.difficulty,
      handMode: state.settings.handMode,
      activeHand: state.settings.activeHand,
      sequenceLength: state.settings.sequenceLength,
      mode: state.settings.mode,
      leftAccuracy: calculateAccuracy(leftResults),
      rightAccuracy: calculateAccuracy(rightResults),
      activeHandAccuracy,
      combinedAccuracy: calculateAccuracy(allResults),
      maxStreak: calculateMaxStreak(allResults),
      counts
    };
  }

  function collectResults(hand) {
    return state.measures.flatMap((measure) => measure.results[hand]);
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
    const total = state.measures.length;
    const current = Math.min(Math.max(state.currentMeasureIndex + 1, 0), total);

    if (state.status === "idle") {
      el.sessionStatus.textContent = "Ready";
      el.playSubhead.textContent = "Configure a session, then start the metronome.";
    } else if (state.status === "countdown") {
      el.sessionStatus.textContent = "Counting in";
      el.playSubhead.textContent = "Get ready for the first measure.";
    } else if (state.status === "running") {
      el.sessionStatus.textContent = `Playing measure ${current} of ${total}`;
      el.playSubhead.textContent = state.settings.mode === "practice"
        ? "Practice mode shows timing deltas as you play."
        : "Scored mode hides timing deltas until the end.";
    } else if (state.status === "paused") {
      el.sessionStatus.textContent = `Paused at measure ${current} of ${total}`;
      el.playSubhead.textContent = "Resume to continue from the same timing position.";
    } else {
      el.sessionStatus.textContent = "Finished";
      el.playSubhead.textContent = "Review the per-hand scores and recent session history.";
    }
  }

  function renderControls() {
    const timingLocked = state.status === "countdown" || state.status === "running";
    const sessionLocked = timingLocked || state.status === "paused";
    const hasMeasures = state.measures.length > 0;

    el.startButton.disabled = sessionLocked;
    el.pauseButton.disabled = !(state.status === "running" || state.status === "paused");
    el.pauseButton.textContent = state.status === "paused" ? "Resume" : "Pause";
    el.restartButton.disabled = !hasMeasures || state.status === "idle";

    [
      el.bpmRange,
      el.bpmNumber,
      ...el.handModeInputs,
      el.sequenceLength,
      el.modeSelect,
      el.leftKeyButton,
      el.rightKeyButton
    ].forEach((control) => {
      control.disabled = sessionLocked;
    });

    el.difficultyInputs.forEach((control) => {
      control.disabled = timingLocked;
    });

    el.activeHandInputs.forEach((control) => {
      control.disabled = sessionLocked || !isOneHandMode();
    });
    el.activeHandField.classList.toggle("is-disabled", !isOneHandMode());
  }

  function renderKeys() {
    const left = displayKey(state.settings.leftKey);
    const right = displayKey(state.settings.rightKey);

    el.leftKeyButton.querySelector("strong").textContent = left;
    el.rightKeyButton.querySelector("strong").textContent = right;

    if (isOneHandMode()) {
      const activeKey = state.settings.activeHand === "left" ? left : right;
      const hintId = state.settings.activeHand === "left" ? "leftKeyHint" : "rightKeyHint";
      el.tapHint.innerHTML = `<span>Tap </span><kbd id="${hintId}">${escapeHtml(activeKey)}</kbd>`;
    } else {
      el.tapHint.innerHTML = `
        <span>Tap</span>
        <kbd id="leftKeyHint">${escapeHtml(left)}</kbd>
        <span id="tapHintJoin">and</span>
        <kbd id="rightKeyHint">${escapeHtml(right)}</kbd>
      `;
    }

    el.leftKeyHint = document.getElementById("leftKeyHint");
    el.tapHintJoin = document.getElementById("tapHintJoin");
    el.rightKeyHint = document.getElementById("rightKeyHint");
  }

  function renderLane() {
    if (!state.measures.length) {
      el.rhythmLane.innerHTML = `<p class="empty-state">No measure sequence yet. Start a session to generate paired measure cards.</p>`;
      return;
    }

    el.rhythmLane.innerHTML = state.measures.map((measure, index) => {
      const active = state.status === "running" && index === state.currentMeasureIndex;
      const complete = isMeasureComplete(measure);
      return `
        <article class="rhythm-row${active ? " is-active" : ""}${complete ? " is-complete" : ""}" data-row="${index + 1}">
          ${renderMeasureCard(measure, "left")}
          ${renderMeasureCard(measure, "right")}
        </article>
      `;
    }).join("");
  }

  function renderMeasureCard(measure, hand) {
    const measurePattern = measure[hand];
    if (measurePattern.inactive) {
      return renderInactiveMeasureCard(hand);
    }

    const isActive = state.status === "running" && measure.index === state.currentMeasureIndex;
    const currentBeat = isActive ? state.currentBeatInMeasure : 0;
    const resultMap = new Map(measure.results[hand].map((result) => [result.eventId, result]));
    const extraCount = measure.extraTaps[hand];

    return `
      <div class="measure-card ${hand}-measure">
        <div class="measure-card-header">
          <div>
            <span class="hand-label">${hand === "left" ? "Left hand" : "Right hand"}</span>
            <h3>${escapeHtml(measurePattern.label)}</h3>
          </div>
          <span class="pattern-label">${escapeHtml(measurePattern.category)}</span>
        </div>
        <div class="measure-timeline" aria-label="${hand} hand measure timeline">
          <div class="beat-grid" aria-hidden="true">
            ${[1, 2, 3, 4].map((beatNumber) => `
              <span class="beat-marker${currentBeat === beatNumber ? " is-current" : ""}">${beatNumber}</span>
            `).join("")}
          </div>
          <div class="measure-events">
            ${measurePattern.events.map((measureEvent) => renderMeasureEvent(measureEvent, resultMap.get(measureEvent.id))).join("")}
          </div>
        </div>
        <div class="measure-footer">
          <span>${measurePattern.events.length} onset${measurePattern.events.length === 1 ? "" : "s"}</span>
          ${state.settings.mode === "practice" && extraCount > 0 ? `<span>${extraCount} extra tap${extraCount === 1 ? "" : "s"}</span>` : ""}
        </div>
      </div>
    `;
  }

  function renderInactiveMeasureCard(hand) {
    return `
      <div class="measure-card inactive-measure-card ${hand}-measure" aria-label="${hand} hand inactive">
        <div class="inactive-content">
          <span class="hand-label">${hand === "left" ? "Left hand" : "Right hand"}</span>
          <h3>${capitalize(hand)} hand inactive</h3>
          <p>Switch to 2 hands or choose this hand for one-hand practice.</p>
        </div>
      </div>
    `;
  }

  function renderMeasureEvent(measureEvent, result) {
    const startPercent = (measureEvent.beatOffset / TIMING.beatsPerMeasure) * 100;
    const widthPercent = (measureEvent.durationBeats / TIMING.beatsPerMeasure) * 100;
    const badge = result ? renderResultBadge(result) : `<span class="badge">Pending</span>`;
    const delta = state.settings.mode === "practice" && result && result.deltaMs !== null
      ? `<span class="delta">${formatDelta(result.deltaMs)}</span>`
      : "";

    return `
      <div class="measure-event ${measureEvent.type === "rest" ? "rest-event" : "tap-event"}"
        style="--event-start: ${startPercent}%; --event-width: ${widthPercent}%">
        <div class="event-stem" aria-hidden="true"></div>
        <div class="event-chip">
          <span class="event-symbol">${escapeHtml(measureEvent.symbol)}</span>
          <span class="event-label">${escapeHtml(measureEvent.label)}</span>
        </div>
        <div class="event-feedback">${badge}${delta}</div>
      </div>
    `;
  }

  function renderResultBadge(result) {
    return `<span class="badge ${result.rating.toLowerCase()}">${result.rating}</span>`;
  }

  function renderProgress() {
    const totalMeasures = state.measures.length;
    const currentMeasure = totalMeasures ? Math.min(Math.max(state.currentMeasureIndex + 1, 0), totalMeasures) : 0;
    const totalBeats = totalMeasures * TIMING.beatsPerMeasure;
    let completedBeats = 0;

    if (state.status === "finished") {
      completedBeats = totalBeats;
    } else if (state.status === "running" || state.status === "paused") {
      completedBeats = Math.max(0, state.currentMeasureIndex * TIMING.beatsPerMeasure + state.currentBeatInMeasure);
    }

    const percent = totalBeats ? Math.round((completedBeats / totalBeats) * 100) : 0;
    const beatText = state.currentBeatInMeasure > 0 ? ` · Beat ${state.currentBeatInMeasure}` : "";

    el.beatCounter.textContent = totalMeasures
      ? `Measure ${currentMeasure} / ${totalMeasures}${beatText}`
      : "Measure 0 / 0";
    el.progressBar.style.width = `${percent}%`;
  }

  function renderResults() {
    if (state.status !== "finished" || !state.lastSummary) {
      return;
    }

    const summary = state.lastSummary;
    el.resultsPanel.hidden = false;
    if (summary.handMode === "one") {
      const handLabel = summary.activeHand === "right" ? "Right" : "Left";
      const handAccuracy = Number.isFinite(summary.activeHandAccuracy)
        ? summary.activeHandAccuracy
        : summary.combinedAccuracy;
      el.scoreSummary.innerHTML = `
        <div class="score-tile"><span>${handLabel}</span><strong>${handAccuracy}%</strong></div>
        <div class="score-tile"><span>Max streak</span><strong>${summary.maxStreak}</strong></div>
      `;
    } else {
      el.scoreSummary.innerHTML = `
        <div class="score-tile"><span>Left</span><strong>${summary.leftAccuracy}%</strong></div>
        <div class="score-tile"><span>Right</span><strong>${summary.rightAccuracy}%</strong></div>
        <div class="score-tile"><span>Combined</span><strong>${summary.combinedAccuracy}%</strong></div>
        <div class="score-tile"><span>Max streak</span><strong>${summary.maxStreak}</strong></div>
      `;
    }
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
      const isOneHandHistory = item.handMode === "one";
      const handLabel = item.activeHand === "right" ? "Right" : "Left";
      const scoreText = isOneHandHistory
        ? `${Number.isFinite(item.activeHandAccuracy) ? item.activeHandAccuracy : item.combinedAccuracy}% ${handLabel.toLowerCase()}`
        : `${item.combinedAccuracy}% combined`;
      return `
        <li>
          <strong>${scoreText}</strong>
          <div class="history-meta">
            ${isOneHandHistory
              ? `<span>1 hand · ${handLabel}</span>`
              : `<span>L ${item.leftAccuracy}%</span><span>R ${item.rightAccuracy}%</span><span>2 hands</span>`}
            <span>${item.bpm} BPM</span>
            <span>${capitalize(item.difficulty)}</span>
            <span>${item.sequenceLength} measures</span>
            <span>${completedAt.toLocaleDateString()} ${completedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </li>
      `;
    }).join("");
  }

  function scrollActiveMeasureIntoView() {
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

  function hideCountdown() {
    el.countdownOverlay.hidden = true;
    el.countdownOverlay.textContent = "";
  }

  function getAllTargets(hand) {
    const handsToRead = hand ? [hand].filter(isHandActive) : getActiveHands();
    return state.measures.flatMap((measure) => handsToRead.flatMap((targetHand) => measure.targets[targetHand]));
  }

  function isMeasureComplete(measure) {
    return getActiveHands().every((hand) => measure.targets[hand].length > 0 && measure.targets[hand].every((target) => target.result));
  }

  function getActiveHands() {
    return isOneHandMode() ? [state.settings.activeHand] : HANDS;
  }

  function isHandActive(hand) {
    return getActiveHands().includes(hand);
  }

  function isOneHandMode() {
    return state.settings.handMode === "one";
  }

  function beatIntervalMs() {
    return 60000 / state.settings.bpm;
  }

  function measureDurationMs() {
    return beatIntervalMs() * TIMING.beatsPerMeasure;
  }

  function readControlsToSettings() {
    state.settings.bpm = clamp(Number(el.bpmNumber.value) || DEFAULT_SETTINGS.bpm, 40, 180);
    state.settings.difficulty = el.difficultyInputs.find((input) => input.checked)?.value || DEFAULT_SETTINGS.difficulty;
    state.settings.handMode = el.handModeInputs.find((input) => input.checked)?.value || DEFAULT_SETTINGS.handMode;
    state.settings.activeHand = el.activeHandInputs.find((input) => input.checked)?.value || DEFAULT_SETTINGS.activeHand;
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
    el.handModeInputs.forEach((input) => {
      input.checked = input.value === state.settings.handMode;
    });
    el.activeHandInputs.forEach((input) => {
      input.checked = input.value === state.settings.activeHand;
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
    settings.sequenceLength = [4, 8, 16, 32].includes(Number(settings.sequenceLength))
      ? Number(settings.sequenceLength)
      : normalizeLegacyLength(settings.sequenceLength);
    settings.difficulty = MEASURE_PATTERNS[settings.difficulty] ? settings.difficulty : DEFAULT_SETTINGS.difficulty;
    settings.handMode = settings.handMode === "one" ? "one" : "two";
    settings.activeHand = HANDS.includes(settings.activeHand) ? settings.activeHand : DEFAULT_SETTINGS.activeHand;
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

  function normalizeLegacyLength(value) {
    const numericValue = Number(value);
    if (numericValue === 64) {
      return 16;
    }

    if ([8, 16, 32].includes(numericValue)) {
      return numericValue;
    }

    return DEFAULT_SETTINGS.sequenceLength;
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

  function normalizeKey(eventObject) {
    if (eventObject.code === "Space") {
      return " ";
    }

    if (eventObject.key.length === 1) {
      return eventObject.key.toLowerCase();
    }

    return eventObject.key;
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
