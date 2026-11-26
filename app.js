import { EVENT, CATEGORIES } from "./config.js";
import { createStore } from "./store.js";

const $ = (sel) => document.querySelector(sel);
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Each browser gets a random id so people can remove their own entries.
const OWNER = (() => {
  try {
    let id = localStorage.getItem("potluck:owner");
    if (!id) localStorage.setItem("potluck:owner", (id = crypto.randomUUID()));
    return id;
  } catch {
    return crypto.randomUUID();
  }
})();

const STATUS_LABEL = { yes: "Going", maybe: "Maybe", no: "Can't go" };

const removeBtn = (col, item) =>
  item.owner === OWNER
    ? `<button class="remove-btn" data-col="${col}" data-id="${esc(item.id)}" title="Remove">Remove</button>`
    : "";

function renderGuests(rsvps) {
  const order = { yes: 0, maybe: 1, no: 2 };
  const sorted = [...rsvps].sort((a, b) => order[a.status] - order[b.status] || a.created - b.created);
  $("#guest-count").textContent = `(${rsvps.filter((r) => r.status === "yes").length} going)`;
  $("#guest-list").innerHTML = sorted.length
    ? sorted
        .map(
          (r) => `<li><span class="name">${esc(r.name)}</span>
            <span class="pill ${esc(r.status)}">${STATUS_LABEL[r.status] ?? ""}</span>${removeBtn("rsvps", r)}</li>`,
        )
        .join("")
    : `<li class="empty">No RSVPs yet.</li>`;
  $("#rsvp-submit").textContent = rsvps.some((r) => r.owner === OWNER) ? "Update RSVP" : "RSVP";
}

function renderFood(dishes) {
  $("#food-list").innerHTML = dishes.length
    ? CATEGORIES.map((cat) => {
        const items = dishes.filter((d) => d.category === cat);
        if (!items.length) return "";
        return `<h3>${esc(cat)}</h3><ul class="list">${items
          .map(
            (d) => `<li><span class="name">${esc(d.dish)}<span class="who">${esc(d.name)}</span></span>
              ${removeBtn("dishes", d)}</li>`,
          )
          .join("")}</ul>`;
      }).join("")
    : `<p class="empty">Nothing yet.</p>`;
}

function onSubmit(form, msgEl, handler) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await handler(new FormData(form));
      msgEl.className = "form-msg";
      msgEl.textContent = "Saved!";
    } catch (err) {
      console.error(err);
      msgEl.className = "form-msg error";
      msgEl.textContent = "Something went wrong. Try again?";
    }
  });
}

// ─── Boot ────────────────────────────────────────────────────
document.querySelectorAll("[data-event]").forEach((el) => (el.textContent = EVENT[el.dataset.event] ?? ""));
$("#category-select").innerHTML = CATEGORIES.map((c) => `<option>${esc(c)}</option>`).join("");

const store = await createStore();
if (store.mode === "local") $("#demo-banner").hidden = false;

let rsvps = [];
store.subscribe("rsvps", (items) => renderGuests((rsvps = items)));
store.subscribe("dishes", renderFood);

onSubmit($("#rsvp-form"), $("#rsvp-msg"), async (fd) => {
  // One RSVP per browser: replace the old one
  const old = rsvps.filter((r) => r.owner === OWNER);
  await store.add("rsvps", { name: fd.get("name").trim(), status: fd.get("status"), owner: OWNER });
  await Promise.all(old.map((r) => store.remove("rsvps", r.id)));
});

onSubmit($("#food-form"), $("#food-msg"), async (fd) => {
  await store.add("dishes", {
    name: fd.get("name").trim(),
    category: fd.get("category"),
    dish: fd.get("dish").trim(),
    owner: OWNER,
  });
  $("#food-form").dish.value = "";
});

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".remove-btn");
  if (btn && confirm("Remove this?")) await store.remove(btn.dataset.col, btn.dataset.id);
});

// Light snowfall
const snow = $(".snow");
for (let i = 0; i < 40; i++) {
  const f = document.createElement("span");
  const size = 2 + Math.random() * 4;
  f.className = "flake";
  f.style.cssText = `left:${Math.random() * 100}vw; width:${size}px; height:${size}px;
    opacity:${0.3 + Math.random() * 0.6}; animation-duration:${12 + Math.random() * 18}s;
    animation-delay:${-Math.random() * 30}s; --y:${Math.random() * 100}vh;`;
  snow.appendChild(f);
}

// String lights: 3 bulbs per scallop of the wire (8 scallops, y = 8 + 60u(1-u))
const bulbs = $(".bulbs");
const colors = ["#d9434c", "#e3b75a", "#6cc3a5", "#f2d3c0"];
for (let k = 0; k < 8; k++) {
  [0.25, 0.5, 0.75].forEach((u, j) => {
    const b = document.createElement("li");
    b.style.cssText = `left:${((k + u) / 8) * 100}%; top:${8 + 60 * u * (1 - u)}px;
      --c:${colors[(k * 3 + j) % colors.length]}; animation-delay:${-Math.random() * 3}s;`;
    bulbs.appendChild(b);
  });
}

// Background music: Jingle Bells (public domain) on a little music-box synth.
// Browsers block autoplay with sound, so it starts from the button.
const musicBtn = $("#music-btn");
const BEAT = 0.32;
const MELODY = [ // [midi note, beats]
  [76,1],[76,1],[76,2], [76,1],[76,1],[76,2], [76,1],[79,1],[72,1.5],[74,0.5], [76,4],
  [77,1],[77,1],[77,1.5],[77,0.5], [77,1],[76,1],[76,1],[76,0.5],[76,0.5], [76,1],[74,1],[74,1],[76,1], [74,2],[79,2],
  [76,1],[76,1],[76,2], [76,1],[76,1],[76,2], [76,1],[79,1],[72,1.5],[74,0.5], [76,4],
  [77,1],[77,1],[77,1.5],[77,0.5], [77,1],[76,1],[76,1],[76,0.5],[76,0.5], [79,1],[79,1],[77,1],[74,1], [72,4],
];
const BASS = [48,48,48,48, 53,48,55,55, 48,48,48,48, 53,48,55,48]; // one root per bar
const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);
let audio = null;

function bell(t, hz, dur, vol) {
  const { ctx, out } = audio;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(out);
  [[1, 1], [2, 0.3], [3, 0.1]].forEach(([mult, level]) => {
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.frequency.value = hz * mult;
    og.gain.value = level;
    o.connect(og).connect(g);
    o.start(t);
    o.stop(t + dur);
  });
}

function sleighBell(t) {
  const { ctx, out, noise } = audio;
  const src = ctx.createBufferSource();
  const hp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = noise;
  hp.type = "highpass";
  hp.frequency.value = 7000;
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  src.connect(hp).connect(g).connect(out);
  src.start(t);
  src.stop(t + 0.15);
}

function scheduleSong(start) {
  let t = start;
  for (const [m, beats] of MELODY) {
    bell(t, midiHz(m), beats * BEAT + 0.6, 0.18);
    t += beats * BEAT;
  }
  BASS.forEach((root, i) => {
    const bar = start + i * 4 * BEAT;
    bell(bar, midiHz(root), 1.2, 0.12);
    bell(bar + 2 * BEAT, midiHz(root + 7), 1.2, 0.08);
    sleighBell(bar + BEAT);
    sleighBell(bar + 3 * BEAT);
  });
  return t;
}

function syncMusicBtn() {
  const playing = audio.ctx.state === "running";
  musicBtn.setAttribute("aria-pressed", String(playing));
  musicBtn.textContent = playing ? "Stop music" : "Play music";
}

// Start playing on load. Most browsers keep the audio suspended until the visitor
// interacts, so we also start it on their first tap/click/keypress anywhere.
{
  const ctx = new AudioContext();
  const out = ctx.createGain();
  out.gain.value = 0.6;
  out.connect(ctx.destination);
  const noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
  noise.getChannelData(0).forEach((_, i, d) => { d[i] = Math.random() * 2 - 1; });
  audio = { ctx, out, noise, userPaused: false };
  // Queue the song once the browser lets audio run, then each loop shortly before the last ends
  setInterval(() => {
    if (audio.end && ctx.currentTime > audio.end - 2) audio.end = scheduleSong(audio.end);
  }, 500);
  ctx.onstatechange = () => {
    if (ctx.state === "running" && !audio.end) audio.end = scheduleSong(ctx.currentTime + 0.1);
    syncMusicBtn();
  };
  ctx.resume().catch(() => {});
  syncMusicBtn();

  const events = ["pointerdown", "touchend", "keydown"];
  const startOnInteraction = (e) => {
    if (e.target.closest?.("#music-btn")) return; // the button handles itself
    events.forEach((ev) => document.removeEventListener(ev, startOnInteraction, true));
    if (!audio.userPaused) ctx.resume();
  };
  events.forEach((ev) => document.addEventListener(ev, startOnInteraction, true));
}

musicBtn.addEventListener("click", async () => {
  if (audio.ctx.state === "running") {
    audio.userPaused = true;
    await audio.ctx.suspend();
  } else {
    audio.userPaused = false;
    await audio.ctx.resume();
  }
  syncMusicBtn();
});

// Welcome screen: entering counts as the interaction that lets the music start
$("#enter-btn").addEventListener("click", () => {
  audio.userPaused = false;
  audio.ctx.resume();
  $("#welcome").classList.add("gone");
});
