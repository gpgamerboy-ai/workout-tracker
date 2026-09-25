// PASTE YOUR APPS SCRIPT WEB APP URL HERE
const ENDPOINT = "https://script.google.com/macros/s/AKfycbyCv5UAZrMpHJvXlGTbnqsA9wjHWKKR8pL3UQQvETdWQX2AVdpoC_21wnCNG2LVE9WO/exec";

let currentPlan = null;
const athleteInput = document.getElementById("athleteName");

athleteInput.value = localStorage.getItem("athleteName") || "";
athleteInput.addEventListener("input", () => {
  localStorage.setItem("athleteName", athleteInput.value.trim());
});

document.querySelectorAll(".plan-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".plan-buttons button")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentPlan = btn.dataset.plan;
    renderPlan(currentPlan);
  });
});

function renderPlan(planKey) {
  const plan = PROGRAM.plans[planKey];
  const area = document.getElementById("workoutArea");
  area.classList.remove("hidden");

  document.getElementById("warmupBlock").innerHTML =
    renderRoutine(PROGRAM.warmup, "Warm-Up");

  const list = document.getElementById("exerciseList");
  list.innerHTML = "<h3>Exercises</h3>";
  plan.exercises.forEach(ex => list.appendChild(renderExercise(ex, planKey)));

  document.getElementById("cooldownBlock").innerHTML =
    renderRoutine(PROGRAM.cooldown, "Cool-Down");
}

function renderRoutine(routine, heading) {
  let html = '<div class="card routine"><h3>' + heading + '</h3>';
  routine.items.forEach(item => {
    html += "<h4>" + item.name + "</h4><ul>";
    item.steps.forEach(s => { html += "<li>" + s + "</li>"; });
    html += "</ul>";
  });
  html += "</div>";
  return html;
}

function renderExercise(ex, planKey) {
  const card = document.createElement("div");
  card.className = "card";

  const tag = ex.type === "main"
    ? '<span class="tag">MAIN</span>'
    : '<span class="tag support">SUPPORT</span>';

  let html = "<h4>" + ex.name + tag + "</h4>";
  if (ex.notes) html += '<div class="notes">' + ex.notes + "</div>";

  if (ex.rampUp) {
    html += "<h3>Ramp-Up</h3>";
    ex.rampUp.forEach((w, i) => {
      html += setRow(ex.name, planKey, "W" + (i + 1), w.reps, w.note || "");
    });
  }

  html += "<h3>Work Sets — " + ex.workReps + " reps</h3>";
  for (let i = 1; i <= ex.workSets; i++) {
    html += setRow(ex.name, planKey, "Set " + i, ex.workReps, "");
  }

  card.innerHTML = html;

  card.querySelectorAll("button[data-log]").forEach(btn => {
    btn.addEventListener("click", () => logSet(btn, ex.name, planKey));
  });

  return card;
}

function setRow(exerciseName, planKey, label, targetReps, note) {
  const safe = exerciseName.replace(/[^a-z0-9]/gi, "_");
  const id = safe + "_" + label.replace(/\s/g, "_");
  return (
    '<div class="set-row">' +
      '<span class="label">' + label + "</span>" +
      '<input type="number" placeholder="lb" id="' + id + '_w" />' +
      '<input type="number" placeholder="reps" id="' + id + '_r" />' +
      '<input type="number" placeholder="RPE" id="' + id + '_p" />' +
      '<button data-log="1" data-ex="' + exerciseName + '" data-plan="' + planKey +
        '" data-label="' + label + '" data-id="' + id + '">Log</button>' +
    "</div>" +
    (note ? '<div class="notes">' + note + "</div>" : "")
  );
}

async function logSet(btn, exerciseName, planKey) {
  const id = btn.dataset.id;
  const weight = document.getElementById(id + "_w").value;
  const reps = document.getElementById(id + "_r").value;
  const rpe = document.getElementById(id + "_p").value;
  const athlete = athleteInput.value.trim() || "Unknown";

  if (!weight && !reps) {
    showToast("Enter weight or reps first", true);
    return;
  }

  const payload = {
    athlete: athlete,
    plan: planKey,
    exercise: exerciseName,
    set: btn.dataset.label,
    weight: weight,
    reps: reps,
    rpe: rpe,
    notes: ""
  };

  btn.disabled = true;
  btn.textContent = "...";

  try {
    await fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload)
    });
    btn.classList.add("logged");
    btn.textContent = "Done";
    showToast("Logged " + exerciseName + " " + btn.dataset.label);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = "Log";
    showToast("Failed to log. Try again.", true);
  }
}

function showToast(msg, isError) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  t.classList.toggle("error", !!isError);
  setTimeout(() => t.classList.add("hidden"), 2200);
}
