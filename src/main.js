const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const storyPanel = document.getElementById("story-panel");
const startButton = document.getElementById("start-button");
const hud = document.getElementById("hud");
const missionLog = document.getElementById("mission-log");
const missionLogList = missionLog.querySelector("ul");
const healthBar = document.getElementById("health-bar");
const energyBar = document.getElementById("energy-bar");
const noiseBar = document.getElementById("noise-bar");
const bc2Display = document.getElementById("bc2-display");
const objectiveDisplay = document.getElementById("objective-display");
const commsDisplay = document.getElementById("comms-display");

const TILE_SIZE = 48;
const WORLD_SCALE = window.devicePixelRatio || 1;
let canvasWidth = window.innerWidth * WORLD_SCALE;
let canvasHeight = window.innerHeight * WORLD_SCALE;
canvas.width = canvasWidth;
canvas.height = canvasHeight;
canvas.style.width = "100vw";
canvas.style.height = "100vh";
ctx.scale(WORLD_SCALE, WORLD_SCALE);

window.addEventListener("resize", () => {
  canvasWidth = window.innerWidth * WORLD_SCALE;
  canvasHeight = window.innerHeight * WORLD_SCALE;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  ctx.setTransform(WORLD_SCALE, 0, 0, WORLD_SCALE, 0, 0);
});

const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  sprint: false,
  reload: false,
  interact: false,
  consume: false,
  shooting: false,
  mouse: { x: 0, y: 0 },
};

window.addEventListener("keydown", (e) => {
  switch (e.code) {
    case "KeyW":
      input.up = true;
      break;
    case "KeyS":
      input.down = true;
      break;
    case "KeyA":
      input.left = true;
      break;
    case "KeyD":
      input.right = true;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      input.sprint = true;
      break;
    case "KeyR":
      input.reload = true;
      break;
    case "KeyE":
      input.interact = true;
      break;
    case "KeyF":
      input.consume = true;
      break;
    case "Space":
      e.preventDefault();
      break;
  }
});

window.addEventListener("keyup", (e) => {
  switch (e.code) {
    case "KeyW":
      input.up = false;
      break;
    case "KeyS":
      input.down = false;
      break;
    case "KeyA":
      input.left = false;
      break;
    case "KeyD":
      input.right = false;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      input.sprint = false;
      break;
    case "KeyR":
      input.reload = false;
      break;
    case "KeyE":
      input.interact = false;
      break;
    case "KeyF":
      input.consume = false;
      break;
  }
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  input.mouse.x = (e.clientX - rect.left);
  input.mouse.y = (e.clientY - rect.top);
});

canvas.addEventListener("mousedown", (e) => {
  if (e.button === 0) {
    input.shooting = true;
  }
});

canvas.addEventListener("mouseup", (e) => {
  if (e.button === 0) {
    input.shooting = false;
  }
});

function vec2(x, y) {
  return { x, y };
}

function length(vec) {
  return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
}

function normalize(vec) {
  const len = length(vec);
  return len === 0 ? { x: 0, y: 0 } : { x: vec.x / len, y: vec.y / len };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

class Door {
  constructor(x, y, width, height, options = {}) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.locked = options.locked ?? false;
    this.open = options.open ?? false;
    this.id = options.id;
    this.requires = options.requires || null;
    this.label = options.label || "Door";
    this.rotation = options.rotation || 0;
  }

  canPass() {
    return this.open && !this.locked;
  }

  interact(player, level) {
    if (this.locked) {
      if (this.requires && player.inventory.includes(this.requires)) {
        this.locked = false;
        level.addLog(`Unlocked ${this.label}.`);
      } else {
        level.toast(`${this.label} locked`);
        level.comms(`Need ${this.requires || "key"} for that."`);
        return;
      }
    }
    this.open = !this.open;
    level.toast(`${this.open ? "Opened" : "Closed"} ${this.label}`);
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);
    ctx.translate(-this.width / 2, -this.height / 2);
    ctx.fillStyle = this.locked ? "rgba(200,50,60,0.8)" : "rgba(110, 170, 220, 0.8)";
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }
}

class Item {
  constructor(x, y, type, amount = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.amount = amount;
    this.radius = 18;
    this.active = true;
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    switch (this.type) {
      case "food":
        ctx.fillStyle = "#23d997";
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(5,5,5,0.4)";
        ctx.fillRect(-8, -4, 16, 8);
        break;
      case "bc2":
        ctx.fillStyle = "#ffc857";
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#05050a";
        ctx.font = "bold 16px Rajdhani";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("₿²", 0, 1);
        break;
      case "intel":
        ctx.fillStyle = "#6b8cff";
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px Rajdhani";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("i", 0, 1);
        break;
    }
    ctx.restore();
  }
}

class Bullet {
  constructor(x, y, velocity, damage, friendly = true) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
    this.speed = 800;
    this.damage = damage;
    this.radius = 4;
    this.friendly = friendly;
    this.active = true;
  }

  update(dt, level) {
    if (!this.active) return;
    this.x += this.velocity.x * this.speed * dt;
    this.y += this.velocity.y * this.speed * dt;

    if (
      this.x < 0 ||
      this.y < 0 ||
      this.x > level.width * TILE_SIZE ||
      this.y > level.height * TILE_SIZE
    ) {
      this.active = false;
      return;
    }

    if (level.isBlocked(this.x, this.y)) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.fillStyle = this.friendly ? "#ffeb3b" : "#ff1744";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Entity {
  constructor(x, y, radius = 18) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vx = 0;
    this.vy = 0;
    this.speed = 180;
    this.angle = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.dead = false;
  }

  get rect() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };
  }
}

class Player extends Entity {
  constructor(x, y) {
    super(x, y, 20);
    this.energy = 100;
    this.maxEnergy = 100;
    this.noise = 0;
    this.maxNoise = 100;
    this.inventory = [];
    this.magSize = 12;
    this.ammo = 12;
    this.reserveAmmo = 60;
    this.reloadTime = 1.2;
    this.reloadTimer = 0;
    this.fireRate = 0.15;
    this.fireCooldown = 0;
    this.aimAngle = 0;
    this.speed = 220;
    this.bc2 = 0;
    this.statusEffects = [];
  }

  update(dt, level) {
    if (this.dead) return;
    let dir = { x: 0, y: 0 };
    if (input.up) dir.y -= 1;
    if (input.down) dir.y += 1;
    if (input.left) dir.x -= 1;
    if (input.right) dir.x += 1;

    dir = normalize(dir);
    const isMoving = dir.x !== 0 || dir.y !== 0;
    let speed = this.speed;
    if (input.sprint && this.energy > 0 && isMoving) {
      speed *= 1.5;
      this.energy = clamp(this.energy - 45 * dt, 0, this.maxEnergy);
      this.noise = clamp(this.noise + 25 * dt, 0, this.maxNoise);
    } else if (isMoving) {
      this.noise = clamp(this.noise + 10 * dt, 0, this.maxNoise);
    }

    this.x += dir.x * speed * dt;
    this.y += dir.y * speed * dt;

    if (!isMoving) {
      this.energy = clamp(this.energy + 35 * dt, 0, this.maxEnergy);
    }

    this.noise = clamp(this.noise - 12 * dt, 0, this.maxNoise);

    this.x = clamp(this.x, 0, level.width * TILE_SIZE);
    this.y = clamp(this.y, 0, level.height * TILE_SIZE);

    const targetAngle = Math.atan2(
      input.mouse.y - this.y,
      input.mouse.x - this.x
    );
    this.aimAngle = lerpAngle(this.aimAngle, targetAngle, 0.15);

    if (this.reloadTimer > 0) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        const needed = this.magSize - this.ammo;
        const loaded = Math.min(needed, this.reserveAmmo);
        this.ammo += loaded;
        this.reserveAmmo -= loaded;
      }
    }

    if (input.reload && this.ammo < this.magSize && this.reserveAmmo > 0) {
      this.reloadTimer = this.reloadTime;
      level.toast("Reloading");
    }

    if (input.consume) {
      this.consume(level);
      input.consume = false;
    }

    this.statusEffects = this.statusEffects.filter((effect) => {
      effect.duration -= dt;
      if (effect.duration <= 0) {
        return false;
      }
      effect.onTick?.(this, dt);
      return true;
    });
  }

  consume(level) {
    const foodIndex = this.inventory.indexOf("food");
    if (foodIndex !== -1) {
      this.inventory.splice(foodIndex, 1);
      this.health = clamp(this.health + 25, 0, this.maxHealth);
      this.energy = clamp(this.energy + 40, 0, this.maxEnergy);
      level.toast("Consumed Food");
    } else {
      level.toast("No food found");
    }
  }

  tryShoot(level) {
    if (this.reloadTimer > 0 || this.dead) return null;
    if (this.fireCooldown > 0) return null;
    if (this.ammo <= 0) {
      level.toast("Out of ammo");
      this.fireCooldown = 0.3;
      return null;
    }
    this.fireCooldown = this.fireRate;
    this.ammo -= 1;
    this.noise = clamp(this.noise + 15, 0, this.maxNoise);
    const bulletVel = {
      x: Math.cos(this.aimAngle),
      y: Math.sin(this.aimAngle),
    };
    return new Bullet(this.x, this.y, bulletVel, 34, true);
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.aimAngle);
    ctx.fillStyle = "rgba(38, 223, 255, 0.35)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 140, -0.4, 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#111b2e";
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#23d997";
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#05050a";
    ctx.fillRect(6, -3, 18, 6);
    ctx.restore();
  }
}

function lerpAngle(a, b, t) {
  const diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  return a + diff * t;
}

class Enemy extends Entity {
  constructor(x, y, options = {}) {
    super(x, y, 20);
    this.speed = options.speed || 140;
    this.color = options.color || "#ff2d55";
    this.visionRange = options.visionRange || 240;
    this.viewAngle = options.viewAngle || (Math.PI / 3);
    this.fireRate = options.fireRate || 0.65;
    this.fireCooldown = 0;
    this.damage = options.damage || 12;
    this.patrolPath = options.patrolPath || [vec2(x, y)];
    this.patrolIndex = 0;
    this.state = "patrol"; // patrol, alert, chase
    this.alertTimer = 0;
    this.toughness = options.toughness || 1;
    this.weaponNoise = options.weaponNoise || 18;
  }

  update(dt, level) {
    if (this.dead) return;
    const player = level.player;
    const toPlayer = { x: player.x - this.x, y: player.y - this.y };
    const distToPlayer = length(toPlayer);

    const canSee = this.canSeePlayer(level);

    if (canSee) {
      this.state = "chase";
      this.alertTimer = 2.8;
    } else if (this.alertTimer > 0) {
      this.alertTimer -= dt;
      this.state = "alert";
    } else {
      this.state = "patrol";
    }

    switch (this.state) {
      case "patrol":
        this.followPatrol(dt);
        break;
      case "alert":
        this.turnTowards(player, dt * 3);
        break;
      case "chase":
        this.chasePlayer(player, dt);
        break;
    }

    if (this.state === "chase" && distToPlayer < this.visionRange) {
      this.shootAtPlayer(level, dt);
    }
  }

  canSeePlayer(level) {
    const player = level.player;
    const toPlayer = { x: player.x - this.x, y: player.y - this.y };
    const distToPlayer = length(toPlayer);
    if (distToPlayer > this.visionRange) return false;

    const direction = normalize(toPlayer);
    const facing = { x: Math.cos(this.angle), y: Math.sin(this.angle) };
    const dot = direction.x * facing.x + direction.y * facing.y;
    const angleBetween = Math.acos(clamp(dot, -1, 1));
    if (angleBetween > this.viewAngle) return false;

    // simple raycast by checking steps along line for collision
    const steps = Math.floor(distToPlayer / 10);
    for (let i = 1; i < steps; i++) {
      const sampleX = this.x + direction.x * i * 10;
      const sampleY = this.y + direction.y * i * 10;
      if (level.isBlocked(sampleX, sampleY, true)) {
        return false;
      }
    }

    level.handleNoisePing(player.noise + this.weaponNoise / 2, this);
    return true;
  }

  followPatrol(dt) {
    if (this.patrolPath.length <= 1) {
      this.angle += 0.3 * dt;
      return;
    }
    const target = this.patrolPath[this.patrolIndex];
    const toTarget = { x: target.x - this.x, y: target.y - this.y };
    const dist = length(toTarget);
    if (dist < 10) {
      this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
      return;
    }
    const dir = normalize(toTarget);
    this.x += dir.x * this.speed * dt;
    this.y += dir.y * this.speed * dt;
    this.angle = Math.atan2(dir.y, dir.x);
  }

  turnTowards(target, t) {
    const desired = Math.atan2(target.y - this.y, target.x - this.x);
    this.angle = lerpAngle(this.angle, desired, t);
  }

  chasePlayer(player, dt) {
    const toPlayer = { x: player.x - this.x, y: player.y - this.y };
    const dir = normalize(toPlayer);
    this.x += dir.x * (this.speed + 40) * dt;
    this.y += dir.y * (this.speed + 40) * dt;
    this.angle = Math.atan2(dir.y, dir.x);
  }

  shootAtPlayer(level, dt) {
    if (this.fireCooldown > 0) {
      this.fireCooldown -= dt;
      return;
    }
    this.fireCooldown = this.fireRate;
    const direction = {
      x: Math.cos(this.angle) + (Math.random() - 0.5) * 0.1,
      y: Math.sin(this.angle) + (Math.random() - 0.5) * 0.1,
    };
    const bullet = new Bullet(this.x, this.y, normalize(direction), this.damage, false);
    level.enemyBullets.push(bullet);
    level.handleNoisePing(this.weaponNoise, this);
  }

  draw(ctx) {
    if (this.dead) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Vision cone
    ctx.fillStyle = "rgba(255, 84, 112, 0.18)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, this.visionRange * 0.8, -this.viewAngle, this.viewAngle);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#300712";
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#111";
    ctx.fillRect(6, -4, 18, 8);
    ctx.restore();
  }
}

class Level {
  constructor(config, game) {
    this.game = game;
    this.tiles = config.tiles;
    this.width = config.width;
    this.height = config.height;
    this.background = config.background || "#050910";
    this.textures = config.textures || {};
    this.playerSpawn = config.playerSpawn || { x: TILE_SIZE * 2, y: TILE_SIZE * 2 };
    this.enemies = [];
    this.enemyBullets = [];
    this.playerBullets = [];
    this.items = [];
    this.doors = [];
    this.interactables = [];
    this.player = new Player(this.playerSpawn.x, this.playerSpawn.y);
    this.toastTimer = 0;
    this.toastMessage = "";
    this.currentObjective = config.objective || "";
    this.completedObjectives = 0;
    this.storyBeats = config.storyBeats || [];
    this.currentBeatIndex = 0;
    this.beatTimer = 0;
    this.reinforcements = config.reinforcements || [];
    this.reinforcementTimer = config.reinforcementTimer || 0;
    this.active = false;
    this.dialogueQueue = [];
    this.commsTimer = 0;
    this.spawnWaveIndex = 0;

    config.doors?.forEach((door) => {
      this.doors.push(
        new Door(
          door.x,
          door.y,
          door.width,
          door.height,
          door
        )
      );
    });

    config.enemies?.forEach((enemy) => {
      const e = new Enemy(enemy.x, enemy.y, enemy);
      this.enemies.push(e);
    });

    config.items?.forEach((item) => {
      this.items.push(new Item(item.x, item.y, item.type, item.amount));
    });
  }

  start() {
    this.active = true;
    this.addLog(`Mission start: ${this.currentObjective}`);
  }

  update(dt) {
    if (!this.active) return;

    this.player.fireCooldown = Math.max(0, this.player.fireCooldown - dt);
    this.player.update(dt, this);

    if (input.shooting) {
      const bullet = this.player.tryShoot(this);
      if (bullet) {
        this.playerBullets.push(bullet);
      }
    }

    for (const bullet of this.playerBullets) {
      bullet.update(dt, this);
    }

    for (const bullet of this.enemyBullets) {
      bullet.update(dt, this);
      if (!bullet.active) continue;
      if (!this.player.dead) {
        const dist = Math.hypot(bullet.x - this.player.x, bullet.y - this.player.y);
        if (dist < this.player.radius + bullet.radius) {
          bullet.active = false;
          this.player.health = clamp(this.player.health - bullet.damage, 0, this.player.maxHealth);
          if (this.player.health <= 0) {
            this.handlePlayerDown();
          }
        }
      }
    }

    this.playerBullets = this.playerBullets.filter((b) => b.active);
    this.enemyBullets = this.enemyBullets.filter((b) => b.active);

    for (const enemy of this.enemies) {
      enemy.update(dt, this);
      if (enemy.dead) continue;
      for (const bullet of this.playerBullets) {
        if (!bullet.active) continue;
        const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
        if (dist < enemy.radius + bullet.radius) {
          bullet.active = false;
          enemy.health -= bullet.damage;
          if (enemy.health <= 0) {
            enemy.dead = true;
            this.player.bc2 += 15;
            this.toast("Hostile down");
            this.comms("Nice shot. Keep moving.");
          } else {
            this.toast("Target wounded");
          }
        }
      }
    }

    // Items
    for (const item of this.items) {
      if (!item.active) continue;
      const dist = Math.hypot(item.x - this.player.x, item.y - this.player.y);
      if (dist < this.player.radius + item.radius) {
        item.active = false;
        switch (item.type) {
          case "food":
            this.player.inventory.push("food");
            this.toast("Picked up food");
            break;
          case "bc2":
            this.player.bc2 += item.amount;
            this.toast(`Collected ${item.amount} Bc2`);
            break;
          case "intel":
            this.player.inventory.push("intel");
            this.toast("Intel secured");
            break;
          case "keycard":
            this.player.inventory.push("keycard");
            this.toast("Keycard obtained");
            break;
        }
      }
    }

    // Doors interactions
    if (input.interact) {
      let interacted = false;
      for (const door of this.doors) {
        const dist = Math.hypot(
          this.player.x - (door.x + door.width / 2),
          this.player.y - (door.y + door.height / 2)
        );
        if (dist < 60) {
          door.interact(this.player, this);
          interacted = true;
          break;
        }
      }
      if (!interacted) {
        this.toast("Nothing to interact");
      }
      input.interact = false;
    }

    // Noise-based reinforcements
    if (this.player.noise >= 75 && this.reinforcements[this.spawnWaveIndex]) {
      this.reinforcementTimer -= dt;
      if (this.reinforcementTimer <= 0) {
        this.spawnReinforcements();
      }
    } else {
      this.reinforcementTimer = Math.max(this.reinforcementTimer, 5);
    }

    // Update timers
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.toastMessage = "";
        const toast = document.querySelector(".toast");
        toast?.remove();
      }
    }

    if (this.commsTimer > 0) {
      this.commsTimer -= dt;
      if (this.commsTimer <= 0) {
        commsDisplay.textContent = "";
      }
    }

    // Story beats for dynamic narration
    if (this.storyBeats[this.currentBeatIndex]) {
      const beat = this.storyBeats[this.currentBeatIndex];
      this.beatTimer += dt;
      if (this.beatTimer >= beat.time) {
        this.comms(beat.line);
        this.currentBeatIndex += 1;
      }
    }
  }

  spawnReinforcements() {
    const wave = this.reinforcements[this.spawnWaveIndex];
    if (!wave) return;
    wave.forEach((enemyConfig) => {
      this.enemies.push(new Enemy(enemyConfig.x, enemyConfig.y, enemyConfig));
    });
    this.spawnWaveIndex += 1;
    this.reinforcementTimer = 20;
    this.toast("Reinforcements inbound");
    this.comms("Noise is off the charts—expect company!");
    this.addLog("Noise spike triggered reinforcements.");
  }

  handleNoisePing(amount) {
    this.player.noise = clamp(this.player.noise + amount * 0.2, 0, this.player.maxNoise);
  }

  handlePlayerDown() {
    if (this.player.dead) return;
    this.player.dead = true;
    this.toast("You are down");
    this.comms("Stay with me! I'm rerouting the van!");
    this.addLog("Player incapacitated. Mission failure state engaged.");
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.background;
    ctx.fillRect(0, 0, this.width * TILE_SIZE, this.height * TILE_SIZE);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y * this.width + x];
        const posX = x * TILE_SIZE;
        const posY = y * TILE_SIZE;
        switch (tile) {
          case 1:
            ctx.fillStyle = "#0e1b2e";
            ctx.fillRect(posX, posY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = "rgba(120, 160, 220, 0.2)";
            ctx.strokeRect(posX, posY, TILE_SIZE, TILE_SIZE);
            break;
          case 2:
            ctx.fillStyle = "rgba(20, 80, 140, 0.35)";
            ctx.fillRect(posX, posY, TILE_SIZE, TILE_SIZE);
            break;
          case 3:
            ctx.fillStyle = "rgba(255, 193, 87, 0.1)";
            ctx.fillRect(posX, posY, TILE_SIZE, TILE_SIZE);
            break;
          default:
            ctx.fillStyle = "rgba(15, 20, 32, 0.3)";
            ctx.fillRect(posX, posY, TILE_SIZE, TILE_SIZE);
            if ((x + y) % 2 === 0) {
              ctx.fillStyle = "rgba(25, 30, 45, 0.3)";
              ctx.fillRect(posX, posY, TILE_SIZE / 2, TILE_SIZE / 2);
            }
        }
      }
    }

    for (const door of this.doors) {
      door.draw(ctx);
    }

    for (const item of this.items) {
      item.draw(ctx);
    }

    for (const enemy of this.enemies) {
      enemy.draw(ctx);
      if (!enemy.dead) {
        drawHealthBar(ctx, enemy.x, enemy.y - enemy.radius - 12, enemy.health / enemy.maxHealth);
      }
    }

    this.player.draw(ctx);
    drawHealthBar(ctx, this.player.x, this.player.y - this.player.radius - 16, this.player.health / this.player.maxHealth, true);

    for (const bullet of this.playerBullets) {
      bullet.draw(ctx);
    }

    for (const bullet of this.enemyBullets) {
      bullet.draw(ctx);
    }

    ctx.restore();
  }

  isBlocked(x, y, ignoreDoors = false) {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    if (tileX < 0 || tileY < 0 || tileX >= this.width || tileY >= this.height) {
      return true;
    }
    const tile = this.tiles[tileY * this.width + tileX];
    if (tile === 1) return true;
    if (!ignoreDoors && tile === 2) {
      const door = this.doors.find((d) =>
        rectsOverlap(
          { x: d.x, y: d.y, width: d.width, height: d.height },
          { x: x - 5, y: y - 5, width: 10, height: 10 }
        )
      );
      if (door && !door.canPass()) {
        return true;
      }
    }
    return false;
  }

  toast(message) {
    if (!message) return;
    this.toastMessage = message;
    this.toastTimer = 2;
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
  }

  comms(message) {
    commsDisplay.textContent = message;
    this.commsTimer = 3.5;
  }

  addLog(entry) {
    missionLogList.insertAdjacentHTML(
      "afterbegin",
      `<li>${new Date().toLocaleTimeString()} – ${entry}</li>`
    );
    missionLog.style.display = "block";
  }
}

function drawHealthBar(ctx, x, y, pct, isPlayer = false) {
  ctx.save();
  ctx.fillStyle = "rgba(4,6,12,0.8)";
  ctx.fillRect(x - 32, y, 64, 8);
  ctx.fillStyle = isPlayer ? "#23d997" : "#ff2d55";
  ctx.fillRect(x - 32, y, 64 * pct, 8);
  ctx.restore();
}

const campaign = [
  {
    id: "station",
    title: "Chapter 1 · Gas Giant Grab",
    objective: "Snatch the cashier's Bc2 wallet without triggering the alarms.",
    description:
      "A desert highway stop hiding an illicit Bc2 cold wallet. Larry idles outside in a stolen e-coupe.",
    story: [
      { speaker: "Narration", line: "2030. Bc2 rules the markets. You and Larry skim crumbs from giants." },
      { speaker: "Larry", line: "Quick in, quick out. The clerk's on his 14-minute hydration break." },
      { speaker: "You", line: "Mask on, pistol ready. Let's make it sloppy-clean." },
    ],
    config: {
      width: 24,
      height: 16,
      background: "#061018",
      tiles: createBoxLayout(24, 16, [
        { x: 5, y: 4, w: 6, h: 1 },
        { x: 5, y: 5, w: 1, h: 5 },
        { x: 10, y: 5, w: 1, h: 5 },
        { x: 6, y: 9, w: 4, h: 1 },
        { x: 12, y: 3, w: 8, h: 1 },
        { x: 12, y: 3, w: 1, h: 6 },
        { x: 19, y: 3, w: 1, h: 6 },
        { x: 12, y: 8, w: 8, h: 1 },
      ]),
      playerSpawn: { x: TILE_SIZE * 3, y: TILE_SIZE * 6 },
      doors: [
        { x: TILE_SIZE * 10, y: TILE_SIZE * 6, width: 10, height: TILE_SIZE, label: "Cooler Door" },
        {
          x: TILE_SIZE * 12,
          y: TILE_SIZE * 5,
          width: TILE_SIZE,
          height: 10,
          label: "Security Gate",
          locked: true,
          requires: "keycard",
        },
      ],
      enemies: [
        {
          x: TILE_SIZE * 8,
          y: TILE_SIZE * 6,
          patrolPath: [
            vec2(TILE_SIZE * 7, TILE_SIZE * 6),
            vec2(TILE_SIZE * 9, TILE_SIZE * 6),
          ],
          visionRange: 220,
        },
        {
          x: TILE_SIZE * 15,
          y: TILE_SIZE * 5,
          patrolPath: [
            vec2(TILE_SIZE * 14, TILE_SIZE * 4),
            vec2(TILE_SIZE * 18, TILE_SIZE * 7),
          ],
          visionRange: 260,
          viewAngle: Math.PI / 2.5,
        },
      ],
      items: [
        { x: TILE_SIZE * 4.5, y: TILE_SIZE * 6, type: "food" },
        { x: TILE_SIZE * 6.5, y: TILE_SIZE * 4.5, type: "bc2", amount: 25 },
        { x: TILE_SIZE * 13, y: TILE_SIZE * 4, type: "keycard" },
        { x: TILE_SIZE * 17, y: TILE_SIZE * 6, type: "intel" },
      ],
      storyBeats: [
        { time: 15, line: "Larry: Clerk's heading back. Move it." },
        { time: 35, line: "Larry: Police scanner hot. Ninety seconds till patrol swing." },
      ],
      reinforcements: [
        [
          { x: TILE_SIZE * 2, y: TILE_SIZE * 2, visionRange: 210, fireRate: 0.5 },
          { x: TILE_SIZE * 20, y: TILE_SIZE * 12, visionRange: 210, fireRate: 0.55 },
        ],
      ],
      reinforcementTimer: 10,
    },
    victoryCondition(level) {
      return level.player.inventory.includes("intel") && level.player.bc2 >= 40;
    },
    onVictory(game, level) {
      game.queueStory(
        [
          { speaker: "Larry", line: "Wallet acquired. I see flashing blues. You better sprint." },
          { speaker: "Narration", line: "You dive into the coupe as drones scan the lot. Larry guns it toward Neon City." },
        ],
        () => game.advanceMission(),
        "Aftermath · Escape"
      );
    },
  },
  {
    id: "neon",
    title: "Chapter 2 · Neon Alley Negotiations",
    objective: "Broker a weapons upgrade with the grid-runner brokers while avoiding corp scouts.",
    description: "Glitched rain, neon alleys, and corp spies. Maintain stealth, collect Bc2, and exit alive.",
    story: [
      { speaker: "Narration", line: "Neon City smells like ozone and greed." },
      { speaker: "Larry", line: "Keep a low profile. Brokers don't bargain with loudmouths." },
      { speaker: "You", line: "Eyes peeled. Pistol's hungry." },
    ],
    config: {
      width: 28,
      height: 18,
      background: "#050d13",
      tiles: createMazeLayout(28, 18),
      playerSpawn: { x: TILE_SIZE * 3, y: TILE_SIZE * 14 },
      doors: [
        {
          x: TILE_SIZE * 12,
          y: TILE_SIZE * 10,
          width: TILE_SIZE,
          height: 10,
          label: "Broker Gate",
          locked: true,
          requires: "intel",
        },
      ],
      enemies: [
        {
          x: TILE_SIZE * 8,
          y: TILE_SIZE * 13,
          patrolPath: [
            vec2(TILE_SIZE * 6, TILE_SIZE * 11),
            vec2(TILE_SIZE * 10, TILE_SIZE * 15),
          ],
          visionRange: 260,
          viewAngle: Math.PI / 2.2,
          fireRate: 0.5,
        },
        {
          x: TILE_SIZE * 20,
          y: TILE_SIZE * 6,
          patrolPath: [
            vec2(TILE_SIZE * 18, TILE_SIZE * 4),
            vec2(TILE_SIZE * 23, TILE_SIZE * 8),
          ],
          visionRange: 290,
          viewAngle: Math.PI / 2.5,
          fireRate: 0.45,
        },
      ],
      items: [
        { x: TILE_SIZE * 5, y: TILE_SIZE * 12, type: "bc2", amount: 45 },
        { x: TILE_SIZE * 12, y: TILE_SIZE * 11, type: "food" },
        { x: TILE_SIZE * 21, y: TILE_SIZE * 6, type: "bc2", amount: 60 },
      ],
      storyBeats: [
        { time: 20, line: "Larry: Drones overhead. Cut through the laundro-shrine." },
        { time: 45, line: "Broker: Bring the intel if you want tech." },
      ],
      reinforcements: [
        [
          { x: TILE_SIZE * 14, y: TILE_SIZE * 2, visionRange: 260, fireRate: 0.4 },
          { x: TILE_SIZE * 24, y: TILE_SIZE * 10, visionRange: 280, fireRate: 0.4 },
        ],
        [
          { x: TILE_SIZE * 4, y: TILE_SIZE * 16, visionRange: 240, fireRate: 0.35 },
        ],
      ],
      reinforcementTimer: 14,
    },
    victoryCondition(level) {
      return level.player.bc2 >= 140;
    },
    onVictory(game) {
      game.queueStory(
        [
          { speaker: "Broker", line: "Pleasure doing neon business. That rifle will punch drones from a mile." },
          { speaker: "Larry", line: "Load up. Syndicate safehouse is next." },
        ],
        () => game.advanceMission(),
        "Aftermath · Upgraded"
      );
    },
  },
  {
    id: "safehouse",
    title: "Chapter 3 · Syndicate Safehouse Siege",
    objective: "Breach the syndicate safehouse, plant the EMP, and exfiltrate with the prototype ledger.",
    description: "Corporate brownstones in lockdown. Thermal turrets, armored guards, and a timer till blackout.",
    story: [
      { speaker: "Narration", line: "The safehouse is the size of a block. Drones circle like vultures." },
      { speaker: "Larry", line: "EMP satchel ready. You'll have five minutes of shadow when it detonates." },
      { speaker: "You", line: "Five minutes is an eternity." },
    ],
    config: {
      width: 32,
      height: 20,
      background: "#070b15",
      tiles: createCompoundLayout(32, 20),
      playerSpawn: { x: TILE_SIZE * 2, y: TILE_SIZE * 18 },
      doors: [
        {
          x: TILE_SIZE * 14,
          y: TILE_SIZE * 9,
          width: TILE_SIZE,
          height: 10,
          label: "Vault Door",
          locked: true,
          requires: "keycard",
        },
        {
          x: TILE_SIZE * 20,
          y: TILE_SIZE * 6,
          width: TILE_SIZE,
          height: 10,
          label: "Server Room",
          locked: true,
          requires: "intel",
        },
      ],
      enemies: [
        {
          x: TILE_SIZE * 10,
          y: TILE_SIZE * 15,
          patrolPath: [
            vec2(TILE_SIZE * 8, TILE_SIZE * 13),
            vec2(TILE_SIZE * 12, TILE_SIZE * 17),
          ],
          visionRange: 300,
          fireRate: 0.35,
          damage: 16,
        },
        {
          x: TILE_SIZE * 22,
          y: TILE_SIZE * 9,
          patrolPath: [
            vec2(TILE_SIZE * 20, TILE_SIZE * 7),
            vec2(TILE_SIZE * 26, TILE_SIZE * 12),
          ],
          visionRange: 320,
          fireRate: 0.3,
          damage: 18,
        },
      ],
      items: [
        { x: TILE_SIZE * 5, y: TILE_SIZE * 16, type: "food" },
        { x: TILE_SIZE * 15, y: TILE_SIZE * 5, type: "bc2", amount: 75 },
        { x: TILE_SIZE * 23, y: TILE_SIZE * 9, type: "bc2", amount: 90 },
        { x: TILE_SIZE * 27, y: TILE_SIZE * 6, type: "food" },
      ],
      storyBeats: [
        { time: 15, line: "Larry: EMP charging. Keep them busy." },
        { time: 60, line: "Larry: Shadow window closing. Plant the satchel!" },
      ],
      reinforcements: [
        [
          { x: TILE_SIZE * 30, y: TILE_SIZE * 18, visionRange: 320, fireRate: 0.28, damage: 18 },
          { x: TILE_SIZE * 18, y: TILE_SIZE * 2, visionRange: 320, fireRate: 0.3, damage: 18 },
        ],
      ],
      reinforcementTimer: 12,
    },
    victoryCondition(level) {
      return level.player.inventory.includes("emp_planted");
    },
    onVictory(game) {
      game.queueStory(
        [
          { speaker: "Narration", line: "The EMP hits. Neon City dims. You slip through the blackout with the ledger." },
          { speaker: "Larry", line: "Last stop: The Helios exchange. Time to cash out or burn down." },
        ],
        () => game.advanceMission(),
        "Aftermath · Blackout"
      );
    },
  },
  {
    id: "exchange",
    title: "Finale · Helios Exchange Uprising",
    objective: "Upload the doctored ledger to crash the Helios exchange while surviving elite response waves.",
    description: "Futuristic stock floor with holographic tickers. Survive waves, hack terminals, escape to the roof.",
    story: [
      { speaker: "Narration", line: "Helios exchange blazes with holo screens. Wealth flows like blood." },
      { speaker: "Larry", line: "I'll loop in on rooftop. Get the upload done." },
      { speaker: "You", line: "We're about to break the chain." },
    ],
    config: {
      width: 34,
      height: 22,
      background: "#040810",
      tiles: createExchangeLayout(34, 22),
      playerSpawn: { x: TILE_SIZE * 4, y: TILE_SIZE * 20 },
      doors: [
        {
          x: TILE_SIZE * 16,
          y: TILE_SIZE * 12,
          width: TILE_SIZE,
          height: 10,
          label: "Mainframe Gate",
          locked: true,
          requires: "ledger",
        },
      ],
      enemies: [
        {
          x: TILE_SIZE * 12,
          y: TILE_SIZE * 18,
          patrolPath: [
            vec2(TILE_SIZE * 9, TILE_SIZE * 17),
            vec2(TILE_SIZE * 14, TILE_SIZE * 19),
          ],
          visionRange: 340,
          fireRate: 0.25,
          damage: 20,
        },
        {
          x: TILE_SIZE * 22,
          y: TILE_SIZE * 10,
          patrolPath: [
            vec2(TILE_SIZE * 20, TILE_SIZE * 8),
            vec2(TILE_SIZE * 26, TILE_SIZE * 12),
          ],
          visionRange: 360,
          fireRate: 0.22,
          damage: 22,
        },
      ],
      items: [
        { x: TILE_SIZE * 6, y: TILE_SIZE * 18, type: "food" },
        { x: TILE_SIZE * 18, y: TILE_SIZE * 10, type: "bc2", amount: 110 },
        { x: TILE_SIZE * 28, y: TILE_SIZE * 6, type: "bc2", amount: 130 },
      ],
      storyBeats: [
        { time: 20, line: "Larry: Upload progress 30%. Hold the floor." },
        { time: 45, line: "Larry: Elite guards inbound. Brace!" },
        { time: 70, line: "Larry: Upload complete. Roof in 45 seconds!" },
      ],
      reinforcements: [
        [
          { x: TILE_SIZE * 4, y: TILE_SIZE * 2, visionRange: 360, fireRate: 0.2, damage: 24 },
          { x: TILE_SIZE * 30, y: TILE_SIZE * 14, visionRange: 360, fireRate: 0.18, damage: 24 },
        ],
        [
          { x: TILE_SIZE * 24, y: TILE_SIZE * 20, visionRange: 360, fireRate: 0.15, damage: 26 },
        ],
      ],
      reinforcementTimer: 16,
    },
    victoryCondition(level) {
      return level.player.bc2 >= 400;
    },
    onVictory(game) {
      game.queueStory([
        { speaker: "Narration", line: "Helios ticks red. Bc2 plummets. The underworld crowns you market breaker." },
        { speaker: "Larry", line: "We're legends now. Or targets." },
        { speaker: "You", line: "Same thing in 2030." },
      ]);
      game.showCredits();
    },
  },
];

function createBoxLayout(width, height, walls) {
  const tiles = new Array(width * height).fill(0);
  for (let x = 0; x < width; x++) {
    tiles[x] = 1;
    tiles[(height - 1) * width + x] = 1;
  }
  for (let y = 0; y < height; y++) {
    tiles[y * width] = 1;
    tiles[y * width + (width - 1)] = 1;
  }
  for (const wall of walls) {
    for (let y = wall.y; y < wall.y + wall.h; y++) {
      for (let x = wall.x; x < wall.x + wall.w; x++) {
        tiles[y * width + x] = 1;
      }
    }
  }
  return tiles;
}

function createMazeLayout(width, height) {
  const tiles = createBoxLayout(width, height, []);
  for (let y = 2; y < height - 2; y += 2) {
    for (let x = 2; x < width - 2; x++) {
      if (Math.random() > 0.7) {
        tiles[y * width + x] = 1;
      }
    }
  }
  for (let i = 0; i < 120; i++) {
    const x = 1 + Math.floor(Math.random() * (width - 2));
    const y = 1 + Math.floor(Math.random() * (height - 2));
    tiles[y * width + x] = 0;
  }
  return tiles;
}

function createCompoundLayout(width, height) {
  const tiles = createBoxLayout(width, height, []);
  const blocks = [
    { x: 6, y: 4, w: 4, h: 8 },
    { x: 14, y: 4, w: 12, h: 4 },
    { x: 24, y: 9, w: 6, h: 7 },
    { x: 10, y: 12, w: 10, h: 4 },
  ];
  for (const block of blocks) {
    for (let y = block.y; y < block.y + block.h; y++) {
      for (let x = block.x; x < block.x + block.w; x++) {
        tiles[y * width + x] = 1;
      }
    }
  }
  return tiles;
}

function createExchangeLayout(width, height) {
  const tiles = createBoxLayout(width, height, []);
  const pillars = [
    { x: 8, y: 4, w: 2, h: 12 },
    { x: 16, y: 6, w: 2, h: 10 },
    { x: 24, y: 5, w: 2, h: 11 },
  ];
  for (const p of pillars) {
    for (let y = p.y; y < p.y + p.h; y++) {
      for (let x = p.x; x < p.x + p.w; x++) {
        tiles[y * width + x] = 1;
      }
    }
  }
  return tiles;
}

class Game {
  constructor() {
    this.currentMissionIndex = -1;
    this.level = null;
    this.state = "menu";
    this.storyQueue = [];
    this.storyResolve = null;
    this.timeAccumulator = 0;
  }

  startCampaign() {
    this.currentMissionIndex = 0;
    this.beginMission();
  }

  beginMission() {
    const mission = campaign[this.currentMissionIndex];
    if (!mission) return;
    this.level = new Level(mission.config, this);
    this.showStory(mission.title, mission.story, () => {
      overlay.classList.add("hidden");
      storyPanel.classList.add("hidden");
      startButton.classList.add("hidden");
      hud.classList.remove("hidden");
      overlay.classList.remove("active");
      this.level.start();
      this.state = "mission";
    });
    missionLogList.innerHTML = "";
    missionLog.style.display = "none";
    this.updateHud();
    objectiveDisplay.textContent = mission.objective;
    this.addTimelineEntry(`${mission.title} — ${mission.description}`);
  }

  addTimelineEntry(text) {
    missionLogList.insertAdjacentHTML("afterbegin", `<li>${text}</li>`);
    missionLog.style.display = "block";
  }

  update(dt) {
    if (this.state === "mission" && this.level) {
      this.level.update(dt);
      this.updateHud();
      const mission = campaign[this.currentMissionIndex];
      if (mission?.victoryCondition(this.level)) {
        mission.onVictory(this, this.level);
        this.state = "story";
      }
    }
  }

  draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (this.level) {
      this.level.draw(ctx);
    }
  }

  updateHud() {
    const player = this.level?.player;
    if (!player) return;
    healthBar.style.width = `${(player.health / player.maxHealth) * 100}%`;
    energyBar.style.width = `${(player.energy / player.maxEnergy) * 100}%`;
    noiseBar.style.width = `${(player.noise / player.maxNoise) * 100}%`;
    bc2Display.textContent = `${Math.floor(player.bc2)} Bc2`;
  }

  queueStory(dialogue, onComplete, title = "Interlude") {
    this.showStory(title, dialogue, () => {
      overlay.classList.add("hidden");
      overlay.classList.remove("active");
      storyPanel.classList.add("hidden");
      hud.classList.remove("hidden");
      this.state = "mission";
      onComplete?.();
    });
  }

  advanceMission() {
    this.currentMissionIndex += 1;
    if (this.currentMissionIndex < campaign.length) {
      setTimeout(() => this.beginMission(), 1200);
    }
  }

  showStory(title, lines, onComplete) {
    overlay.classList.add("active");
    overlay.classList.remove("hidden");
    storyPanel.classList.remove("hidden");
    hud.classList.add("hidden");
    startButton.classList.add("hidden");
    renderStoryPanel(title, lines);
    this.state = "story";
    this.storyResolve = onComplete;
  }

  showCredits() {
    this.showStory("Epilogue · Market Collapse", [
      { speaker: "Narration", line: "Your hack crashes Helios. Global markets convulse." },
      { speaker: "Larry", line: "We go dark now. No more gas stations." },
      { speaker: "You", line: "Disorderly Conduct? More like the new order." },
    ], () => {
      startButton.textContent = "Play Again";
      startButton.classList.remove("hidden");
      overlay.classList.remove("hidden");
      overlay.classList.add("active");
      hud.classList.add("hidden");
      this.state = "menu";
    });
  }
}

function renderStoryPanel(title, lines) {
  storyPanel.innerHTML = `
    <h2>${title}</h2>
    <div id="story-lines"></div>
    <button id="continue-button">Continue</button>
  `;
  const container = storyPanel.querySelector("#story-lines");
  lines.forEach((line) => {
    const entry = document.createElement("div");
    entry.className = "story-entry";
    entry.innerHTML = `<div class="speaker">${line.speaker}</div><div class="line">${line.line}</div>`;
    container.appendChild(entry);
  });
  const continueButton = storyPanel.querySelector("#continue-button");
  continueButton.addEventListener("click", () => {
    const resolver = game.storyResolve;
    game.storyResolve = null;
    resolver?.();
  });
}

const game = new Game();

startButton.addEventListener("click", () => {
  overlay.classList.add("hidden");
  startButton.classList.add("hidden");
  game.startCampaign();
});

let lastTime = 0;
function loop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  game.update(dt);
  game.draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
