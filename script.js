const {
  Engine, Render, Runner, World, Bodies, Body, Events, Vector
} = Matter;

const canvas = document.getElementById("world");
const stage = document.getElementById("stage");

const remainingEl = document.getElementById("remaining");
const eliminatedEl = document.getElementById("eliminated");
const roundEl = document.getElementById("round");
const top5El = document.getElementById("top5");

const winnerOverlay = document.getElementById("winner");
const winnerText = document.getElementById("winnerText");
const winnerSub = document.getElementById("winnerSub");

const btnStart = document.getElementById("btnStart");
const btnReset = document.getElementById("btnReset");
const btnNextRound = document.getElementById("btnNextRound");
const btnPlayAgain = document.getElementById("btnPlayAgain");
const autoNext = document.getElementById("autoNext");
const btnOrientation = document.getElementById("btnOrientation");

/* ---------- CONFIG ---------- */
const FLAG_RADIUS = 16;            // physics radius
const FLAG_SPRITE_SIZE = 34;       // display size
const WALL_THICKNESS = 18;
const RING_SEGMENTS = 84;          // smoother ring
const MOUTH_FRACTION = 0.10;       // 10% gap
const ROTATION_SPEED = 0.010;      // rad/tick
const OUT_MARGIN = 26;
const START_PUSH = 0.020;          // initial force
const COLLISION_THRESHOLD = 2.0;
const SOUND_COOLDOWN_MS = 60;

/* ---------- FLAGS (193 UN members) ---------- */
const COUNTRIES = [
  { name: "Afghanistan", code: "af" },{ name: "Albania", code: "al" },{ name: "Algeria", code: "dz" },{ name: "Andorra", code: "ad" },
  { name: "Angola", code: "ao" },{ name: "Antigua and Barbuda", code: "ag" },{ name: "Argentina", code: "ar" },{ name: "Armenia", code: "am" },
  { name: "Australia", code: "au" },{ name: "Austria", code: "at" },{ name: "Azerbaijan", code: "az" },{ name: "Bahamas", code: "bs" },
  { name: "Bahrain", code: "bh" },{ name: "Bangladesh", code: "bd" },{ name: "Barbados", code: "bb" },{ name: "Belarus", code: "by" },
  { name: "Belgium", code: "be" },{ name: "Belize", code: "bz" },{ name: "Benin", code: "bj" },{ name: "Bhutan", code: "bt" },
  { name: "Bolivia", code: "bo" },{ name: "Bosnia and Herzegovina", code: "ba" },{ name: "Botswana", code: "bw" },{ name: "Brazil", code: "br" },
  { name: "Brunei", code: "bn" },{ name: "Bulgaria", code: "bg" },{ name: "Burkina Faso", code: "bf" },{ name: "Burundi", code: "bi" },
  { name: "Cambodia", code: "kh" },{ name: "Cameroon", code: "cm" },{ name: "Canada", code: "ca" },{ name: "Cape Verde", code: "cv" },
  { name: "Central African Republic", code: "cf" },{ name: "Chad", code: "td" },{ name: "Chile", code: "cl" },{ name: "China", code: "cn" },
  { name: "Colombia", code: "co" },{ name: "Comoros", code: "km" },{ name: "Congo", code: "cg" },{ name: "Costa Rica", code: "cr" },
  { name: "Croatia", code: "hr" },{ name: "Cuba", code: "cu" },{ name: "Cyprus", code: "cy" },{ name: "Czech Republic", code: "cz" },
  { name: "Denmark", code: "dk" },{ name: "Djibouti", code: "dj" },{ name: "Dominica", code: "dm" },{ name: "Dominican Republic", code: "do" },
  { name: "Ecuador", code: "ec" },{ name: "Egypt", code: "eg" },{ name: "El Salvador", code: "sv" },{ name: "Equatorial Guinea", code: "gq" },
  { name: "Eritrea", code: "er" },{ name: "Estonia", code: "ee" },{ name: "Eswatini", code: "sz" },{ name: "Ethiopia", code: "et" },
  { name: "Fiji", code: "fj" },{ name: "Finland", code: "fi" },{ name: "France", code: "fr" },{ name: "Gabon", code: "ga" },
  { name: "Gambia", code: "gm" },{ name: "Georgia", code: "ge" },{ name: "Germany", code: "de" },{ name: "Ghana", code: "gh" },
  { name: "Greece", code: "gr" },{ name: "Grenada", code: "gd" },{ name: "Guatemala", code: "gt" },{ name: "Guinea", code: "gn" },
  { name: "Guinea-Bissau", code: "gw" },{ name: "Guyana", code: "gy" },{ name: "Haiti", code: "ht" },{ name: "Honduras", code: "hn" },
  { name: "Hungary", code: "hu" },{ name: "Iceland", code: "is" },{ name: "India", code: "in" },{ name: "Indonesia", code: "id" },
  { name: "Iran", code: "ir" },{ name: "Iraq", code: "iq" },{ name: "Ireland", code: "ie" },{ name: "Israel", code: "il" },
  { name: "Italy", code: "it" },{ name: "Jamaica", code: "jm" },{ name: "Japan", code: "jp" },{ name: "Jordan", code: "jo" },
  { name: "Kazakhstan", code: "kz" },{ name: "Kenya", code: "ke" },{ name: "Kiribati", code: "ki" },{ name: "Kuwait", code: "kw" },
  { name: "Kyrgyzstan", code: "kg" },{ name: "Laos", code: "la" },{ name: "Latvia", code: "lv" },{ name: "Lebanon", code: "lb" },
  { name: "Lesotho", code: "ls" },{ name: "Liberia", code: "lr" },{ name: "Libya", code: "ly" },{ name: "Liechtenstein", code: "li" },
  { name: "Lithuania", code: "lt" },{ name: "Luxembourg", code: "lu" },{ name: "Madagascar", code: "mg" },{ name: "Malawi", code: "mw" },
  { name: "Malaysia", code: "my" },{ name: "Maldives", code: "mv" },{ name: "Mali", code: "ml" },{ name: "Malta", code: "mt" },
  { name: "Marshall Islands", code: "mh" },{ name: "Mauritania", code: "mr" },{ name: "Mauritius", code: "mu" },{ name: "Mexico", code: "mx" },
  { name: "Micronesia", code: "fm" },{ name: "Moldova", code: "md" },{ name: "Monaco", code: "mc" },{ name: "Mongolia", code: "mn" },
  { name: "Montenegro", code: "me" },{ name: "Morocco", code: "ma" },{ name: "Mozambique", code: "mz" },{ name: "Myanmar", code: "mm" },
  { name: "Namibia", code: "na" },{ name: "Nauru", code: "nr" },{ name: "Nepal", code: "np" },{ name: "Netherlands", code: "nl" },
  { name: "New Zealand", code: "nz" },{ name: "Nicaragua", code: "ni" },{ name: "Niger", code: "ne" },{ name: "Nigeria", code: "ng" },
  { name: "North Korea", code: "kp" },{ name: "North Macedonia", code: "mk" },{ name: "Norway", code: "no" },{ name: "Oman", code: "om" },
  { name: "Pakistan", code: "pk" },{ name: "Palau", code: "pw" },{ name: "Panama", code: "pa" },{ name: "Papua New Guinea", code: "pg" },
  { name: "Paraguay", code: "py" },{ name: "Peru", code: "pe" },{ name: "Philippines", code: "ph" },{ name: "Poland", code: "pl" },
  { name: "Portugal", code: "pt" },{ name: "Qatar", code: "qa" },{ name: "Romania", code: "ro" },{ name: "Russia", code: "ru" },
  { name: "Rwanda", code: "rw" },{ name: "Saint Kitts and Nevis", code: "kn" },{ name: "Saint Lucia", code: "lc" },
  { name: "Saint Vincent and the Grenadines", code: "vc" },{ name: "Samoa", code: "ws" },{ name: "San Marino", code: "sm" },
  { name: "Sao Tome and Principe", code: "st" },{ name: "Saudi Arabia", code: "sa" },{ name: "Senegal", code: "sn" },
  { name: "Serbia", code: "rs" },{ name: "Seychelles", code: "sc" },{ name: "Sierra Leone", code: "sl" },{ name: "Singapore", code: "sg" },
  { name: "Slovakia", code: "sk" },{ name: "Slovenia", code: "si" },{ name: "Solomon Islands", code: "sb" },
  { name: "Somalia", code: "so" },{ name: "South Africa", code: "za" },{ name: "South Sudan", code: "ss" },{ name: "Spain", code: "es" },
  { name: "Sri Lanka", code: "lk" },{ name: "Sudan", code: "sd" },{ name: "Suriname", code: "sr" },{ name: "Sweden", code: "se" },
  { name: "Switzerland", code: "ch" },{ name: "Syria", code: "sy" },{ name: "Tajikistan", code: "tj" },{ name: "Tanzania", code: "tz" },
  { name: "Thailand", code: "th" },{ name: "Timor-Leste", code: "tl" },{ name: "Togo", code: "tg" },{ name: "Tonga", code: "to" },
  { name: "Trinidad and Tobago", code: "tt" },{ name: "Tunisia", code: "tn" },{ name: "Turkey", code: "tr" },
  { name: "Turkmenistan", code: "tm" },{ name: "Tuvalu", code: "tv" },{ name: "Uganda", code: "ug" },{ name: "Ukraine", code: "ua" },
  { name: "United Arab Emirates", code: "ae" },{ name: "United Kingdom", code: "gb" },{ name: "United States", code: "us" },
  { name: "Uruguay", code: "uy" },{ name: "Uzbekistan", code: "uz" },{ name: "Vanuatu", code: "vu" },
  { name: "Vatican City", code: "va" },{ name: "Venezuela", code: "ve" },{ name: "Vietnam", code: "vn" },{ name: "Yemen", code: "ye" },
  { name: "Zambia", code: "zm" },{ name: "Zimbabwe", code: "zw" }
];

/* ---------- helpers ---------- */
function flagUrl(code) {
  return `https://flagcdn.com/w80/${code}.png`;
}

/* ---------- audio (no file) ---------- */
let audioCtx = null;
let lastSoundAt = 0;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}
function playClink(intensity = 0.5) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "triangle";
  const base = 350 + Math.random() * 350;
  osc.frequency.setValueAtTime(base, now);
  osc.frequency.exponentialRampToValueAtTime(base * 1.8, now + 0.02);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.min(0.25, 0.03 + intensity * 0.20), now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

/* ---------- world state ---------- */
let engine, runner, render;
let W = 0, H = 0, dpr = 1;

let ringCenter = { x: 0, y: 0 };
let ringRadius = 0;
let ringAngle = 0;
let mouthCenterAngle = 0;
let mouthHalfAngle = 0;

let ringSegments = [];
let walls = [];
let allFlags = [];       // all bodies (including eliminated)
let activeFlags = [];    // still in the ring competition

let eliminatedCount = 0;
let roundNumber = 1;
let started = false;
let nextRoundTimer = null;

const wins = {}; // session wins per country

function setCounts() {
  remainingEl.textContent = String(activeFlags.length);
  eliminatedEl.textContent = String(eliminatedCount);
  roundEl.textContent = String(roundNumber);
}

function renderTop5() {
  const entries = Object.entries(wins).sort((a,b)=>b[1]-a[1]).slice(0,5);
  top5El.innerHTML = "";
  for (const [name, score] of entries) {
    const li = document.createElement("li");
    li.textContent = `${name} — ${score}`;
    top5El.appendChild(li);
  }
  if (entries.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No wins yet";
    top5El.appendChild(li);
  }
}

function showWinner(name) {
  winnerText.textContent = `${name} wins!`;
  winnerOverlay.classList.remove("hidden");
}

function hideWinner() {
  winnerOverlay.classList.add("hidden");
}

/* ---------- sizing ---------- */
function getCanvasTargetRect() {
  // We read the displayed canvas size from CSS (stage modes)
  const rect = canvas.getBoundingClientRect();
  return rect;
}

function resize() {
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const rect = getCanvasTargetRect();
  W = Math.max(1, Math.floor(rect.width * dpr));
  H = Math.max(1, Math.floor(rect.height * dpr));

  canvas.width = W;
  canvas.height = H;

  if (render) {
    render.options.width = W;
    render.options.height = H;
    render.canvas.width = W;
    render.canvas.height = H;
  }

  // ring sits in upper portion so escape -> drop to bottom
  ringCenter = { x: W / 2, y: H * 0.42 };
  ringRadius = Math.min(W, H) * 0.34;
}

/* ---------- build boundaries ---------- */
function clearBodies(list) {
  for (const b of list) World.remove(engine.world, b);
  list.length = 0;
}

function buildScreenWalls() {
  clearBodies(walls);
  const t = 40;
  const opts = { isStatic: true, render: { visible: false } };

  const top = Bodies.rectangle(W/2, -t/2, W+2*t, t, opts);
  const bottom = Bodies.rectangle(W/2, H + t/2, W+2*t, t, opts);
  const left = Bodies.rectangle(-t/2, H/2, t, H+2*t, opts);
  const right = Bodies.rectangle(W + t/2, H/2, t, H+2*t, opts);

  walls.push(top, bottom, left, right);
  World.add(engine.world, walls);
}

function angleDiff(a, b) {
  // smallest signed diff
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function buildRingWithMouth() {
  clearBodies(ringSegments);

  mouthHalfAngle = (Math.PI * 2) * (MOUTH_FRACTION / 2); // half-gap
  mouthCenterAngle = Math.random() * Math.PI * 2;        // random each round

  const segCount = RING_SEGMENTS;
  const r = ringRadius;
  const thickness = WALL_THICKNESS;

  for (let i = 0; i < segCount; i++) {
    const a = (i / segCount) * Math.PI * 2;
    // skip segments inside mouth window
    if (Math.abs(angleDiff(a, mouthCenterAngle)) < mouthHalfAngle) continue;

    const x = ringCenter.x + Math.cos(a) * r;
    const y = ringCenter.y + Math.sin(a) * r;

    const segLen = (2 * Math.PI * r) / segCount + 2;

    const wall = Bodies.rectangle(x, y, segLen, thickness, {
      isStatic: true,
      angle: a,
      label: "ring",
      render: { fillStyle: "#203252" }
    });

    wall._baseAngle = a;
    ringSegments.push(wall);
  }

  World.add(engine.world, ringSegments);
}

function updateRingRotation() {
  ringAngle += ROTATION_SPEED;
  const r = ringRadius;

  for (const wall of ringSegments) {
    const a = wall._baseAngle + ringAngle;
    const x = ringCenter.x + Math.cos(a) * r;
    const y = ringCenter.y + Math.sin(a) * r;
    Body.setPosition(wall, { x, y });
    Body.setAngle(wall, a);
  }
}

/* ---------- flags ---------- */
function randomInsideCircle(maxR) {
  const t = Math.random() * Math.PI * 2;
  const u = Math.random() + Math.random();
  const rr = (u > 1 ? 2 - u : u) * maxR;
  return { x: ringCenter.x + Math.cos(t) * rr, y: ringCenter.y + Math.sin(t) * rr };
}

function spawnFlags() {
  // remove old flags
  for (const f of allFlags) World.remove(engine.world, f);
  allFlags = [];
  activeFlags = [];
  eliminatedCount = 0;

  const maxSpawnR = ringRadius - 85;

  for (const c of COUNTRIES) {
    let pos = null;

    for (let tries = 0; tries < 90; tries++) {
      const p = randomInsideCircle(maxSpawnR);

      // don’t spawn too close to mouth direction
      const ang = Math.atan2(p.y - ringCenter.y, p.x - ringCenter.x);
      if (Math.abs(angleDiff(ang, mouthCenterAngle)) < mouthHalfAngle * 1.6) continue;

      const ok = activeFlags.every(b => {
        const dx = b.position.x - p.x;
        const dy = b.position.y - p.y;
        return Math.hypot(dx, dy) > FLAG_RADIUS * 2.0;
      });
      if (ok) { pos = p; break; }
    }
    if (!pos) pos = randomInsideCircle(maxSpawnR);

    const body = Bodies.circle(pos.x, pos.y, FLAG_RADIUS, {
      restitution: 0.9,
      friction: 0.02,
      frictionAir: 0.01,
      density: 0.001,
      label: "flag",
      render: {
        sprite: {
          texture: flagUrl(c.code),
          xScale: FLAG_SPRITE_SIZE / 80,
          yScale: FLAG_SPRITE_SIZE / 80
        }
      }
    });

    body._countryName = c.name;
    body._eliminated = false;
    body._lastHitAt = 0;

    allFlags.push(body);
    activeFlags.push(body);
    World.add(engine.world, body);
  }

  setCounts();
}

/* ---------- elimination logic ---------- */
function checkEliminations() {
  const limit = ringRadius + OUT_MARGIN;

  for (const b of activeFlags) {
    const p = b.position;
    const d = Math.hypot(p.x - ringCenter.x, p.y - ringCenter.y);

    if (d > limit) {
      b._eliminated = true;
      b.label = "out";

      // make eliminated flags slide & settle nicely
      b.restitution = 0.15;
      b.friction = 0.15;
      b.frictionAir = 0.02;

      eliminatedCount++;
    }
  }

  const survivors = activeFlags.filter(b => !b._eliminated);
  if (survivors.length !== activeFlags.length) {
    activeFlags = survivors;
    setCounts();
  }

  if (started && activeFlags.length === 1) {
    const winner = activeFlags[0]._countryName;
    wins[winner] = (wins[winner] || 0) + 1;
    renderTop5();

    started = false;
    showWinner(winner);

    if (autoNext.checked) scheduleNextRound();
  }
}

/* ---------- start push ---------- */
function startPush() {
  // random left/right energy immediately
  for (const b of activeFlags) {
    const dirX = Math.random() < 0.5 ? -1 : 1;
    const jitterY = (Math.random() - 0.5) * 0.4;
    const force = { x: dirX * START_PUSH, y: jitterY * START_PUSH };
    Body.applyForce(b, b.position, force);
  }
}

/* ---------- collisions sound ---------- */
function setupCollisionSound() {
  Events.on(engine, "collisionStart", (evt) => {
    if (!started) return;
    if (!audioCtx) return;

    const nowMs = performance.now();
    if (nowMs - lastSoundAt < SOUND_COOLDOWN_MS) return;

    for (const pair of evt.pairs) {
      const a = pair.bodyA;
      const b = pair.bodyB;

      if (a.label === "flag" && b.label === "flag") {
        const speed = (a.speed + b.speed) * 0.5;
        if (speed >= COLLISION_THRESHOLD) {
          lastSoundAt = nowMs;
          playClink(Math.min(1, speed / 10));
          break;
        }
      }
    }
  });
}

/* ---------- visuals ---------- */
function drawArenaOverlay() {
  Events.on(render, "afterRender", () => {
    const ctx = render.context;

    // ring outline
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.arc(ringCenter.x, ringCenter.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // mouth highlight
    const startA = mouthCenterAngle - mouthHalfAngle + ringAngle;
    const endA = mouthCenterAngle + mouthHalfAngle + ringAngle;
    ctx.beginPath();
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(43,124,255,0.35)";
    ctx.arc(ringCenter.x, ringCenter.y, ringRadius, startA, endA);
    ctx.stroke();

    // hint "drop zone"
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.moveTo(0, ringCenter.y + ringRadius + 60);
    ctx.lineTo(W, ringCenter.y + ringRadius + 60);
    ctx.stroke();

    ctx.restore();
  });
}

/* ---------- round control ---------- */
function cancelNextTimer() {
  if (nextRoundTimer) {
    clearInterval(nextRoundTimer);
    nextRoundTimer = null;
  }
}

function scheduleNextRound() {
  cancelNextTimer();
  let t = 3;
  winnerSub.textContent = `Next round in ${t}…`;

  nextRoundTimer = setInterval(() => {
    t -= 1;
    if (t <= 0) {
      cancelNextTimer();
      nextRound();
    } else {
      winnerSub.textContent = `Next round in ${t}…`;
    }
  }, 1000);
}

function nextRound() {
  hideWinner();
  roundNumber += 1;
  setCounts();

  ringAngle = 0;
  buildRingWithMouth();
  spawnFlags();

  // start automatically (no clicking)
  startGame();
}

function resetAll(resetScores = false) {
  hideWinner();
  cancelNextTimer();

  if (resetScores) {
    for (const k of Object.keys(wins)) delete wins[k];
    renderTop5();
    roundNumber = 1;
  }

  started = false;
  ringAngle = 0;

  buildScreenWalls();
  buildRingWithMouth();
  spawnFlags();

  setCounts();
}

/* ---------- start/stop ---------- */
function startGame() {
  ensureAudio();
  started = true;
  startPush();
}

/* ---------- init ---------- */
function init() {
  engine = Engine.create();
  engine.gravity.y = 0; // important: eliminated flags FALL and collect at bottom

  render = Render.create({
    canvas,
    engine,
    options: {
      width: canvas.width,
      height: canvas.height,
      wireframes: false,
      background: "#0b1220",
      pixelRatio: 1
    },
  });

  runner = Runner.create();
  Runner.run(runner, engine);
  Render.run(render);

  resize();
  buildScreenWalls();
  buildRingWithMouth();
  spawnFlags();

  setupCollisionSound();
  drawArenaOverlay();
  renderTop5();

  Events.on(engine, "beforeUpdate", () => {
    updateRingRotation();
    if (started) checkEliminations();
  });

  setCounts();
}

window.addEventListener("resize", () => {
  // keep stage sizing accurate, then rebuild boundaries
  resize();
  buildScreenWalls();
  buildRingWithMouth();
});

btnStart.addEventListener("click", () => {
  hideWinner();
  startGame();
});

btnReset.addEventListener("click", () => resetAll(false));
btnNextRound.addEventListener("click", () => {
  cancelNextTimer();
  nextRound();
});
btnPlayAgain.addEventListener("click", () => resetAll(true));

btnOrientation.addEventListener("click", () => {
  // toggle stage mode
  const vertical = stage.classList.contains("vertical");
  stage.classList.toggle("vertical", !vertical);
  stage.classList.toggle("horizontal", vertical);

  btnOrientation.textContent = vertical ? "Vertical" : "Horizontal";

  // Important: update canvas size based on new CSS size
  setTimeout(() => {
    resize();
    buildScreenWalls();
    buildRingWithMouth();
  }, 0);
});

// Start
init();
