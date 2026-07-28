(function () {
  "use strict";

  const PROTOTYPE_VERSION = "3.0.0";
  const STORAGE_KEY = "ocean-adventure-whole-number-trap-v3";
  const MAX_EVENTS = 10000;

  const CHARACTER_ASSETS = {
    specter: {
      src: "assets/specter.png",
      alt: "Specter, the ghostly Ocean Adventure villain",
      role: "Villain in archived replay",
      name: "Specter"
    },
    bellumExplain: {
      src: "assets/bellum-explain.png",
      alt: "Bellum, Agent Decimal’s trusted First Mate",
      role: "First Mate",
      name: "Bellum"
    },
    bellumAlert: {
      src: "assets/first-mate-explain.png",
      alt: "Bellum raising a finger to signal an important idea",
      role: "First Mate",
      name: "Bellum"
    },
    bellumThink: {
      src: "assets/first-mate-think.png",
      alt: "Bellum thinking carefully",
      role: "First Mate",
      name: "Bellum"
    },
    bellumConfident: {
      src: "assets/first-mate-confident.png",
      alt: "Bellum ready for Manual Mode",
      role: "First Mate",
      name: "Bellum"
    },
    bellumSuccess: {
      src: "assets/bellum-success.png",
      alt: "Bellum smiling after the training mission",
      role: "First Mate",
      name: "Bellum"
    }
  };

  const SCREENS = [
    {
      id: "recovered-log",
      scene: 1,
      type: "briefing",
      phase: "Present day",
      title: "Bellum opens the recovered battle log",
      character: "bellumAlert",
      radar: "absent"
    },
    {
      id: "replay-whole",
      scene: 2,
      type: "replayWhole",
      phase: "Archived battle replay",
      title: "Orb Chain 1: the whole-number bait",
      character: "specter",
      radar: "absent",
      archived: true
    },
    {
      id: "replay-decimal",
      scene: 3,
      type: "replayDecimal",
      phase: "Archived battle replay",
      title: "Orb Chain 2: the decimal trap",
      character: "specter",
      radar: "absent",
      archived: true
    },
    {
      id: "trap-sprung",
      scene: 4,
      type: "failure",
      phase: "Archived battle replay",
      title: "Specter’s Whole-Number Trap",
      character: "specter",
      radar: "absent",
      archived: true,
      dramatic: true
    },
    {
      id: "repair-align",
      scene: 5,
      type: "alignRepair",
      phase: "Active repair",
      title: "Align the decimal points",
      character: "bellumExplain",
      radar: "absent",
      archived: true,
      frozenReplay: true
    },
    {
      id: "repair-proof",
      scene: 6,
      type: "trial",
      phase: "Active repair",
      title: "Click the decisive place values",
      character: "bellumExplain",
      radar: "absent",
      archived: true,
      frozenReplay: true,
      item: {
        id: "repair_07_052",
        caseType: "modeled_decimal_conflict",
        left: "0.7",
        right: "0.52",
        numberType: "DECIMALS",
        initialRequired: false,
        alignmentRequired: false,
        alignedDisplay: true,
        correctInitial: "left",
        finalExpression: "0.7 > 0.52",
        nextLabel: "Activate SAIL",
        proofIntro: "Start with the tenths. Select the digit in the tenths place of each number.",
        path: [
          {
            leftIndex: 2,
            rightIndex: 2,
            relation: ">",
            prompt: "Select the digit in the tenths place of each number, then compare them.",
            success: "7 tenths is greater than 5 tenths."
          }
        ],
        mismatchFeedback: "Those digits are in different places: 7 is tenths, but 2 is hundredths. Compare tenths with tenths.",
        relationFeedback: "The number of written digits does not decide the size of decimals. Compare the digits that occupy the same place.",
        correctFeedback: "Seven tenths is greater than five tenths. The first place that differs decides the comparison, so we do not need to inspect the hundredths."
      }
    },
    {
      id: "sail-lesson",
      scene: 7,
      type: "lesson",
      phase: "Repaired boundary",
      title: "Bellum activates the Place-Value Radar",
      character: "bellumAlert",
      radar: "full"
    },
    {
      id: "guided-practice",
      scene: 8,
      type: "trial",
      phase: "Guided practice",
      title: "Full radar and SAIL support",
      character: "bellumExplain",
      radar: "full",
      item: {
        id: "guided_053_0433",
        caseType: "guided_unequal_length",
        left: "0.53",
        right: "0.433",
        numberType: "DECIMALS",
        initialRequired: true,
        alignmentRequired: true,
        alignedDisplay: true,
        correctInitial: "left",
        finalExpression: "0.53 > 0.433",
        nextLabel: "Continue with less radar support",
        proofIntro: "To show the proof, select the first corresponding digit pair that decides the comparison.",
        path: [
          {
            leftIndex: 2,
            rightIndex: 2,
            relation: ">",
            prompt: "Beginning from the left, click the first corresponding digits that differ.",
            success: "5 tenths is greater than 4 tenths."
          }
        ],
        mismatchFeedback: "Your comparison may be correct, but those digits do not prove it. Select digits in the same place, beginning from the left.",
        mismatchFeedbackWhenInitialCorrect: "Your first choice is correct, but those digits do not show why. Select digits in the same place, beginning from the left.",
        mismatchFeedbackWhenInitialIncorrect: "Those digits do not prove the comparison. Select digits in the same place, beginning from the left.",
        relationFeedback: "Compare the selected tenths: 5 tenths is greater than 4 tenths.",
        correctFeedback: "Five tenths is greater than four tenths, so 0.53 is greater than 0.433."
      }
    },
    {
      id: "faded-equality",
      scene: 9,
      type: "trial",
      phase: "Faded practice",
      title: "Equality and trailing-zero meaning",
      character: "bellumThink",
      radar: "alert",
      item: {
        id: "faded_06_060",
        caseType: "faded_trailing_zero_equality",
        left: "0.6",
        right: "0.60",
        numberType: "DECIMALS",
        initialRequired: true,
        alignmentRequired: true,
        alignedDisplay: true,
        correctInitial: "equal",
        finalExpression: "0.6 = 0.60",
        nextLabel: "Prepare for Manual Mode",
        proofIntro: "Compare corresponding places from left to right.",
        path: [
          {
            leftIndex: 2,
            rightIndex: 2,
            relation: "=",
            prompt: "Select the digit in the tenths place of each number, then compare them.",
            success: "The tenths are equal, so continue to the hundredths."
          }
        ],
        emptyQuestion: true,
        mismatchFeedback: "Select digits in the same place, beginning with the tenths.",
        relationFeedback: "Both tenths digits are 6, so they are equal. Continue to the hundredths.",
        correctFeedback: "Both numbers name six tenths. Writing a zero to the right does not change the value."
      }
    },
    {
      id: "manual-handoff",
      scene: 10,
      type: "manualHandoff",
      phase: "Training handoff",
      title: "Intentional handoff to Manual Mode",
      character: "bellumConfident",
      radar: "manual"
    },
    {
      id: "manual-a",
      scene: 11,
      type: "trial",
      phase: "Independent practice · Round A",
      title: "Manual comparison: Round A",
      character: "bellumConfident",
      radar: "absent",
      item: {
        id: "manual_12_1109",
        caseType: "independent_unequal_length",
        left: "1.2",
        right: "1.109",
        numberType: "DECIMALS",
        initialRequired: true,
        alignmentRequired: false,
        alignedDisplay: false,
        correctInitial: "left",
        finalExpression: "1.2 > 1.109",
        nextLabel: "Continue to Round B",
        proofIntro: "Compare the whole-number parts first. If they are equal, move right through the decimal places.",
        revealHeadingsAfter: 2,
        path: [
          {
            leftIndex: 0,
            rightIndex: 0,
            relation: "=",
            prompt: "Start with the whole-number part. Select the digit in the ones place of each number.",
            success: "The ones digits are equal, so move one place right to the tenths."
          },
          {
            leftIndex: 2,
            rightIndex: 2,
            relation: ">",
            prompt: "The digits in the ones place are equal. Move one place right and select the digit in the tenths place of each number.",
            success: "At the tenths place, 2 is greater than 1."
          }
        ],
        mismatchFeedback: "Compare digits in the same place, starting with the whole-number part.",
        relationFeedback: "Compare corresponding places from left to right.",
        correctFeedback: "The digits in the ones place are equal. At the tenths place, 2 is greater than 1, so 1.2 is greater than 1.109."
      }
    },
    {
      id: "manual-b",
      scene: 12,
      type: "trial",
      phase: "Independent practice · Round B",
      title: "Manual comparison: Round B",
      character: "bellumThink",
      radar: "absent",
      item: {
        id: "manual_047_0482",
        caseType: "independent_equal_tenths",
        left: "0.47",
        right: "0.482",
        numberType: "DECIMALS",
        initialRequired: true,
        alignmentRequired: false,
        alignedDisplay: false,
        correctInitial: "right",
        finalExpression: "0.47 < 0.482",
        nextLabel: "Complete the navigation rule",
        proofIntro: "Both numbers have 0 as the whole-number part, so begin with the tenths. Continue right when a pair is equal.",
        path: [
          {
            leftIndex: 2,
            rightIndex: 2,
            relation: "=",
            prompt: "Select the digit in the tenths place of each number.",
            success: "The tenths are equal, so continue to the hundredths."
          },
          {
            leftIndex: 3,
            rightIndex: 3,
            relation: "<",
            prompt: "The tenths digits are equal. Move one place right and select the digit in the hundredths place of each number.",
            success: "7 hundredths is less than 8 hundredths."
          }
        ],
        mismatchFeedback: "Select digits in the same place, beginning from the left and continuing past equal places.",
        relationFeedback: "Compare the two selected digits, then continue if they are equal.",
        correctFeedback: "The tenths are equal, so continue to the hundredths. Seven hundredths is less than eight hundredths, so 0.47 is less than 0.482."
      }
    },
    {
      id: "boundary-check",
      scene: 13,
      type: "boundary",
      phase: "Final boundary check",
      title: "Complete Bellum’s navigation log",
      character: "bellumSuccess",
      radar: "absent"
    },
    {
      id: "mission-return",
      scene: 14,
      type: "return",
      phase: "Return to mission",
      title: "Contain the Plasma Orbs",
      character: "bellumSuccess",
      radar: "absent"
    }
  ];

  const BOUNDARY_OPTIONS = [
    {
      value: "always",
      label: "The number with more digits is always greater."
    },
    {
      value: "bounded",
      label: "Digit count can help compare positive whole numbers. For decimals, align decimal points and compare corresponding places."
    },
    {
      value: "shorter",
      label: "For decimals, the number with fewer digits is greater."
    }
  ];

  const dom = {};
  let state;
  let storageAvailable = true;
  let memoryState = null;
  let transitionLocked = false;
  let toastTimer = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheDom();
    populateJumpMenu();
    bindEvents();

    const restored = loadState();
    state = restored || createFreshState([]);
    state.screenEnteredAt = Date.now();

    if (restored) {
      logEvent("session_resume", { response: "restored V3 local progress" });
    } else {
      logEvent("session_start", { response: "new V3 session" });
    }

    render();
    logEvent("screen_view");
  }

  function cacheDom() {
    dom.missionFrame = document.getElementById("mission-frame");
    dom.stageLayout = document.querySelector(".stage-layout");
    dom.phaseLabel = document.getElementById("phase-label");
    dom.screenCounter = document.getElementById("screen-counter");
    dom.progressTrack = document.getElementById("progress-track");
    dom.progressFill = document.getElementById("progress-fill");
    dom.characterCard = document.getElementById("character-card");
    dom.characterPortrait = document.getElementById("character-portrait");
    dom.speakerRole = document.getElementById("speaker-role");
    dom.speakerName = document.getElementById("speaker-name");
    dom.screenMount = document.getElementById("screen-mount");
    dom.radarPanel = document.getElementById("radar-panel");
    dom.radarScreen = document.getElementById("radar-screen");
    dom.radarStateBadge = document.getElementById("radar-state-badge");
    dom.trapOverlay = document.getElementById("trap-open-overlay");
    dom.saveStatus = document.getElementById("save-status");
    dom.logToggle = document.getElementById("log-toggle");
    dom.logClose = document.getElementById("log-close");
    dom.logDrawer = document.getElementById("log-drawer");
    dom.drawerBackdrop = document.getElementById("drawer-backdrop");
    dom.eventCount = document.getElementById("event-count");
    dom.logSummary = document.getElementById("log-summary");
    dom.logTableBody = document.getElementById("log-table-body");
    dom.restartButton = document.getElementById("restart-button");
    dom.screenJump = document.getElementById("screen-jump");
    dom.jumpButton = document.getElementById("jump-button");
    dom.downloadJson = document.getElementById("download-json");
    dom.downloadCsv = document.getElementById("download-csv");
    dom.clearData = document.getElementById("clear-data");
    dom.toast = document.getElementById("toast");
  }

  function bindEvents() {
    dom.screenMount.addEventListener("click", handleScreenClick);
    dom.screenMount.addEventListener("submit", handleScreenSubmit);
    dom.logToggle.addEventListener("click", openLogDrawer);
    dom.logClose.addEventListener("click", closeLogDrawer);
    dom.drawerBackdrop.addEventListener("click", closeLogDrawer);
    dom.restartButton.addEventListener("click", restartMission);
    dom.jumpButton.addEventListener("click", jumpToSelectedScreen);
    dom.downloadJson.addEventListener("click", downloadJsonLog);
    dom.downloadCsv.addEventListener("click", downloadCsvLog);
    dom.clearData.addEventListener("click", clearLocalData);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !dom.logDrawer.hidden) closeLogDrawer();
    });
  }

  function populateJumpMenu() {
    SCREENS.forEach(function (screen) {
      const option = document.createElement("option");
      option.value = String(screen.scene - 1);
      option.textContent = "Scene " + screen.scene + ": " + screen.title;
      dom.screenJump.appendChild(option);
    });
  }

  function createFreshState(existingEvents) {
    return {
      version: PROTOTYPE_VERSION,
      sessionId: createSessionId(),
      screenIndex: 0,
      sessionStartedAt: Date.now(),
      screenEnteredAt: Date.now(),
      activities: {},
      boundary: {
        selected: null,
        attempts: 0,
        completed: false,
        message: ""
      },
      handoffComplete: false,
      events: Array.isArray(existingEvents) ? existingEvents.slice(-MAX_EVENTS) : []
    };
  }

  function createSessionId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "session-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== PROTOTYPE_VERSION || !Array.isArray(parsed.events)) return null;
      if (!Number.isInteger(parsed.screenIndex) || parsed.screenIndex < 0 || parsed.screenIndex >= SCREENS.length) return null;
      return parsed;
    } catch (error) {
      storageAvailable = false;
      return memoryState;
    }
  }

  function persist() {
    state.events = state.events.slice(-MAX_EVENTS);
    memoryState = state;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageAvailable = true;
      dom.saveStatus.textContent = "V3 progress is stored only in this browser.";
    } catch (error) {
      storageAvailable = false;
      dom.saveStatus.textContent = "Browser storage is unavailable; progress will last only until this page closes.";
    }
    updateEventCount();
  }

  function currentScreen() {
    return SCREENS[state.screenIndex];
  }

  function ensureActivity(screen) {
    if (!state.activities[screen.id]) {
      const item = screen.item || {};
      state.activities[screen.id] = {
        initialComparison: null,
        initialLocked: item.initialRequired === false,
        alignedLeft: false,
        alignedRight: false,
        alignmentAttempts: { left: 0, right: 0 },
        aligned: item.alignmentRequired === false,
        selectedLeft: null,
        selectedRight: null,
        relation: null,
        pathIndex: 0,
        proofAttempts: [],
        proofErrors: 0,
        showHeadings: false,
        emptyAnswer: null,
        emptyAttempts: 0,
        emptyCorrect: false,
        completed: false,
        message: "",
        messageKind: "neutral",
        attemptStartedAt: Date.now()
      };
    }
    const activity = state.activities[screen.id];
    if (!activity.alignmentAttempts) activity.alignmentAttempts = { left: 0, right: 0 };
    if (!Array.isArray(activity.proofAttempts)) activity.proofAttempts = [];
    if (!Number.isInteger(activity.emptyAttempts)) activity.emptyAttempts = 0;
    return activity;
  }

  function render() {
    const screen = currentScreen();
    const progress = Math.round(((screen.scene - 1) / (SCREENS.length - 1)) * 100);

    dom.phaseLabel.textContent = screen.phase;
    dom.screenCounter.textContent = "Scene " + screen.scene + " of " + SCREENS.length;
    dom.progressFill.style.width = progress + "%";
    dom.progressTrack.setAttribute("aria-valuenow", String(progress));
    dom.screenJump.value = String(state.screenIndex);
    dom.missionFrame.dataset.screenType = screen.type;
    dom.missionFrame.classList.toggle("is-archived", Boolean(screen.archived));
    dom.missionFrame.classList.toggle("failure-active", screen.id === "trap-sprung");

    renderCharacter(screen);
    renderRadar(screen);
    renderTrapOverlay(screen);

    if (screen.type === "briefing") dom.screenMount.innerHTML = renderBriefing(screen);
    else if (screen.type === "replayWhole") dom.screenMount.innerHTML = renderReplayWhole(screen);
    else if (screen.type === "replayDecimal") dom.screenMount.innerHTML = renderReplayDecimal(screen);
    else if (screen.type === "failure") dom.screenMount.innerHTML = renderFailure(screen);
    else if (screen.type === "alignRepair") dom.screenMount.innerHTML = renderAlignRepair(screen);
    else if (screen.type === "trial") dom.screenMount.innerHTML = renderTrial(screen);
    else if (screen.type === "lesson") dom.screenMount.innerHTML = renderLesson(screen);
    else if (screen.type === "manualHandoff") dom.screenMount.innerHTML = renderManualHandoff(screen);
    else if (screen.type === "boundary") dom.screenMount.innerHTML = renderBoundary(screen);
    else dom.screenMount.innerHTML = renderMissionReturn(screen);

    updateEventCount();
    updateLogDrawer();
  }

  function renderCharacter(screen) {
    const character = CHARACTER_ASSETS[screen.character] || CHARACTER_ASSETS.bellumExplain;
    dom.characterPortrait.src = character.src;
    dom.characterPortrait.alt = character.alt;
    dom.speakerRole.textContent = character.role;
    dom.speakerName.textContent = character.name;
    dom.characterCard.classList.toggle("dramatic-specter", Boolean(screen.dramatic));
  }

  function renderRadar(screen) {
    const mode = screen.radar || "absent";
    const absent = mode === "absent";
    dom.radarPanel.hidden = absent;
    dom.stageLayout.classList.toggle("radar-absent", absent);
    if (absent) return;

    dom.radarScreen.className = "radar-screen " + mode;
    if (mode === "manual") {
      dom.radarStateBadge.textContent = "Planned handoff";
      dom.radarScreen.innerHTML = [
        '<div class="manual-screen radar-content">',
        '<span class="manual-icon" aria-hidden="true">⚓</span>',
        '<div class="radar-status"><span class="status-dot"></span>TRAINING COMPLETE — MANUAL MODE</div>',
        '<p class="radar-copy">The radar completed its training job. There is no countdown, failure, or time pressure.</p>',
        '</div>'
      ].join("");
      return;
    }

    if (mode === "alert") {
      dom.radarStateBadge.textContent = "Alert only";
      dom.radarScreen.innerHTML = [
        '<div class="radar-content">',
        '<div class="radar-status"><span class="status-dot"></span>PLACE-VALUE ALERT</div>',
        '<p class="radar-alert">DECIMAL FORMS DIFFER. DECIDE WITH PLACE VALUE.</p>',
        '<p class="radar-copy">The reminder stops here. Align and compare for yourself.</p>',
        '</div>'
      ].join("");
      return;
    }

    dom.radarStateBadge.textContent = "Full training support";
    dom.radarScreen.innerHTML = [
      '<div class="radar-content">',
      '<div class="radar-status"><span class="status-dot"></span>PLACE-VALUE RADAR</div>',
      '<p class="radar-alert">ONE DECIMAL HAS MORE DIGITS. MORE DIGITS DO NOT MEAN GREATER. ALIGN AND COMPARE.</p>',
      '<p class="radar-copy">The radar is only a reminder. It does not identify the stronger orb.</p>',
      renderSailMini(),
      '</div>'
    ].join("");
  }

  function renderTrapOverlay(screen) {
    dom.trapOverlay.hidden = true;
    if (screen.id === "replay-decimal" || screen.id === "trap-sprung") {
      dom.trapOverlay.src = "assets/trap-open-right.png";
      dom.trapOverlay.hidden = false;
      return;
    }
    if (screen.type !== "trial") return;
    const activity = ensureActivity(screen);
    if (!activity.completed) return;
    if (screen.item.correctInitial === "equal") return;
    dom.trapOverlay.src = screen.item.correctInitial === "right" ? "assets/trap-open-right.png" : "assets/trap-open-left.png";
    dom.trapOverlay.hidden = false;
  }

  function renderBriefing(screen) {
    return [
      '<article>',
      '<p class="screen-kicker">Recovered battle intelligence</p>',
      '<h2 id="screen-title" tabindex="-1">' + escapeHtml(screen.title) + '</h2>',
      '<section class="recording-panel" aria-label="Recovered battle log">',
      '<span class="recording-icon" aria-hidden="true">▣</span>',
      '<div><strong>Recovered Battle Log</strong><span>Prior Encounter with Specter</span></div>',
      '</section>',
      '<blockquote class="dialogue-quote">Agent Decimal, we recovered a recording of Specter’s last encounter with another agent. His ghostly scouts had studied how agents compare whole numbers during their training. Watch how he used that knowledge to set a trap.</blockquote>',
      '<div class="screen-actions"><button class="primary-button" type="button" data-action="continue">Play Recovered Recording</button></div>',
      '</article>'
    ].join("");
  }

  function renderReplayWhole(screen) {
    return [
      '<article>',
      renderArchiveBanner(),
      '<p class="screen-kicker">Orb Chain 1</p>',
      '<h2 id="screen-title" tabindex="-1">' + escapeHtml(screen.title) + '</h2>',
      renderNumberTypeBadge("WHOLE NUMBERS", "▦"),
      renderOrbs("7", "52", true),
      '<div class="replay-dialogue"><p><strong>Specter:</strong> “Choose the stronger orb.”</p><p><strong>Prior agent:</strong> “52. It has two digits, while 7 has one.”</p></div>',
      '<div class="replay-status success" role="status"><span class="status-symbol" aria-hidden="true">✓</span><strong>CONTAINMENT SUCCESSFUL: 52 &gt; 7</strong></div>',
      '<blockquote class="dialogue-quote specter-line">Correct. Keep that method in mind.</blockquote>',
      '<div class="screen-actions"><button class="primary-button" type="button" data-action="continue">Continue archived replay</button></div>',
      '</article>'
    ].join("");
  }

  function renderReplayDecimal(screen) {
    return [
      '<article>',
      renderArchiveBanner(),
      '<p class="screen-kicker">Orb Chain 2</p>',
      '<h2 id="screen-title" tabindex="-1">' + escapeHtml(screen.title) + '</h2>',
      renderNumberTypeBadge("DECIMALS", "·"),
      renderOrbs("0.7", "0.52", true, "right-chosen"),
      '<div class="replay-dialogue"><p><strong>Specter:</strong> “Now choose the stronger orb.”</p><p><strong>Prior agent:</strong> “That is easy—it is just 7 versus 52 with decimal points. I choose 0.52.”</p></div>',
      '<div class="containment-overload" role="status"><span class="large-x" aria-hidden="true">✕</span><div><strong>RIGHT FIELD OVERLOAD</strong><span>The 0.52 orb was sent to the stronger containment field.</span></div></div>',
      '<p class="failure-copy"><span aria-hidden="true">⚠</span> The containment field opens unsuccessfully.</p>',
      '<div class="screen-actions"><button class="primary-button" type="button" data-action="continue">See the trap spring</button></div>',
      '</article>'
    ].join("");
  }

  function renderFailure(screen) {
    return [
      '<article class="failure-stage">',
      renderArchiveBanner(),
      '<h2 id="screen-title" class="failure-heading" tabindex="-1"><span class="failure-x" aria-hidden="true">✕</span><span>MY WHOLE-NUMBER TRAP WORKED!</span></h2>',
      '<p class="containment-failed" role="status">CONTAINMENT FAILED</p>',
      '<blockquote class="dialogue-quote specter-laugh">HA! Just as my scouts predicted! The agent saw more digits and expected more power!</blockquote>',
      '<p class="screen-lead">Bellum freezes the archived replay.</p>',
      '<div class="screen-actions"><button class="primary-button" type="button" data-action="continue">Freeze replay and repair the comparison</button></div>',
      '</article>'
    ].join("");
  }

  function renderAlignRepair(screen) {
    const activity = ensureActivity(screen);
    return [
      '<article>',
      renderFrozenArchiveBanner(),
      '<p class="screen-kicker">Bellum begins the active repair</p>',
      '<h2 id="screen-title" tabindex="-1">' + escapeHtml(screen.title) + '</h2>',
      '<blockquote class="dialogue-quote">That method worked for 7 and 52 because both are whole numbers. But Specter’s new numbers, 0.7 and 0.52, are decimals. With decimals, having more digits <strong>does not</strong> mean a number is greater. To compare decimals correctly, let’s line up the decimal points and find the first place, from left to right, where the digits are different.</blockquote>',
      activity.completed
        ? renderCompletedAlignment("0.7", "0.52")
        : renderAlignmentTask("0.7", "0.52", activity, "Tap the decimal point in each number."),
      renderActivityMessage(activity),
      activity.completed
        ? '<div class="info-callout"><span class="callout-icon" aria-hidden="true">✓</span><span>The decimal points are aligned. Tenths now sit under tenths. The hundredths cell after 0.7 stays empty.</span></div>'
        : '<p class="interaction-note">Use the real buttons in the numbers. If you tap a digit instead, Bellum will help you realign.</p>',
      '<div class="screen-actions">',
      activity.completed ? '<button class="primary-button" type="button" data-action="continue">Compare the aligned place values</button>' : '',
      '</div>',
      '</article>'
    ].join("");
  }

  function renderTrial(screen) {
    const item = screen.item;
    const activity = ensureActivity(screen);
    let task;

    if (!activity.initialLocked) task = renderInitialComparison(item, activity);
    else if (item.alignmentRequired && !activity.aligned) task = renderTrialAlignment(item, activity);
    else if (activity.pathIndex < item.path.length) task = renderProofStep(item, activity);
    else if (item.emptyQuestion && !activity.emptyCorrect) task = renderEmptyPlaceStep(item, activity);
    else if (!activity.completed) task = renderFinalLock(item, activity);
    else task = renderCompletedTrial(item, activity);

    const lead = item.initialRequired && !activity.initialLocked
      ? '<p class="screen-lead">First, compare the plasma orbs. Next, use place value to show why.</p>'
      : screen.id === "repair-proof"
        ? '<blockquote class="dialogue-quote">Start with the tenths. Select the digit in the tenths place of each number.</blockquote>'
        : '<p class="screen-lead">' + escapeHtml(item.proofIntro) + '</p>';

    return [
      '<article class="interactive-comparison">',
      screen.frozenReplay ? renderFrozenArchiveBanner() : '',
      '<p class="screen-kicker">' + escapeHtml(screen.phase) + '</p>',
      '<h2 id="screen-title" tabindex="-1">' + escapeHtml(screen.title) + '</h2>',
      lead,
      screen.id === "manual-a" || screen.id === "manual-b" ? '' : renderNumberTypeBadge(item.numberType, "·"),
      task,
      '</article>'
    ].join("");
  }

  function renderInitialComparison(item, activity) {
    return [
      renderOrbs(item.left, item.right, true),
      '<form id="initial-comparison-form" novalidate>',
      '<fieldset class="question-group"><legend>Which comparison is correct?</legend>',
      '<div class="choice-grid three-up">',
      renderComparisonChoice("left", item.left + " is greater", activity.initialComparison),
      renderComparisonChoice("equal", "They are equal", activity.initialComparison),
      renderComparisonChoice("right", item.right + " is greater", activity.initialComparison),
      '</div></fieldset>',
      renderActivityMessage(activity),
      '<div class="screen-actions"><button class="primary-button" type="submit">Confirm choice</button></div>',
      '</form>'
    ].join("");
  }

  function renderTrialAlignment(item, activity) {
    return [
      '<div class="choice-recorded"><span aria-hidden="true">✓</span><span>Choice confirmed. Now use place value to show why.</span></div>',
      renderAlignmentTask(item.left, item.right, activity, "Tap the decimal point in each number to align corresponding places."),
      renderActivityMessage(activity)
    ].join("");
  }

  function renderProofStep(item, activity) {
    const step = item.path[activity.pathIndex];
    const showAligned = item.alignedDisplay || activity.showHeadings;
    return [
      item.initialRequired ? '<div class="choice-recorded"><span aria-hidden="true">✓</span><span>Choice confirmed. Now use place value to show why.</span></div>' : '',
      '<section class="proof-workbench" aria-labelledby="proof-prompt">',
      '<div class="proof-progress">Place-value proof · step ' + (activity.pathIndex + 1) + ' of ' + item.path.length + '</div>',
      '<h3 id="proof-prompt">' + renderProofPrompt(step) + '</h3>',
      showAligned
        ? renderPlaceGrid(item.left, item.right, activity, true)
        : renderRawProofRows(item.left, item.right, activity),
      '<form id="proof-relation-form" novalidate>',
      '<p class="selection-pair-label">Selected proof pair</p>',
      '<fieldset class="question-group relation-group"><legend>How do the selected digits compare?</legend>',
      renderInlineRelationRow(item, activity),
      '</fieldset>',
      renderActivityMessage(activity),
      '<div class="screen-actions"><button class="primary-button" type="submit">Check this step</button></div>',
      '</form>',
      '</section>'
    ].join("");
  }

  function renderProofPrompt(step) {
    const currentPlace = placeNameFromIndex(step.leftIndex);
    return escapeHtml(step.prompt).replace(/\b(ones|tenths|hundredths|thousandths)\b/gi, function (match) {
      return match.toLowerCase() === currentPlace
        ? '<strong class="place-cue">' + match + '</strong>'
        : match;
    });
  }

  function renderEmptyPlaceStep(item, activity) {
    return [
      '<section class="proof-workbench" aria-labelledby="empty-place-title">',
      '<div class="proof-progress">Place-value proof · continue to the hundredths</div>',
      '<h3 id="empty-place-title">The tenths are equal. What does the empty hundredths place after 0.6 represent?</h3>',
      renderPlaceGrid(item.left, item.right, activity, false, true),
      '<form id="empty-place-form" novalidate>',
      '<fieldset class="question-group"><legend>Choose the value of the empty hundredths place.</legend>',
      '<div class="choice-grid three-up">',
      renderNamedChoice("empty-place", "zero", "0 hundredths", activity.emptyAnswer),
      renderNamedChoice("empty-place", "none", "No value at all", activity.emptyAnswer),
      renderNamedChoice("empty-place", "six", "6 hundredths", activity.emptyAnswer),
      '</div></fieldset>',
      renderActivityMessage(activity),
      '<div class="screen-actions"><button class="primary-button" type="submit">Lock the hundredths meaning</button></div>',
      '</form>',
      '</section>'
    ].join("");
  }

  function renderFinalLock(item, activity) {
    return [
      '<section class="final-lock-panel" aria-labelledby="final-lock-title">',
      '<span class="final-lock-icon" aria-hidden="true">⌁</span>',
      '<div><p class="screen-kicker">Place-value proof ready</p>',
      '<h3 id="final-lock-title">' + escapeHtml(item.finalExpression) + '</h3>',
      '<p>Lock the completed comparison into the containment field.</p></div>',
      '</section>',
      renderActivityMessage(activity),
      '<div class="screen-actions"><button class="primary-button" type="button" data-action="lock-final">Lock ' + escapeHtml(item.finalExpression) + '</button></div>'
    ].join("");
  }

  function renderCompletedTrial(item, activity) {
    return [
      renderOrbs(item.left, item.right, true, item.correctInitial + "-contained"),
      '<section class="feedback-panel success" id="feedback-panel" role="status" tabindex="-1">',
      '<h3 class="feedback-title"><span aria-hidden="true">✓</span>PLACE-VALUE PROOF COMPLETE</h3>',
      '<p class="feedback-detail">' + escapeHtml(item.correctFeedback) + '</p>',
      '</section>',
      screenOutcome(item),
      '<div class="screen-actions"><button class="primary-button" type="button" data-action="continue">' + escapeHtml(item.nextLabel) + '</button></div>'
    ].join("");
  }

  function screenOutcome(item) {
    if (item.id === "repair_07_052") {
      return '<p class="containment-success"><span aria-hidden="true">✓</span> The correct containment field activates and captures the 0.7 orb.</p>';
    }
    return '';
  }

  function renderLesson(screen) {
    return [
      '<article>',
      '<p class="screen-kicker">Bellum names the repaired boundary</p>',
      '<h2 id="screen-title" tabindex="-1">' + escapeHtml(screen.title) + '</h2>',
      '<blockquote class="dialogue-quote">Counting digits helped with 7 and 52 because both were positive whole numbers. For decimals, the number of written digits does not decide which value is greater. Align the decimal points and compare the same place values from left to right.</blockquote>',
      '<div class="type-contrast" aria-label="Number-type boundary">',
      '<section class="type-card whole"><span class="type-icon" aria-hidden="true">▦</span><strong>WHOLE NUMBERS</strong><p>For positive whole numbers, different digit counts can help compare size.</p></section>',
      '<section class="type-card decimal"><span class="type-icon" aria-hidden="true">·</span><strong>DECIMALS</strong><p>The number of written digits does not decide size. Align and compare corresponding places.</p></section>',
      '</div>',
      '<blockquote class="dialogue-quote">The radar is only a reminder. It does not identify the stronger orb.</blockquote>',
      renderSailCards(),
      '<div class="screen-actions"><button class="primary-button" type="button" data-action="continue">Begin guided practice</button></div>',
      '</article>'
    ].join("");
  }

  function renderManualHandoff(screen) {
    return [
      '<article>',
      '<p class="screen-kicker">Planned scaffold fading</p>',
      '<h2 id="screen-title" tabindex="-1">' + escapeHtml(screen.title) + '</h2>',
      '<blockquote class="dialogue-quote">The radar has completed its training job. I am powering it down now. The next comparisons are yours.</blockquote>',
      '<blockquote class="dialogue-quote">Spot the number type. For decimals, align and compare corresponding places from left to right. I have faith in you, Agent Decimal.</blockquote>',
      '<div class="manual-handoff-note"><span aria-hidden="true">⚓</span><div><strong>TRAINING COMPLETE — MANUAL MODE</strong><p>The handoff is intentional. There is no countdown, accidental battery failure, or time pressure.</p></div></div>',
      '<div class="screen-actions"><button class="primary-button" type="button" data-action="continue">Enter Manual Mode</button></div>',
      '</article>'
    ].join("");
  }

  function renderBoundary(screen) {
    const runtime = state.boundary;
    const options = BOUNDARY_OPTIONS.map(function (option) {
      return renderNamedChoice("boundary", option.value, option.label, runtime.selected, runtime.completed);
    }).join("");
    return [
      '<article>',
      '<p class="screen-kicker">Bellum’s navigation log</p>',
      '<h2 id="screen-title" tabindex="-1">' + escapeHtml(screen.title) + '</h2>',
      '<div class="navigation-log"><span aria-hidden="true">☷</span><p>One line is missing from the recovered navigation rule.</p></div>',
      '<form id="boundary-form" novalidate>',
      '<fieldset class="question-group debrief-options"><legend>Complete the rule that defeats Specter’s Whole-Number Trap.</legend>',
      options,
      '</fieldset>',
      runtime.message ? '<section class="feedback-panel ' + (runtime.completed ? 'success' : 'retry') + '" id="feedback-panel" role="status" tabindex="-1"><h3 class="feedback-title"><span aria-hidden="true">' + (runtime.completed ? '✓' : '!') + '</span>' + (runtime.completed ? 'Boundary restored' : 'Repair the boundary') + '</h3><p class="feedback-detail">' + escapeHtml(runtime.message) + '</p></section>' : '',
      runtime.completed ? '<blockquote class="dialogue-quote">Sometimes counting decimal digits may happen to give the correct answer, but it is not a reliable method. To compare decimals, line up the decimal points and compare digits in the same place from left to right.</blockquote>' : '',
      '<div class="screen-actions">',
      runtime.completed
        ? '<button class="primary-button" type="button" data-action="continue">Return to the Ocean Adventure mission</button>'
        : '<button class="primary-button" type="submit">Check the completed rule</button>',
      '</div>',
      '</form>',
      '</article>'
    ].join("");
  }

  function renderMissionReturn(screen) {
    const summary = calculateSessionSummary();
    return [
      '<article>',
      '<p class="screen-kicker">Back to the present-day mission</p>',
      '<h2 id="screen-title" tabindex="-1">' + escapeHtml(screen.title) + '</h2>',
      '<blockquote class="dialogue-quote">Now you know how Specter’s trap works. Contain his plasma orbs by comparing their values.</blockquote>',
      state.handoffComplete
        ? '<section class="feedback-panel success" role="status"><h3 class="feedback-title"><span aria-hidden="true">✓</span>MISSION HANDOFF REACHED</h3><p class="feedback-detail">The existing SpecterOrb1 activity would begin here. CTAT is intentionally outside this local prototype.</p></section>'
        : '',
      '<div class="completion-grid">',
      renderCompletionStat(summary.initialCorrect + "/" + summary.initialTotal, "First comparison choices"),
      renderCompletionStat(summary.proofCorrect + "/" + summary.proofTotal, "First proof steps"),
      renderCompletionStat(formatDuration(summary.elapsedMs), "Session duration"),
      '</div>',
      '<div class="completion-actions">',
      state.handoffComplete
        ? '<button class="primary-button" type="button" data-action="restart">Start a new local run</button>'
        : '<button class="primary-button" type="button" data-action="mission-handoff">Begin Contain the Plasma Orbs</button>',
      '<button class="secondary-button" type="button" data-action="download-json">Download JSON log</button>',
      '<button class="secondary-button" type="button" data-action="download-csv">Download CSV log</button>',
      '</div>',
      '</article>'
    ].join("");
  }

  function renderArchiveBanner() {
    return '<div class="archive-banner"><span aria-hidden="true">◉</span><strong>ARCHIVED BATTLE REPLAY</strong><span>Prior encounter · read-only</span></div>';
  }

  function renderFrozenArchiveBanner() {
    return '<div class="archive-banner frozen"><span aria-hidden="true">❚❚</span><strong>ARCHIVED BATTLE REPLAY</strong><span>Frozen for place-value repair</span></div>';
  }

  function renderNumberTypeBadge(label, icon) {
    return '<div class="number-type-badge"><span aria-hidden="true">' + escapeHtml(icon) + '</span><strong>' + escapeHtml(label) + '</strong></div>';
  }

  function renderOrbs(left, right, staticOrbs, stateClass) {
    return [
      '<div class="orb-readings ' + (staticOrbs ? 'orbs-paused ' : '') + escapeHtml(stateClass || '') + '" aria-label="Left orb ' + escapeHtml(left) + '; right orb ' + escapeHtml(right) + '">',
      '<div class="orb-card"><img src="assets/plasma-orb-left.png" alt="" aria-hidden="true"><span class="orb-side-label">Left plasma orb</span><strong class="orb-value">' + escapeHtml(left) + '</strong></div>',
      '<span class="versus-badge" aria-hidden="true">VS</span>',
      '<div class="orb-card"><img src="assets/plasma-orb-right.png" alt="" aria-hidden="true"><span class="orb-side-label">Right plasma orb</span><strong class="orb-value">' + escapeHtml(right) + '</strong></div>',
      '</div>'
    ].join("");
  }

  function renderAlignmentTask(left, right, activity, instruction) {
    return [
      '<section class="alignment-workbench" aria-labelledby="alignment-instruction">',
      '<h3 id="alignment-instruction">' + escapeHtml(instruction) + '</h3>',
      '<div class="horizontal-readings">',
      renderAlignmentNumber("left", left, activity.alignedLeft),
      '<span class="versus-badge" aria-hidden="true">VS</span>',
      renderAlignmentNumber("right", right, activity.alignedRight),
      '</div>',
      '<p class="selection-status" aria-live="polite">' + (activity.alignedLeft ? 'Left decimal point selected. ' : '') + (activity.alignedRight ? 'Right decimal point selected.' : '') + '</p>',
      '</section>'
    ].join("");
  }

  function renderAlignmentNumber(side, value, selected) {
    const chars = Array.from(value).map(function (character, index) {
      const isPoint = character === ".";
      const label = isPoint ? "decimal point" : "digit " + character;
      const pressed = isPoint && selected;
      return '<button class="align-char ' + (isPoint ? 'decimal-point' : '') + (pressed ? ' selected' : '') + '" type="button" data-action="align-char" data-side="' + side + '" data-index="' + index + '" data-character="' + escapeHtml(character) + '" aria-label="' + capitalize(side) + ' number, ' + label + '" aria-pressed="' + String(pressed) + '">' + escapeHtml(character) + '</button>';
    }).join("");
    return '<div class="align-number" aria-label="' + capitalize(side) + ' number ' + escapeHtml(value) + '">' + chars + '</div>';
  }

  function renderCompletedAlignment(left, right) {
    return [
      '<section class="alignment-workbench">',
      '<h3>Decimal points aligned</h3>',
      renderPlaceGrid(left, right, { selectedLeft: null, selectedRight: null }, false),
      '</section>'
    ].join("");
  }

  function renderPlaceGrid(left, right, activity, interactive, emphasizeEmpty) {
    const maxPlaces = Math.max(decimalPlaces(left), decimalPlaces(right));
    const labels = ["Ones", "Decimal point", "Tenths", "Hundredths", "Thousandths"].slice(0, maxPlaces + 2);
    return [
      '<div class="place-grid" style="--data-columns:' + labels.length + '" aria-label="Numbers in place-value columns">',
      '<span class="place-heading row-heading" aria-hidden="true"></span>',
      labels.map(function (label) { return '<span class="place-heading">' + escapeHtml(label) + '</span>'; }).join(""),
      renderPlaceRow("LEFT", left, maxPlaces, activity, "left", interactive, emphasizeEmpty),
      renderPlaceRow("RIGHT", right, maxPlaces, activity, "right", interactive, false),
      '</div>'
    ].join("");
  }

  function renderPlaceRow(label, value, maxPlaces, activity, side, interactive, emphasizeEmpty) {
    const parts = decimalParts(value);
    const cells = [parts.ones, "."];
    for (let i = 0; i < maxPlaces; i += 1) cells.push(parts.fraction[i] || "");
    return '<span class="place-row-label">' + label + '</span>' + cells.map(function (character, columnIndex) {
      const rawIndex = columnIndex === 0 ? 0 : columnIndex === 1 ? 1 : columnIndex;
      if (!character) {
        return '<span class="place-cell empty-cell ' + (emphasizeEmpty ? 'emphasized-empty' : '') + '" aria-label="Empty ' + escapeHtml(placeNameFromIndex(rawIndex)) + ' place"><span aria-hidden="true">□</span></span>';
      }
      if (character === ".") return '<span class="place-cell point-cell" aria-label="decimal point">.</span>';
      if (!interactive) return '<span class="place-cell digit-cell">' + escapeHtml(character) + '</span>';
      const selected = side === "left" ? activity.selectedLeft === rawIndex : activity.selectedRight === rawIndex;
      return '<button class="place-cell digit-button ' + (selected ? 'selected' : '') + '" type="button" data-action="proof-digit" data-side="' + side + '" data-index="' + rawIndex + '" aria-pressed="' + String(selected) + '" aria-label="' + capitalize(side) + ' number, ' + character + ' in the ' + escapeHtml(placeNameFromIndex(rawIndex)) + ' place">' + escapeHtml(character) + '</button>';
    }).join("");
  }

  function renderRawProofRows(left, right, activity) {
    return [
      '<div class="raw-proof-rows" aria-label="Select corresponding digits from each number">',
      '<div><span>LEFT</span>' + renderProofNumber("left", left, activity.selectedLeft) + '</div>',
      '<div><span>RIGHT</span>' + renderProofNumber("right", right, activity.selectedRight) + '</div>',
      '</div>'
    ].join("");
  }

  function renderProofNumber(side, value, selectedIndex) {
    const chars = Array.from(value).map(function (character, index) {
      if (character === ".") return '<span class="raw-decimal-point" aria-label="decimal point">.</span>';
      const selected = selectedIndex === index;
      return '<button class="raw-digit-button ' + (selected ? 'selected' : '') + '" type="button" data-action="proof-digit" data-side="' + side + '" data-index="' + index + '" aria-pressed="' + String(selected) + '" aria-label="' + capitalize(side) + ' number, ' + character + ' in the ' + escapeHtml(placeNameFromIndex(index)) + ' place">' + escapeHtml(character) + '</button>';
    }).join("");
    return '<span class="raw-number">' + chars + '</span>';
  }

  function renderInlineRelationRow(item, activity) {
    const left = activity.selectedLeft === null ? "—" : item.left.charAt(activity.selectedLeft);
    const right = activity.selectedRight === null ? "—" : item.right.charAt(activity.selectedRight);
    const relationDisabled = activity.selectedLeft === null || activity.selectedRight === null;
    return [
      '<div class="inline-relation-row">',
      '<strong class="selected-comparison-digit" aria-label="Selected left digit: ' + escapeHtml(left) + '">' + escapeHtml(left) + '</strong>',
      '<div class="inline-relation-options" aria-label="Choose the comparison symbol">',
      renderRelationChoice(">", activity.relation, relationDisabled),
      renderRelationChoice("=", activity.relation, relationDisabled),
      renderRelationChoice("<", activity.relation, relationDisabled),
      '</div>',
      '<strong class="selected-comparison-digit" aria-label="Selected right digit: ' + escapeHtml(right) + '">' + escapeHtml(right) + '</strong>',
      '</div>'
    ].join("");
  }

  function renderComparisonChoice(value, label, selected) {
    return renderNamedChoice("initial-comparison", value, label, selected);
  }

  function renderRelationChoice(value, selected, disabled) {
    return renderNamedChoice("proof-relation", value, value, selected, disabled);
  }

  function renderNamedChoice(name, value, label, selected, disabled) {
    return [
      '<label class="choice-chip">',
      '<input type="radio" name="' + escapeHtml(name) + '" value="' + escapeHtml(value) + '"' + (selected === value ? ' checked' : '') + (disabled ? ' disabled' : '') + '>',
      '<span class="choice-main">' + escapeHtml(label) + '</span>',
      '</label>'
    ].join("");
  }

  function renderActivityMessage(activity) {
    if (!activity.message) return '<p class="form-message" id="form-message" role="status" aria-live="polite"></p>';
    return '<p class="form-message ' + escapeHtml(activity.messageKind || "neutral") + '" id="form-message" role="status" aria-live="polite" tabindex="-1">' + escapeHtml(activity.message) + '</p>';
  }

  function renderSailCards() {
    const steps = [
      ["S", "Spot", "Spot the number type: whole numbers or decimals."],
      ["A", "Align", "Align the decimal points."],
      ["I", "Inspect", "Inspect corresponding places from left to right."],
      ["L", "Lock", "Lock the comparison with place-value evidence."]
    ];
    return '<div class="sail-grid" aria-label="SAIL place-value strategy">' + steps.map(function (step) {
      return '<div class="sail-card"><span class="sail-letter">' + step[0] + '</span><strong>' + step[1] + '</strong><span>' + step[2] + '</span></div>';
    }).join("") + '</div>';
  }

  function renderSailMini() {
    return [
      '<ol class="sail-mini" aria-label="SAIL steps">',
      '<li><strong>S</strong><span>Spot the number type</span></li>',
      '<li><strong>A</strong><span>Align decimal points</span></li>',
      '<li><strong>I</strong><span>Inspect corresponding places</span></li>',
      '<li><strong>L</strong><span>Lock with evidence</span></li>',
      '</ol>'
    ].join("");
  }

  function renderCompletionStat(value, label) {
    return '<div class="completion-stat"><strong>' + escapeHtml(String(value)) + '</strong><span>' + escapeHtml(label) + '</span></div>';
  }

  function handleScreenClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.getAttribute("data-action");

    if (action === "continue") advanceScreen();
    else if (action === "align-char") selectAlignmentCharacter(button);
    else if (action === "proof-digit") selectProofDigit(button);
    else if (action === "lock-final") lockFinalComparison();
    else if (action === "mission-handoff") completeMissionHandoff();
    else if (action === "restart") restartMission();
    else if (action === "download-json") downloadJsonLog();
    else if (action === "download-csv") downloadCsvLog();
  }

  function handleScreenSubmit(event) {
    event.preventDefault();
    if (event.target.id === "initial-comparison-form") submitInitialComparison(event.target);
    else if (event.target.id === "proof-relation-form") submitProofStep(event.target);
    else if (event.target.id === "empty-place-form") submitEmptyPlace(event.target);
    else if (event.target.id === "boundary-form") submitBoundary(event.target);
  }

  function selectAlignmentCharacter(button) {
    const screen = currentScreen();
    const activity = ensureActivity(screen);
    const side = button.getAttribute("data-side");
    const index = Number(button.getAttribute("data-index"));
    const character = button.getAttribute("data-character");
    const correct = character === ".";
    activity.alignmentAttempts[side] = (activity.alignmentAttempts[side] || 0) + 1;

    logEvent("response", {
      itemId: screen.item ? screen.item.id : "repair_alignment",
      responsePart: "alignment_selection",
      evidenceRole: "place_value_proof",
      response: side + ":" + index + ":" + character,
      correct: correct,
      attempt: activity.alignmentAttempts[side],
      latencyMs: Date.now() - activity.attemptStartedAt
    });

    if (!correct) {
      activity.message = "Line up decimal point with decimal point so tenths are under tenths.";
      activity.messageKind = "retry";
      persist();
      render();
      focusAfterRender("#form-message");
      return;
    }

    if (side === "left") activity.alignedLeft = true;
    if (side === "right") activity.alignedRight = true;
    activity.message = "";
    if (activity.alignedLeft && activity.alignedRight) {
      activity.aligned = true;
      if (screen.type === "alignRepair") activity.completed = true;
      logEvent("alignment_complete", {
        itemId: screen.item ? screen.item.id : "repair_alignment",
        responsePart: "alignment",
        evidenceRole: "place_value_proof",
        response: "decimal points aligned",
        correct: true,
        latencyMs: Date.now() - activity.attemptStartedAt
      });
    }
    persist();
    render();
    focusAfterRender(activity.aligned ? (screen.type === "alignRepair" ? ".primary-button" : "#proof-prompt") : ".decimal-point:not(.selected)");
  }

  function submitInitialComparison(form) {
    const screen = currentScreen();
    const item = screen.item;
    const activity = ensureActivity(screen);
    const data = new FormData(form);
    const response = data.get("initial-comparison");
    if (!response) {
      activity.message = "Choose a comparison before continuing.";
      activity.messageKind = "retry";
      persist();
      render();
      focusAfterRender("#form-message");
      return;
    }

    activity.initialComparison = response;
    activity.initialLocked = true;
    activity.message = "";
    activity.messageKind = "neutral";
    logEvent("response", {
      itemId: item.id,
      responsePart: "initial_comparison",
      evidenceRole: "initial_answer",
      response: response,
      correct: response === item.correctInitial,
      attempt: 1,
      latencyMs: Date.now() - activity.attemptStartedAt
    });
    activity.attemptStartedAt = Date.now();
    persist();
    render();
    focusAfterRender(item.alignmentRequired ? "#alignment-instruction" : "#proof-prompt");
  }

  function selectProofDigit(button) {
    const screen = currentScreen();
    const activity = ensureActivity(screen);
    const side = button.getAttribute("data-side");
    const index = Number(button.getAttribute("data-index"));
    const item = screen.item;
    const step = item.path[activity.pathIndex];

    const wasSelected = side === "left" ? activity.selectedLeft === index : activity.selectedRight === index;
    if (side === "left") activity.selectedLeft = wasSelected ? null : index;
    else activity.selectedRight = wasSelected ? null : index;
    activity.message = "";

    logEvent("proof_action", {
      itemId: item.id,
      responsePart: "proof_digit_selection",
      evidenceRole: "place_value_proof",
      response: (wasSelected ? "deselected" : "selected") + ":" + side + ":" + placeNameFromIndex(index) + ":" + (side === "left" ? item.left.charAt(index) : item.right.charAt(index)),
      correct: wasSelected ? null : (side === "left" ? index === step.leftIndex : index === step.rightIndex),
      attempt: (activity.proofAttempts[activity.pathIndex] || 0) + 1,
      latencyMs: Date.now() - activity.attemptStartedAt
    });
    persist();
    render();
    focusAfterRender(side === "left"
      ? 'button[data-action="proof-digit"][data-side="right"]'
      : 'input[name="proof-relation"]');
  }

  function submitProofStep(form) {
    const screen = currentScreen();
    const item = screen.item;
    const activity = ensureActivity(screen);
    const step = item.path[activity.pathIndex];
    const data = new FormData(form);
    const relation = data.get("proof-relation");
    activity.relation = relation;

    if (activity.selectedLeft === null || activity.selectedRight === null || !relation) {
      activity.message = "Select one digit from each number and choose how they compare.";
      activity.messageKind = "retry";
      persist();
      render();
      focusAfterRender("#form-message");
      return;
    }

    const pairCorrect = activity.selectedLeft === step.leftIndex && activity.selectedRight === step.rightIndex;
    const relationCorrect = relation === step.relation;
    const attempt = (activity.proofAttempts[activity.pathIndex] || 0) + 1;
    activity.proofAttempts[activity.pathIndex] = attempt;
    const pairResponse = "left:" + activity.selectedLeft + ":" + item.left.charAt(activity.selectedLeft) + " | right:" + activity.selectedRight + ":" + item.right.charAt(activity.selectedRight);

    logEvent("response", {
      itemId: item.id,
      responsePart: "proof_pair_" + (activity.pathIndex + 1),
      evidenceRole: "place_value_proof",
      response: pairResponse,
      correct: pairCorrect,
      attempt: attempt,
      latencyMs: Date.now() - activity.attemptStartedAt
    });
    logEvent("response", {
      itemId: item.id,
      responsePart: "proof_relation_" + (activity.pathIndex + 1),
      evidenceRole: "place_value_proof",
      response: relation,
      correct: relationCorrect,
      attempt: attempt,
      latencyMs: Date.now() - activity.attemptStartedAt
    });

    if (pairCorrect && relationCorrect) {
      activity.pathIndex += 1;
      activity.message = step.success;
      activity.messageKind = "success";
      activity.selectedLeft = null;
      activity.selectedRight = null;
      activity.relation = null;
      activity.attemptStartedAt = Date.now();
    } else {
      activity.proofErrors += 1;
      if (!pairCorrect && item.mismatchFeedbackWhenInitialCorrect) {
        activity.message = activity.initialComparison === item.correctInitial
          ? item.mismatchFeedbackWhenInitialCorrect
          : item.mismatchFeedbackWhenInitialIncorrect;
      } else {
        activity.message = !pairCorrect ? item.mismatchFeedback : item.relationFeedback;
      }
      activity.messageKind = "retry";
      if (item.revealHeadingsAfter && activity.proofErrors >= item.revealHeadingsAfter) {
        activity.showHeadings = true;
        activity.message += " Place-value column headings are now available; you still choose the decisive digits.";
        if (activity.proofErrors === item.revealHeadingsAfter) {
          logEvent("scaffold_reveal", {
            itemId: item.id,
            responsePart: "place_value_headings",
            evidenceRole: "adaptive_support",
            response: "headings revealed after repeated proof errors",
            correct: null,
            attempt: attempt
          });
        }
      }
      activity.selectedLeft = null;
      activity.selectedRight = null;
      activity.relation = null;
      activity.attemptStartedAt = Date.now();
    }

    persist();
    render();
    focusAfterRender("#form-message");
  }

  function submitEmptyPlace(form) {
    const screen = currentScreen();
    const item = screen.item;
    const activity = ensureActivity(screen);
    const data = new FormData(form);
    const response = data.get("empty-place");
    if (!response) {
      activity.message = "Choose what the empty hundredths place represents.";
      activity.messageKind = "retry";
      persist();
      render();
      focusAfterRender("#form-message");
      return;
    }

    activity.emptyAttempts += 1;
    activity.emptyAnswer = response;
    const correct = response === "zero";
    logEvent("response", {
      itemId: item.id,
      responsePart: "empty_hundredths_meaning",
      evidenceRole: "place_value_proof",
      response: response,
      correct: correct,
      attempt: activity.emptyAttempts,
      latencyMs: Date.now() - activity.attemptStartedAt
    });

    if (correct) {
      activity.emptyCorrect = true;
      activity.message = "The empty place represents 0 hundredths.";
      activity.messageKind = "success";
    } else {
      activity.message = "The empty hundredths place after 0.6 represents 0 hundredths. Writing that zero does not change the value.";
      activity.messageKind = "retry";
    }
    activity.attemptStartedAt = Date.now();
    persist();
    render();
    focusAfterRender("#form-message");
  }

  function lockFinalComparison() {
    const screen = currentScreen();
    const item = screen.item;
    const activity = ensureActivity(screen);
    activity.completed = true;
    activity.message = "";
    logEvent("response", {
      itemId: item.id,
      responsePart: "final_comparison_lock",
      evidenceRole: "final_lock_after_proof",
      response: item.finalExpression,
      correct: true,
      attempt: 1,
      latencyMs: Date.now() - activity.attemptStartedAt
    });
    logEvent("item_complete", {
      itemId: item.id,
      responsePart: "completion",
      evidenceRole: "combined_observable_sequence",
      response: "proof completed and final comparison locked",
      correct: true
    });
    persist();
    render();
    focusAfterRender("#feedback-panel");
  }

  function submitBoundary(form) {
    const data = new FormData(form);
    const selected = data.get("boundary");
    if (!selected) {
      state.boundary.message = "Choose the line that repairs the rule.";
      persist();
      render();
      focusAfterRender("#feedback-panel");
      return;
    }
    state.boundary.selected = selected;
    state.boundary.attempts += 1;
    const correct = selected === "bounded";
    logEvent("response", {
      itemId: "final_boundary_check",
      responsePart: "boundary_rule",
      evidenceRole: "final_boundary_statement",
      response: selected,
      correct: correct,
      attempt: state.boundary.attempts,
      latencyMs: Date.now() - state.screenEnteredAt
    });
    if (correct) {
      state.boundary.completed = true;
      state.boundary.message = "Exactly. We kept the useful whole-number knowledge and added the condition that was missing.";
    } else {
      state.boundary.message = "That line does not preserve the useful whole-number rule while adding the decimal boundary. Try again.";
    }
    persist();
    render();
    focusAfterRender("#feedback-panel");
  }

  function completeMissionHandoff() {
    state.handoffComplete = true;
    logEvent("mission_handoff", {
      itemId: "specter_orb_1_handoff",
      responsePart: "handoff",
      evidenceRole: "navigation",
      response: "Begin Contain the Plasma Orbs selected",
      correct: null,
      latencyMs: Date.now() - state.screenEnteredAt
    });
    persist();
    render();
    focusAfterRender(".feedback-panel");
  }

  function advanceScreen() {
    if (transitionLocked || state.screenIndex >= SCREENS.length - 1) return;
    transitionLocked = true;
    logEvent("screen_exit", { latencyMs: Date.now() - state.screenEnteredAt });
    state.screenIndex += 1;
    state.screenEnteredAt = Date.now();
    persist();
    render();
    logEvent("screen_view");
    focusAfterRender("#screen-title");
    window.setTimeout(function () { transitionLocked = false; }, 180);
  }

  function jumpToSelectedScreen() {
    const index = Number(dom.screenJump.value);
    if (!Number.isInteger(index) || index < 0 || index >= SCREENS.length) return;
    logEvent("researcher_jump", { response: SCREENS[index].id });
    state.screenIndex = index;
    state.screenEnteredAt = Date.now();
    persist();
    render();
    logEvent("screen_view", { response: "researcher jump" });
    focusAfterRender("#screen-title");
    showToast("Jumped to Scene " + SCREENS[index].scene + ".");
  }

  function restartMission() {
    const existingEvents = state && Array.isArray(state.events) ? state.events : [];
    if (state) logEvent("session_end", { response: "restart requested", latencyMs: Date.now() - state.sessionStartedAt });
    state = createFreshState(existingEvents);
    logEvent("session_start", { response: "restart" });
    persist();
    render();
    logEvent("screen_view");
    focusAfterRender("#screen-title");
    showToast("New V3 session started. Earlier log entries were preserved.");
  }

  function clearLocalData() {
    const confirmed = window.confirm("Clear all V3 progress and every locally stored experiment-log entry? This cannot be undone.");
    if (!confirmed) return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      storageAvailable = false;
    }
    memoryState = null;
    state = createFreshState([]);
    logEvent("session_start", { response: "after local data clear" });
    persist();
    render();
    closeLogDrawer();
    focusAfterRender("#screen-title");
    showToast("All earlier V3 local data was cleared.");
  }

  function logEvent(eventType, extra) {
    if (!state) return;
    const screen = currentScreen();
    const item = screen && screen.item;
    const data = extra || {};
    const record = {
      timestamp: new Date().toISOString(),
      sessionId: state.sessionId,
      prototypeVersion: PROTOTYPE_VERSION,
      screenId: screen ? screen.id : null,
      scene: screen ? screen.scene : null,
      itemId: data.itemId || (item ? item.id : null),
      caseType: item ? item.caseType : null,
      scaffoldLevel: screen ? screen.radar : null,
      eventType: eventType,
      responsePart: data.responsePart || null,
      evidenceRole: data.evidenceRole || null,
      stimulus: item ? item.left + " | " + item.right : null,
      response: data.response === undefined ? null : data.response,
      correct: typeof data.correct === "boolean" ? data.correct : null,
      attempt: data.attempt || null,
      latencyMs: Number.isFinite(data.latencyMs) ? Math.round(data.latencyMs) : null
    };
    state.events.push(record);
    persist();
  }

  function calculateSessionSummary() {
    const sessionEvents = state.events.filter(function (event) { return event.sessionId === state.sessionId; });
    const initial = sessionEvents.filter(function (event) {
      return event.eventType === "response" && event.responsePart === "initial_comparison" && event.attempt === 1;
    });
    const proofPairs = sessionEvents.filter(function (event) {
      return event.eventType === "response" && event.responsePart && event.responsePart.indexOf("proof_pair_") === 0 && event.attempt === 1;
    });
    const firstRelations = new Map();
    sessionEvents.forEach(function (event) {
      if (event.eventType !== "response" || !event.responsePart || event.responsePart.indexOf("proof_relation_") !== 0 || event.attempt !== 1) return;
      const step = event.responsePart.replace("proof_relation_", "");
      firstRelations.set((event.itemId || "") + "|" + step, event);
    });
    const proofCorrect = proofPairs.filter(function (pairEvent) {
      const step = pairEvent.responsePart.replace("proof_pair_", "");
      const relationEvent = firstRelations.get((pairEvent.itemId || "") + "|" + step);
      return pairEvent.correct === true && relationEvent && relationEvent.correct === true;
    }).length;
    return {
      initialCorrect: initial.filter(function (event) { return event.correct; }).length,
      initialTotal: initial.length,
      proofCorrect: proofCorrect,
      proofTotal: proofPairs.length,
      elapsedMs: Date.now() - state.sessionStartedAt
    };
  }

  function openLogDrawer() {
    updateLogDrawer();
    dom.logDrawer.hidden = false;
    dom.drawerBackdrop.hidden = false;
    dom.logToggle.setAttribute("aria-expanded", "true");
    dom.logClose.focus();
  }

  function closeLogDrawer() {
    dom.logDrawer.hidden = true;
    dom.drawerBackdrop.hidden = true;
    dom.logToggle.setAttribute("aria-expanded", "false");
    dom.logToggle.focus();
  }

  function updateEventCount() {
    if (!dom.eventCount || !state) return;
    dom.eventCount.textContent = String(state.events.length);
  }

  function updateLogDrawer() {
    if (!state || !dom.logTableBody) return;
    const summary = calculateSessionSummary();
    dom.logSummary.innerHTML = [
      renderSummaryStat(state.events.length, "All local events"),
      renderSummaryStat(summary.initialCorrect + "/" + summary.initialTotal, "First initial answers"),
      renderSummaryStat(summary.proofCorrect + "/" + summary.proofTotal, "First proof pairs")
    ].join("");

    const rows = state.events.slice(-120).reverse().map(function (event) {
      const time = event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : "";
      return [
        "<tr>",
        "<td>" + escapeHtml(time) + "</td>",
        "<td>" + escapeHtml(event.screenId || "—") + "</td>",
        "<td>" + escapeHtml(event.eventType + (event.responsePart ? ": " + event.responsePart : "")) + "</td>",
        "<td>" + escapeHtml(event.response === null ? "—" : String(event.response)) + "</td>",
        "<td>" + (event.correct === null ? "—" : event.correct ? "Yes" : "No") + "</td>",
        "</tr>"
      ].join("");
    }).join("");
    dom.logTableBody.innerHTML = rows || '<tr><td colspan="5">No events recorded yet.</td></tr>';
  }

  function renderSummaryStat(value, label) {
    return '<div class="summary-stat"><strong>' + escapeHtml(String(value)) + '</strong><span>' + escapeHtml(label) + '</span></div>';
  }

  function downloadJsonLog() {
    const payload = {
      prototype: "Ocean Adventure — Specter’s Whole-Number Trap",
      prototypeVersion: PROTOTYPE_VERSION,
      exportedAt: new Date().toISOString(),
      storageMode: storageAvailable ? "localStorage" : "memory-only",
      responseEvidenceNote: "Initial comparisons and selected place-value proof actions are separate observable responses; neither is treated as definitive evidence of an internal misconception.",
      activeSessionId: state.sessionId,
      events: state.events
    };
    downloadBlob("ocean-adventure-whole-number-trap-v3-log.json", JSON.stringify(payload, null, 2), "application/json");
    logEvent("log_export", { response: "json" });
    showToast("JSON experiment log downloaded.");
  }

  function downloadCsvLog() {
    const fields = [
      "timestamp", "sessionId", "prototypeVersion", "screenId", "scene", "itemId", "caseType",
      "scaffoldLevel", "eventType", "responsePart", "evidenceRole", "stimulus", "response",
      "correct", "attempt", "latencyMs"
    ];
    const lines = [fields.join(",")];
    state.events.forEach(function (event) {
      lines.push(fields.map(function (field) { return csvEscape(event[field]); }).join(","));
    });
    downloadBlob("ocean-adventure-whole-number-trap-v3-log.csv", lines.join("\n"), "text/csv;charset=utf-8");
    logEvent("log_export", { response: "csv" });
    showToast("CSV experiment log downloaded.");
  }

  function csvEscape(value) {
    if (value === null || value === undefined) return "";
    const text = String(value);
    if (/[",\n]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
    return text;
  }

  function downloadBlob(filename, contents, mimeType) {
    const blob = new Blob([contents], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function focusAfterRender(selector) {
    window.requestAnimationFrame(function () {
      const target = dom.screenMount.querySelector(selector);
      if (target) target.focus();
    });
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    dom.toast.textContent = message;
    dom.toast.hidden = false;
    toastTimer = window.setTimeout(function () { dom.toast.hidden = true; }, 2600);
  }

  function decimalPlaces(value) {
    const parts = String(value).split(".");
    return parts.length === 2 ? parts[1].length : 0;
  }

  function decimalParts(value) {
    const parts = String(value).split(".");
    return { ones: parts[0], fraction: parts[1] || "" };
  }

  function placeNameFromIndex(index) {
    if (index === 0) return "ones";
    if (index === 1) return "decimal point";
    if (index === 2) return "tenths";
    if (index === 3) return "hundredths";
    if (index === 4) return "thousandths";
    return "place value";
  }

  function capitalize(value) {
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  }

  function formatDuration(milliseconds) {
    const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes + ":" + String(seconds).padStart(2, "0");
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
