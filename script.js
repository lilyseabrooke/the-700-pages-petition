// Point this at your deployed Cloudflare Worker URL.
const WORKER_URL = "https://the-700-pages-petition.lilyseabrooke00.workers.dev";

// Milestones for the progress bar's label + goal — purely decorative, the
// real count always comes from the Worker. Editable without touching code:
// see milestones.txt.
const MILESTONES_URL = "milestones.txt";
const FALLBACK_MILESTONES = [{ label: "Jacqueline will probably listen at", goal: 10 }];

// How many times *this browser* has clicked sign. Local-only flavor, not
// sent anywhere — the petition explicitly doesn't care who's signing.
const MINE_KEY = "petition700.mine";

const countEl = document.getElementById("count");
const progressFillEl = document.getElementById("progress-fill");
const goalLabelEl = document.getElementById("goal-label");
const goalEl = document.getElementById("goal");
const buttonEl = document.getElementById("sign-button");
const statusEl = document.getElementById("status");
const sealEl = document.getElementById("seal");
const badgeEl = document.getElementById("mine-badge");
const mineLabelEl = document.getElementById("mine-label");
const challengeButtonEl = document.getElementById("challenge-button");
const challengeDialogEl = document.getElementById("challenge-dialog");
const challengeDialogOkEl = document.getElementById("challenge-dialog-ok");

const numberFormatter = new Intl.NumberFormat("en-US");

let milestones = FALLBACK_MILESTONES;

// Parses lines like: "LABEL TEXT", 10
// Blank lines and lines starting with # are ignored.
function parseMilestones(text) {
  const rows = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^"([^"]*)"\s*,\s*(\d+)\s*$/);
    if (!match) continue;
    rows.push({ label: match[1], goal: parseInt(match[2], 10) });
  }
  rows.sort((a, b) => a.goal - b.goal);
  return rows;
}

async function loadMilestones() {
  try {
    const res = await fetch(MILESTONES_URL);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const parsed = parseMilestones(await res.text());
    if (parsed.length > 0) milestones = parsed;
  } catch (err) {
    console.error("Couldn't load milestones.txt, using fallback goal.", err);
  }
}

// The active milestone is the first one not yet reached, or the last one
// once the count has passed every goal listed.
function currentMilestone(count) {
  return milestones.find(m => count < m.goal) ?? milestones[milestones.length - 1];
}

function getMine() {
  try {
    return parseInt(localStorage.getItem(MINE_KEY), 10) || 0;
  } catch (e) {
    return 0;
  }
}

function setMine(mine) {
  try {
    localStorage.setItem(MINE_KEY, String(mine));
  } catch (e) {
    // localStorage unavailable — badge just won't persist across visits.
  }
}

function renderMine(mine) {
  if (mine > 0) {
    mineLabelEl.textContent = mine === 1 ? "Your mark is affixed" : `Your marks: ${mine}`;
    badgeEl.hidden = false;
  } else {
    badgeEl.hidden = true;
  }
}

function renderCount(count) {
  countEl.textContent = numberFormatter.format(count);

  const milestone = currentMilestone(count);
  goalLabelEl.textContent = milestone.label;
  goalEl.textContent = numberFormatter.format(milestone.goal);
  const pct = Math.min(100, (count / milestone.goal) * 100);
  progressFillEl.style.width = `${pct.toFixed(2)}%`;
}

function flourish() {
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  sealEl.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());

  countEl.classList.remove("pop");
  void countEl.offsetWidth; // restart the animation
  countEl.classList.add("pop");
}

renderMine(getMine());

async function fetchCount() {
  try {
    const res = await fetch(`${WORKER_URL}/count`);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const data = await res.json();
    renderCount(data.count);
  } catch (err) {
    countEl.textContent = "—";
    statusEl.textContent = "Couldn't reach the counter. Try again shortly.";
    console.error(err);
  }
}

async function signPetition() {
  buttonEl.disabled = true;
  statusEl.textContent = "Signing…";

  try {
    const res = await fetch(`${WORKER_URL}/sign`, { method: "POST" });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const data = await res.json();
    renderCount(data.count);
    flourish();

    const mine = getMine() + 1;
    setMine(mine);
    renderMine(mine);

    statusEl.textContent = "Thank you for supporting our objectively correct cause.";
  } catch (err) {
    statusEl.textContent = "Something went wrong. Your click has been lost to the void.";
    console.error(err);
  } finally {
    buttonEl.disabled = false;
  }
}

buttonEl.addEventListener("click", signPetition);

// The petition cannot, in fact, be challenged. Esc doesn't get you out of
// it either — only agreeing (and signing) does.
challengeButtonEl.addEventListener("click", () => challengeDialogEl.showModal());
challengeDialogEl.addEventListener("cancel", event => event.preventDefault());
challengeDialogOkEl.addEventListener("click", () => {
  challengeDialogEl.close();
  signPetition();
});

async function init() {
  await loadMilestones();
  await fetchCount();
}

init();
