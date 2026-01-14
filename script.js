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
const FLAG_RADIUS = 22;             // physics circle radius (px)
const FLAG_SPRITE_SIZE = 44;        // sprite display size (px)
const WALL_THICKNESS = 18;
const WALL_SEGMENTS = 64;           // more segments -> smoother ring
const ROTATION_SPEED = 0.008;       // radians per tick (feel free to adjust)
const OUT_MARGIN = 30;              // how far outside counts as eliminated
const START_IMPULSE = 0.012;        // initial push for chaos
const COLLISION_SPEED_THRESHOLD = 2.2;
const SOUND_COOLDOWN_MS = 55;

/** Pick flags here. Add more countries easily. */
const COUNTRIES = [
  { name: "Nepal", code: "np" },
  { name: "Japan", code: "jp" },
  { name: "Brazil", code: "br" },
  { name: "Germany", code: "de" },
  { name: "India", code: "in" },
  { name: "Australia", code: "au" },
  { name: "USA", code: "us" },
  { name: "France", code: "fr" },
  { name: "Argentina", code: "ar" },
  { name: "South Korea", code: "kr" },
  { name: "United Kingdom", code: "gb" },
  { name: "Canada", code: "ca" },
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
