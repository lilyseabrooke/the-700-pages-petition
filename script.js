// Point this at your deployed Cloudflare Worker URL.
const WORKER_URL = "https://the-700-pages-petition.lilyseabrooke00.workers.dev";

const counterEl = document.getElementById("counter");
const buttonEl = document.getElementById("sign-button");
const statusEl = document.getElementById("status");

const numberFormatter = new Intl.NumberFormat("en-US");

function renderCount(count) {
  counterEl.textContent = numberFormatter.format(count);
}

async function fetchCount() {
  try {
    const res = await fetch(`${WORKER_URL}/count`);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const data = await res.json();
    renderCount(data.count);
  } catch (err) {
    counterEl.textContent = "—";
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
