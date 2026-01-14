/* Flag Royale - Matter.js
   - Rotating circle boundary
   - Flags collide with sound
   - If a flag escapes -> eliminated
   - Last remaining -> winner overlay
*/

const {
  Engine,
  Render,
  Runner,
  World,
  Bodies,
  Body,
  Events,
  Composite,
  Vector
} = Matter;

const canvas = document.getElementById("world");
const remainingEl = document.getElementById("remaining");
const eliminatedEl = document.getElementById("eliminated");
const winnerOverlay = document.getElementById("winner");
const winnerText = document.getElementById("winnerText");
const btnStart = document.getElementById("btnStart");
const btnReset = document.getElementById("btnReset");
const btnPlayAgain = document.getElementById("btnPlayAgain");

/** ---------- CONFIG ---------- **/
const FLAG_RADIUS = 16;             // physics circle radius (px)
const FLAG_SPRITE_SIZE = 32;        // sprite display size (px)
const WALL_THICKNESS = 18;
const WALL_SEGMENTS = 64;           // more segments -> smoother ring
const ROTATION_SPEED = 0.008;       // radians per tick (feel free to adjust)
const OUT_MARGIN = 30;              // how far outside counts as eliminated
const START_IMPULSE = 0.012;        // initial push for chaos
const COLLISION_SPEED_THRESHOLD = 2.2;
const SOUND_COOLDOWN_MS = 55;

/** Pick flags here. Add more countries easily. */
const COUNTRIES = [
  { name: "Afghanistan", code: "af" },
  { name: "Albania", code: "al" },
  { name: "Algeria", code: "dz" },
  { name: "Andorra", code: "ad" },
  { name: "Angola", code: "ao" },
  { name: "Antigua and Barbuda", code: "ag" },
  { name: "Argentina", code: "ar" },
  { name: "Armenia", code: "am" },
  { name: "Australia", code: "au" },
  { name: "Austria", code: "at" },
  { name: "Azerbaijan", code: "az" },

  { name: "Bahamas", code: "bs" },
  { name: "Bahrain", code: "bh" },
  { name: "Bangladesh", code: "bd" },
  { name: "Barbados", code: "bb" },
  { name: "Belarus", code: "by" },
  { name: "Belgium", code: "be" },
  { name: "Belize", code: "bz" },
  { name: "Benin", code: "bj" },
  { name: "Bhutan", code: "bt" },
  { name: "Bolivia", code: "bo" },
  { name: "Bosnia and Herzegovina", code: "ba" },
  { name: "Botswana", code: "bw" },
  { name: "Brazil", code: "br" },
  { name: "Brunei", code: "bn" },
  { name: "Bulgaria", code: "bg" },
  { name: "Burkina Faso", code: "bf" },
  { name: "Burundi", code: "bi" },

  { name: "Cambodia", code: "kh" },
  { name: "Cameroon", code: "cm" },
  { name: "Canada", code: "ca" },
  { name: "Cape Verde", code: "cv" },
  { name: "Central African Republic", code: "cf" },
  { name: "Chad", code: "td" },
  { name: "Chile", code: "cl" },
  { name: "China", code: "cn" },
  { name: "Colombia", code: "co" },
  { name: "Comoros", code: "km" },
  { name: "Congo", code: "cg" },
  { name: "Costa Rica", code: "cr" },
  { name: "Croatia", code: "hr" },
  { name: "Cuba", code: "cu" },
  { name: "Cyprus", code: "cy" },
  { name: "Czech Republic", code: "cz" },

  { name: "Denmark", code: "dk" },
  { name: "Djibouti", code: "dj" },
  { name: "Dominica", code: "dm" },
  { name: "Dominican Republic", code: "do" },

  { name: "Ecuador", code: "ec" },
  { name: "Egypt", code: "eg" },
  { name: "El Salvador", code: "sv" },
  { name: "Equatorial Guinea", code: "gq" },
  { name: "Eritrea", code: "er" },
  { name: "Estonia", code: "ee" },
  { name: "Eswatini", code: "sz" },
  { name: "Ethiopia", code: "et" },

  { name: "Fiji", code: "fj" },
  { name: "Finland", code: "fi" },
  { name: "France", code: "fr" },

  { name: "Gabon", code: "ga" },
  { name: "Gambia", code: "gm" },
  { name: "Georgia", code: "ge" },
  { name: "Germany", code: "de" },
  { name: "Ghana", code: "gh" },
  { name: "Greece", code: "gr" },
  { name: "Grenada", code: "gd" },
  { name: "Guatemala", code: "gt" },
  { name: "Guinea", code: "gn" },
  { name: "Guinea-Bissau", code: "gw" },
  { name: "Guyana", code: "gy" },

  { name: "Haiti", code: "ht" },
  { name: "Honduras", code: "hn" },
  { name: "Hungary", code: "hu" },

  { name: "Iceland", code: "is" },
  { name: "India", code: "in" },
  { name: "Indonesia", code: "id" },
  { name: "Iran", code: "ir" },
  { name: "Iraq", code: "iq" },
  { name: "Ireland", code: "ie" },
  { name: "Israel", code: "il" },
  { name: "Italy", code: "it" },

  { name: "Jamaica", code: "jm" },
  { name: "Japan", code: "jp" },
  { name: "Jordan", code: "jo" },

  { name: "Kazakhstan", code: "kz" },
  { name: "Kenya", code: "ke" },
  { name: "Kiribati", code: "ki" },
  { name: "Kuwait", code: "kw" },
  { name: "Kyrgyzstan", code: "kg" },

  { name: "Laos", code: "la" },
  { name: "Latvia", code: "lv" },
  { name: "Lebanon", code: "lb" },
  { name: "Lesotho", code: "ls" },
  { name: "Liberia", code: "lr" },
  { name: "Libya", code: "ly" },
  { name: "Liechtenstein", code: "li" },
  { name: "Lithuania", code: "lt" },
  { name: "Luxembourg", code: "lu" },

  { name: "Madagascar", code: "mg" },
  { name: "Malawi", code: "mw" },
  { name: "Malaysia", code: "my" },
  { name: "Maldives", code: "mv" },
  { name: "Mali", code: "ml" },
  { name: "Malta", code: "mt" },
  { name: "Marshall Islands", code: "mh" },
  { name: "Mauritania", code: "mr" },
  { name: "Mauritius", code: "mu" },
  { name: "Mexico", code: "mx" },
  { name: "Micronesia", code: "fm" },
  { name: "Moldova", code: "md" },
  { name: "Monaco", code: "mc" },
  { name: "Mongolia", code: "mn" },
  { name: "Montenegro", code: "me" },
  { name: "Morocco", code: "ma" },
  { name: "Mozambique", code: "mz" },
  { name: "Myanmar", code: "mm" },

  { name: "Namibia", code: "na" },
  { name: "Nauru", code: "nr" },
  { name: "Nepal", code: "np" },
  { name: "Netherlands", code: "nl" },
  { name: "New Zealand", code: "nz" },
  { name: "Nicaragua", code: "ni" },
  { name: "Niger", code: "ne" },
  { name: "Nigeria", code: "ng" },
  { name: "North Korea", code: "kp" },
  { name: "North Macedonia", code: "mk" },
  { name: "Norway", code: "no" },

  { name: "Oman", code: "om" },

  { name: "Pakistan", code: "pk" },
  { name: "Palau", code: "pw" },
  { name: "Panama", code: "pa" },
  { name: "Papua New Guinea", code: "pg" },
  { name: "Paraguay", code: "py" },
  { name: "Peru", code: "pe" },
  { name: "Philippines", code: "ph" },
  { name: "Poland", code: "pl" },
  { name: "Portugal", code: "pt" },

  { name: "Qatar", code: "qa" },

  { name: "Romania", code: "ro" },
  { name: "Russia", code: "ru" },
  { name: "Rwanda", code: "rw" },

  { name: "Saint Kitts and Nevis", code: "kn" },
  { name: "Saint Lucia", code: "lc" },
  { name: "Saint Vincent and the Grenadines", code: "vc" },
  { name: "Samoa", code: "ws" },
  { name: "San Marino", code: "sm" },
  { name: "Sao Tome and Principe", code: "st" },
  { name: "Saudi Arabia", code: "sa" },
  { name: "Senegal", code: "sn" },
  { name: "Serbia", code: "rs" },
  { name: "Seychelles", code: "sc" },
  { name: "Sierra Leone", code: "sl" },
  { name: "Singapore", code: "sg" },
  { name: "Slovakia", code: "sk" },
  { name: "Slovenia", code: "si" },
  { name: "Solomon Islands", code: "sb" },
  { name: "Somalia", code: "so" },
  { name: "South Africa", code: "za" },
  { name: "South Sudan", code: "ss" },
  { name: "Spain", code: "es" },
  { name: "Sri Lanka", code: "lk" },
  { name: "Sudan", code: "sd" },
  { name: "Suriname", code: "sr" },
  { name: "Sweden", code: "se" },
  { name: "Switzerland", code: "ch" },
  { name: "Syria", code: "sy" },

  { name: "Tajikistan", code: "tj" },
  { name: "Tanzania", code: "tz" },
  { name: "Thailand", code: "th" },
  { name: "Timor-Leste", code: "tl" },
  { name: "Togo", code: "tg" },
  { name: "Tonga", code: "to" },
  { name: "Trinidad and Tobago", code: "tt" },
  { name: "Tunisia", code: "tn" },
  { name: "Turkey", code: "tr" },
  { name: "Turkmenistan", code: "tm" },
  { name: "Tuvalu", code: "tv" },

  { name: "Uganda", code: "ug" },
  { name: "Ukraine", code: "ua" },
  { name: "United Arab Emirates", code: "ae" },
  { name: "United Kingdom", code: "gb" },
  { name: "United States", code: "us" },
  { name: "Uruguay", code: "uy" },
  { name: "Uzbekistan", code: "uz" },

  { name: "Vanuatu", code: "vu" },
  { name: "Vatican City", code: "va" },
  { name: "Venezuela", code: "ve" },
  { name: "Vietnam", code: "vn" },

  { name: "Yemen", code: "ye" },

  { name: "Zambia", code: "zm" },
  { name: "Zimbabwe", code: "zw" }
];


/** Flag CDN (PNG). Works well on GitHub/Vercel. */
function flagUrl(code) {
  // 80px wide PNGs
  return `https://flagcdn.com/w80/${code}.png`;
}

/** ---------- AUDIO (WebAudio, no files) ---------- **/
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}
function playClink(intensity = 0.5) {
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  // a quick “clicky” metallic feel
  osc.type = "triangle";
  const base = 420 + Math.random() * 260;
  osc.frequency.setValueAtTime(base, now);
  osc.frequency.exponentialRampToValueAtTime(base * 1.9, now + 0.02);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.min(0.25, 0.03 + intensity * 0.22), now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

/** ---------- GAME STATE ---------- **/
let engine, runner, render;
let arenaCenter = { x: 0, y: 0 };
let arenaRadius = 0;
let ringSegments = [];
let flags = [];
let eliminatedCount = 0;
let started = false;
let ringAngle = 0;
let lastSoundAt = 0;

function setCounts() {
  remainingEl.textContent = String(flags.length);
  eliminatedEl.textContent = String(eliminatedCount);
}

function resize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const w = Math.floor(window.innerWidth * dpr);
  const h = Math.floor(window.innerHeight * dpr);

  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  if (render) {
    render.options.width = w;
    render.options.height = h;
    render.canvas.width = w;
    render.canvas.height = h;
  }

  arenaCenter = { x: w / 2, y: h / 2 };
  arenaRadius = Math.min(w, h) * 0.34; // adjust size of circle here
}

function createEngine() {
  engine = Engine.create();
  engine.gravity.y = 0; // no gravity, like the TikTok style
}

function createRenderer() {
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

  Render.run(render);
}

function createRunner() {
  runner = Runner.create();
  Runner.run(runner, engine);
}

/** Create a ring boundary from many static rectangles */
function buildRing() {
  // cleanup old
  for (const seg of ringSegments) World.remove(engine.world, seg);
  ringSegments = [];

  const segCount = WALL_SEGMENTS;
  const r = arenaRadius;
  const thickness = WALL_THICKNESS;

  for (let i = 0; i < segCount; i++) {
    const a = (i / segCount) * Math.PI * 2;
    const x = arenaCenter.x + Math.cos(a) * r;
    const y = arenaCenter.y + Math.sin(a) * r;

    // segment length approximates arc chord
    const segLen = (2 * Math.PI * r) / segCount + 2;

    const wall = Bodies.rectangle(x, y, segLen, thickness, {
      isStatic: true,
      angle: a,
      render: { fillStyle: "#203252" }
    });

    // store local angle for rotation updates
    wall._baseAngle = a;
    ringSegments.push(wall);
  }

  World.add(engine.world, ringSegments);
}

function randomInsideCircle(maxR) {
  // random uniform-ish within circle
  const t = Math.random() * Math.PI * 2;
  const u = Math.random() + Math.random();
  const rr = (u > 1 ? 2 - u : u) * maxR;
  return {
    x: arenaCenter.x + Math.cos(t) * rr,
    y: arenaCenter.y + Math.sin(t) * rr
  };
}

function createFlags() {
  // cleanup old
  for (const f of flags) World.remove(engine.world, f.body);
  flags = [];
  eliminatedCount = 0;
  setCounts();

  const maxSpawnR = arenaRadius - 90;

  for (const c of COUNTRIES) {
    // attempt to spawn without too much overlap
    let pos = null;
    for (let tries = 0; tries < 80; tries++) {
      const p = randomInsideCircle(maxSpawnR);
      const ok = flags.every(f => {
        const dx = f.body.position.x - p.x;
        const dy = f.body.position.y - p.y;
        return Math.hypot(dx, dy) > FLAG_RADIUS * 2.2;
      });
      if (ok) { pos = p; break; }
    }
    if (!pos) pos = randomInsideCircle(maxSpawnR);

    const body = Bodies.circle(pos.x, pos.y, FLAG_RADIUS, {
      restitution: 0.95,
      friction: 0.02,
      frictionAir: 0.01,
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
    body._lastHitAt = 0;

    flags.push({ body, name: c.name, code: c.code });
    World.add(engine.world, body);
  }

  // give them a little initial velocity so it starts lively
  for (const f of flags) {
    const dir = Vector.normalise({
      x: (Math.random() - 0.5),
      y: (Math.random() - 0.5)
    });
    Body.applyForce(f.body, f.body.position, { x: dir.x * START_IMPULSE, y: dir.y * START_IMPULSE });
  }

  setCounts();
}

function showWinner(name) {
  winnerText.textContent = `${name} wins!`;
  winnerOverlay.classList.remove("hidden");
}

function hideWinner() {
  winnerOverlay.classList.add("hidden");
}

/** Update ring rotation by moving the static segments */
function updateRingRotation() {
  ringAngle += ROTATION_SPEED;

  const r = arenaRadius;
  for (const wall of ringSegments) {
    const a = wall._baseAngle + ringAngle;

    const x = arenaCenter.x + Math.cos(a) * r;
    const y = arenaCenter.y + Math.sin(a) * r;

    Body.setPosition(wall, { x, y });
    Body.setAngle(wall, a);
  }
}

/** Eliminate flags that go outside */
function checkEliminations() {
  const limit = arenaRadius + OUT_MARGIN;

  const survivors = [];
  for (const f of flags) {
    const p = f.body.position;
    const d = Math.hypot(p.x - arenaCenter.x, p.y - arenaCenter.y);

    if (d > limit) {
      // eliminate
      World.remove(engine.world, f.body);
      eliminatedCount++;
    } else {
      survivors.push(f);
    }
  }

  if (survivors.length !== flags.length) {
    flags = survivors;
    setCounts();

    if (flags.length === 1) {
      showWinner(flags[0].name);
      started = false; // stop logic (physics still runs but no more eliminations)
    }
  }
}

/** Collision sound */
function setupCollisionSound() {
  Events.on(engine, "collisionStart", (evt) => {
    if (!started) return;
    if (!audioCtx) return;

    const nowMs = performance.now();
    if (nowMs - lastSoundAt < SOUND_COOLDOWN_MS) return;

    for (const pair of evt.pairs) {
      const a = pair.bodyA;
      const b = pair.bodyB;

      // only flag-flag collisions (ignore wall hits)
      if (a.label === "flag" && b.label === "flag") {
        const speed = (a.speed + b.speed) * 0.5;
        if (speed >= COLLISION_SPEED_THRESHOLD) {
          lastSoundAt = nowMs;
          playClink(Math.min(1, speed / 10));
          break;
        }
      }
    }
  });
}

/** Main tick */
function setupTick() {
  Events.on(engine, "beforeUpdate", () => {
    if (!started) return;
    updateRingRotation();
    checkEliminations();
  });
}

/** Draw a visible circle outline (purely visual) */
function drawArenaOverlay() {
  Events.on(render, "afterRender", () => {
    const ctx = render.context;

    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.arc(arenaCenter.x, arenaCenter.y, arenaRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
}

function resetGame() {
  hideWinner();
  ringAngle = 0;
  started = false;
  createFlags();
  setCounts();
}

function startGame() {
  ensureAudio();  // user gesture required
  hideWinner();
  started = true;
}

/** ---------- INIT ---------- **/
function init() {
  resize();
  createEngine();
  createRenderer();
  createRunner();

  buildRing();
  createFlags();

  setupCollisionSound();
  setupTick();
  drawArenaOverlay();

  setCounts();
}

window.addEventListener("resize", () => {
  // Rebuild everything on resize for simplicity
  if (!engine) return;
  resize();
  buildRing();
});

btnStart.addEventListener("click", startGame);
btnReset.addEventListener("click", resetGame);
btnPlayAgain.addEventListener("click", () => {
  resetGame();
  startGame();
});

// Start
init();
