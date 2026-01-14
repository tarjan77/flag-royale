/* Flag Royale - TikTok Vertical First (Fast, Endless Rounds) */

const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

/* ---------------- DOM ---------------- */
const canvas = document.getElementById("world");

const remainingEl = document.getElementById("remaining");
const eliminatedEl = document.getElementById("eliminated");
const roundEl = document.getElementById("round");
const top5El = document.getElementById("top5");

const startOverlay = document.getElementById("startOverlay");
const btnStartBig = document.getElementById("btnStartBig");

const winnerOverlay = document.getElementById("winner");
const winnerText = document.getElementById("winnerText");
const winnerFlag = document.getElementById("winnerFlag");

/* ---------------- CONFIG (fast game) ---------------- */
const FLAG_RADIUS = 15;
const FLAG_SPRITE_W = 34;     // display size
const FLAG_SPRITE_H = 26;

const RING_SEGMENTS = 96;
const WALL_THICKNESS = 18;

const MOUTH_FRACTION = 0.10;  // 10% gap

// Faster ring + stronger kick so game ends quickly
const ROTATION_SPEED = 0.018;
const OUT_MARGIN = 24;

// Motion tuning (never stop + faster)
const START_SPEED_MIN = 6.5;
const START_SPEED_MAX = 10.0;

const MIN_SPEED = 5.2;        // aggressive keep-alive
const MAX_SPEED = 18.0;

const RING_KICK_BAND = 38;
const RING_KICK_FORCE = 0.00085;  // stronger so they speed up on ring hits

// eliminated pit behavior
const OUT_FALL_FORCE = 0.0020;
const PIT_KEEP_Y_FRAC = 0.90;  // bottom 10% is pit; anything below stays, anything above can be pushed down
const PIT_PUSH_DOWN_FORCE = 0.0009;

// sound
const COLLISION_THRESHOLD = 2.2;
const SOUND_COOLDOWN_MS = 45;

/* ---------------- FLAGS (193 UN members) ---------------- */
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

function flagUrl(code){ return `https://flagcdn.com/w80/${code}.png`; }

/* ---------------- AUDIO ---------------- */
let audioCtx = null;
let lastSoundAt = 0;

function ensureAudio(){
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playClink(intensity = 0.6){
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "triangle";
  const base = 420 + Math.random() * 420;
  osc.frequency.setValueAtTime(base, now);
  osc.frequency.exponentialRampToValueAtTime(base * 1.9, now + 0.02);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.min(0.28, 0.04 + intensity * 0.22), now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.085);
}

/* ---------------- WORLD STATE ---------------- */
let engine, render, runner;

let W = 0, H = 0, dpr = 1;
let ringCenter = {x:0,y:0};
let ringRadius = 0;

let ringAngle = 0;
let mouthCenterAngle = 0;
let mouthHalfAngle = 0;

let ringSegments = [];
let walls = [];

let allFlags = [];     // all bodies
let activeFlags = [];  // still competing

let eliminatedCount = 0;
let roundNumber = 1;
let running = false;   // after first Start, runs forever

const wins = {};       // session wins

/* ---------------- LAYOUT / RESIZE ---------------- */
function resize(){
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const rect = canvas.getBoundingClientRect();
  W = Math.max(1, Math.floor(rect.width * dpr));
  H = Math.max(1, Math.floor(rect.height * dpr));
  canvas.width = W;
  canvas.height = H;

  if (render){
    render.options.width = W;
    render.options.height = H;
    render.canvas.width = W;
    render.canvas.height = H;
  }

  // vertical priority:
  // top 10% = HUD, middle 50% = ring, bottom 10% = pit
  // Place ring center around mid-upper area to leave pit at bottom
  ringCenter = { x: W/2, y: H * 0.42 };
  ringRadius = Math.min(W, H) * 0.34;
}

/* ---------------- HELPERS ---------------- */
function clearBodies(list){
  for (const b of list) World.remove(engine.world, b);
  list.length = 0;
}
function angleDiff(a,b){
  let d = a - b;
  while (d > Math.PI) d -= Math.PI*2;
  while (d < -Math.PI) d += Math.PI*2;
  return d;
}
function randomInsideCircle(maxR){
  const t = Math.random() * Math.PI * 2;
  const u = Math.random() + Math.random();
  const rr = (u > 1 ? 2 - u : u) * maxR;
  return { x: ringCenter.x + Math.cos(t)*rr, y: ringCenter.y + Math.sin(t)*rr };
}

/* ---------------- WALLS ---------------- */
function buildScreenWalls(){
  clearBodies(walls);
  const t = 44;
  const opts = { isStatic: true, render: { visible:false } };
  const top = Bodies.rectangle(W/2, -t/2, W+2*t, t, opts);
  const bottom = Bodies.rectangle(W/2, H+t/2, W+2*t, t, opts);
  const left = Bodies.rectangle(-t/2, H/2, t, H+2*t, opts);
  const right = Bodies.rectangle(W+t/2, H/2, t, H+2*t, opts);
  walls.push(top,bottom,left,right);
  World.add(engine.world, walls);
}

/* ---------------- RING WITH GAP ---------------- */
function buildRingWithMouth(){
  clearBodies(ringSegments);

  mouthHalfAngle = (Math.PI*2) * (MOUTH_FRACTION/2);
  mouthCenterAngle = Math.random() * Math.PI*2;

  const segCount = RING_SEGMENTS;
  const r = ringRadius;
  const thickness = WALL_THICKNESS;

  for (let i=0;i<segCount;i++){
    const a = (i/segCount) * Math.PI*2;
    if (Math.abs(angleDiff(a, mouthCenterAngle)) < mouthHalfAngle) continue;

    const x = ringCenter.x + Math.cos(a)*r;
    const y = ringCenter.y + Math.sin(a)*r;
    const segLen = (2*Math.PI*r)/segCount + 2;

    const wall = Bodies.rectangle(x,y, segLen, thickness, {
      isStatic:true,
      angle:a,
      label:"ring",
      render:{ visible:false }
    });

    wall._baseAngle = a;
    ringSegments.push(wall);
  }

  World.add(engine.world, ringSegments);
}

function updateRingRotation(){
  ringAngle += ROTATION_SPEED;
  const r = ringRadius;

  for (const wall of ringSegments){
    const a = wall._baseAngle + ringAngle;
    Body.setPosition(wall, {
      x: ringCenter.x + Math.cos(a)*r,
      y: ringCenter.y + Math.sin(a)*r
    });
    Body.setAngle(wall, a);
  }
}

/* ---------------- FLAGS ---------------- */
function spawnFlags(){
  // remove old flags
  for (const f of allFlags) World.remove(engine.world, f);
  allFlags = [];
  activeFlags = [];
  eliminatedCount = 0;

  const maxSpawnR = ringRadius - 90;

  for (const c of COUNTRIES){
    let pos = null;

    for (let tries=0;tries<150;tries++){
      const p = randomInsideCircle(maxSpawnR);

      // avoid mouth direction
      const ang = Math.atan2(p.y - ringCenter.y, p.x - ringCenter.x);
      if (Math.abs(angleDiff(ang, mouthCenterAngle)) < mouthHalfAngle*1.7) continue;

      // avoid overlaps
      const ok = activeFlags.every(b => Math.hypot(b.position.x - p.x, b.position.y - p.y) > FLAG_RADIUS*2.0);
      if (ok){ pos=p; break; }
    }
    if (!pos) pos = randomInsideCircle(maxSpawnR);

    // VERY bouncy, no drag, no friction = fast reflections
    const body = Bodies.circle(pos.x, pos.y, FLAG_RADIUS, {
      restitution: 1.04,      // slightly > 1 keeps energy alive
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
      slop: 0,
      label: "flag",
      render: {
        sprite: {
          texture: flagUrl(c.code),
          // keep flags more rectangle-like by scaling differently
          xScale: (FLAG_SPRITE_W / 80),
          yScale: (FLAG_SPRITE_H / 80)
        }
      }
    });

    body._countryName = c.name;
    body._countryCode = c.code;
    body._eliminated = false;

    allFlags.push(body);
    activeFlags.push(body);
    World.add(engine.world, body);
  }

  setCounts();
}

function startVelocities(){
  for (const b of activeFlags){
    const a = Math.random() * Math.PI*2;
    const s = START_SPEED_MIN + Math.random()*(START_SPEED_MAX-START_SPEED_MIN);
    Body.setVelocity(b, { x: Math.cos(a)*s, y: Math.sin(a)*s });
    Body.setAngularVelocity(b, (Math.random()-0.5)*0.22);
  }
}

/* Keep alive + speed up */
function keepFlagsMoving(){
  for (const b of activeFlags){
    const v = b.velocity;
    const speed = Math.hypot(v.x, v.y);

    if (speed < MIN_SPEED){
      const a = Math.random() * Math.PI*2;
      Body.setVelocity(b, { x: Math.cos(a)*MIN_SPEED, y: Math.sin(a)*MIN_SPEED });
    } else if (speed > MAX_SPEED){
      const scale = MAX_SPEED / speed;
      Body.setVelocity(b, { x: v.x*scale, y: v.y*scale });
    }
  }
}

/* Ring kick makes them gain speed when interacting with circle */
function ringKick(){
  for (const b of activeFlags){
    const dx = b.position.x - ringCenter.x;
    const dy = b.position.y - ringCenter.y;
    const d = Math.hypot(dx,dy) || 1;

    if (Math.abs(d - ringRadius) < RING_KICK_BAND){
      // tangential push (like rotating boundary)
      const tx = -dy / d;
      const ty = dx / d;
      Body.applyForce(b, b.position, { x: tx*RING_KICK_FORCE, y: ty*RING_KICK_FORCE });
    }
  }
}

/* Elimination: out of ring => removed from competition but stays on screen */
function checkEliminations(){
  const limit = ringRadius + OUT_MARGIN;

  for (const b of activeFlags){
    const p = b.position;
    const d = Math.hypot(p.x - ringCenter.x, p.y - ringCenter.y);
    if (d > limit){
      b._eliminated = true;
      b.label = "out";

      // settle in pit (less bounce)
      b.restitution = 0.08;
      b.friction = 0.20;
      b.frictionAir = 0.03;

      eliminatedCount++;
    }
  }

  const survivors = activeFlags.filter(b => !b._eliminated);
  if (survivors.length !== activeFlags.length){
    activeFlags = survivors;
    setCounts();
  }

  if (running && activeFlags.length === 1){
    endRound(activeFlags[0]);
  }
}

/* Make eliminated flags fall and keep them mostly in bottom 10% area.
   If too many, it's OK if some go out of view (we push them down and let them stack). */
function applyOutPit(){
  const pitTopY = H * PIT_KEEP_Y_FRAC;

  for (const b of allFlags){
    if (!b._eliminated) continue;

    // constant down pull
    Body.applyForce(b, b.position, { x: 0, y: OUT_FALL_FORCE });

    // if an eliminated flag drifts above pit area, push it down harder
    if (b.position.y < pitTopY){
      Body.applyForce(b, b.position, { x: 0, y: PIT_PUSH_DOWN_FORCE });
    }

    // slight damping sideways to make pile compact
    Body.setVelocity(b, { x: b.velocity.x * 0.992, y: b.velocity.y });
  }
}

/* ---------------- ROUND FLOW ---------------- */
function endRound(winnerBody){
  running = false;

  const name = winnerBody._countryName;
  const code = winnerBody._countryCode;

  wins[name] = (wins[name] || 0) + 1;
  renderTop5();

  // winner overlay: show flag + name for 3 sec
  winnerText.textContent = `${name} wins!`;
  winnerFlag.src = flagUrl(code);
  winnerOverlay.classList.remove("hidden");

  setTimeout(() => {
    winnerOverlay.classList.add("hidden");
    nextRound();
  }, 3000);
}

function nextRound(){
  roundNumber += 1;
  ringAngle = 0;

  buildRingWithMouth();
  spawnFlags();
  startVelocities();

  running = true;
  setCounts();
}

/* ---------------- UI ---------------- */
function setCounts(){
  remainingEl.textContent = String(activeFlags.length);
  eliminatedEl.textContent = String(eliminatedCount);
  roundEl.textContent = String(roundNumber);
}

function renderTop5(){
  const entries = Object.entries(wins).sort((a,b)=>b[1]-a[1]).slice(0,5);
  top5El.innerHTML = "";
  if (entries.length === 0){
    const li = document.createElement("li");
    li.textContent = "No wins yet";
    top5El.appendChild(li);
    return;
  }
  for (const [name, score] of entries){
    const li = document.createElement("li");
    li.textContent = `${name} — ${score}`;
    top5El.appendChild(li);
  }
}

/* ---------------- COLLISION SOUND ---------------- */
function setupCollisionSound(){
  Events.on(engine, "collisionStart", (evt) => {
    if (!running || !audioCtx) return;

    const nowMs = performance.now();
    if (nowMs - lastSoundAt < SOUND_COOLDOWN_MS) return;

    for (const pair of evt.pairs){
      const a = pair.bodyA;
      const b = pair.bodyB;
      if (a.label === "flag" && b.label === "flag"){
        const speed = (a.speed + b.speed) * 0.5;
        if (speed >= COLLISION_THRESHOLD){
          lastSoundAt = nowMs;
          playClink(Math.min(1, speed / 12));
          break;
        }
      }
    }
  });
}

/* ---------------- DRAW SOLID RING WITH GAP ---------------- */
function drawOverlay(){
  Events.on(render, "afterRender", () => {
    const ctx = render.context;

    const gapStart = (mouthCenterAngle - mouthHalfAngle) + ringAngle;
    const gapEnd   = (mouthCenterAngle + mouthHalfAngle) + ringAngle;

    ctx.save();

    // ring line (solid, clean)
    ctx.lineWidth = 12;
    ctx.strokeStyle = "rgba(10,18,34,0.60)";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(ringCenter.x, ringCenter.y, ringRadius, gapEnd, gapStart + Math.PI*2, false);
    ctx.stroke();

    // subtle highlight
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.arc(ringCenter.x, ringCenter.y, ringRadius, gapEnd, gapStart + Math.PI*2, false);
    ctx.stroke();

    // pit separator line (visual guide)
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(10,18,34,0.18)";
    ctx.beginPath();
    ctx.moveTo(0, H * PIT_KEEP_Y_FRAC);
    ctx.lineTo(W, H * PIT_KEEP_Y_FRAC);
    ctx.stroke();

    ctx.restore();
  });
}

/* ---------------- INIT ---------------- */
function init(){
  engine = Engine.create();
  engine.enableSleeping = false; // never sleep = never stop
  engine.gravity.y = 0;          // no global gravity (we manage pit falling)

  render = Render.create({
    canvas,
    engine,
    options: {
      width: canvas.width,
      height: canvas.height,
      wireframes: false,
      background: "transparent",  // let CSS background show
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
  drawOverlay();
  renderTop5();
  setCounts();

  Events.on(engine, "beforeUpdate", () => {
    updateRingRotation();

    if (running){
      checkEliminations();
      keepFlagsMoving();
      ringKick();
    }

    // eliminated pit behavior always
    applyOutPit();
  });
}

window.addEventListener("resize", () => {
  resize();
  buildScreenWalls();
  buildRingWithMouth();
});

/* ---------------- START (one-time) ---------------- */
btnStartBig.addEventListener("click", () => {
  ensureAudio();
  startOverlay.style.display = "none";

  // start the endless game
  roundNumber = 1;
  ringAngle = 0;

  buildRingWithMouth();
  spawnFlags();
  startVelocities();

  running = true;
  setCounts();
});

/* GO */
init();
