/* Flag Royale (Fixed Physics) - Matter.js
   ✅ Solid ring drawn with a clear mouth gap (10% random each round)
   ✅ Invisible ring colliders for physics
   ✅ Flags bounce/reflect strongly and NEVER stop moving after Start
   ✅ Escaped flags are "eliminated" from the competition but stay on screen
      and slide/fall to bottom (without global gravity)
   ✅ Screen edges are walls (nothing leaves the screen)
   ✅ PC toggle: Vertical / Horizontal stage
   ✅ Top-5 wins scoreboard (session-only, resets on reload)
   ✅ Random mouth + random spawn each round
   ✅ Start gives immediate random velocity to all flags
   ✅ Auto next round option and countdown overlay
*/

const {
  Engine, Render, Runner, World, Bodies, Body, Events, Vector
} = Matter;

/* ---------- DOM ---------- */
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
const FLAG_RADIUS = 16;
const FLAG_SPRITE_SIZE = 34;

const WALL_THICKNESS = 18;
const RING_SEGMENTS = 92;

const MOUTH_FRACTION = 0.10;      // 10% gap
const ROTATION_SPEED = 0.010;     // rad/tick

const OUT_MARGIN = 26;            // when outside ring => eliminated
const START_VEL_MIN = 3.2;        // initial velocity range
const START_VEL_MAX = 6.2;

const COLLISION_THRESHOLD = 1.8;  // sound trigger threshold
const SOUND_COOLDOWN_MS = 55;

/* “Never stop moving” tuning */
const MIN_SPEED = 2.2;
const MAX_SPEED = 11.0;

/* Extra energy injection near ring boundary */
const RING_KICK_BAND = 28;
const RING_KICK_FORCE = 0.00035;

/* Out flags falling/settling */
const OUT_FALL_FORCE = 0.0018;

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

/* ---------- URL helper ---------- */
function flagUrl(code) {
  return `https://flagcdn.com/w80/${code}.png`;
}

/* ---------- Audio (no files) ---------- */
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

/* ---------- World state ---------- */
let engine, runner, render;
let W = 0, H = 0, dpr = 1;

let ringCenter = { x: 0, y: 0 };
let ringRadius = 0;
let ringAngle = 0;

let mouthCenterAngle = 0;
let mouthHalfAngle = 0;

let ringSegments = [];
let walls = [];

let allFlags = [];
let activeFlags = [];

let eliminatedCount = 0;
let roundNumber = 1;
let started = false;

let nextRoundTimer = null;
const wins = {}; // session-only

/* ---------- UI ---------- */
function setCounts() {
  remainingEl.textContent = String(activeFlags.length);
  eliminatedEl.textContent = String(eliminatedCount);
  roundEl.textContent = String(roundNumber);
}
function renderTop5() {
  const entries = Object.entries(wins).sort((a,b)=>b[1]-a[1]).slice(0,5);
  top5El.innerHTML = "";
  if (entries.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No wins yet";
    top5El.appendChild(li);
    return;
  }
  for (const [name, score] of entries) {
    const li = document.createElement("li");
    li.textContent = `${name} — ${score}`;
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

/* ---------- Sizing ---------- */
function getCanvasTargetRect() {
  return canvas.getBoundingClientRect();
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

  // ring slightly above center, so escaped flags pile at bottom area
  ringCenter = { x: W / 2, y: H * 0.42 };
  ringRadius = Math.min(W, H) * 0.34;
}

/* ---------- Helpers ---------- */
function clearBodies(list) {
  for (const b of list) World.remove(engine.world, b);
  list.length = 0;
}
function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
function randomInsideCircle(maxR) {
  const t = Math.random() * Math.PI * 2;
  const u = Math.random() + Math.random();
  const rr = (u > 1 ? 2 - u : u) * maxR;
  return { x: ringCenter.x + Math.cos(t) * rr, y: ringCenter.y + Math.sin(t) * rr };
}

/* ---------- Screen walls (keep everything on screen) ---------- */
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

/* ---------- Ring with mouth gap (physics segments invisible) ---------- */
function buildRingWithMouth() {
  clearBodies(ringSegments);

  mouthHalfAngle = (Math.PI * 2) * (MOUTH_FRACTION / 2);
  mouthCenterAngle = Math.random() * Math.PI * 2;

  const segCount = RING_SEGMENTS;
  const r = ringRadius;
  const thickness = WALL_THICKNESS;

  for (let i = 0; i < segCount; i++) {
    const a = (i / segCount) * Math.PI * 2;

    // skip the mouth opening
    if (Math.abs(angleDiff(a, mouthCenterAngle)) < mouthHalfAngle) continue;

    const x = ringCenter.x + Math.cos(a) * r;
    const y = ringCenter.y + Math.sin(a) * r;
    const segLen = (2 * Math.PI * r) / segCount + 2;

    const wall = Bodies.rectangle(x, y, segLen, thickness, {
      isStatic: true,
      angle: a,
      label: "ring",
      render: { visible: false } // IMPORTANT: ring is drawn manually
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

/* ---------- Spawn flags ---------- */
function spawnFlags() {
  // remove old
  for (const f of allFlags) World.remove(engine.world, f);
  allFlags = [];
  activeFlags = [];
  eliminatedCount = 0;

  const maxSpawnR = ringRadius - 85;

  for (const c of COUNTRIES) {
    let pos = null;

    for (let tries = 0; tries < 120; tries++) {
      const p = randomInsideCircle(maxSpawnR);

      // avoid spawning right near the mouth direction
      const ang = Math.atan2(p.y - ringCenter.y, p.x - ringCenter.x);
      if (Math.abs(angleDiff(ang, mouthCenterAngle)) < mouthHalfAngle * 1.7) continue;

      // avoid overlaps
      const ok = activeFlags.every(b => Math.hypot(b.position.x - p.x, b.position.y - p.y) > FLAG_RADIUS * 2.0);
      if (ok) { pos = p; break; }
    }
    if (!pos) pos = randomInsideCircle(maxSpawnR);

    const body = Bodies.circle(pos.x, pos.y, FLAG_RADIUS, {
      restitution: 1.02,      // slightly >1 to compensate tiny losses
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,         // NO DRAG
      slop: 0,
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

    allFlags.push(body);
    activeFlags.push(body);
    World.add(engine.world, body);
  }

  setCounts();
}

/* ---------- Start motion (instant chaos) ---------- */
function startVelocities() {
  for (const b of activeFlags) {
    const a = Math.random() * Math.PI * 2;
    const s = START_VEL_MIN + Math.random() * (START_VEL_MAX - START_VEL_MIN);
    Body.setVelocity(b, { x: Math.cos(a) * s, y: Math.sin(a) * s });
    Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.25);
  }
}

/* ---------- Keep flags moving forever (main fix) ---------- */
function keepFlagsMoving() {
  for (const b of activeFlags) {
    const v = b.velocity;
    const speed = Math.hypot(v.x, v.y);

    if (speed < MIN_SPEED) {
      const a = Math.random() * Math.PI * 2;
      Body.setVelocity(b, { x: Math.cos(a) * MIN_SPEED, y: Math.sin(a) * MIN_SPEED });
    } else if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed;
      Body.setVelocity(b, { x: v.x * scale, y: v.y * scale });
    }
  }
}

/* Inject extra energy near ring boundary */
function ringKick() {
  for (const b of activeFlags) {
    const dx = b.position.x - ringCenter.x;
    const dy = b.position.y - ringCenter.y;
    const d = Math.hypot(dx, dy) || 1;

    if (Math.abs(d - ringRadius) < RING_KICK_BAND) {
      const tx = -dy / d;
      const ty = dx / d;
      Body.applyForce(b, b.position, { x: tx * RING_KICK_FORCE, y: ty * RING_KICK_FORCE });
    }
  }
}

/* ---------- Elimination (out of ring) ---------- */
function checkEliminations() {
  const limit = ringRadius + OUT_MARGIN;

  for (const b of activeFlags) {
    const p = b.position;
    const d = Math.hypot(p.x - ringCenter.x, p.y - ringCenter.y);

    if (d > limit) {
      b._eliminated = true;
      b.label = "out";

      // settle out flags
      b.restitution = 0.08;
      b.friction = 0.20;
      b.frictionAir = 0.03;

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

/* ---------- Out flags fall/collect at bottom (no global gravity) ---------- */
function applyOutFlagFall() {
  for (const b of allFlags) {
    if (b._eliminated) {
      Body.applyForce(b, b.position, { x: 0, y: OUT_FALL_FORCE });
      Body.setVelocity(b, { x: b.velocity.x * 0.995, y: b.velocity.y });
    }
  }
}

/* ---------- Collision sound ---------- */
function setupCollisionSound() {
  Events.on(engine, "collisionStart", (evt) => {
    if (!started || !audioCtx) return;

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

/* ---------- Clean ring drawing (solid line with real gap) ---------- */
function drawArenaOverlay() {
  Events.on(render, "afterRender", () => {
    const ctx = render.context;

    const gapStart = (mouthCenterAngle - mouthHalfAngle) + ringAngle;
    const gapEnd   = (mouthCenterAngle + mouthHalfAngle) + ringAngle;

    ctx.save();

    // main solid ring
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(120,170,255,0.55)";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(ringCenter.x, ringCenter.y, ringRadius, gapEnd, gapStart + Math.PI * 2, false);
    ctx.stroke();

    // subtle inner highlight
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.beginPath();
    ctx.arc(ringCenter.x, ringCenter.y, ringRadius, gapEnd, gapStart + Math.PI * 2, false);
    ctx.stroke();

    // divider line for "pile zone"
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.moveTo(0, ringCenter.y + ringRadius + 60);
    ctx.lineTo(W, ringCenter.y + ringRadius + 60);
    ctx.stroke();

    ctx.restore();
  });
}

/* ---------- Round control ---------- */
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

  // auto-start
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

/* ---------- Start ---------- */
function startGame() {
  ensureAudio();
  started = true;
  startVelocities();
}

/* ---------- Init ---------- */
function init() {
  engine = Engine.create();
  engine.enableSleeping = false;   // IMPORTANT: prevents bodies from sleeping
  engine.gravity.y = 0;            // IMPORTANT: no global gravity (we manually drop eliminated)

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
  setCounts();

  Events.on(engine, "beforeUpdate", () => {
    updateRingRotation();

    if (started) {
      checkEliminations();
      keepFlagsMoving();
      ringKick();
    }

    applyOutFlagFall();
  });
}

/* ---------- Events ---------- */
window.addEventListener("resize", () => {
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
  const vertical = stage.classList.contains("vertical");
  stage.classList.toggle("vertical", !vertical);
  stage.classList.toggle("horizontal", vertical);

  btnOrientation.textContent = vertical ? "Vertical" : "Horizontal";

  // wait for CSS layout update then resize
  setTimeout(() => {
    resize();
    buildScreenWalls();
    buildRingWithMouth();
  }, 0);
});

/* ---------- Go ---------- */
init();
