const screens = {
  menu: document.getElementById('menu'),
  customization: document.getElementById('customization'),
  game: document.getElementById('gameScreen')
};

function showScreen(id) {
  Object.values(screens).forEach((screen) => screen.classList.remove('active'));
  screens[id].classList.add('active');
}

const howToPlayModal = document.getElementById('howToPlay');
const startButton = document.getElementById('startButton');
const howToPlayButton = document.getElementById('howToPlayButton');
const closeHowToPlay = document.getElementById('closeHowToPlay');
const backToMenuButton = document.getElementById('backToMenu');
const beginTutorialButton = document.getElementById('beginTutorial');
const restartButton = document.getElementById('restartButton');

const aliasInput = document.getElementById('aliasInput');
const jacketColorInput = document.getElementById('jacketColor');
const pantsColorInput = document.getElementById('pantsColor');
const accentColorInput = document.getElementById('accentColor');
const maskStyleSelect = document.getElementById('maskStyle');

const preview = document.getElementById('characterPreview');
const previewHead = preview.querySelector('.head');
const previewMask = preview.querySelector('.mask');
const previewBody = preview.querySelector('.body');
const previewLegs = preview.querySelector('.legs');
const previewAccent = preview.querySelector('.accent');

const objectiveEl = document.getElementById('objective');
const dialogueEl = document.getElementById('dialogue');
const statusEl = document.getElementById('status');
const endOverlay = document.getElementById('endOverlay');
const endSummary = document.getElementById('endSummary');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let currentGame = null;

startButton.addEventListener('click', () => {
  showScreen('customization');
});

backToMenuButton.addEventListener('click', () => {
  showScreen('menu');
});

restartButton.addEventListener('click', () => {
  if (currentGame) {
    currentGame.destroy();
    currentGame = null;
  }
  endOverlay.classList.add('hidden');
  showScreen('menu');
});

howToPlayButton.addEventListener('click', () => {
  howToPlayModal.classList.remove('hidden');
});

closeHowToPlay.addEventListener('click', () => {
  howToPlayModal.classList.add('hidden');
});

function updatePreview() {
  const jacket = jacketColorInput.value;
  const pants = pantsColorInput.value;
  const accent = accentColorInput.value;
  const maskStyle = maskStyleSelect.value;

  previewBody.style.background = jacket;
  previewLegs.style.background = pants;
  previewAccent.style.background = accent;
  previewMask.style.background = maskStyle === 'none' ? 'transparent' : accent;
  previewHead.style.background = maskStyle === 'full' ? '#111821' : '#d1a87c';

  preview.classList.remove('mask-none', 'mask-bandana', 'mask-full');
  preview.classList.add(`mask-${maskStyle}`);
}

[jacketColorInput, pantsColorInput, accentColorInput, maskStyleSelect].forEach((input) => {
  input.addEventListener('input', updatePreview);
});

updatePreview();

beginTutorialButton.addEventListener('click', () => {
  endOverlay.classList.add('hidden');
  if (currentGame) {
    currentGame.destroy();
    currentGame = null;
  }
  const profile = {
    alias: aliasInput.value.trim(),
    colors: {
      jacket: jacketColorInput.value,
      pants: pantsColorInput.value,
      accent: accentColorInput.value
    },
    maskStyle: maskStyleSelect.value
  };
  showScreen('game');
  currentGame = new DisorderlyConductGame(canvas, ctx, profile);
  currentGame.start();
});

const KEY_MAP = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  jump: ['Space', 'ArrowUp', 'KeyW'],
  interact: ['KeyE']
};

window.addEventListener('keydown', (event) => {
  if (!currentGame || currentGame.isDestroyed) return;
  if (KEY_MAP.jump.includes(event.code) || event.code === 'Space') {
    event.preventDefault();
  }
  currentGame.handleKeyDown(event.code);
});

window.addEventListener('keyup', (event) => {
  if (!currentGame || currentGame.isDestroyed) return;
  currentGame.handleKeyUp(event.code);
});

class DisorderlyConductGame {
  constructor(canvas, context, profile) {
    this.canvas = canvas;
    this.ctx = context;
    this.profile = profile;
    this.alias = profile.alias || 'You';
    this.running = false;
    this.isDestroyed = false;
    this.inputEnabled = true;
    this.ended = false;

    this.keys = {
      left: false,
      right: false,
      jump: false,
      jumpPressed: false,
      interact: false,
      interactPressed: false
    };

    this.world = {
      width: 2000,
      height: this.canvas.height
    };

    this.groundY = this.canvas.height - 96;

    this.player = {
      x: 180,
      y: this.groundY,
      width: 40,
      height: 84,
      vy: 0,
      speed: 240,
      onGround: true
    };

    this.store = {
      building: { x: 520, width: 260, height: 220 },
      doorZone: { x: 610, width: 72 },
      registerZone: { x: 720, width: 70 },
      counter: { x: 640, width: 190, height: 34 }
    };

    this.escapeZone = { x: 1350 };

    this.accompliceName = randomAccompliceName();
    this.accomplice = {
      x: 360,
      y: this.groundY,
      width: 36,
      height: 78,
      colors: randomOutfitPalette(),
      visible: true
    };

    this.accompliceFleeing = false;

    this.clerk = {
      x: this.store.registerZone.x + 20,
      y: this.groundY,
      width: 30,
      height: 70
    };

    this.police = {
      active: false,
      x: this.escapeZone.x + 80,
      lightPhase: 0
    };

    this.dialogueQueue = [];
    this.currentDialogue = null;
    this.dialogueTimer = 0;
    this.onDialogueEmpty = null;

    this.statusBase = '';
    this.statusDetail = '';

    this.cameraX = 0;

    this.gravity = 1800;
    this.jumpVelocity = -620;

    this.tutorial = new TutorialController(this);
    this.boundLoop = this.loop.bind(this);

    objectiveEl.textContent = '';
    dialogueEl.innerHTML = '';
    statusEl.innerHTML = '';
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.isDestroyed = false;
    this.inputEnabled = true;
    this.ended = false;
    this.lastTime = performance.now();
    this.tutorial.start();
    this.loopId = requestAnimationFrame(this.boundLoop);
  }

  destroy() {
    if (this.loopId) {
      cancelAnimationFrame(this.loopId);
      this.loopId = null;
    }
    this.running = false;
    this.isDestroyed = true;
  }

  handleKeyDown(code) {
    switch (true) {
      case KEY_MAP.left.includes(code):
        this.keys.left = true;
        break;
      case KEY_MAP.right.includes(code):
        this.keys.right = true;
        break;
      case KEY_MAP.jump.includes(code):
        if (!this.keys.jump) {
          this.keys.jumpPressed = true;
        }
        this.keys.jump = true;
        break;
      case KEY_MAP.interact.includes(code):
        if (!this.keys.interact) {
          this.keys.interactPressed = true;
        }
        this.keys.interact = true;
        break;
      default:
        break;
    }
  }

  handleKeyUp(code) {
    switch (true) {
      case KEY_MAP.left.includes(code):
        this.keys.left = false;
        break;
      case KEY_MAP.right.includes(code):
        this.keys.right = false;
        break;
      case KEY_MAP.jump.includes(code):
        this.keys.jump = false;
        break;
      case KEY_MAP.interact.includes(code):
        this.keys.interact = false;
        break;
      default:
        break;
    }
  }

  consumeInteract() {
    if (this.keys.interactPressed) {
      this.keys.interactPressed = false;
      return true;
    }
    return false;
  }

  loop(timestamp) {
    if (!this.running || this.isDestroyed) {
      return;
    }

    const delta = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(delta);
    this.draw();

    this.loopId = requestAnimationFrame(this.boundLoop);
  }

  update(delta) {
    if (!this.ended) {
      this.handleMovement(delta);
    }

    this.updateDialogue(delta);
    this.tutorial.update(delta);
    this.updateAccomplice(delta);
    this.updatePolice(delta);

    if (this.tutorial.step === 'intimidate') {
      const progress = Math.min(100, Math.round((this.tutorial.robberyTimer / 3) * 100));
      this.setStatusDetail(`Clerk compliance: ${progress}%`);
    } else if (this.tutorial.step === 'escape') {
      const distance = Math.max(0, this.escapeZone.x - this.player.x);
      const meters = Math.max(0, Math.round(distance / 10));
      this.setStatusDetail(`Distance to alley: ${meters} m`);
    } else if (this.tutorial.step === 'captured') {
      this.setStatusDetail('Pinned down by responding officers.');
    } else {
      this.setStatusDetail('');
    }
  }

  handleMovement(delta) {
    const player = this.player;

    if (!this.inputEnabled) {
      player.vx = 0;
    } else {
      let direction = 0;
      if (this.keys.left) direction -= 1;
      if (this.keys.right) direction += 1;
      player.vx = direction * player.speed;
    }

    if (this.inputEnabled && this.keys.jumpPressed && player.onGround) {
      player.vy = this.jumpVelocity;
      player.onGround = false;
    }
    this.keys.jumpPressed = false;

    player.x += player.vx * delta;
    player.y += player.vy * delta;

    if (!player.onGround) {
      player.vy += this.gravity * delta;
    }

    if (player.y >= this.groundY) {
      player.y = this.groundY;
      player.vy = 0;
      player.onGround = true;
    }

    const halfWidth = player.width / 2;
    if (player.x < halfWidth) player.x = halfWidth;
    if (player.x > this.world.width - halfWidth) player.x = this.world.width - halfWidth;

    this.cameraX = clamp(player.x - this.canvas.width / 2, 0, this.world.width - this.canvas.width);
  }

  updateDialogue(delta) {
    if (!this.currentDialogue && this.dialogueQueue.length > 0) {
      this.advanceDialogue();
    }

    if (this.currentDialogue) {
      this.dialogueTimer -= delta;
      if (this.dialogueTimer <= 0) {
        this.advanceDialogue();
      }
    }
  }

  advanceDialogue() {
    if (this.dialogueQueue.length === 0) {
      this.currentDialogue = null;
      this.dialogueTimer = 0;
      dialogueEl.innerHTML = '';
      if (typeof this.onDialogueEmpty === 'function') {
        const handler = this.onDialogueEmpty;
        this.onDialogueEmpty = null;
        handler();
      }
      return;
    }
    this.currentDialogue = this.dialogueQueue.shift();
    const { speaker, text, duration } = this.currentDialogue;
    this.dialogueTimer = duration;
    const isPlayerSpeaker = speaker === this.alias;
    const speakerName = isPlayerSpeaker && this.alias.toLowerCase() !== 'you'
      ? `${speaker} (You)`
      : speaker;
    dialogueEl.innerHTML = `<strong>${speakerName}:</strong> ${text}`;
  }

  queueDialogue(speaker, text, duration = 3) {
    this.dialogueQueue.push({ speaker, text, duration });
  }

  setObjective(text) {
    objectiveEl.textContent = text;
  }

  setStatusBase(text) {
    this.statusBase = text;
    this.renderStatus();
  }

  setStatusDetail(text) {
    this.statusDetail = text;
    this.renderStatus();
  }

  renderStatus() {
    const parts = [];
    if (this.statusBase) parts.push(this.statusBase);
    if (this.statusDetail) parts.push(`<span>${this.statusDetail}</span>`);
    statusEl.innerHTML = parts.join('<br>');
  }

  updateAccomplice(delta) {
    if (!this.accomplice.visible) return;

    if (this.accompliceFleeing) {
      this.accomplice.x += 320 * delta;
      if (this.accomplice.x > this.world.width + 120) {
        this.accomplice.visible = false;
        this.accompliceFleeing = false;
      }
    }
  }

  updatePolice(delta) {
    if (this.police.active) {
      this.police.lightPhase += delta * 6;
    }
  }

  isPlayerInZone(zone) {
    const left = this.player.x - this.player.width / 2;
    const right = this.player.x + this.player.width / 2;
    return right >= zone.x && left <= zone.x + (zone.width || 0);
  }

  draw() {
    const cameraX = this.cameraX;
    this.drawBackground(cameraX);

    this.ctx.save();
    this.ctx.translate(-cameraX, 0);
    this.drawGround();
    this.drawStore();
    if (this.tutorial.step === 'escape' || this.tutorial.step === 'captured') {
      this.drawEscapeMarker();
    }
    if (this.police.active) {
      this.drawPolice();
    }
    this.drawAccomplice();
    this.drawClerk();
    this.drawPlayer();
    this.ctx.restore();
  }

  drawBackground(cameraX) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#0c151f';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const skylineOffset = (cameraX * 0.35) % 240;
    ctx.fillStyle = '#142438';
    for (let i = -1; i < 10; i++) {
      const x = i * 240 - skylineOffset;
      const width = 160;
      const height = 180 + mod(i * 37, 80);
      ctx.fillRect(x, this.canvas.height - height - 180, width, height);
    }

    const midOffset = (cameraX * 0.6) % 180;
    ctx.fillStyle = '#1b2f46';
    for (let i = -1; i < 12; i++) {
      const x = i * 180 - midOffset;
      const width = 120;
      const height = 120 + mod(i * 51, 60);
      ctx.fillRect(x, this.canvas.height - height - 120, width, height);
    }
  }

  drawGround() {
    const ctx = this.ctx;
    ctx.fillStyle = '#20242c';
    ctx.fillRect(0, this.groundY, this.world.width, this.canvas.height - this.groundY);
    ctx.fillStyle = '#3a3f49';
    ctx.fillRect(0, this.groundY - 12, this.world.width, 12);
    ctx.setLineDash([18, 26]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(0, this.groundY + 24);
    ctx.lineTo(this.world.width, this.groundY + 24);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawStore() {
    const ctx = this.ctx;
    const storeTop = this.groundY - this.store.building.height;
    ctx.fillStyle = '#2f3c4e';
    ctx.fillRect(this.store.building.x, storeTop, this.store.building.width, this.store.building.height);
    ctx.fillStyle = '#212b38';
    ctx.fillRect(this.store.building.x + 14, storeTop + 60, this.store.building.width - 28, this.store.building.height - 74);

    const doorX = this.store.doorZone.x;
    ctx.fillStyle = '#0f1924';
    ctx.fillRect(doorX, this.groundY - 110, 62, 110);
    ctx.strokeStyle = '#4ac0ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(doorX + 4, this.groundY - 108, 54, 106);

    ctx.fillStyle = '#25394a';
    ctx.fillRect(this.store.registerZone.x - 50, this.groundY - 150, 120, 60);

    ctx.fillStyle = '#eac75f';
    ctx.font = '24px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.fillText('QuickFix Mart', this.store.building.x + this.store.building.width / 2, storeTop + 40);

    ctx.fillStyle = '#3f5266';
    ctx.fillRect(this.store.counter.x, this.groundY - 50, this.store.counter.width, this.store.counter.height);

    if (this.tutorial.step === 'door') {
      ctx.fillStyle = 'rgba(74, 192, 255, 0.35)';
      ctx.fillRect(this.store.doorZone.x - 6, this.groundY - 112, this.store.doorZone.width + 12, 116);
    }

    if (this.tutorial.step === 'register') {
      ctx.fillStyle = 'rgba(255, 230, 92, 0.7)';
      ctx.fillRect(this.store.registerZone.x - 12, this.groundY - 110, 64, 10);
    }
  }

  drawEscapeMarker() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255, 90, 90, 0.25)';
    ctx.fillRect(this.escapeZone.x - 10, this.groundY - 160, 100, 160);
    ctx.fillStyle = '#ff5d5d';
    ctx.beginPath();
    ctx.moveTo(this.escapeZone.x + 30, this.groundY - 150);
    ctx.lineTo(this.escapeZone.x + 80, this.groundY - 120);
    ctx.lineTo(this.escapeZone.x + 30, this.groundY - 90);
    ctx.closePath();
    ctx.fill();
  }

  drawPlayer() {
    const ctx = this.ctx;
    const p = this.player;
    const colors = this.profile.colors;
    const legHeight = 32;
    const bodyHeight = 36;
    const headRadius = 18;

    ctx.save();
    ctx.translate(p.x, p.y);

    // shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // legs
    ctx.fillStyle = colors.pants;
    ctx.fillRect(-p.width / 2 + 6, -legHeight, p.width - 12, legHeight);

    // torso
    ctx.fillStyle = colors.jacket;
    ctx.fillRect(-p.width / 2, -legHeight - bodyHeight, p.width, bodyHeight);

    // accent strap
    ctx.fillStyle = colors.accent;
    ctx.fillRect(-p.width / 2 + 4, -legHeight - bodyHeight + 12, p.width - 8, 8);

    // head
    const headY = -legHeight - bodyHeight - headRadius;
    ctx.fillStyle = '#d1a87c';
    if (this.profile.maskStyle === 'full') {
      ctx.fillStyle = colors.accent;
    }
    ctx.beginPath();
    ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    if (this.profile.maskStyle === 'bandana') {
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.moveTo(-headRadius, headY);
      ctx.lineTo(headRadius, headY);
      ctx.lineTo(0, headY + 18);
      ctx.closePath();
      ctx.fill();
    } else if (this.profile.maskStyle === 'full') {
      ctx.fillStyle = '#141820';
      ctx.fillRect(-headRadius / 1.2, headY - 6, headRadius * 1.6, 12);
    }

    ctx.restore();
  }

  drawAccomplice() {
    if (!this.accomplice.visible) return;
    const ctx = this.ctx;
    const a = this.accomplice;
    const legHeight = 28;
    const bodyHeight = 34;
    const headRadius = 16;

    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = a.colors.pants;
    ctx.fillRect(-a.width / 2 + 4, -legHeight, a.width - 8, legHeight);
    ctx.fillStyle = a.colors.jacket;
    ctx.fillRect(-a.width / 2, -legHeight - bodyHeight, a.width, bodyHeight);
    ctx.fillStyle = a.colors.accent;
    ctx.fillRect(-a.width / 2 + 6, -legHeight - bodyHeight + 10, a.width - 12, 6);

    const headY = -legHeight - bodyHeight - headRadius;
    ctx.fillStyle = '#bd8e63';
    ctx.beginPath();
    ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a1f2a';
    ctx.fillRect(-headRadius, headY - 4, headRadius * 2, 10);

    ctx.restore();
  }

  drawClerk() {
    const ctx = this.ctx;
    const c = this.clerk;
    const bodyHeight = 30;
    const headRadius = 14;

    ctx.save();
    ctx.translate(c.x, c.y - 34);
    ctx.fillStyle = 'rgba(15, 15, 15, 0.12)';
    ctx.beginPath();
    ctx.ellipse(0, c.height - 20, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6993c5';
    ctx.fillRect(-14, -bodyHeight, 28, bodyHeight);
    ctx.fillStyle = '#c98a5f';
    ctx.beginPath();
    ctx.arc(0, -bodyHeight - headRadius, headRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawPolice() {
    const ctx = this.ctx;
    const phase = this.police.lightPhase;
    const carX = this.police.x;
    const carY = this.groundY - 42;

    ctx.save();
    ctx.translate(carX, carY);
    ctx.fillStyle = '#1d2330';
    ctx.fillRect(-70, -20, 140, 40);
    ctx.fillStyle = '#141924';
    ctx.fillRect(-60, -36, 120, 22);

    const red = `rgba(255, 80, 80, ${0.4 + 0.3 * Math.sin(phase)})`;
    const blue = `rgba(90, 160, 255, ${0.4 + 0.3 * Math.cos(phase)})`;
    ctx.fillStyle = red;
    ctx.fillRect(-30, -40, 28, 10);
    ctx.fillStyle = blue;
    ctx.fillRect(2, -40, 28, 10);

    ctx.fillStyle = '#d9dbe4';
    ctx.fillRect(-50, 12, 24, 10);
    ctx.fillRect(26, 12, 24, 10);

    ctx.restore();
  }

  endTutorial() {
    if (this.ended) return;
    this.ended = true;
    this.setStatusDetail('Arrested and processed.');
    endSummary.textContent = `${this.alias} was captured outside the alley while ${this.accompliceName} vanished into the night.`;
    endOverlay.classList.remove('hidden');
  }
}

class TutorialController {
  constructor(game) {
    this.game = game;
    this.step = 'approach';
    this.robberyTimer = 0;
    this.wantedLevel = 0;
    this.policeArrived = false;
  }

  start() {
    this.game.setObjective(`Head to the QuickFix Mart and meet ${this.game.accompliceName}.`);
    this.setWantedLevel(0);
    this.game.queueDialogue('Dispatcher', 'Late-night lull on the scanners. Perfect moment to make a name for yourself.', 3.5);
  }

  update(delta) {
    const player = this.game.player;
    switch (this.step) {
      case 'approach':
        if (player.x >= this.game.accomplice.x - 40) {
          this.step = 'door';
          this.game.queueDialogue(this.game.accompliceName, 'There you are. Keep it slick and quiet, rookie.');
          this.game.queueDialogue(this.game.alias, "I'll handle the clerk. Keep the engine warm.");
          this.game.queueDialogue(this.game.accompliceName, `Signal me at the door when you're ready.`);
          this.game.setObjective(`Signal ${this.game.accompliceName} at the store entrance (press E).`);
        }
        break;
      case 'door':
        if (this.game.isPlayerInZone(this.game.store.doorZone) && this.game.consumeInteract()) {
          this.step = 'intimidate';
          this.setWantedLevel(1);
          this.game.queueDialogue(this.game.alias, 'Nobody move! Empty the register now.');
          this.game.queueDialogue('Clerk', "Please don't hurt me! I'm opening it!");
          this.game.setObjective('Hold position while the clerk opens the register.');
          this.robberyTimer = 0;
        }
        break;
      case 'intimidate':
        this.robberyTimer += delta;
        if (this.robberyTimer >= 3) {
          this.step = 'register';
          this.game.queueDialogue('Clerk', "It's open! Take it and go!");
          this.game.setObjective('Grab the cash from the register (press E).');
        }
        break;
      case 'register':
        if (this.game.isPlayerInZone(this.game.store.registerZone) && this.game.consumeInteract()) {
          this.step = 'escape';
          this.setWantedLevel(2);
          this.game.queueDialogue(this.game.alias, 'Cash secured. We ghost this place now.');
          this.game.queueDialogue(this.game.accompliceName, 'Run to the alley! I will swing the car around!');
          this.game.setObjective('Sprint to the alley getaway point down the street.');
        }
        break;
      case 'escape':
        if (player.x >= this.game.escapeZone.x) {
          this.triggerPolice();
        }
        break;
      case 'captured':
        break;
      default:
        break;
    }
  }

  setWantedLevel(level) {
    if (level === this.wantedLevel) {
      if (this.wantedLevel === 0) {
        const stars = '☆☆☆☆☆';
        this.game.setStatusBase(`Wanted Level: 0 stars ${stars}`);
      }
      return;
    }
    this.wantedLevel = level;
    const stars = '★'.repeat(level) + '☆'.repeat(Math.max(0, 5 - level));
    const label = level === 1 ? 'star' : 'stars';
    this.game.setStatusBase(`Wanted Level: ${level} ${label} ${stars}`);
  }

  triggerPolice() {
    if (this.policeArrived) return;
    this.policeArrived = true;
    this.step = 'captured';
    this.setWantedLevel(3);
    this.game.setObjective('Comply with the arrest. There is no escape this time.');
    this.game.inputEnabled = false;
    this.game.player.vx = 0;
    this.game.player.vy = 0;
    this.game.police.active = true;
    this.game.queueDialogue('Officer', 'Freeze! LSPD! Drop the cash and get on the ground!');
    this.game.queueDialogue(this.game.alias, "We're boxed in! There's nowhere to run!");
    this.game.queueDialogue(this.game.accompliceName, "I can't get pinched. I'm out! Sorry!");
    this.game.queueDialogue('Officer', 'Hands behind your back! You are under arrest.');
    this.game.accompliceFleeing = true;
    this.game.onDialogueEmpty = () => this.game.endTutorial();
  }
}

function randomAccompliceName() {
  const names = ['Riley', 'Jordan', 'Blaze', 'Sable', 'Nova', 'Reese', 'Axel', 'Morgan', 'Harper', 'Skye', 'Rowan'];
  return names[Math.floor(Math.random() * names.length)];
}

function randomOutfitPalette() {
  const palettes = [
    { jacket: '#24455c', pants: '#1f2733', accent: '#ff9f43' },
    { jacket: '#3b2f4d', pants: '#1b1629', accent: '#f25f5c' },
    { jacket: '#2d4739', pants: '#1b2d22', accent: '#ffce73' },
    { jacket: '#44353c', pants: '#2b1b1e', accent: '#ef476f' }
  ];
  return palettes[Math.floor(Math.random() * palettes.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mod(n, m) {
  return ((n % m) + m) % m;
}
