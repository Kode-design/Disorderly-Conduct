const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const TILE_SIZE = 12;
const WORLD_WIDTH = 96;
const WORLD_HEIGHT = 96;

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
  [TILES.GRASS]: { color: '#2d6a4f', solid: false },
  [TILES.BUILDING]: { color: '#3a3a3a', solid: true },
  [TILES.ROAD]: { color: '#495057', solid: false },
  [TILES.SIDEWALK]: { color: '#adb5bd', solid: false },
  [TILES.WATER]: { color: '#264653', solid: true },
  [TILES.PARK]: { color: '#40916c', solid: false },
  [TILES.HIGHLIGHT]: { color: '#f8961e', solid: false },
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

const ui = {
  loot: document.getElementById('loot-count'),
  wanted: document.getElementById('wanted-level'),
  heat: document.getElementById('heat-meter'),
  status: document.getElementById('status-message'),
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

generateWorld();

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
  updatePlayer(dt);
  updatePedestrians(dt);
  updateCars(dt);
  updateEnforcers(dt);
  updateLoot(dt);
  updateWanted(dt);
  updateStatus(dt);
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

function updateLootUI() {
  ui.loot.textContent = `${lootCollected} / ${lootCrates.length}`;
}

function updateWantedUI() {
  ui.wanted.textContent = wantedLevel.toFixed(1);
  ui.heat.textContent = `${Math.round(heatLevel * 100)}%`;
}

const camera = { x: player.x, y: player.y };

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const viewWidth = canvas.width / TILE_SIZE;
  const viewHeight = canvas.height / TILE_SIZE;
  camera.x += (player.x - camera.x) * 0.1;
  camera.y += (player.y - camera.y) * 0.1;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  camera.x = clamp(camera.x, viewWidth / 2, world.width - viewWidth / 2);
  camera.y = clamp(camera.y, viewHeight / 2, world.height - viewHeight / 2);

  const offsetX = Math.floor((camera.x - viewWidth / 2) * TILE_SIZE);
  const offsetY = Math.floor((camera.y - viewHeight / 2) * TILE_SIZE);

  ctx.save();
  ctx.translate(-offsetX, -offsetY);
  drawWorld();
  drawTrails();
  drawLoot();
  drawEntities(pedestrians);
  drawEntities(cars);
  drawEntities(enforcers, true);
  drawPlayer();
  ctx.restore();

  drawWantedMeter();
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
      ctx.fillStyle = def.color;
      ctx.fillRect(Math.floor(x * TILE_SIZE), Math.floor(y * TILE_SIZE), TILE_SIZE + 1, TILE_SIZE + 1);

      if (tile === TILES.ROAD) {
        const stripeNoise = pseudoRandom(x, y, 12.5);
        if (stripeNoise > 0.7) {
          ctx.fillStyle = '#ffd166';
          ctx.fillRect(x * TILE_SIZE + TILE_SIZE / 2 - 1, y * TILE_SIZE + TILE_SIZE / 2 - 3, 2, 6);
        }
      }
      if (tile === TILES.SIDEWALK) {
        const crackNoise = pseudoRandom(x, y, 4.2);
        if (crackNoise > 0.75) {
          ctx.fillStyle = '#ced4da';
          ctx.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        }
      }
    }
  }
}

function pseudoRandom(x, y, seed = 0) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + seed * 43758.5453);
  return s - Math.floor(s);
}

function drawTrails() {
  for (const segment of player.trail) {
    const alpha = Math.max(0, segment.life / 0.3);
    ctx.fillStyle = `rgba(247, 37, 133, ${alpha.toFixed(2)})`;
    ctx.fillRect(
      Math.floor(segment.x * TILE_SIZE - 2),
      Math.floor(segment.y * TILE_SIZE - 2),
      4,
      4
    );
  }
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

function drawEntities(list, isEnforcer = false) {
  list.forEach((entity) => {
    ctx.fillStyle = entity.color || (isEnforcer ? '#48cae4' : '#ffe066');
    ctx.fillRect(
      Math.floor((entity.x - entity.w / 2) * TILE_SIZE),
      Math.floor((entity.y - entity.h / 2) * TILE_SIZE),
      Math.ceil(entity.w * TILE_SIZE),
      Math.ceil(entity.h * TILE_SIZE)
    );
  });
}

function drawPlayer() {
  ctx.fillStyle = '#f72585';
  ctx.fillRect(
    Math.floor((player.x - player.w / 2) * TILE_SIZE),
    Math.floor((player.y - player.h / 2) * TILE_SIZE),
    Math.ceil(player.w * TILE_SIZE),
    Math.ceil(player.h * TILE_SIZE)
  );
  ctx.fillStyle = '#fff';
  ctx.fillRect(
    Math.floor(player.x * TILE_SIZE - 2),
    Math.floor(player.y * TILE_SIZE - player.h * TILE_SIZE / 2 - 4),
    4,
    4
  );
}

function drawWantedMeter() {
  const stars = Math.min(5, Math.round(wantedLevel));
  ctx.save();
  if (ctx.resetTransform) {
    ctx.resetTransform();
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#f72585';
  for (let i = 0; i < 5; i++) {
    ctx.globalAlpha = i < stars ? 1 : 0.2;
    ctx.fillText('★', 10 + i * 12, 10);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#4cc9f0';
  ctx.fillText(`Heat ${Math.round(heatLevel * 100)}%`, 10, 26);
  ctx.restore();
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;
  if (!paused) {
    update(dt);
  }
  render();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
