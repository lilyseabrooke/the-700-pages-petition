// Point this at your deployed Cloudflare Worker URL.
const WORKER_URL = "https://the-700-pages-petition.lilyseabrooke00.workers.dev";

// Flavor-text goal for the progress bar — purely decorative, the real count
// always comes from the Worker.
const GOAL = 10000;

// How many times *this browser* has clicked sign. Local-only flavor, not
// sent anywhere — the petition explicitly doesn't care who's signing.
const MINE_KEY = "petition700.mine";

const countEl = document.getElementById("count");
const progressFillEl = document.getElementById("progress-fill");
const goalEl = document.getElementById("goal");
const buttonEl = document.getElementById("sign-button");
const statusEl = document.getElementById("status");
const sealEl = document.getElementById("seal");
const badgeEl = document.getElementById("mine-badge");
const mineLabelEl = document.getElementById("mine-label");

const numberFormatter = new Intl.NumberFormat("en-US");

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
  const pct = Math.min(100, (count / GOAL) * 100);
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

goalEl.textContent = numberFormatter.format(GOAL);
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

    statusEl.textContent = "Thank you for your meaningless but heartfelt support.";
  } catch (err) {
    statusEl.textContent = "Something went wrong. Your click has been lost to the void.";
    console.error(err);
  } finally {
    buttonEl.disabled = false;
  }
}

buttonEl.addEventListener("click", signPetition);

fetchCount();
