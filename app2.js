// ============================================================
// WORKOUT TRACKER — app2.js
// ============================================================

const ENDPOINT = "https://script.google.com/macros/s/AKfycbyCv5UAZrMpHJvXlGTbnqsA9wjHWKKR8pL3UQQvETdWQX2AVdpoC_21wnCNG2LVE9WO/exec
";
const TUTORIAL_THRESHOLD = 30;

// ============================================================
// STATE
// ============================================================

const state = {
  token: null,
  athlete: null,
  program: null,
  programs: null,        // { A: [...], B: [...], C: [...] }
  sessionCount: 0,
  currentPlan: null,
  lastTimeCache: {},     // exerciseName -> { lastSession, recentSessions }
  offlineQueue: [],
  popupShown: false
};

// ============================================================
// DOM SHORTCUTS
// ============================================================

const $ = (id) => document.getElementById(id);

const dom = {
  offlineBanner: $("offlineBanner"),
  loginScreen: $("loginScreen"),
  appScreen: $("appScreen"),
  loginName: $("loginName"),
  loginPin: $("loginPin"),
  loginBtn: $("loginBtn"),
  loginError: $("loginError"),
  headerName: $("headerName"),
  helpBtn: $("helpBtn"),
  refreshBtn: $("refreshBtn"),
  logoutBtn: $("logoutBtn"),
  planBtns: document.querySelectorAll(".plan-btn"),
  exerciseList: $("exerciseList"),
  downloadCsvBtn: $("downloadCsvBtn"),
  downloadPdfBtn: $("downloadPdfBtn"),
  tabBtns: document.querySelectorAll(".tab-btn"),
  tabWorkout: $("tab-workout"),
  tabHistory: $("tab-history"),
  historyList: $("historyList"),
  histPlanFilter: $("histPlanFilter"),
  histDaysFilter: $("histDaysFilter"),
  welcomePopup: $("welcomePopup"),
  popupContent: $("popupContent"),
  popupHideBtn: $("popupHideBtn"),
  popupDontShowBtn: $("popupDontShowBtn"),
  popupCloseX: $("popupCloseX"),
  lastTimeModal: $("lastTimeModal"),
  lastTimeContent: $("lastTimeContent"),
  lastTimeCloseX: $("lastTimeCloseX"),
  toast: $("toast")
};

// ============================================================
// STARTUP
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  wireEvents();
  wireOfflineDetection();
  loadRememberedName();
  tryRestoreSession();
});

function wireEvents() {
  dom.loginBtn.addEventListener("click", handleLogin);
  dom.loginPin.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  dom.planBtns.forEach((btn) => {
    btn.addEventListener("click", () => selectPlan(btn.dataset.plan));
  });

  dom.tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  dom.helpBtn.addEventListener("click", () => showWelcomePopup(true));
  dom.refreshBtn.addEventListener("click", () => refreshData());
  dom.logoutBtn.addEventListener("click", handleLogout);

  dom.downloadCsvBtn.addEventListener("click", downloadCsv);
  dom.downloadPdfBtn.addEventListener("click", downloadPdf);

  dom.popupHideBtn.addEventListener("click", hideWelcomePopup);
  dom.popupCloseX.addEventListener("click", hideWelcomePopup);
  dom.popupDontShowBtn.addEventListener("click", dontShowAgain);

  dom.lastTimeCloseX.addEventListener("click", () => {
    dom.lastTimeModal.classList.add("hidden");
  });

  dom.histPlanFilter.addEventListener("change", renderHistory);
  dom.histDaysFilter.addEventListener("change", renderHistory);

  window.addEventListener("online", flushOfflineQueue);
  window.addEventListener("offline", () => {
    dom.offlineBanner.classList.remove("hidden");
  });
}

// ============================================================
// OFFLINE DETECTION
// ============================================================

function wireOfflineDetection() {
  if (!navigator.onLine) {
    dom.offlineBanner.classList.remove("hidden");
  }
  loadOfflineQueue();
}

function loadOfflineQueue() {
  try {
    const raw = localStorage.getItem("offlineQueue");
    state.offlineQueue = raw ? JSON.parse(raw) : [];
  } catch (e) {
    state.offlineQueue = [];
  }
}

function saveOfflineQueue() {
  localStorage.setItem("offlineQueue", JSON.stringify(state.offlineQueue));
}

function enqueueOffline(payload) {
  state.offlineQueue.push(payload);
  saveOfflineQueue();
}

async function flushOfflineQueue() {
  dom.offlineBanner.classList.add("hidden");
  if (!state.offlineQueue.length) return;

  const remaining = [];
  for (const item of state.offlineQueue) {
    try {
      const res = await postJSON({ action: "logSet", token: state.token, ...item });
      if (!res || !res.ok) remaining.push(item);
    } catch (e) {
      remaining.push(item);
    }
  }
  state.offlineQueue = remaining;
  saveOfflineQueue();

  if (!remaining.length) {
    showToast("Offline sets synced", false);
  }
}

// ============================================================
// REMEMBERED NAME
// ============================================================

function loadRememberedName() {
  const saved = localStorage.getItem("lastAthlete");
  if (saved) {
    dom.loginName.value = saved;
  }
  loadAthleteDropdown();
}

async function loadAthleteDropdown() {
  // Try to fetch the athlete list from Apps Script if it exposes one
  // Fallback: leave placeholder; coach adds names in the sheet and user types
  // For now, keep a manual list. We'll populate from Users sheet via a public
  // endpoint in a future version. For now, dropdown shows nothing; coach can
  // pre-fill via state if needed.
  // Intentionally a no-op for v1 — see note in commit message.
}

// ============================================================
// LOGIN
// ============================================================

async function handleLogin() {
  const name = dom.loginName.value.trim();
  const pin = dom.loginPin.value.trim();

  if (!name || !pin) {
    dom.loginError.textContent = "Enter your name and PIN.";
    return;
  }

  dom.loginBtn.disabled = true;
  dom.loginBtn.textContent = "Logging in...";
  dom.loginError.textContent = "";

  try {
    const res = await postJSON({ action: "login", name, pin });
    if (!res || !res.ok) {
      dom.loginError.textContent = res && res.error ? res.error : "Login failed.";
      dom.loginBtn.disabled = false;
      dom.loginBtn.textContent = "Log In";
      return;
    }

    state.token = res.token;
    state.athlete = res.athlete;
    state.program = res.program;
    state.programs = res.programs;
    state.sessionCount = res.sessionCount || 0;

    localStorage.setItem("lastAthlete", name);
    localStorage.setItem("sessionToken", res.token);
    localStorage.setItem("sessionExpires", Date.now() + 12 * 3600 * 1000);

    enterApp();
  } catch (e) {
    dom.loginError.textContent = "Could not reach server. Check connection.";
    dom.loginBtn.disabled = false;
    dom.loginBtn.textContent = "Log In";
  }
}

function tryRestoreSession() {
  const token = localStorage.getItem("sessionToken");
  const exp = parseInt(localStorage.getItem("sessionExpires") || "0", 10);
  if (!token || !exp || Date.now() > exp) return;

  // Restore is best-effort; the token gets validated on the first API call
  state.token = token;
  // We can't fully restore without the full login payload; do a lightweight
  // "whoami" via sessionCount endpoint; if it fails, send back to login.
  (async () => {
    try {
      const res = await postJSON({ action: "sessionCount", token });
      if (res && res.ok) {
        state.sessionCount = res.count;
        // Best-effort: we still need the program; do a silent re-login is not
        // possible without PIN. So we just show login with remembered name.
      }
    } catch (e) {}
  })();
}

function handleLogout() {
  state.token = null;
  state.athlete = null;
  state.program = null;
  state.programs = null;
  state.currentPlan = null;
  localStorage.removeItem("sessionToken");
  localStorage.removeItem("sessionExpires");
  dom.appScreen.classList.add("hidden");
  dom.loginScreen.classList.remove("hidden");
  dom.loginPin.value = "";
  dom.loginBtn.disabled = false;
  dom.loginBtn.textContent = "Log In";
}

function enterApp() {
  dom.loginScreen.classList.add("hidden");
  dom.appScreen.classList.remove("hidden");
  dom.headerName.textContent = state.athlete;

  // Mark plan A active by default? No — let user pick.
  selectPlan(null);

  // Show welcome popup on every open until 30 sessions
  showWelcomePopup(false);
}

// ============================================================
// PLAN SELECTION
// ============================================================

function selectPlan(plan) {
  state.currentPlan = plan;

  dom.planBtns.forEach((b) => {
    b.classList.toggle("active", b.dataset.plan === plan);
  });

  if (!plan) {
    dom.exerciseList.innerHTML = "";
    return;
  }

  renderExerciseCards(plan);
  // Preload last-time data for each exercise
  loadLastTimesForPlan(plan);
}

function renderExerciseCards(plan) {
  const exercises = (state.programs && state.programs[plan]) || [];
  if (!exercises.length) {
    dom.exerciseList.innerHTML =
      '<div class="history-empty">No exercises found for this plan.</div>';
    return;
  }

  dom.exerciseList.innerHTML = "";
  exercises.forEach((ex) => {
    dom.exerciseList.appendChild(buildExerciseCard(ex, plan));
  });
}

function buildExerciseCard(ex, plan) {
  const card = document.createElement("div");
  card.className = "exercise-card";

  const tagClass = ex.type === "main" ? "" : "support";
  const tagText = ex.type === "main" ? "MAIN" : "SUPPORT";

  card.innerHTML = `
    <div class="exercise-head">
      <h3 class="exercise-name">${escapeHtml(ex.name)}</h3>
      <span class="exercise-tag ${tagClass}">${tagText}</span>
    </div>
    <div class="exercise-meta">
      <strong>Rest:</strong> ${escapeHtml(String(ex.rest))} &nbsp;•&nbsp;
      <strong>Tempo:</strong> ${escapeHtml(String(ex.tempo))}
    </div>
    ${ex.notes ? `<div class="exercise-notes">${escapeHtml(ex.notes)}</div>` : ""}
    <div class="set-compare" data-exercise="${escapeHtml(ex.name)}"></div>
    <button class="full-history-link" data-exercise="${escapeHtml(ex.name)}">
      Open full history for this lift
    </button>
  `;

  const compareEl = card.querySelector(".set-compare");
  ex.sets.forEach((s) => {
    compareEl.appendChild(buildSetCompare(s, ex.name, plan));
  });

  card.querySelector(".full-history-link").addEventListener("click", () => {
    openLastTimeModal(ex.name);
  });

  return card;
}

function buildSetCompare(setInfo, exerciseName, plan) {
  const wrapper = document.createElement("div");
  wrapper.style.display = "contents";

  const setNum = String(setInfo.set);
  const safeEx = sanitizeId(exerciseName);
  const safeSet = sanitizeId(setNum);
  const idBase = `set_${safeEx}_${safeSet}_${plan}`;

  wrapper.innerHTML = `
    <div class="compare-col">
      <div class="compare-label">Last Time</div>
      <div class="compare-set" id="${idBase}_last">
        <div class="set-name">Set ${escapeHtml(setNum)}</div>
        <div class="set-data dim">—</div>
      </div>
    </div>
    <div class="compare-col">
      <div class="compare-label">Today</div>
      <div class="compare-set current">
        <div class="set-name">Set ${escapeHtml(setNum)}${setInfo.targetNote ? ` — <span style="color:#9aa3b0;font-weight:400;">${escapeHtml(setInfo.targetNote)}</span>` : ""}</div>
        <div class="set-input">
          <div>
            <label>Target</label>
            <input type="text" value="${escapeHtml(String(setInfo.target || ""))}" readonly />
          </div>
          <div>
            <label>Weight</label>
            <input type="number" id="${idBase}_w" placeholder="lb" />
          </div>
        </div>
        <div class="set-input">
          <div>
            <label>Reps</label>
            <input type="number" id="${idBase}_r" placeholder="reps" />
          </div>
          <div>
            <label>Grade</label>
            <select id="${idBase}_g">
              <option value="">—</option>
              <option>A+</option><option>A</option><option>A-</option>
              <option>B+</option><option>B</option><option>B-</option>
              <option>C+</option><option>C</option><option>C-</option>
              <option>D</option><option>F</option>
            </select>
          </div>
        </div>
        <div class="set-input">
          <div class="set-input-full">
            <label>Notes</label>
            <input type="text" id="${idBase}_n" placeholder="" />
          </div>
        </div>
        <button class="log-btn" id="${idBase}_btn">Log</button>
      </div>
    </div>
  `;

  const logBtn = wrapper.querySelector(`#${idBase}_btn`);
  logBtn.addEventListener("click", () => handleLogSet(exerciseName, plan, setInfo, idBase));

  return wrapper;
}

// ============================================================
// LOGGING A SET
// ============================================================

async function handleLogSet(exerciseName, plan, setInfo, idBase) {
  const weight = $(`${idBase}_w`).value;
  const reps = $(`${idBase}_r`).value;
  const grade = $(`${idBase}_g`).value;
  const notes = $(`${idBase}_n`).value;

  if (!weight && !reps) {
    showToast("Enter weight or reps first", true);
    return;
  }

  const payload = {
    athlete: state.athlete,
    program: state.program,
    plan: plan,
    exercise: exerciseName,
    set: String(setInfo.set),
    target: String(setInfo.target || ""),
    weight: weight,
    reps: reps,
    grade: grade,
    notes: notes
  };

  const btn = $(`${idBase}_btn`);
  btn.disabled = true;
  btn.textContent = "...";

  // Try online first
  if (navigator.onLine) {
    try {
      const res = await postJSON({ action: "logSet", token: state.token, ...payload });
      if (res && res.ok) {
        btn.classList.add("logged");
        btn.textContent = "Done";
        showToast(`Logged ${exerciseName} — Set ${setInfo.set}`);
        refreshLastTimeForExercise(exerciseName);
        return;
      } else if (res && res.error && res.error.toLowerCase().includes("expired")) {
        showToast("Session expired. Please log in again.", true);
        handleLogout();
        return;
      }
    } catch (e) {
      // fall through to offline
    }
  }

  // Offline path
  enqueueOffline(payload);
  btn.classList.add("queued");
  btn.textContent = "Queued";
  showToast("Saved offline — will sync later", "warn");
}

// ============================================================
// LAST TIME — loading and rendering
// ============================================================

async function loadLastTimesForPlan(plan) {
  const exercises = (state.programs && state.programs[plan]) || [];
  for (const ex of exercises) {
    await loadLastTimeForExercise(ex.name);
  }
}

async function loadLastTimeForExercise(exerciseName) {
  if (!state.token) return;
  try {
    const res = await postJSON({
      action: "lastTime",
      token: state.token,
      exercise: exerciseName
    });
    if (res && res.ok) {
      state.lastTimeCache[exerciseName] = {
        lastSession: res.lastSession,
        recentSessions: res.recentSessions || []
      };
      if (typeof res.sessionCount === "number") {
        state.sessionCount = res.sessionCount;
      }
      paintLastTimeForExercise(exerciseName);
    }
  } catch (e) {
    // offline — skip
  }
}

function refreshLastTimeForExercise(exerciseName) {
  loadLastTimeForExercise(exerciseName);
}

function paintLastTimeForExercise(exerciseName) {
  const data = state.lastTimeCache[exerciseName];
  if (!data || !data.lastSession) return;

  const sets = data.lastSession.sets || [];
  sets.forEach((s) => {
    const el = document.querySelector(
      `.compare-set[id^="set_${sanitizeId(exerciseName)}_"][id$="_last"]`
    );
  });

  // Better: query all last-time cells for this exercise
  const cards = dom.exerciseList.querySelectorAll(".set-compare");
  cards.forEach((compareEl) => {
    if (compareEl.dataset.exercise !== exerciseName) return;
    const lastCells = compareEl.querySelectorAll('.compare-set[id$="_last"]');
    lastCells.forEach((cell, i) => {
      const s = sets[i];
      if (!s) {
        cell.innerHTML = `<div class="set-name">Set ${i + 1}</div><div class="set-data dim">—</div>`;
        return;
      }
      cell.innerHTML = `
        <div class="set-name">Set ${escapeHtml(String(s.set))}</div>
        <div class="set-data">
          ${s.weight ? escapeHtml(String(s.weight)) + " lb" : ""}
          ${s.reps ? " x " + escapeHtml(String(s.reps)) : ""}
          ${s.grade ? `<span class="set-grade">${escapeHtml(s.grade)}</span>` : ""}
        </div>
        ${s.notes ? `<div class="set-notes">${escapeHtml(s.notes)}</div>` : ""}
      `;
    });
  });
}

// ============================================================
// FULL HISTORY MODAL PER LIFT
// ============================================================

function openLastTimeModal(exerciseName) {
  const data = state.lastTimeCache[exerciseName];
  const recent = (data && data.recentSessions) || [];

  if (!recent.length) {
    dom.lastTimeContent.innerHTML = `
      <h2>${escapeHtml(exerciseName)}</h2>
      <p style="color:#9aa3b0;">No previous sessions logged yet.</p>
    `;
    dom.lastTimeModal.classList.remove("hidden");
    return;
  }

  let html = `<h2>${escapeHtml(exerciseName)}</h2>`;
  html += `<p style="color:#9aa3b0;font-size:13px;">Last ${recent.length} session${recent.length > 1 ? "s" : ""}.</p>`;
  html += `<div class="lt-grid">`;
  recent.forEach((session) => {
    html += `<div class="lt-session-col"><h4>${escapeHtml(session.date)}</h4>`;
    session.sets.forEach((s) => {
      html += `
        <div class="lt-set">
          <span class="lt-set-num">Set ${escapeHtml(String(s.set))}:</span>
          ${s.weight ? escapeHtml(String(s.weight)) + " lb" : ""}
          ${s.reps ? " x " + escapeHtml(String(s.reps)) : ""}
          ${s.grade ? `<span class="lt-set-grade">${escapeHtml(s.grade)}</span>` : ""}
          ${s.notes ? `<span class="lt-set-notes">${escapeHtml(s.notes)}</span>` : ""}
        </div>
      `;
    });
    html += `</div>`;
  });
  html += `</div>`;

  dom.lastTimeContent.innerHTML = html;
  dom.lastTimeModal.classList.remove("hidden");
}

// ============================================================
// TABS
// ============================================================

function switchTab(tabName) {
  dom.tabBtns.forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tabName);
  });
  dom.tabWorkout.classList.toggle("hidden", tabName !== "workout");
  dom.tabHistory.classList.toggle("hidden", tabName !== "history");

  if (tabName === "history") {
    loadAndRenderHistory();
  }
}

// ============================================================
// HISTORY TAB
// ============================================================

async function loadAndRenderHistory() {
  dom.historyList.innerHTML = `<div class="history-empty">Loading…</div>`;
  try {
    const days = parseInt(dom.histDaysFilter.value, 10) || 30;
    const res = await postJSON({
      action: "history",
      token: state.token,
      days: days
    });
    if (!res || !res.ok) {
      dom.historyList.innerHTML = `<div class="history-empty">Could not load history.</div>`;
      return;
    }
    state.historyRows = res.rows || [];
    renderHistory();
  } catch (e) {
    dom.historyList.innerHTML = `<div class="history-empty">Offline — no history available.</div>`;
  }
}

function renderHistory() {
  const rows = state.historyRows || [];
  const planFilter = dom.histPlanFilter.value;

  const filtered = planFilter ? rows.filter((r) => r.plan === planFilter) : rows;

  if (!filtered.length) {
    dom.historyList.innerHTML = `<div class="history-empty">No sessions in this range.</div>`;
    return;
  }

  // Group by date
  const byDate = {};
  filtered.forEach((r) => {
    const d = new Date(r.timestamp);
    if (isNaN(d.getTime())) return;
    const key = d.toISOString().slice(0, 10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(r);
  });

  const dates = Object.keys(byDate).sort().reverse();
  dom.historyList.innerHTML = "";

  dates.forEach((dateKey) => {
    const sessionsForDate = byDate[dateKey];
    const plan = sessionsForDate[0].plan;
    const totalSets = sessionsForDate.length;
    const totalLifts = new Set(sessionsForDate.map((r) => r.exercise)).size;

    const el = document.createElement("div");
    el.className = "history-session";
    el.innerHTML = `
      <div class="history-session-head">
        <div>
          <div class="history-date">${formatDate(dateKey)} — Plan ${escapeHtml(plan)}</div>
          <div class="history-summary">${totalLifts} lifts, ${totalSets} sets</div>
        </div>
        <div class="history-toggle">›</div>
      </div>
      <div class="history-body hidden"></div>
    `;

    const body = el.querySelector(".history-body");

    // Group by exercise, preserving order
    const byLift = {};
    const liftOrder = [];
    sessionsForDate.forEach((r) => {
      if (!byLift[r.exercise]) { byLift[r.exercise] = []; liftOrder.push(r.exercise); }
      byLift[r.exercise].push(r);
    });

    liftOrder.forEach((liftName) => {
      const liftSets = byLift[liftName];
      const liftEl = document.createElement("div");
      liftEl.className = "history-lift";

      let html = `<div class="history-lift-name">${escapeHtml(liftName)}</div>`;
      liftSets.forEach((s) => {
        const line = `${s.weight || ""}${s.weight ? " lb" : ""}${s.reps ? " x " + s.reps : ""}`;
        html += `
          <div class="history-set-row">
            <div class="history-set-num">S${escapeHtml(String(s.set))}</div>
            <div class="history-set-data">${escapeHtml(line || "—")}</div>
            <div class="history-set-grade">${escapeHtml(s.grade || "")}</div>
          </div>
          ${s.notes ? `<div class="history-set-notes">"${escapeHtml(s.notes)}"</div>` : ""}
        `;
      });

      liftEl.innerHTML = html;
      body.appendChild(liftEl);
    });

    el.querySelector(".history-session-head").addEventListener("click", () => {
      el.classList.toggle("open");
      body.classList.toggle("hidden");
    });

    dom.historyList.appendChild(el);
  });
}

// ============================================================
// WELCOME POPUP
// ============================================================

function showWelcomePopup(fromHelpButton) {
  if (!fromHelpButton && localStorage.getItem("hideTutorial") === "1") return;

  dom.popupContent.innerHTML = `
    <h2>How to use this app</h2>
    <ul>
      <li>Pick your plan for today (A, B, or C).</li>
      <li>Each exercise shows <strong>Last Time</strong> on the left, <strong>Today</strong> on the right.</li>
      <li>Enter Weight, Reps, Grade, and Notes for each set.</li>
      <li>Tap <strong>Log</strong> when a set is done.</li>
      <li>Offline? Your sets save and sync when you're back online.</li>
    </ul>

    <h3>Terms</h3>

    <h4>Ramp-Up Sets</h4>
    <p>Lighter sets before your work sets. Purpose is to warm up the movement, not to tire you out.</p>

    <h4>Work Sets</h4>
    <p>Your real sets at working weight. These are the ones that make you stronger.</p>

    <h4>Left in the Tank</h4>
    <p>How many more reps you could have done before failing. 4 in the tank = you had 4 reps left.</p>

    <h4>Rest</h4>
    <p>Time to take between sets. Shown at the top of each lift.</p>

    <h4>Tempo = W/X/Y/Z</h4>
    <p>
      W = first motion<br>
      X = pause before 2nd motion<br>
      Y = second motion<br>
      Z = time between reps<br>
      If an X is shown instead of a number, move with speed.
    </p>

    <h4>Target Rep Range</h4>
    <p>Use loads that have you failing in this range. If you exceed or fall short, adjust the weight. This is a skill that gets better with practice.</p>

    <h4>Grade</h4>
    <p>Give the grade and explain WHY in the notes. Notes also serve as cues for better performance — read your notes from the last set before each new set.</p>

    <h3>Movement Preps : Warm-Ups</h3>

    <h4>World's Greatest Stretch Walking (dynamic)</h4>
    <ul>
      <li>Stand tall.</li>
      <li>Step out like stepping over a puddle.</li>
      <li>Elbow to instep.</li>
      <li>Twist away.</li>
      <li>Frame the foot: one hand on each side.</li>
      <li>Straighten front leg.</li>
      <li>Draw hands back toward heel, rock back on heel.</li>
      <li>Step forward, reach up tall, repeat.</li>
      <li>5-6 minutes — start slow and hold, work up to a flow.</li>
    </ul>

    <h4>Kick Series (dynamic)</h4>
    <ul>
      <li>Lie in Jesus pose, arms out, legs straight.</li>
      <li>Right leg up to 'check-in', kick leg up.</li>
      <li>Left leg up to 'check-in', kick leg up.</li>
      <li>Right leg folds over and back.</li>
      <li>Left leg folds over and back.</li>
      <li>Right leg: kick up + fold over + back + down.</li>
      <li>Left leg: kick up + fold over + back + down.</li>
      <li>4-6 minutes — this is a conversation you are having with your body, asking permission to move and listening to what your body is telling you.</li>
    </ul>

    <h3>Cool Down / Recovery</h3>

    <h4>World's Greatest Stretch Walking (slow)</h4>
    <p>Same movement pattern as warm-up. Slower pace, longer holds. 4-6 minutes, rest as needed. Recover. Breathe easily.</p>

    <h4>Kick Series (slow)</h4>
    <p>Same sequence as warm-up. Slow and controlled. 1 round. Focus on breathing and range. 4-6 minutes, rest as needed. Recover. Breathe easily.</p>

    <h3>Coach</h3>
    <p>I am your Coach. If you need to, just call me: <a href="tel:9734526850">973.452.6850</a></p>
  `;

  // Don't-show button visibility is gated by session count
  if (state.sessionCount >= TUTORIAL_THRESHOLD) {
    dom.popupDontShowBtn.classList.remove("hidden");
  } else {
    dom.popupDontShowBtn.classList.add("hidden");
  }

  dom.welcomePopup.classList.remove("hidden");
}

function hideWelcomePopup() {
  dom.welcomePopup.classList.add("hidden");
}

function dontShowAgain() {
  localStorage.setItem("hideTutorial", "1");
  hideWelcomePopup();
}

// ============================================================
// DOWNLOAD EMPTY LOG
// ============================================================

function downloadCsv() {
  const plan = state.currentPlan;
  const lines = [];

  lines.push(["Athlete", "Plan", "Exercise", "Set", "Target", "Weight", "Reps", "Grade", "Notes"].join(","));

  if (plan && state.programs[plan]) {
    state.programs[plan].forEach((ex) => {
      ex.sets.forEach((s) => {
        lines.push([
          csv(state.athlete || ""),
          csv(plan),
          csv(ex.name),
          csv(String(s.set)),
          csv(String(s.target || "")),
          "", // weight
          "", // reps
          "", // grade
          ""  // notes
        ].join(","));
      });
    });
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  triggerDownload(blob, `empty-log-${state.athlete || "athlete"}-${new Date().toISOString().slice(0,10)}.csv`);
}

function downloadPdf() {
  const plan = state.currentPlan;
  if (!plan || !state.programs[plan]) {
    showToast("Pick a plan first, then download", true);
    return;
  }

  // Build a printable window
  const w = window.open("", "_blank");
  let html = `
    <html><head><title>Empty Log — Plan ${plan}</title>
    <style>
      body { font-family: sans-serif; padding: 20px; }
      h1 { font-size: 18px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #999; padding: 6px; font-size: 12px; text-align: left; }
      th { background: #eee; }
      .notes-col { width: 25%; }
    </style></head><body>
    <h1>Empty Log — ${escapeHtml(state.athlete || "")} — Plan ${plan}</h1>
    <p>Date: ___________________</p>
    <table>
      <thead><tr>
        <th>Exercise</th><th>Set</th><th>Target</th>
        <th>Weight</th><th>Reps</th><th>Grade</th>
        <th class="notes-col">Notes</th>
      </tr></thead>
      <tbody>
  `;

  state.programs[plan].forEach((ex) => {
    ex.sets.forEach((s, i) => {
      html += `<tr>
        <td>${i === 0 ? escapeHtml(ex.name) : ""}</td>
        <td>${escapeHtml(String(s.set))}</td>
        <td>${escapeHtml(String(s.target || ""))}</td>
        <td></td><td></td><td></td><td></td>
      </tr>`;
    });
  });

  html += `</tbody></table></body></html>`;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

function csv(v) {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================
// REFRESH
// ============================================================

async function refreshData() {
  showToast("Refreshing…", false);
  if (state.currentPlan) {
    await loadLastTimesForPlan(state.currentPlan);
  }
  if (!dom.tabHistory.classList.contains("hidden")) {
    await loadAndRenderHistory();
  }
}

// ============================================================
// HELPERS
// ============================================================

async function postJSON(payload) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload)
  });
  // no-cors gives an opaque response; we can't read it. Use JSONP-style
  // workaround: Apps Script redirects to script.googleusercontent.com; because
  // we can't read opaque responses, we make a follow-up GET with the same
  // payload encoded. Simpler: use GET with query string for all actions.
  // See postJSON wrapper below.
  throw new Error("placeholder");
}

// Fallback: use GET for everything (simpler and reliable with Apps Script)
async function getJSON(params) {
  const q = Object.keys(params)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
    .join("&");
  const res = await fetch(`${ENDPOINT}?${q}`);
  return await res.json();
}

// Real implementation — override postJSON
window.postJSON = async function (payload) {
  const q = Object.keys(payload)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(payload[k]))
    .join("&");
  const res = await fetch(`${ENDPOINT}?${q}`);
  return await res.json();
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeId(s) {
  return String(s).replace(/[^a-z0-9]/gi, "_");
}

function formatDate(yyyymmdd) {
  const [y, m, d] = yyyymmdd.split("-");
  const dt = new Date(y, parseInt(m, 10) - 1, d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function showToast(msg, isError) {
  dom.toast.textContent = msg;
  dom.toast.classList.remove("hidden", "error", "warn");
  if (isError === true) dom.toast.classList.add("error");
  else if (isError === "warn") dom.toast.classList.add("warn");
  setTimeout(() => dom.toast.classList.add("hidden"), 2400);
}
