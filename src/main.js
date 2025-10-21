const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const TILE_SIZE = 12;
const WORLD_WIDTH = 96;
const WORLD_HEIGHT = 96;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hexToRgb(hex) {
  const parsed = hex.replace('#', '');
  const bigint = parseInt(parsed, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function mixHex(a, b, t) {
  const colorA = hexToRgb(a);
  const colorB = hexToRgb(b);
  const r = Math.round(lerp(colorA.r, colorB.r, t));
  const g = Math.round(lerp(colorA.g, colorB.g, t));
  const b = Math.round(lerp(colorA.b, colorB.b, t));
  const toHex = (value) => value.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const TILES = {
  GRASS: 0,
  BUILDING: 1,
  ROAD: 2,
  SIDEWALK: 3,
  WATER: 4,
  PARK: 5,
  HIGHLIGHT: 6,
};

const TILE_DEF = {
  [TILES.GRASS]: {
    colors: { day: '#37e1a0', night: '#0b5246' },
    accent: '#5ef2d1',
    solid: false,
  },
  [TILES.BUILDING]: {
    colors: { day: '#2b2f38', night: '#090b12' },
    accent: '#4cc9f0',
    solid: true,
  },
  [TILES.ROAD]: {
    colors: { day: '#1f2430', night: '#05070f' },
    lane: '#ffe066',
    solid: false,
  },
  [TILES.SIDEWALK]: {
    colors: { day: '#3e4a5b', night: '#141922' },
    accent: '#a6b3c9',
    solid: false,
  },
  [TILES.WATER]: {
    colors: { day: '#207a9f', night: '#07223b' },
    accent: '#64dfdf',
    solid: true,
  },
  [TILES.PARK]: {
    colors: { day: '#2ca58d', night: '#123f37' },
    accent: '#9bffcb',
    solid: false,
  },
  [TILES.HIGHLIGHT]: {
    colors: { day: '#f8961e', night: '#f25c54' },
    accent: '#ffda79',
    solid: false,
  },
};

const world = {
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT,
  tiles: new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT),
};

const inputs = new Set();
let paused = false;
let lastTime = performance.now();
let heatCooldown = 0;
let frameClock = 0;

const lighting = {
  time: Math.random(),
  palette: 0.6,
  speed: 0.02,
  weather: 'clear',
  weatherTimer: 14,
  weatherIntensity: 0,
};

const weatherParticles = [];

const billboardCopy = [
  'NEON VELOCITY',
  'SKIPTRACE CLOUD',
  'MIDNIGHT MARKET',
  'VOID MART™',
  'GLITCH BISTRO',
  'SYNTHLANE 5',
  'QUANTUM LOOT',
  'CYBERLEASE',
  'SAFEHOU5E',
  'PULSEWAVE',
  'ION DRIFT',
  'NOVA RIDE',
];

const billboards = [];

const ui = {
  loot: document.getElementById('loot-count'),
  wanted: document.getElementById('wanted-level'),
  heat: document.getElementById('heat-meter'),
  status: document.getElementById('status-message'),
  cycle: document.getElementById('cycle-indicator'),
  resume: document.getElementById('resume-button'),
};

ui.resume.addEventListener('click', () => {
  paused = false;
  ui.resume.hidden = true;
  ui.status.textContent = 'Back on the streets.';
});

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  const { code } = event;
  if (code === 'KeyP') {
    paused = !paused;
    ui.resume.hidden = !paused;
    ui.status.textContent = paused ? 'Planning the next move…' : 'Chaos resumed!';
    return;
  }
  if (code === 'Space') {
    attemptDash();
  }
  inputs.add(code);
});

window.addEventListener('keyup', (event) => {
  inputs.delete(event.code);
});

const player = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  w: 0.8,
  h: 0.9,
  speed: 4.6,
  dashTimer: 0,
  dashCooldown: 0,
  trail: [],
  invulnerable: 0,
};

const pedestrians = [];
const cars = [];
const enforcers = [];
const lootCrates = [];
let lootCollected = 0;
let wantedLevel = 0;
let heatLevel = 0;
let statusTimer = 0;

function generateWorld() {
  world.tiles.fill(TILES.GRASS);

  const setTile = (x, y, tile) => {
    if (x < 0 || y < 0 || x >= world.width || y >= world.height) return;
    world.tiles[y * world.width + x] = tile;
  };

  // Lay down a Manhattan-style road grid.
  for (let y = 0; y < world.height; y++) {
    if (y % 12 === 6) {
      for (let x = 0; x < world.width; x++) {
        setTile(x, y, TILES.ROAD);
        if (y + 1 < world.height) setTile(x, y + 1, TILES.SIDEWALK);
        if (y - 1 >= 0) setTile(x, y - 1, TILES.SIDEWALK);
      }
    }
  }

  for (let x = 0; x < world.width; x++) {
    if (x % 12 === 6) {
      for (let y = 0; y < world.height; y++) {
        setTile(x, y, TILES.ROAD);
        if (x + 1 < world.width) setTile(x + 1, y, TILES.SIDEWALK);
        if (x - 1 >= 0) setTile(x - 1, y, TILES.SIDEWALK);
      }
    }
  }

  // City blocks with buildings.
  for (let blockY = 0; blockY < world.height; blockY += 12) {
    for (let blockX = 0; blockX < world.width; blockX += 12) {
      const offsetX = blockX + 2 + Math.floor(Math.random() * 2);
      const offsetY = blockY + 2 + Math.floor(Math.random() * 2);
      const width = 4 + Math.floor(Math.random() * 3);
      const height = 4 + Math.floor(Math.random() * 3);
      for (let y = offsetY; y < offsetY + height; y++) {
        for (let x = offsetX; x < offsetX + width; x++) {
          if (Math.random() < 0.1) {
            setTile(x, y, TILES.PARK);
          } else {
            setTile(x, y, TILES.BUILDING);
          }
        }
      }
    }
  }

  // Waterfront district.
  for (let y = world.height - 18; y < world.height; y++) {
    for (let x = 0; x < 18; x++) {
      if (x + y > world.height) {
        setTile(x, y, TILES.WATER);
      }
    }
  }

  // Neon-highlighted plazas near the center.
  const centerX = Math.floor(world.width / 2);
  const centerY = Math.floor(world.height / 2);
  for (let y = centerY - 4; y <= centerY + 4; y++) {
    for (let x = centerX - 4; x <= centerX + 4; x++) {
      if ((x + y) % 2 === 0) setTile(x, y, TILES.HIGHLIGHT);
    }
  }
}

function seedBillboards(count = 14) {
  billboards.length = 0;
  for (let i = 0; i < count; i++) {
    const { x, y } = randomNavigablePosition();
    billboards.push({
      x,
      y,
      w: 1.6 + Math.random() * 1.4,
      h: 0.8 + Math.random() * 0.6,
      hue: Math.floor(Math.random() * 360),
      text: billboardCopy[i % billboardCopy.length],
      phase: Math.random() * Math.PI * 2,
      speed: 1 + Math.random() * 1.5,
    });
  }
}

generateWorld();
seedBillboards();

function randomNavigablePosition() {
  let attempt = 0;
  while (attempt++ < 1000) {
    const x = Math.random() * (world.width - 2) + 1;
    const y = Math.random() * (world.height - 2) + 1;
    if (!isSolid(x, y)) {
      return { x, y };
    }
  }
  return { x: world.width / 2, y: world.height / 2 };
}

function spawnPedestrian() {
  const { x, y } = randomNavigablePosition();
  const colors = ['#f9c74f', '#90be6d', '#f94144', '#577590', '#4d908e'];
  pedestrians.push({
    x,
    y,
    w: 0.7,
    h: 0.8,
    speed: 2 + Math.random() * 1.5,
    direction: Math.random() * Math.PI * 2,
    changeTimer: Math.random() * 3,
    color: colors[Math.floor(Math.random() * colors.length)],
  });
}

function spawnCar() {
  const lanes = [];
  for (let y = 0; y < world.height; y++) {
    if (getTile(5, y) === TILES.ROAD) lanes.push({ axis: 'horizontal', coord: y });
  }
  for (let x = 0; x < world.width; x++) {
    if (getTile(x, 5) === TILES.ROAD) lanes.push({ axis: 'vertical', coord: x });
  }
  if (!lanes.length) return;
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  if (lane.axis === 'horizontal') {
    cars.push({
      x: Math.random() < 0.5 ? -2 : world.width + 2,
      y: lane.coord + 0.1,
      w: 1.6,
      h: 0.9,
      speed: 5 + Math.random() * 1.5,
      direction: Math.random() < 0.5 ? 1 : -1,
      color: '#e63946',
    });
  } else {
    cars.push({
      x: lane.coord + 0.1,
      y: Math.random() < 0.5 ? -2 : world.height + 2,
      w: 0.9,
      h: 1.6,
      speed: 5 + Math.random() * 1.5,
      direction: Math.random() < 0.5 ? 1 : -1,
      color: '#4361ee',
    });
  }
}

function spawnLoot(count = 12) {
  for (let i = 0; i < count; i++) {
    const pos = randomNavigablePosition();
    lootCrates.push({ x: pos.x, y: pos.y, w: 0.7, h: 0.7, collected: false, pulse: Math.random() * Math.PI * 2 });
  }
  updateLootUI();
}

function spawnEnforcer() {
  if (enforcers.length >= Math.ceil(wantedLevel)) return;
  const { x, y } = randomNavigablePosition();
  enforcers.push({
    x,
    y,
    w: 0.85,
    h: 0.85,
    speed: 3.6 + Math.random(),
    color: '#48cae4',
    state: 'search',
    patience: 6,
  });
}

for (let i = 0; i < 30; i++) spawnPedestrian();
for (let i = 0; i < 6; i++) spawnCar();
spawnLoot(15);
updateWantedUI();

function getTile(x, y) {
  if (x < 0 || y < 0 || x >= world.width || y >= world.height) return TILES.BUILDING;
  return world.tiles[Math.floor(y) * world.width + Math.floor(x)];
}

function isSolid(x, y) {
  const tile = getTile(x, y);
  return TILE_DEF[tile]?.solid ?? true;
}

function moveEntity(entity, dx, dy) {
  const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.3);
  const stepX = dx / Math.max(1, steps);
  const stepY = dy / Math.max(1, steps);
  for (let i = 0; i < Math.max(1, steps); i++) {
    if (!collides(entity, stepX, 0)) entity.x += stepX;
    if (!collides(entity, 0, stepY)) entity.y += stepY;
  }
}

function collides(entity, dx, dy) {
  const minX = entity.x - entity.w / 2 + dx;
  const minY = entity.y - entity.h / 2 + dy;
  const maxX = entity.x + entity.w / 2 + dx;
  const maxY = entity.y + entity.h / 2 + dy;
  const startX = Math.floor(minX);
  const endX = Math.ceil(maxX);
  const startY = Math.floor(minY);
  const endY = Math.ceil(maxY);
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      if (isSolid(x, y)) return true;
    }
  }
  return false;
}

function update(dt) {
  updateWorldAtmosphere(dt);
  updatePlayer(dt);
  updatePedestrians(dt);
  updateCars(dt);
  updateEnforcers(dt);
  updateLoot(dt);
  updateBillboards(dt);
  updateWanted(dt);
  updateStatus(dt);
  camera.shake = Math.max(0, camera.shake - dt * 28);
}

function updatePlayer(dt) {
  const desired = { x: 0, y: 0 };
  if (inputs.has('KeyW') || inputs.has('ArrowUp')) desired.y -= 1;
  if (inputs.has('KeyS') || inputs.has('ArrowDown')) desired.y += 1;
  if (inputs.has('KeyA') || inputs.has('ArrowLeft')) desired.x -= 1;
  if (inputs.has('KeyD') || inputs.has('ArrowRight')) desired.x += 1;

  let magnitude = Math.hypot(desired.x, desired.y);
  if (magnitude > 0) {
    desired.x /= magnitude;
    desired.y /= magnitude;
  }

  let speed = player.speed;
  if (player.dashTimer > 0) {
    player.dashTimer -= dt;
    speed *= 2.4;
  } else if (player.dashCooldown > 0) {
    player.dashCooldown -= dt;
  }

  moveEntity(player, desired.x * speed * dt, desired.y * speed * dt);

  player.trail.push({ x: player.x, y: player.y, life: 0.3 });
  while (player.trail.length > 30) player.trail.shift();
  player.trail.forEach((segment) => {
    segment.life -= dt;
  });
  while (player.trail.length && player.trail[0].life <= 0) player.trail.shift();

  if (player.invulnerable > 0) player.invulnerable -= dt;

  // Collisions with cars and pedestrians.
  pedestrians.forEach((ped) => {
    if (rectIntersect(player, ped)) {
      ped.direction += Math.PI;
      ped.changeTimer = 0;
      raiseHeat(0.4, 'You spooked a civilian!');
    }
  });

  cars.forEach((car) => {
    if (rectIntersect(player, car)) {
      if (player.invulnerable <= 0) {
        raiseHeat(0.6, 'Traffic mayhem unleashed!');
        player.invulnerable = 1;
      }
    }
  });
}

function rectIntersect(a, b) {
  return (
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
    Math.abs(a.y - b.y) < (a.h + b.h) / 2
  );
}

function attemptDash() {
  if (player.dashCooldown <= 0) {
    player.dashTimer = 0.25;
    player.dashCooldown = 1.2;
    ui.status.textContent = 'Jet boots engaged!';
    statusTimer = 1;
    camera.shake = Math.min(6, camera.shake + 2.5);
  }
}

function updatePedestrians(dt) {
  pedestrians.forEach((ped) => {
    ped.changeTimer -= dt;
    if (ped.changeTimer <= 0) {
      ped.direction = Math.random() * Math.PI * 2;
      ped.changeTimer = 1 + Math.random() * 3;
    }
    const dx = Math.cos(ped.direction) * ped.speed * dt;
    const dy = Math.sin(ped.direction) * ped.speed * dt;
    if (collides(ped, dx, dy)) {
      ped.direction += Math.PI / 2;
    } else {
      moveEntity(ped, dx, dy);
    }
  });
}

function updateCars(dt) {
  cars.forEach((car) => {
    if (car.w > car.h) {
      car.x += car.direction * car.speed * dt;
    } else {
      car.y += car.direction * car.speed * dt;
    }
  });
  for (let i = cars.length - 1; i >= 0; i--) {
    const car = cars[i];
    if (car.x < -4 || car.y < -4 || car.x > world.width + 4 || car.y > world.height + 4) {
      cars.splice(i, 1);
      spawnCar();
    }
  }
}

function updateEnforcers(dt) {
  if (wantedLevel >= 1) {
    if (Math.random() < dt * 0.5) spawnEnforcer();
  }

  enforcers.forEach((cop) => {
    const dirX = player.x - cop.x;
    const dirY = player.y - cop.y;
    const distance = Math.hypot(dirX, dirY);
    if (distance < 0.1) return;

    if (wantedLevel <= 0.2) {
      cop.patience -= dt;
      if (cop.patience <= 0) cop.state = 'leave';
    }

    if (cop.state === 'leave') {
      const exitDir = Math.atan2(-cop.y + world.height / 2, -cop.x + world.width / 2);
      moveEntity(cop, Math.cos(exitDir) * cop.speed * dt, Math.sin(exitDir) * cop.speed * dt);
    } else {
      const desiredX = (dirX / distance) * cop.speed * (1 + wantedLevel * 0.1);
      const desiredY = (dirY / distance) * cop.speed * (1 + wantedLevel * 0.1);
      moveEntity(cop, desiredX * dt, desiredY * dt);
      if (distance < 1.3 && player.invulnerable <= 0) {
        raiseHeat(0.8, 'The enforcers caught sight of you!');
        player.invulnerable = 0.5;
      }
    }
  });

  for (let i = enforcers.length - 1; i >= 0; i--) {
    const cop = enforcers[i];
    if (cop.state === 'leave' && (cop.x < -2 || cop.y < -2 || cop.x > world.width + 2 || cop.y > world.height + 2)) {
      enforcers.splice(i, 1);
    }
  }
}

function updateLoot(dt) {
  lootCrates.forEach((loot) => {
    loot.pulse += dt * 2;
    if (!loot.collected && rectIntersect(player, loot)) {
      loot.collected = true;
      lootCollected += 1;
      raiseHeat(0.2, 'Loot secured!');
      updateLootUI();
      if (lootCollected === lootCrates.length) {
        ui.status.textContent = 'All loot collected! Extract or keep causing chaos.';
        statusTimer = 4;
      }
    }
  });
}

function raiseHeat(amount, message) {
  wantedLevel = Math.min(5, wantedLevel + amount);
  heatLevel = Math.min(1, heatLevel + amount * 0.15);
  heatCooldown = 5;
  if (message) {
    ui.status.textContent = message;
    statusTimer = 2.2;
  }
  camera.shake = Math.min(8, camera.shake + amount * 2);
  updateWantedUI();
}

function updateWanted(dt) {
  if (heatCooldown > 0) {
    heatCooldown -= dt;
  } else {
    wantedLevel = Math.max(0, wantedLevel - dt * 0.25);
  }
  heatLevel = Math.max(0, heatLevel - dt * 0.05);
  updateWantedUI();
}

function updateStatus(dt) {
  if (statusTimer > 0) {
    statusTimer -= dt;
    if (statusTimer <= 0) ui.status.textContent = '';
  }
}

function updateBillboards(dt) {
  billboards.forEach((sign) => {
    sign.phase += dt * (1.2 + sign.speed * 0.6);
    if (Math.random() < dt * 0.15) {
      sign.hue = (sign.hue + Math.floor(Math.random() * 40) + 10) % 360;
    }
  });
}

function updateWorldAtmosphere(dt) {
  lighting.time = (lighting.time + dt * lighting.speed) % 1;
  const cycle = Math.sin(lighting.time * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
  lighting.palette = clamp(0.25 + cycle * 0.7, 0, 1);

  lighting.weatherTimer -= dt;
  if (lighting.weatherTimer <= 0) {
    const roll = Math.random();
    lighting.weather = roll < 0.55 ? 'clear' : roll < 0.85 ? 'rain' : 'smog';
    lighting.weatherTimer = 16 + Math.random() * 18;
  }

  const targetIntensity =
    lighting.weather === 'rain' ? 1 : lighting.weather === 'smog' ? 0.65 : 0;
  lighting.weatherIntensity += (targetIntensity - lighting.weatherIntensity) * clamp(dt * 2.6, 0, 1);

  updateWeatherParticles(dt);
  updateCycleUI();
}

function describeAtmosphere() {
  const palette = lighting.palette;
  let phase;
  if (palette > 0.78) phase = 'Daylight';
  else if (palette > 0.55) phase = 'Golden Hour';
  else if (palette > 0.38) phase = 'Neon Night';
  else phase = 'After Hours';

  const weatherLabel =
    lighting.weather === 'rain'
      ? 'Ion Rain'
      : lighting.weather === 'smog'
      ? 'Holographic Haze'
      : 'Clear Skies';

  return `${phase} · ${weatherLabel}`;
}

function updateCycleUI() {
  if (ui.cycle) {
    ui.cycle.textContent = describeAtmosphere();
  }
}

function spawnWeatherParticle(type) {
  if (type === 'rain') {
    return {
      type,
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height,
      speed: 260 + Math.random() * 220,
      drift: -80 + Math.random() * 160,
      length: 12 + Math.random() * 18,
      life: 1.5 + Math.random(),
      opacity: 0.25 + Math.random() * 0.4,
    };
  }
  return {
    type: 'smog',
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: -5 + Math.random() * 10,
    drift: -12 + Math.random() * 24,
    radius: 16 + Math.random() * 22,
    life: 8 + Math.random() * 10,
    opacity: 0.08 + Math.random() * 0.12,
  };
}

function updateWeatherParticles(dt) {
  const targetCount =
    lighting.weather === 'rain'
      ? Math.round(90 * lighting.weatherIntensity)
      : lighting.weather === 'smog'
      ? Math.round(40 * lighting.weatherIntensity)
      : 0;

  while (weatherParticles.length < targetCount) {
    weatherParticles.push(spawnWeatherParticle(lighting.weather));
  }
  while (weatherParticles.length > targetCount) {
    weatherParticles.pop();
  }

  for (let i = weatherParticles.length - 1; i >= 0; i--) {
    const particle = weatherParticles[i];
    particle.life -= dt;
    particle.x += (particle.drift ?? 0) * dt;
    particle.y += particle.speed * dt;
    if (particle.type === 'rain') {
      particle.length += particle.speed * dt * 0.02;
      if (particle.y > canvas.height + 40) {
        particle.y = -20 - Math.random() * canvas.height * 0.3;
        particle.x = Math.random() * canvas.width;
      }
    } else if (particle.type === 'smog') {
      particle.y = (particle.y + canvas.height) % canvas.height;
      particle.x = (particle.x + canvas.width) % canvas.width;
    }
    if (particle.life <= 0) {
      weatherParticles.splice(i, 1);
    }
  }
}

function updateLootUI() {
  ui.loot.textContent = `${lootCollected} / ${lootCrates.length}`;
}

function updateWantedUI() {
  ui.wanted.textContent = wantedLevel.toFixed(1);
  ui.heat.textContent = `${Math.round(heatLevel * 100)}%`;
}

const camera = { x: player.x, y: player.y, shake: 0 };

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const viewWidth = canvas.width / TILE_SIZE;
  const viewHeight = canvas.height / TILE_SIZE;
  camera.x += (player.x - camera.x) * 0.1;
  camera.y += (player.y - camera.y) * 0.1;
  camera.x = clamp(camera.x, viewWidth / 2, world.width - viewWidth / 2);
  camera.y = clamp(camera.y, viewHeight / 2, world.height - viewHeight / 2);

  const offsetX = Math.floor((camera.x - viewWidth / 2) * TILE_SIZE);
  const offsetY = Math.floor((camera.y - viewHeight / 2) * TILE_SIZE);
  const shakeX = (Math.random() - 0.5) * camera.shake;
  const shakeY = (Math.random() - 0.5) * camera.shake;

  ctx.save();
  ctx.translate(-offsetX + shakeX, -offsetY + shakeY);
  drawWorld();
  drawTrails();
  drawLoot();
  drawBillboards();
  drawEntities(pedestrians);
  drawEntities(cars);
  drawEntities(enforcers, true);
  drawPlayer();
  ctx.restore();

  drawAtmosphereOverlay();
  drawWeatherOverlay();
  drawScanlines();
  drawWantedMeter();
}

function resolveTileColor(tile, x, y) {
  const def = TILE_DEF[tile];
  if (!def) return '#000000';
  const day = def.colors?.day ?? '#0f0f0f';
  const night = def.colors?.night ?? day;
  let base = mixHex(night, day, lighting.palette);
  if (lighting.weather !== 'clear' && lighting.weatherIntensity > 0.01) {
    const tint = lighting.weather === 'rain' ? '#102046' : '#331f3d';
    base = mixHex(base, tint, lighting.weatherIntensity * 0.35);
  }
  if (tile === TILES.HIGHLIGHT) {
    const pulse = (Math.sin(frameClock * 4 + x * 0.6 + y * 0.4) + 1) * 0.5;
    base = mixHex(base, '#fff7cc', pulse * 0.35);
  }
  return base;
}

function drawWorld() {
  const startX = Math.floor(camera.x - canvas.width / TILE_SIZE);
  const endX = Math.ceil(camera.x + canvas.width / TILE_SIZE);
  const startY = Math.floor(camera.y - canvas.height / TILE_SIZE);
  const endY = Math.ceil(camera.y + canvas.height / TILE_SIZE);

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const tile = getTile(x, y);
      const def = TILE_DEF[tile];
      if (!def) continue;
      const px = Math.floor(x * TILE_SIZE);
      const py = Math.floor(y * TILE_SIZE);
      ctx.fillStyle = resolveTileColor(tile, x, y);
      ctx.fillRect(px, py, TILE_SIZE + 1, TILE_SIZE + 1);

      if (tile === TILES.ROAD) {
        const stripeNoise = pseudoRandom(x, y, Math.floor(frameClock * 4));
        if (stripeNoise > 0.72) {
          ctx.fillStyle = def.lane ?? '#ffd166';
          ctx.fillRect(px + TILE_SIZE / 2 - 1, py + 2, 2, TILE_SIZE - 4);
        }
        ctx.fillStyle = mixHex(def.colors.night, def.colors.day, 0.25);
        ctx.globalAlpha = 0.15;
        ctx.fillRect(px, py + TILE_SIZE - 2, TILE_SIZE + 1, 2);
        ctx.globalAlpha = 1;
      }

      if (tile === TILES.SIDEWALK) {
        const crackNoise = pseudoRandom(x, y, 4.2 + frameClock);
        if (crackNoise > 0.7) {
          ctx.fillStyle = mixHex(def.accent ?? '#a6b3c9', '#ffffff', 0.25);
          ctx.globalAlpha = 0.25;
          ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.globalAlpha = 1;
        }
      }

      if (tile === TILES.BUILDING) {
        const sparkle = pseudoRandom(x, y, Math.floor(frameClock * 6));
        if (sparkle > 0.66) {
          ctx.fillStyle = mixHex(def.accent ?? '#4cc9f0', '#ffffff', 0.45);
          ctx.globalAlpha = 0.55;
          ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.globalAlpha = 1;
        } else if (sparkle > 0.4) {
          ctx.fillStyle = mixHex(def.accent ?? '#4cc9f0', '#fee440', 0.25);
          ctx.globalAlpha = 0.45;
          ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
          ctx.globalAlpha = 1;
        }
      }

      if (tile === TILES.WATER) {
        const ripple = (Math.sin(frameClock * 2.5 + x * 0.6 + y * 0.4) + 1) * 0.5;
        ctx.strokeStyle = mixHex(def.accent ?? '#64dfdf', '#ffffff', 0.4);
        ctx.globalAlpha = 0.18 + ripple * 0.2;
        ctx.beginPath();
        ctx.moveTo(px + 1, py + TILE_SIZE / 2);
        ctx.lineTo(px + TILE_SIZE - 1, py + TILE_SIZE / 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (tile === TILES.PARK) {
        const spark = pseudoRandom(x, y, frameClock * 1.5);
        if (spark > 0.8) {
          ctx.fillStyle = mixHex(def.accent ?? '#9bffcb', '#ffffff', 0.3);
          ctx.globalAlpha = 0.5;
          ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          ctx.globalAlpha = 1;
        }
      }

      if (tile === TILES.HIGHLIGHT) {
        ctx.fillStyle = mixHex(def.accent ?? '#ffda79', '#ffffff', 0.4);
        ctx.globalAlpha = 0.65;
        ctx.fillRect(px + TILE_SIZE / 2 - 1, py + 1, 2, TILE_SIZE - 2);
        ctx.fillRect(px + 1, py + TILE_SIZE / 2 - 1, TILE_SIZE - 2, 2);
        ctx.globalAlpha = 1;
      }
    }
  }
}

function pseudoRandom(x, y, seed = 0) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + seed * 43758.5453);
  return s - Math.floor(s);
}

function drawTrails() {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const segment of player.trail) {
    const alpha = Math.max(0, segment.life / 0.3);
    ctx.fillStyle = `rgba(247, 37, 133, ${(alpha * 0.75).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(segment.x * TILE_SIZE, segment.y * TILE_SIZE, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawLoot() {
  lootCrates.forEach((loot) => {
    if (loot.collected) return;
    const pulse = (Math.sin(loot.pulse) + 1) * 0.5;
    const size = TILE_SIZE * (0.4 + pulse * 0.25);
    ctx.fillStyle = `rgba(255, 221, 89, ${0.6 + pulse * 0.4})`;
    ctx.beginPath();
    ctx.rect(
      loot.x * TILE_SIZE - size / 2,
      loot.y * TILE_SIZE - size / 2,
      size,
      size
    );
    ctx.fill();
    ctx.strokeStyle = '#f3722c';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function drawBillboards() {
  if (!billboards.length) return;
  billboards.forEach((sign) => {
    const width = sign.w * TILE_SIZE;
    const height = sign.h * TILE_SIZE;
    const px = sign.x * TILE_SIZE - width / 2;
    const py = sign.y * TILE_SIZE - height / 2 - 4;
    const oscillation = (Math.sin(sign.phase + frameClock * sign.speed) + 1) * 0.5;
    const hue = sign.hue;
    const glow = `hsla(${hue}, 90%, ${55 + oscillation * 22}%, 0.85)`;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = glow;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 12 + oscillation * 22;
    ctx.fillRect(px, py, width, height);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(5, 8, 20, 0.8)';
    ctx.fillRect(px + 1, py + 1, width - 2, height - 2);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `hsla(${hue}, 100%, ${70 + oscillation * 8}%, 0.95)`;
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sign.text, px + width / 2, py + height / 2 + Math.sin(sign.phase * 0.5 + frameClock) * 1.5);
    ctx.restore();
  });
}

function drawEntities(list, isEnforcer = false) {
  list.forEach((entity) => {
    const px = Math.floor((entity.x - entity.w / 2) * TILE_SIZE);
    const py = Math.floor((entity.y - entity.h / 2) * TILE_SIZE);
    const width = Math.ceil(entity.w * TILE_SIZE);
    const height = Math.ceil(entity.h * TILE_SIZE);
    const fill = entity.color || (isEnforcer ? '#48cae4' : '#ffe066');

    ctx.fillStyle = fill;
    ctx.fillRect(px, py, width, height);
    ctx.strokeStyle = 'rgba(5, 8, 20, 0.7)';
    ctx.strokeRect(px, py, width, height);

    if (isEnforcer) {
      const siren = (Math.sin(frameClock * 8 + entity.x + entity.y) + 1) * 0.5;
      ctx.fillStyle = `rgba(56, 248, 227, ${0.4 + siren * 0.35})`;
      ctx.fillRect(px, py - 3, width, 2);
    }
  });
}

function drawPlayer() {
  const px = Math.floor((player.x - player.w / 2) * TILE_SIZE);
  const py = Math.floor((player.y - player.h / 2) * TILE_SIZE);
  const width = Math.ceil(player.w * TILE_SIZE);
  const height = Math.ceil(player.h * TILE_SIZE);
  const pulse = (Math.sin(frameClock * 12) + 1) * 0.5;

  ctx.save();
  ctx.fillStyle = '#f72585';
  ctx.fillRect(px, py, width, height);
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = `rgba(247, 37, 133, ${0.2 + pulse * 0.3})`;
  ctx.fillRect(px - 1, py - 1, width + 2, height + 2);
  ctx.restore();

  ctx.strokeStyle = `rgba(56, 248, 227, ${0.35 + pulse * 0.25})`;
  ctx.strokeRect(px, py, width, height);

  ctx.fillStyle = '#fff';
  ctx.fillRect(
    Math.floor(player.x * TILE_SIZE - 2),
    Math.floor(player.y * TILE_SIZE - (player.h * TILE_SIZE) / 2 - 4),
    4,
    4
  );
}

function drawAtmosphereOverlay() {
  const top = mixHex('#0f172a', '#4f46e5', lighting.palette * 0.8 + 0.2);
  const bottom = mixHex('#020617', '#0b1120', lighting.palette * 0.6);
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = `rgba(56, 248, 227, ${0.08 + (1 - lighting.palette) * 0.14})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawWeatherOverlay() {
  if (lighting.weatherIntensity <= 0.01) return;
  ctx.save();
  if (lighting.weather === 'rain') {
    ctx.globalCompositeOperation = 'screen';
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(120, 200, 255, 0.85)';
    weatherParticles.forEach((drop) => {
      ctx.globalAlpha = drop.opacity * lighting.weatherIntensity;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + drop.drift * 0.02, drop.y + drop.length);
      ctx.stroke();
    });
  } else if (lighting.weather === 'smog') {
    ctx.globalCompositeOperation = 'lighter';
    weatherParticles.forEach((puff) => {
      ctx.globalAlpha = puff.opacity * lighting.weatherIntensity;
      ctx.fillStyle = 'rgba(160, 130, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();
}

function drawScanlines() {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = 'rgba(2, 6, 23, 0.2)';
  for (let y = 0; y < canvas.height; y += 2) {
    ctx.fillRect(0, y, canvas.width, 1);
  }
  ctx.restore();
}

function drawWantedMeter() {
  ctx.save();
  if (ctx.resetTransform) {
    ctx.resetTransform();
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  const neon = (Math.sin(frameClock * 5) + 1) * 0.5;
  const panelWidth = 176;
  const panelHeight = 60;

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = 'rgba(6, 12, 24, 0.75)';
  ctx.fillRect(12, 12, panelWidth, panelHeight);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = `rgba(56, 248, 227, ${0.35 + neon * 0.3})`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(12.75, 12.75, panelWidth - 1.5, panelHeight - 1.5);

  ctx.font = '9px "Press Start 2P", monospace';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#38f8e3';
  ctx.fillText('WANTED', 22, 18);

  const stars = Math.min(5, Math.floor(wantedLevel));
  const fractional = clamp(wantedLevel - stars, 0, 1);
  for (let i = 0; i < 5; i++) {
    const fill = i < stars ? 1 : i === stars ? fractional : 0;
    const x = 22 + i * 28;
    ctx.fillStyle = `rgba(247, 37, 133, ${0.2 + fill * 0.8})`;
    ctx.fillText('★', x, 34);
  }

  ctx.fillStyle = '#cbd5f5';
  ctx.fillText('HEAT', 22, 48);
  ctx.fillText(`${Math.round(heatLevel * 100)}%`, 130, 48);

  ctx.fillStyle = 'rgba(56, 248, 227, 0.18)';
  ctx.fillRect(22, 56, 120, 6);
  ctx.fillStyle = `rgba(56, 248, 227, ${0.35 + neon * 0.25})`;
  ctx.fillRect(22, 56, 120 * clamp(heatLevel, 0, 1), 6);

  ctx.restore();
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;
  frameClock = timestamp / 1000;
  if (!paused) {
    update(dt);
  }
  render();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
