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
const randomAliasButton = document.getElementById('randomAlias');
const randomizeLookButton = document.getElementById('randomizeLook');

const aliasInput = document.getElementById('aliasInput');
const jacketColorInput = document.getElementById('jacketColor');
const pantsColorInput = document.getElementById('pantsColor');
const accentColorInput = document.getElementById('accentColor');
const gloveColorInput = document.getElementById('gloveColor');
const shoeColorInput = document.getElementById('shoeColor');
const maskStyleSelect = document.getElementById('maskStyle');
const attitudeSelect = document.getElementById('attitude');

const preview = document.getElementById('characterPreview');
const previewHead = preview.querySelector('.head');
const previewMask = preview.querySelector('.mask');
const previewBody = preview.querySelector('.body');
const previewLegs = preview.querySelector('.legs');
const previewAccent = preview.querySelector('.accent');
const previewHands = preview.querySelector('.hands');
const previewShoes = preview.querySelector('.shoes');

const objectiveEl = document.getElementById('objective');
const dialogueEl = document.getElementById('dialogue');
const statusEl = document.getElementById('status');
const heatPanel = document.getElementById('heatPanel');
const heatFill = heatPanel.querySelector('.meter-fill');
const heatNote = heatPanel.querySelector('.meter-note');
const focusPanel = document.getElementById('focusPanel');
const focusFill = focusPanel.querySelector('.meter-fill');
const focusNote = focusPanel.querySelector('.meter-note');
const timelineList = document.getElementById('timelineList');
const intelLog = document.getElementById('intelLog');
const commsLog = document.getElementById('commsLog');
const endOverlay = document.getElementById('endOverlay');
const endSummary = document.getElementById('endSummary');
const minigameOverlayEl = document.getElementById('minigameOverlay');
const minigameAbortButton = document.getElementById('minigameAbort');
const audioToggle = document.getElementById('audioToggle');
const sessionClock = document.getElementById('sessionClock');

if (sessionClock) {
  sessionClock.textContent = '--:--';
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let currentGame = null;

startButton.addEventListener('click', () => {
  showScreen('customization');
});

backToMenuButton.addEventListener('click', () => {
  showScreen('menu');
  if (sessionClock) {
    sessionClock.textContent = '--:--';
    sessionClock.classList.remove('active');
  }
});

restartButton.addEventListener('click', () => {
  if (currentGame) {
    currentGame.destroy();
    currentGame = null;
  }
  endOverlay.classList.add('hidden');
  showScreen('menu');
  if (sessionClock) {
    sessionClock.textContent = '--:--';
    sessionClock.classList.remove('active');
  }
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
  const gloves = gloveColorInput.value;
  const shoes = shoeColorInput.value;
  const maskStyle = maskStyleSelect.value;

  previewBody.style.background = jacket;
  previewLegs.style.background = pants;
  previewAccent.style.background = accent;
  previewHands.style.background = gloves;
  previewShoes.style.background = shoes;
  previewMask.style.background = maskStyle === 'none' ? 'transparent' : accent;
  previewHead.style.background = maskStyle === 'full' ? '#111821' : '#d1a87c';

  preview.classList.remove('mask-none', 'mask-bandana', 'mask-full');
  preview.classList.add(`mask-${maskStyle}`);
}

[jacketColorInput, pantsColorInput, accentColorInput, gloveColorInput, shoeColorInput, maskStyleSelect].forEach((input) => {
  input.addEventListener('input', updatePreview);
});

updatePreview();

randomAliasButton.addEventListener('click', () => {
  aliasInput.value = generateAlias();
});

randomizeLookButton.addEventListener('click', () => {
  const palette = randomPlayerPalette();
  jacketColorInput.value = palette.jacket;
  pantsColorInput.value = palette.pants;
  accentColorInput.value = palette.accent;
  gloveColorInput.value = palette.gloves;
  shoeColorInput.value = palette.shoes;
  const styles = ['none', 'bandana', 'full'];
  maskStyleSelect.value = styles[Math.floor(Math.random() * styles.length)];
  if (!aliasInput.value.trim()) {
    aliasInput.value = generateAlias();
  }
  updatePreview();
});

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
      accent: accentColorInput.value,
      gloves: gloveColorInput.value,
      shoes: shoeColorInput.value
    },
    maskStyle: maskStyleSelect.value,
    attitude: attitudeSelect.value
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

const CRYPTO_KEYS = ['KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyV', 'KeyB', 'Digit1', 'Digit2', 'Digit3', 'Digit4'];

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

class AudioManager {
  constructor(toggleButton) {
    this.toggleButton = toggleButton;
    this.context = null;
    this.masterGain = null;
    this.ambientOsc = null;
    this.filter = null;
    this.textureGain = null;
    this.enabled = false;
    this.updateButton();
  }

  async toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      await this.enable();
    }
  }

  async enable() {
    if (!this.context) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) {
        this.updateButton('unsupported');
        return;
      }
      this.context = new Ctx();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.2;
      this.masterGain.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    this.startAmbient();
    this.enabled = true;
    this.updateButton();
  }

  disable() {
    this.stopAmbient();
    this.enabled = false;
    this.updateButton();
  }

  updateButton(state) {
    if (!this.toggleButton) return;
    if (state === 'unsupported') {
      this.toggleButton.textContent = '🔇 Audio N/A';
      this.toggleButton.disabled = true;
      return;
    }
    this.toggleButton.textContent = this.enabled ? '🔊 Audio On' : '🔇 Audio Off';
  }

  startAmbient() {
    if (!this.context || this.ambientOsc) return;
    this.ambientOsc = this.context.createOscillator();
    this.ambientOsc.type = 'sawtooth';
    this.ambientOsc.frequency.value = 110;

    this.filter = this.context.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 220;

    this.textureGain = this.context.createGain();
    this.textureGain.gain.value = 0.16;

    this.ambientOsc.connect(this.filter);
    this.filter.connect(this.textureGain);
    this.textureGain.connect(this.masterGain);

    this.ambientOsc.start();
  }

  stopAmbient() {
    if (this.ambientOsc) {
      try {
        this.ambientOsc.stop();
      } catch (err) {
        // oscillator may already be stopped
      }
      this.ambientOsc.disconnect();
      this.ambientOsc = null;
    }
    if (this.filter) {
      this.filter.disconnect();
      this.filter = null;
    }
    if (this.textureGain) {
      this.textureGain.disconnect();
      this.textureGain = null;
    }
  }

  updateMix(heatValue, focusValue, captured = false) {
    if (!this.context || !this.enabled) return;
    const normalizedHeat = clamp(heatValue / 100, 0, 1);
    const normalizedFocus = clamp(focusValue / 100, 0, 1);
    if (this.filter) {
      const targetFrequency = 220 + normalizedHeat * 1100;
      this.filter.frequency.linearRampToValueAtTime(targetFrequency, this.context.currentTime + 0.3);
    }
    if (this.textureGain) {
      const base = captured ? 0.05 : 0.16;
      const targetGain = clamp(base + normalizedHeat * 0.28 - (1 - normalizedFocus) * 0.12, 0.03, 0.6);
      this.textureGain.gain.cancelScheduledValues(this.context.currentTime);
      this.textureGain.gain.linearRampToValueAtTime(targetGain, this.context.currentTime + 0.35);
    }
  }

  pulse(type = 'dialogue') {
    if (!this.context || !this.enabled) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'triangle';
    const freq = type === 'alert' ? 560 : type === 'success' ? 880 : 640;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, this.context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.context.currentTime + 0.4);
  }

  idle() {
    if (!this.context || !this.enabled || !this.textureGain) return;
    this.textureGain.gain.cancelScheduledValues(this.context.currentTime);
    this.textureGain.gain.linearRampToValueAtTime(0.04, this.context.currentTime + 0.5);
  }
}

const audioManager = new AudioManager(audioToggle);

if (audioToggle) {
  audioToggle.addEventListener('click', () => {
    audioManager.toggle();
  });
}

class DisorderlyConductGame {
  constructor(canvas, context, profile) {
    this.canvas = canvas;
    this.ctx = context;
    this.profile = profile;
    this.alias = profile.alias || 'You';
    this.attitude = profile.attitude || 'professional';
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

    this.obstacles = [
      { x: 1120, width: 72, height: 42, type: 'barricade', active: false, triggered: false },
      { x: 1280, width: 88, height: 36, type: 'spikes', active: false, triggered: false }
    ];

    const interiorFloor = this.groundY - 26;
    this.store = {
      building: { x: 520, width: 260, height: 220 },
      doorZone: { x: 610, width: 72 },
      interior: {
        floorY: interiorFloor,
        backWallTop: interiorFloor - 118,
        widthInset: 22,
        doorwayDepth: 28
      },
      registerZone: {
        x: 720,
        width: 70,
        glowWidth: 78,
        glowHeight: 56,
        glowOffsetY: 104
      },
      counter: { x: 640, width: 190, height: 38, base: interiorFloor - 2 },
      panelZone: { x: 660, width: 42, height: 118, top: interiorFloor - 132 }
    };
    this.store.interiorOpen = false;

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
      x: this.store.registerZone.x + this.store.registerZone.width / 2,
      y: this.store.interior.floorY,
      width: 30,
      height: 70,
      inside: false
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

    this.heat = {
      value: 5,
      target: 5,
      reason: 'Neighborhood calm'
    };

    this.focus = { value: 82, target: 82, reason: 'Steady hands' };
    focusFill.style.width = '82%';
    focusNote.textContent = 'Steady • Study the block';

    this.intelEntries = [];
    this.timelineEntries = [];
    this.commsEntries = [];
    this.elapsedTime = 0;
    this.displayedSeconds = -1;
    this.clearIntel();
    this.clearComms();
    this.resetTimeline([]);

    this.backgroundPhase = Math.random() * Math.PI * 2;

    this.minigame = new MinigameOverlay(minigameOverlayEl, minigameAbortButton);
    this.minigame.onConsume = () => {
      this.inputEnabled = false;
    };
    this.minigame.onRelease = () => {
      this.inputEnabled = true;
    };

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
    this.clearIntel();
    this.clearComms();
    this.resetTimeline([]);
    this.elapsedTime = 0;
    this.displayedSeconds = -1;
    this.focus.value = 84;
    this.focus.target = 84;
    this.focus.reason = 'Calm breathing';
    this.updateFocus(0);
    this.updateClock();
    if (sessionClock) {
      sessionClock.textContent = '00:00';
      sessionClock.classList.add('active');
    }
    this.setHeat(5, 'Neighborhood calm');
    this.resetObstacles();
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
    this.minigame.close();
    audioManager.idle();
    if (sessionClock) {
      sessionClock.classList.remove('active');
    }
    this.displayedSeconds = -1;
  }

  handleKeyDown(code) {
    if (this.minigame.active && this.minigame.handleKeyDown(code)) {
      return;
    }
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
    if (this.minigame.active && this.minigame.handleKeyUp(code)) {
      return;
    }
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

    if (!this.ended) {
      this.elapsedTime += delta;
      this.updateClock(delta);
    }

    this.minigame.update(delta);
    this.updateDialogue(delta);
    this.tutorial.update(delta);
    this.updateAccomplice(delta);
    this.updatePolice(delta);
    this.updateHeat(delta);
    this.updateFocus(delta);
    audioManager.updateMix(this.heat.value, this.focus.value, this.tutorial.step === 'captured');
    this.backgroundPhase += delta * 0.25;

    if (this.tutorial.step === 'escape') {
      const distance = Math.max(0, this.escapeZone.x - this.player.x);
      const meters = Math.max(0, Math.round(distance / 10));
      this.setStatusDetail(`Distance to alley: ${meters} m`);
    } else if (this.tutorial.step === 'captured') {
      this.setStatusDetail('Pinned down by responding officers.');
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

    this.handleObstacleInteractions();

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
    audioManager.pulse('dialogue');
    this.appendComm(speakerName, text);
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

  setHeat(target, note) {
    this.heat.target = clamp(target, 0, 100);
    if (note) {
      this.heat.reason = note;
    }
  }

  updateHeat(delta) {
    const diff = this.heat.target - this.heat.value;
    if (Math.abs(diff) > 0.1) {
      this.heat.value += diff * Math.min(1, delta * 3.5);
    } else {
      this.heat.value = this.heat.target;
    }
    const clamped = clamp(this.heat.value, 0, 100);
    heatFill.style.width = `${clamped}%`;
    const descriptor = clamped < 20
      ? 'Ghosted'
      : clamped < 40
        ? 'Chill'
        : clamped < 60
          ? 'Noticed'
          : clamped < 80
            ? 'Hot'
            : 'Blazing';
    heatNote.textContent = `${descriptor} • ${this.heat.reason}`;
  }

  setFocus(target, note) {
    this.focus.target = clamp(target, 0, 100);
    if (note) {
      this.focus.reason = note;
    }
  }

  adjustFocus(delta, note) {
    this.setFocus(this.focus.target + delta, note);
  }

  updateFocus(delta) {
    const diff = this.focus.target - this.focus.value;
    if (Math.abs(diff) > 0.1) {
      this.focus.value += diff * Math.min(1, delta * 3.2);
    } else {
      this.focus.value = this.focus.target;
    }

    if (!this.ended && this.heat.value > 70) {
      const stressDrain = (this.heat.value - 70) * delta * 0.35;
      this.focus.value = clamp(this.focus.value - stressDrain, 0, 100);
    }

    const clamped = clamp(this.focus.value, 0, 100);
    focusFill.style.width = `${clamped}%`;
    const descriptor = clamped >= 82
      ? 'Zen'
      : clamped >= 64
        ? 'Collected'
        : clamped >= 46
          ? 'Wary'
          : clamped >= 24
            ? 'Shaken'
            : 'Fractured';
    focusNote.textContent = `${descriptor} • ${this.focus.reason}`;
  }

  clearIntel() {
    this.intelEntries = [];
    if (intelLog) {
      intelLog.innerHTML = '';
    }
  }

  appendIntel(entry) {
    this.intelEntries.push(entry);
    while (this.intelEntries.length > 6) {
      this.intelEntries.shift();
    }
    if (intelLog) {
      intelLog.innerHTML = this.intelEntries
        .map((line) => `<div class="intel-entry">› ${line}</div>`)
        .join('');
      intelLog.scrollTop = intelLog.scrollHeight;
    }
  }

  clearComms() {
    this.commsEntries = [];
    if (commsLog) {
      commsLog.innerHTML = '';
    }
  }

  appendComm(speaker, message) {
    if (!commsLog) return;
    this.commsEntries.push({ speaker, message });
    while (this.commsEntries.length > 7) {
      this.commsEntries.shift();
    }
    commsLog.innerHTML = this.commsEntries
      .map((entry) => `<div class="comm-entry"><span class="speaker">${entry.speaker}:</span><span class="content">${entry.message}</span></div>`)
      .join('');
    commsLog.scrollTop = commsLog.scrollHeight;
  }

  resetTimeline(steps) {
    this.timelineEntries = [];
    if (!timelineList) return;
    timelineList.innerHTML = '';
    steps.forEach((step) => {
      const item = document.createElement('li');
      item.className = 'timeline-step';
      item.dataset.step = step.id;
      item.textContent = step.label;
      timelineList.appendChild(item);
      this.timelineEntries.push({ id: step.id, label: step.label, element: item, status: 'pending' });
    });
  }

  setTimelineStatus(id, status) {
    const entry = this.timelineEntries.find((item) => item.id === id);
    if (!entry) return;
    entry.status = status;
    entry.element.classList.remove('active', 'done', 'alert', 'pulse');
    if (status) {
      entry.element.classList.add(status);
    }
  }

  pulseTimeline(id) {
    const entry = this.timelineEntries.find((item) => item.id === id);
    if (!entry) return;
    entry.element.classList.remove('pulse');
    void entry.element.offsetWidth;
    entry.element.classList.add('pulse');
  }

  updateClock() {
    if (!sessionClock) return;
    const totalSeconds = Math.floor(this.elapsedTime);
    if (totalSeconds === this.displayedSeconds) {
      return;
    }
    this.displayedSeconds = totalSeconds;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    sessionClock.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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

  handleObstacleInteractions() {
    const player = this.player;
    const half = player.width / 2;
    const playerLeft = player.x - half;
    const playerRight = player.x + half;
    const playerTop = player.y - player.height;
    const playerBottom = player.y;

    this.obstacles.forEach((obstacle) => {
      if (!obstacle.active) return;
      const left = obstacle.x - obstacle.width / 2;
      const right = obstacle.x + obstacle.width / 2;
      const top = this.groundY - obstacle.height;
      const bottom = this.groundY;

      const overlapX = playerRight > left && playerLeft < right;
      const overlapY = playerBottom > top && playerTop < bottom;

      if (overlapX && overlapY) {
        if (playerBottom >= top && player.vy >= 0) {
          player.y = top;
          player.vy = 0;
          player.onGround = true;
        }
        if (player.x < obstacle.x) {
          player.x = left - half - 2;
        } else {
          player.x = right + half + 2;
        }
        this.hitObstacle(obstacle);
      }
    });
  }

  updatePolice(delta) {
    if (this.police.active) {
      this.police.lightPhase += delta * 6;
    }
  }

  activateObstacles() {
    this.obstacles.forEach((obstacle) => {
      obstacle.active = true;
    });
  }

  resetObstacles() {
    this.obstacles.forEach((obstacle) => {
      obstacle.active = false;
      obstacle.triggered = false;
    });
  }

  hitObstacle(obstacle) {
    if (obstacle.triggered) return;
    obstacle.triggered = true;
    this.appendIntel('Noise erupts as debris scatters across the alley.');
    this.setHeat(this.heat.target + 8, 'Crash echoes through the block');
    this.queueDialogue('Dispatcher', 'Unit reported a loud bang near QuickFix Mart. Patrol rerouting!');
    this.adjustFocus(-10, 'Collision rattles your stance');
    this.pulseTimeline('escape');
    audioManager.pulse('alert');
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
    this.drawStoreBackdrop();
    if (this.tutorial.step === 'escape' || this.tutorial.step === 'captured') {
      this.drawEscapeMarker();
    }
    this.drawObstacles();
    if (this.police.active) {
      this.drawPolice();
    }
    this.drawAccomplice();
    this.drawClerk();
    this.drawStoreForeground();
    this.drawPlayer();
    this.ctx.restore();
  }

  drawBackground(cameraX) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    const phase = this.backgroundPhase;
    gradient.addColorStop(0, '#090c14');
    gradient.addColorStop(0.45, '#132132');
    gradient.addColorStop(1, '#05070c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const starCount = 60;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < starCount; i++) {
      const twinkle = 0.6 + 0.4 * Math.sin(phase * 2 + i);
      const x = ((i * 137) % this.canvas.width);
      const y = ((i * 83) % (this.canvas.height / 2));
      ctx.globalAlpha = twinkle;
      ctx.fillRect(x, y + 30, 2, 2);
    }
    ctx.globalAlpha = 1;

    const skylineOffset = (cameraX * 0.35 + phase * 30) % 240;
    ctx.fillStyle = '#142438';
    for (let i = -1; i < 12; i++) {
      const x = i * 220 - skylineOffset;
      const width = 160;
      const height = 180 + mod(i * 37, 80);
      ctx.fillRect(x, this.canvas.height - height - 200, width, height);
    }

    const midOffset = (cameraX * 0.6 + phase * 60) % 180;
    ctx.fillStyle = '#1b2f46';
    for (let i = -1; i < 12; i++) {
      const x = i * 180 - midOffset;
      const width = 120;
      const height = 120 + mod(i * 51, 60);
      ctx.fillRect(x, this.canvas.height - height - 120, width, height);
    }

    ctx.fillStyle = 'rgba(58, 82, 114, 0.45)';
    const hazeOffset = (cameraX * 0.25 + phase * 40) % 320;
    for (let i = -1; i < 10; i++) {
      const x = i * 320 - hazeOffset;
      ctx.beginPath();
      ctx.ellipse(x + 160, this.canvas.height - 220, 220, 40, 0, 0, Math.PI * 2);
      ctx.fill();
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

  drawStoreBackdrop() {
    const ctx = this.ctx;
    const building = this.store.building;
    const storeTop = this.groundY - building.height;
    const recessX = building.x + 14;
    const recessY = storeTop + 60;
    const recessW = building.width - 28;
    const recessH = building.height - 74;
    const interior = this.store.interior;
    const interiorOpen = this.store.interiorOpen || ['breach', 'intimidate', 'register', 'escape', 'captured'].includes(this.tutorial.step);

    ctx.fillStyle = '#2f3c4e';
    ctx.fillRect(building.x, storeTop, building.width, building.height);
    ctx.fillStyle = '#212b38';
    ctx.fillRect(recessX, recessY, recessW, recessH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(recessX, recessY, recessW, recessH);
    ctx.clip();

    if (interiorOpen) {
      const interiorGradient = ctx.createLinearGradient(0, interior.backWallTop, 0, interior.floorY + 24);
      interiorGradient.addColorStop(0, '#111b27');
      interiorGradient.addColorStop(0.55, '#152a3d');
      interiorGradient.addColorStop(1, '#080f16');
      ctx.fillStyle = interiorGradient;
      ctx.fillRect(recessX, interior.backWallTop, recessW, interior.floorY - interior.backWallTop + 24);

      ctx.fillStyle = 'rgba(58, 88, 130, 0.32)';
      ctx.fillRect(recessX + 18, interior.backWallTop + 26, recessW - 36, 8);
      ctx.fillRect(recessX + 18, interior.backWallTop + 64, recessW - 36, 8);

      const floorGradient = ctx.createLinearGradient(0, interior.floorY - 16, 0, interior.floorY + 24);
      floorGradient.addColorStop(0, '#1a2b3c');
      floorGradient.addColorStop(1, '#080d15');
      ctx.fillStyle = floorGradient;
      ctx.fillRect(recessX, interior.floorY - 16, recessW, 40);

      ctx.fillStyle = 'rgba(74, 192, 255, 0.12)';
      ctx.fillRect(this.store.doorZone.x - 10, interior.floorY - interior.doorwayDepth, this.store.doorZone.width + 20, interior.doorwayDepth + 12);

      const panel = this.store.panelZone;
      ctx.fillStyle = '#162534';
      ctx.fillRect(panel.x, panel.top, panel.width, panel.height);
      ctx.fillStyle = '#20354b';
      ctx.fillRect(panel.x + 4, panel.top + 6, panel.width - 8, panel.height - 12);
      ctx.strokeStyle = 'rgba(74, 192, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(panel.x + 3, panel.top + 4, panel.width - 6, panel.height - 8);

      if (['surveillance', 'surveillanceHack'].includes(this.tutorial.step)) {
        ctx.strokeStyle = 'rgba(74, 192, 255, 0.85)';
        ctx.lineWidth = 3;
        ctx.strokeRect(panel.x + 2, panel.top + 2, panel.width - 4, panel.height - 4);
        ctx.fillStyle = 'rgba(74, 192, 255, 0.22)';
        ctx.fillRect(panel.x + 2, panel.top + 2, panel.width - 4, panel.height - 4);
        ctx.fillStyle = '#a9f3ff';
        ctx.font = '11px "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillText('CCTV', panel.x + panel.width / 2, panel.top + 22);
        ctx.textAlign = 'start';
      }

      const counter = this.store.counter;
      const counterTop = counter.base - counter.height;
      ctx.fillStyle = '#223347';
      ctx.fillRect(counter.x, counterTop + 6, counter.width, counter.height - 10);

      const nodeX = this.store.registerZone.x - 44;
      const nodeY = counterTop - 50;
      ctx.fillStyle = '#162635';
      ctx.fillRect(nodeX, nodeY, 108, 60);
      ctx.fillStyle = '#0f1924';
      ctx.fillRect(nodeX + 4, nodeY + 8, 100, 42);
      ctx.fillStyle = '#132c3b';
      ctx.fillRect(nodeX + 8, nodeY + 12, 92, 28);
    } else {
      const glassGradient = ctx.createLinearGradient(0, recessY, 0, recessY + recessH);
      glassGradient.addColorStop(0, 'rgba(23, 36, 52, 0.92)');
      glassGradient.addColorStop(1, 'rgba(9, 15, 24, 0.88)');
      ctx.fillStyle = glassGradient;
      ctx.fillRect(recessX, recessY, recessW, recessH);

      ctx.fillStyle = 'rgba(64, 86, 116, 0.32)';
      ctx.fillRect(recessX + 26, recessY + 40, recessW - 52, 6);
      ctx.fillRect(recessX + 26, recessY + 84, recessW - 52, 6);
    }

    ctx.restore();

    ctx.fillStyle = '#1b2534';
    ctx.fillRect(building.x + 6, storeTop + 54, building.width - 12, 6);
  }

  drawStoreForeground() {
    const ctx = this.ctx;
    const building = this.store.building;
    const storeTop = this.groundY - building.height;
    const interior = this.store.interior;
    const interiorOpen = this.store.interiorOpen || ['breach', 'intimidate', 'register', 'escape', 'captured'].includes(this.tutorial.step);
    const doorX = this.store.doorZone.x;
    const doorWidth = this.store.doorZone.width;
    const doorTop = storeTop + 72;
    const doorBottom = interior.floorY + 8;

    ctx.fillStyle = '#1a2534';
    ctx.fillRect(doorX - 6, storeTop + 64, 6, doorBottom - storeTop - 64);
    ctx.fillRect(doorX + doorWidth, storeTop + 64, 6, doorBottom - storeTop - 64);

    if (!interiorOpen) {
      const glassGrad = ctx.createLinearGradient(0, doorTop, 0, doorBottom);
      glassGrad.addColorStop(0, 'rgba(26, 50, 78, 0.9)');
      glassGrad.addColorStop(1, 'rgba(9, 18, 28, 0.96)');
      ctx.fillStyle = glassGrad;
      ctx.fillRect(doorX + 4, doorTop, doorWidth - 8, doorBottom - doorTop);
      ctx.fillStyle = 'rgba(90, 160, 255, 0.12)';
      ctx.fillRect(doorX + 4, doorTop + 14, doorWidth - 8, 18);
    } else {
      ctx.fillStyle = '#0f1824';
      ctx.fillRect(doorX + 4, interior.floorY - 6, doorWidth - 8, 12);
      ctx.fillStyle = 'rgba(74, 192, 255, 0.14)';
      ctx.fillRect(doorX + 8, interior.floorY - 24, doorWidth - 16, 14);
    }

    if (['door', 'lockpick', 'breach'].includes(this.tutorial.step)) {
      ctx.fillStyle = 'rgba(74, 192, 255, 0.35)';
      ctx.fillRect(doorX - 6, doorTop - 10, doorWidth + 12, doorBottom - doorTop + 20);
    }

    const counter = this.store.counter;
    const counterTop = counter.base - counter.height;
    ctx.fillStyle = '#3d5063';
    ctx.fillRect(counter.x, counterTop, counter.width, counter.height);
    ctx.fillStyle = '#52657a';
    ctx.fillRect(counter.x, counterTop, counter.width, 10);
    ctx.fillStyle = 'rgba(15, 22, 31, 0.65)';
    ctx.fillRect(counter.x, counterTop + 10, counter.width, counter.height - 10);

    const nodeX = this.store.registerZone.x - 44;
    const nodeY = counterTop - 48;
    ctx.fillStyle = '#1d3342';
    ctx.fillRect(nodeX, nodeY, 108, 50);
    ctx.fillStyle = '#10212f';
    ctx.fillRect(nodeX + 4, nodeY + 6, 100, 34);
    ctx.fillStyle = '#33ffd0';
    ctx.globalAlpha = 0.18;
    ctx.fillRect(nodeX + 4, nodeY + 6, 100, 34);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#33ffd0';
    ctx.font = 'bold 12px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.fillText('BC2 NODE', this.store.registerZone.x + 10, nodeY + 27);
    ctx.textAlign = 'start';

    if (this.tutorial.step === 'register') {
      const glowTop = interior.floorY - this.store.registerZone.glowOffsetY;
      const glowLeft = this.store.registerZone.x - (this.store.registerZone.glowWidth - this.store.registerZone.width) / 2;
      ctx.fillStyle = 'rgba(51, 255, 208, 0.62)';
      ctx.fillRect(glowLeft, glowTop, this.store.registerZone.glowWidth, this.store.registerZone.glowHeight);
    }

    ctx.strokeStyle = '#4ac0ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(doorX + 4, doorTop, doorWidth - 8, doorBottom - doorTop);

    ctx.fillStyle = '#eac75f';
    ctx.font = '24px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.fillText('QuickFix Mart', building.x + building.width / 2, storeTop + 40);
    ctx.textAlign = 'start';
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

  drawObstacles() {
    const ctx = this.ctx;
    this.obstacles.forEach((obstacle) => {
      if (!obstacle.active) return;
      ctx.save();
      ctx.translate(obstacle.x, this.groundY);
      ctx.fillStyle = obstacle.type === 'spikes' ? '#d94f4f' : '#3a4a5f';
      const height = obstacle.height;
      const width = obstacle.width;
      ctx.fillRect(-width / 2, -height, width, height);
      if (obstacle.type === 'barricade') {
        ctx.fillStyle = 'rgba(255, 194, 71, 0.8)';
        ctx.fillRect(-width / 2, -height / 2, width, 8);
      } else if (obstacle.type === 'spikes') {
        ctx.fillStyle = '#fbfaf5';
        for (let i = -width / 2; i < width / 2; i += 10) {
          ctx.beginPath();
          ctx.moveTo(i, -height);
          ctx.lineTo(i + 5, -height - 14);
          ctx.lineTo(i + 10, -height);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    });
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

    // gloves / sleeves
    ctx.fillStyle = colors.gloves;
    ctx.fillRect(-p.width / 2 - 10, -legHeight - bodyHeight + 10, p.width + 20, 12);

    // shoes
    ctx.fillStyle = colors.shoes;
    ctx.fillRect(-p.width / 2 + 6, -4, p.width - 12, 12);

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

    ctx.fillStyle = a.colors.gloves || '#cbd4e0';
    ctx.fillRect(-a.width / 2 - 8, -legHeight - bodyHeight + 8, a.width + 16, 10);

    ctx.fillStyle = a.colors.shoes || '#111821';
    ctx.fillRect(-a.width / 2 + 4, -4, a.width - 8, 10);

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
    const floorY = this.store.interior.floorY;
    const engagedSteps = ['breach', 'intimidate', 'register', 'escape', 'captured'];
    const stageInside = engagedSteps.includes(this.tutorial.step);
    const interiorOpen = this.store.interiorOpen;
    const alpha = stageInside ? 1 : interiorOpen ? 0.6 : 0.32;
    const legHeight = 28;
    const bodyHeight = 32;
    const headRadius = 14;

    ctx.save();
    ctx.translate(c.x, floorY);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3d5570';
    ctx.fillRect(-12, -legHeight, 24, legHeight);
    ctx.fillStyle = '#6993c5';
    ctx.fillRect(-14, -legHeight - bodyHeight, 28, bodyHeight);
    ctx.fillStyle = '#c98a5f';
    ctx.beginPath();
    ctx.arc(0, -legHeight - bodyHeight - headRadius, headRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f1924';
    ctx.fillRect(-headRadius, -legHeight - bodyHeight - headRadius - 2, headRadius * 2, 6);

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
    this.setTimelineStatus('captured', 'done');
    this.pulseTimeline('captured');
    audioManager.pulse('alert');
    endSummary.textContent = `${this.alias} was captured outside the alley while ${this.accompliceName} vanished into the night.`;
    endOverlay.classList.remove('hidden');
  }
}

class TutorialController {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.step = 'approach';
    this.robberyTimer = 0;
    this.wantedLevel = 0;
    this.policeArrived = false;
    this.clerkFear = 0.35;
    this.bc2Transfer = 0;
    this.hackFailures = 0;
    this.timeWithoutThreat = 0;
    this.game.store.interiorOpen = false;
    this.game.clerk.inside = false;
    this.game.clerk.y = this.game.store.interior.floorY;
    this.flags = {
      intimidationHint: false,
      walletPrompt: false,
      panicWarn: false,
      lockpickWarn: false,
      obstacleBrief: false,
      surveillanceHint: false,
      watchdogHint: false,
      hackCheer: false
    };
  }

  start() {
    this.reset();
    const { game } = this;
    game.resetTimeline([
      { id: 'approach', label: 'Rendezvous with driver' },
      { id: 'door', label: 'Signal the breach' },
      { id: 'lockpick', label: 'Bypass the mag-lock' },
      { id: 'surveillance', label: 'Loop the CCTV' },
      { id: 'breach', label: 'Breach the interior' },
      { id: 'intimidate', label: 'Control the clerk' },
      { id: 'register', label: 'Siphon the BC2 node' },
      { id: 'escape', label: 'Reach the alley' },
      { id: 'captured', label: 'Inevitable capture' }
    ]);
    game.setTimelineStatus('approach', 'active');
    game.pulseTimeline('approach');
    game.setObjective(`Head to the QuickFix Mart and meet ${game.accompliceName}.`);
    this.setWantedLevel(0);
    game.setStatusDetail('Move with purpose but keep it subtle.');
    game.appendIntel('Night watch is thin near South Market.');
    const preamble = this.lineForAttitude({
      professional: 'Focus up. We ghost this place in ninety seconds.',
      reckless: 'We kick the hornet nest and still walk out rich.',
      empathetic: 'Nobody gets hurt tonight. Fast and clean.'
    });
    game.queueDialogue('Dispatcher', 'Late-night lull on the scanners. Perfect moment to make a name for yourself.', 3.5);
    game.queueDialogue(game.alias, preamble);
    game.queueDialogue(game.accompliceName, 'Engine is idling two blocks over. Give me the signal when the door is cracked.');
  }

  update(delta) {
    const player = this.game.player;
    switch (this.step) {
      case 'approach':
        if (player.x >= this.game.accomplice.x - 50) {
          this.step = 'door';
          this.game.setTimelineStatus('approach', 'done');
          this.game.setTimelineStatus('door', 'active');
          this.game.pulseTimeline('door');
          this.game.adjustFocus(3, 'Driver trusts your pacing');
          this.game.appendIntel('Accomplice is positioned beside the entrance.');
          this.game.queueDialogue(this.game.accompliceName, 'There you are. Keep it slick and quiet, rookie.');
          this.game.queueDialogue(this.game.alias, this.lineForAttitude({
            professional: "I'll handle the clerk. Keep the engine warm.",
            reckless: "This place is a joke. We blitz them.",
            empathetic: "No one panics if we stay calm."
          }));
          this.game.queueDialogue(this.game.accompliceName, `Signal me at the door when you're ready.`);
          this.game.setObjective(`Signal ${this.game.accompliceName} at the store entrance (press E).`);
          this.game.setStatusDetail('Stand near the door and press E to start the breach.');
        }
        break;
      case 'door':
        if (this.game.isPlayerInZone(this.game.store.doorZone) && this.game.consumeInteract()) {
          this.startLockpick();
        }
        break;
      case 'lockpick':
        break;
      case 'surveillance':
        if (!this.flags.surveillanceHint && this.game.player.x >= this.game.store.panelZone.x - 40) {
          this.flags.surveillanceHint = true;
          this.game.queueDialogue(this.game.accompliceName, 'Glow on the panel inside? Kill the cameras before you rush him!');
        }
        this.game.setStatusDetail('Disable the CCTV junction inside and press E.');
        if (this.game.isPlayerInZone(this.game.store.panelZone) && this.game.consumeInteract()) {
          this.startSurveillanceHack();
        }
        break;
      case 'surveillanceHack':
        break;
      case 'breach':
        if (this.game.isPlayerInZone(this.game.store.doorZone) && this.game.consumeInteract()) {
          this.beginIntimidation();
        }
        break;
      case 'intimidate':
        this.updateIntimidation(delta);
        break;
      case 'register':
        this.updateRegister(delta);
        break;
      case 'escape':
        this.updateEscape(delta);
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

  startLockpick() {
    this.step = 'lockpick';
    this.game.setTimelineStatus('door', 'done');
    this.game.setTimelineStatus('lockpick', 'active');
    this.game.pulseTimeline('lockpick');
    this.game.adjustFocus(-4, 'Lockpick work under pressure');
    this.game.setStatusDetail('Cycle the cheap mag-lock quickly.');
    this.game.appendIntel('Lockpick attempt underway...');
    this.game.queueDialogue(this.game.accompliceName, "Don't fumble this. Cameras are sleeping for another minute.");
    const sequence = generateLockpickSequence(5);
    this.game.minigame.startLockpick({
      title: 'Bypass Security',
      instructions: 'Hit the highlighted keys in order to lift the tumblers.',
      sequence,
      timeLimit: 12,
      allowAbort: false,
      onComplete: () => this.onLockpickSuccess(),
      onFail: (reason) => this.onLockpickFail(reason)
    });
  }

  onLockpickSuccess() {
    this.step = 'surveillance';
    this.setWantedLevel(1);
    this.game.setHeat(32, 'Door bypassed without alarms');
    this.game.appendIntel('Door quietly unlatches. CCTV still sweeps the floor.');
    this.game.setTimelineStatus('lockpick', 'done');
    this.game.setTimelineStatus('surveillance', 'active');
    this.game.pulseTimeline('surveillance');
    this.game.adjustFocus(6, 'Tumblers fall silent in your hands');
    this.game.store.interiorOpen = true;
    this.game.clerk.inside = true;
    audioManager.pulse('success');
    this.game.queueDialogue(this.game.accompliceName, 'Nice work. Loop their cameras so no one clocks your face.');
    this.game.queueDialogue(this.game.alias, this.lineForAttitude({
      professional: 'Sliding to the panel now.',
      reckless: 'CCTV is next on the chopping block.',
      empathetic: 'Killing the feed so nobody panics.'
    }));
    this.game.queueDialogue(this.game.accompliceName, 'Signal me once the feeds are snow. Then rush the clerk.');
    this.game.setObjective('Slip inside and disable the glowing CCTV panel (press E).');
    this.game.setStatusDetail('Press E at the panel to begin the circuit trace.');
  }

  onLockpickFail(reason) {
    this.step = 'door';
    this.game.setHeat(this.game.heat.target + 12, 'Lockpick scrapes draw attention');
    this.game.appendIntel('Metal screeches — a nearby dog barks in response.');
    if (!this.flags.lockpickWarn) {
      this.game.queueDialogue(this.game.accompliceName, 'Careful! You trip that alarm and we\'re toast. Try again.');
      this.flags.lockpickWarn = true;
    }
    this.game.adjustFocus(-8, 'Tumblers slip under pressure');
    this.game.setTimelineStatus('lockpick', 'alert');
    this.game.pulseTimeline('lockpick');
    this.game.store.interiorOpen = false;
    this.game.clerk.inside = false;
    window.setTimeout(() => {
      this.game.setTimelineStatus('lockpick', 'active');
    }, 700);
    this.game.setTimelineStatus('door', 'active');
    audioManager.pulse('alert');
    this.game.setStatusDetail('Steady hands. Try the lock again.');
  }

  startSurveillanceHack() {
    this.step = 'surveillanceHack';
    this.game.adjustFocus(-5, 'Rewiring CCTV circuits under pressure');
    this.game.setTimelineStatus('surveillance', 'active');
    this.game.pulseTimeline('surveillance');
    this.game.setHeat(36, 'CCTV feed still active');
    this.game.appendIntel('CCTV DVR hums dangerously — reroute it fast.');
    this.game.queueDialogue(this.game.accompliceName, 'Loop those cameras or every cruiser will have your face.');
    const sequence = generateCircuitSequence(6);
    this.game.minigame.startCircuitTrace({
      title: 'Loop CCTV Feeds',
      instructions: 'Trace the circuit path using the arrow keys in order.',
      sequence,
      timeLimit: 11,
      allowAbort: true,
      onComplete: () => this.onSurveillanceSuccess(),
      onFail: (reason) => this.onSurveillanceFail(reason)
    });
  }

  onSurveillanceSuccess() {
    this.step = 'breach';
    this.game.setTimelineStatus('surveillance', 'done');
    this.game.setTimelineStatus('breach', 'active');
    this.game.pulseTimeline('breach');
    this.game.store.interiorOpen = true;
    this.game.clerk.inside = true;
    this.game.adjustFocus(9, 'Cameras loop static');
    audioManager.pulse('success');
    this.game.setHeat(30, 'CCTV feeds now looping static');
    this.game.appendIntel('CCTV feeds loop to grainy static — interior eyes are blind.');
    this.game.queueDialogue(this.game.accompliceName, 'Ghosted. Hit the clerk fast before someone wanders by.');
    this.game.queueDialogue(this.game.alias, this.lineForAttitude({
      professional: 'Panel is looped. Breaching now.',
      reckless: 'Feeds are fried. Let’s spook the clerk.',
      empathetic: 'Nobody will see this. Going in calm.'
    }));
    this.game.setObjective('Ease the door open and slip inside (press E).');
    this.game.setStatusDetail('Press E near the door to rush the clerk.');
  }

  onSurveillanceFail(reason) {
    this.step = 'surveillance';
    this.game.adjustFocus(-12, 'Circuit sparks rattle your nerves');
    this.game.setHeat(this.game.heat.target + 10, 'Circuit sparks draw attention');
    this.game.appendIntel('Static arcs from the CCTV housing. Reset and try again.');
    this.game.queueDialogue(this.game.accompliceName, 'Careful! Those sparks will wake the block. Reset and finish it.');
    this.game.setTimelineStatus('surveillance', 'alert');
    this.game.pulseTimeline('surveillance');
    audioManager.pulse('alert');
    window.setTimeout(() => {
      this.game.setTimelineStatus('surveillance', 'active');
    }, 700);
    this.game.setStatusDetail('Regroup, then press E at the panel again.');
  }

  beginIntimidation() {
    this.step = 'intimidate';
    this.robberyTimer = 0;
    this.clerkFear = 0.45;
    this.timeWithoutThreat = 0;
    this.game.clerk.inside = true;
    this.setWantedLevel(1);
    this.game.setHeat(52, 'Clerk startled into compliance');
    this.game.appendIntel('Clerk stumbles back, eyeing the silent alarm.');
    this.game.setTimelineStatus('breach', 'done');
    this.game.setTimelineStatus('intimidate', 'active');
    this.game.pulseTimeline('intimidate');
    this.game.adjustFocus(-6, 'Tension spikes as you draw down');
    this.game.queueDialogue(this.game.alias, this.lineForAttitude({
      professional: 'Nobody move! Empty the register now.',
      reckless: 'Hands up! Blink wrong and this gets messy.',
      empathetic: 'Stay calm and nobody gets hurt. Open the drawer.'
    }));
    this.game.queueDialogue('Clerk', "Please don't hurt me! I'm opening it!");
    this.game.setObjective('Control the clerk (hold E to keep pressure).');
    this.game.setStatusDetail('Hold E to keep the fear high.');
  }

  updateIntimidation(delta) {
    const applyingPressure = this.game.keys.interact;
    if (applyingPressure) {
      this.clerkFear = clamp(this.clerkFear + delta * 0.9, 0, 1);
      this.timeWithoutThreat = 0;
    } else {
      this.clerkFear = clamp(this.clerkFear - delta * 0.45, 0, 1);
      this.timeWithoutThreat += delta;
    }

    const compliance = Math.round(this.clerkFear * 100);
    this.game.setStatusDetail(`Clerk compliance: ${compliance}% (hold E)`);
    this.game.setHeat(48 + this.clerkFear * 22, this.clerkFear > 0.7 ? 'Clerk obeys, for now' : 'Clerk wavering');

    if (!applyingPressure && this.timeWithoutThreat > 1.2 && !this.flags.intimidationHint) {
      this.game.queueDialogue(this.game.accompliceName, 'Keep leaning on them! Hold E so they don\'t hit the button.');
      this.flags.intimidationHint = true;
    }

    if (this.clerkFear < 0.25 && !this.flags.panicWarn) {
      this.flags.panicWarn = true;
      this.game.appendIntel('Clerk fingers the panic alarm under the counter.');
      this.game.setHeat(this.game.heat.target + 12, 'Alarm fingered!');
      this.game.queueDialogue('Clerk', 'I already hit the panic button! You better run!');
    }

    if (this.clerkFear > 0.7) {
      this.robberyTimer = Math.min(4, this.robberyTimer + delta);
    } else {
      this.robberyTimer = Math.max(0, this.robberyTimer - delta * 0.5);
    }

    if (this.robberyTimer >= 4) {
      this.beginRegisterGrab();
    }
  }

  beginRegisterGrab() {
    this.step = 'register';
    this.bc2Transfer = 0;
    this.hackFailures = 0;
    this.setWantedLevel(2);
    this.game.setHeat(70, 'Silent alarm LED flickers cyan');
    this.game.appendIntel('Counter terminal unlocks its BC2 wallet module.');
    this.game.setTimelineStatus('intimidate', 'done');
    this.game.setTimelineStatus('register', 'active');
    this.game.pulseTimeline('register');
    this.game.adjustFocus(6, 'Wallet interface hums online');
    audioManager.pulse('success');
    this.game.queueDialogue('Clerk', 'Please! The BC2 wallet is all digital — just take it and go!');
    this.game.setObjective('Siphon the BC2 wallet from the counter terminal (press E to hack).');
    this.game.setStatusDetail('BC2 siphon: 0% • Press E inside the glow to inject the exploit.');
  }

  updateRegister(delta) {
    const insideTerminal = this.game.isPlayerInZone(this.game.store.registerZone);
    const percent = Math.round(this.bc2Transfer * 100);

    if (this.game.minigame.active && this.game.minigame.type === 'crypto') {
      this.game.setStatusDetail(`BC2 siphon: ${percent}% • Handshake in progress...`);
    } else if (insideTerminal) {
      this.game.setStatusDetail(`BC2 siphon: ${percent}% • Press E to run the next exploit.`);
      if (this.game.consumeInteract()) {
        this.startCryptoHack();
      }
    } else {
      this.game.setStatusDetail('Get behind the counter to reach the BC2 terminal.');
    }

    const heatReason = this.bc2Transfer >= 0.85 ? 'Silent alarm pinging dispatch' : 'Silent alarm LED flickers cyan';
    this.game.setHeat(70 + this.bc2Transfer * 18, heatReason);

    if (this.bc2Transfer >= 1) {
      this.startEscape();
    }
  }

  startCryptoHack() {
    if (this.game.minigame.active) return;
    const sequenceLength = 5 + Math.floor(this.bc2Transfer * 4);
    const sequence = generateCryptoSequence(sequenceLength);
    const timeLimit = clamp(11 - this.bc2Transfer * 3.2, 6.5, 11);
    if (!this.flags.walletPrompt) {
      this.flags.walletPrompt = true;
      this.game.queueDialogue(this.game.alias, this.lineForAttitude({
        professional: 'Injecting exploit. Cover me while I siphon the BC2.',
        reckless: 'Let the BC2 flow. Keep that clerk frozen.',
        empathetic: 'Pulling the BC2 quietly. Stay calm.'
      }));
    }
    this.game.appendIntel('BC2 terminal handshake engaged — spoofing wallet keys.');
    this.game.adjustFocus(-7, 'Injecting malware under pressure');
    this.game.minigame.startCryptoHack({
      title: 'BC2 Wallet Breach',
      instructions: 'Input the flashing handshake keys before the watchdog resets.',
      sequence,
      timeLimit,
      allowAbort: true,
      onComplete: () => this.onCryptoHackSuccess(),
      onFail: (reason) => this.onCryptoHackFail(reason)
    });
  }

  onCryptoHackSuccess() {
    const chunk = clamp(0.45 - this.bc2Transfer * 0.18, 0.22, 0.48);
    this.bc2Transfer = clamp(this.bc2Transfer + chunk, 0, 1);
    const percent = Math.round(this.bc2Transfer * 100);
    this.game.adjustFocus(8, 'Wallet handshake accepts your payload');
    audioManager.pulse('success');
    this.game.appendIntel('BC2 reserves reroute into your burner ledger.');
    if (this.bc2Transfer >= 1) {
      this.game.setStatusDetail('BC2 siphon: 100% • Transfer confirmed. Move!');
    } else {
      this.game.setStatusDetail(`BC2 siphon: ${percent}% • Re-initialize another exploit (press E).`);
      if (!this.flags.hackCheer) {
        this.flags.hackCheer = true;
        this.game.queueDialogue(this.game.accompliceName, 'Nice work. Snag the rest before the sirens arrive.');
      }
    }
    this.game.setHeat(74 + this.bc2Transfer * 18, 'Silent alarm sniffing anomalies');
    if (this.bc2Transfer >= 1) {
      this.startEscape();
    }
  }

  onCryptoHackFail(reason) {
    this.hackFailures += 1;
    this.bc2Transfer = clamp(this.bc2Transfer - 0.1, 0, 1);
    const percent = Math.round(this.bc2Transfer * 100);
    const failureNote = reason === 'abort' ? 'You bail before the watchdog spikes the alarms.' : 'Watchdog flags the breach and reboots.';
    const heatBump = reason === 'timeout' ? 16 : 10;
    const focusPenalty = reason === 'abort' ? -4 : -9;
    this.game.adjustFocus(focusPenalty, 'Wallet watchdog rattles your nerves');
    this.game.setHeat(this.game.heat.target + heatBump, reason === 'abort' ? 'Exploit aborted mid-stream' : 'Wallet watchdog escalates');
    this.game.appendIntel(`BC2 handshake collapses. ${failureNote}`);
    if (!this.flags.watchdogHint) {
      this.flags.watchdogHint = true;
      this.game.queueDialogue(this.game.accompliceName, 'Their watchdog is nasty — stay sharp and run it again.');
    }
    if (reason !== 'abort') {
      this.game.queueDialogue('Clerk', 'Please! Take it and leave already! The cops are coming!');
    }
    this.game.setStatusDetail(`BC2 siphon: ${percent}% • Reset at the terminal and press E.`);
  }

  startEscape() {
    this.step = 'escape';
    this.setWantedLevel(2);
    this.game.activateObstacles();
    this.game.setHeat(82, '911 call logged — patrol en route');
    this.game.appendIntel('Distant sirens crescendo. Time to bolt.');
    this.game.setTimelineStatus('register', 'done');
    this.game.setTimelineStatus('escape', 'active');
    this.game.pulseTimeline('escape');
    this.game.adjustFocus(-8, 'Adrenaline spikes as you dash');
    this.game.queueDialogue(this.game.accompliceName, 'Run to the alley! I will swing the car around!');
    this.game.queueDialogue(this.game.alias, this.lineForAttitude({
      professional: 'BC2 secured. Move!',
      reckless: 'Adrenaline! Let\'s fly!',
      empathetic: 'Ledger\'s copied. Let\'s go before anyone gets hurt.'
    }));
    this.game.setObjective('Sprint to the alley getaway point down the street (jump with Space).');
  }

  updateEscape(delta) {
    if (!this.flags.obstacleBrief && this.game.player.x > 1020) {
      this.flags.obstacleBrief = true;
      this.game.queueDialogue(this.game.accompliceName, 'Road crew left barriers ahead — jump them!');
      this.game.appendIntel('Public works barricades block the straight path. Jump or weave.');
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
    this.game.setHeat(100, 'Cruisers box you in on both sides');
    this.game.appendIntel('Multiple squads converge from both ends of the street.');
    this.game.appendIntel(`${this.game.accompliceName} vanishes into a side street, leaving you alone.`);
    this.game.setTimelineStatus('escape', 'done');
    this.game.setTimelineStatus('captured', 'alert');
    this.game.pulseTimeline('captured');
    this.game.adjustFocus(-18, 'Sirens shred your nerves');
    audioManager.pulse('alert');
    this.game.queueDialogue('Officer', 'Freeze! LSPD! Drop the BC2 deck and get on the ground!');
    this.game.queueDialogue(this.game.alias, this.lineForAttitude({
      professional: "We\'re boxed in! Ledger\'s gone — nowhere to run!",
      reckless: 'Ah, come on! We were so close!',
      empathetic: 'Just breathe... hands where they can see them.'
    }));
    this.game.queueDialogue(this.game.accompliceName, "I can't get pinched. I'm out! Sorry!");
    this.game.queueDialogue('Officer', 'Hands behind your back! You are under arrest.');
    this.game.accompliceFleeing = true;
    this.game.onDialogueEmpty = () => this.game.endTutorial();
  }

  lineForAttitude(options) {
    return options[this.game.attitude] || options.professional || Object.values(options)[0] || '';
  }
}

class MinigameOverlay {
  constructor(element, abortButton) {
    this.element = element;
    this.abortButton = abortButton;
    this.titleEl = element.querySelector('.minigame-title');
    this.instructionsEl = element.querySelector('.minigame-instructions');
    this.bodyEl = element.querySelector('.minigame-body');
    this.timerEl = element.querySelector('.minigame-timer');
    this.active = false;
    this.type = null;
    this.sequence = [];
    this.keyElements = [];
    this.index = 0;
    this.timeLeft = 0;
    this.onComplete = null;
    this.onFail = null;
    this.onConsume = null;
    this.onRelease = null;

    this.abortButton.addEventListener('click', () => {
      if (!this.active) return;
      this.fail('abort');
    });
  }

  startLockpick(config) {
    this.active = true;
    this.type = 'lockpick';
    this.sequence = config.sequence.slice();
    this.index = 0;
    this.timeLeft = config.timeLimit || 10;
    this.onComplete = config.onComplete;
    this.onFail = config.onFail;
    this.element.dataset.type = 'lockpick';
    this.titleEl.textContent = config.title || 'Minigame';
    this.instructionsEl.textContent = config.instructions || '';
    this.prepareSequenceElements();
    this.timerEl.textContent = `Timer: ${this.timeLeft.toFixed(1)}s`;
    this.abortButton.classList.toggle('hidden', !config.allowAbort);
    this.element.classList.remove('hidden');
    if (typeof this.onConsume === 'function') {
      this.onConsume();
    }
  }

  startCircuitTrace(config) {
    this.active = true;
    this.type = 'circuit';
    this.sequence = config.sequence.slice();
    this.index = 0;
    this.timeLeft = config.timeLimit || 9;
    this.onComplete = config.onComplete;
    this.onFail = config.onFail;
    this.element.dataset.type = 'circuit';
    this.titleEl.textContent = config.title || 'Circuit Trace';
    this.instructionsEl.textContent = config.instructions || '';
    this.prepareSequenceElements();
    this.timerEl.textContent = `Timer: ${this.timeLeft.toFixed(1)}s`;
    this.abortButton.classList.toggle('hidden', !config.allowAbort);
    this.element.classList.remove('hidden');
    if (typeof this.onConsume === 'function') {
      this.onConsume();
    }
  }

  startCryptoHack(config) {
    this.active = true;
    this.type = 'crypto';
    this.sequence = config.sequence.slice();
    this.index = 0;
    this.timeLeft = config.timeLimit || 9;
    this.onComplete = config.onComplete;
    this.onFail = config.onFail;
    this.element.dataset.type = 'crypto';
    this.titleEl.textContent = config.title || 'Crypto Hack';
    this.instructionsEl.textContent = config.instructions || '';
    this.prepareSequenceElements();
    this.timerEl.textContent = `Timer: ${this.timeLeft.toFixed(1)}s`;
    this.abortButton.classList.toggle('hidden', !config.allowAbort);
    this.element.classList.remove('hidden');
    if (typeof this.onConsume === 'function') {
      this.onConsume();
    }
  }

  handleKeyDown(code) {
    if (!this.active) return false;
    if (this.type === 'lockpick') {
      if (code === this.sequence[this.index]) {
        this.advanceSequence();
      } else if (!code.startsWith('Shift') && code !== 'Tab') {
        this.fail('wrong');
      }
      return true;
    } else if (this.type === 'circuit') {
      const allowed = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
      if (!allowed.includes(code)) {
        return false;
      }
      if (code === this.sequence[this.index]) {
        this.advanceSequence();
      } else {
        this.flashError(this.keyElements[this.index]);
        this.fail('wrong');
      }
      return true;
    } else if (this.type === 'crypto') {
      const allowed = CRYPTO_KEYS;
      if (!allowed.includes(code)) {
        return false;
      }
      if (code === this.sequence[this.index]) {
        this.advanceSequence();
      } else {
        this.flashError(this.keyElements[this.index]);
        this.fail('wrong');
      }
      return true;
    }
    return false;
  }

  handleKeyUp(code) {
    if (!this.active) return false;
    if (this.type === 'lockpick') {
      return ['ShiftLeft', 'ShiftRight'].includes(code);
    }
    if (this.type === 'circuit') {
      return ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(code);
    }
    if (this.type === 'crypto') {
      return CRYPTO_KEYS.includes(code);
    }
    return false;
  }

  advanceSequence() {
    if (!this.active) return;
    const currentEl = this.keyElements[this.index];
    if (currentEl) {
      currentEl.classList.remove('active');
      currentEl.classList.add('done');
      currentEl.classList.remove('error');
    }
    this.index += 1;
    if (this.index >= this.sequence.length) {
      this.succeed();
      return;
    }
    const nextEl = this.keyElements[this.index];
    if (nextEl) {
      nextEl.classList.add('active');
    }
  }

  update(delta) {
    if (!this.active) return;
    this.timeLeft -= delta;
    if (this.timeLeft <= 0) {
      this.timerEl.textContent = 'Timer: 0.0s';
      this.fail('timeout');
      return;
    }
    this.timerEl.textContent = `Timer: ${this.timeLeft.toFixed(1)}s`;
  }

  succeed() {
    const callback = this.onComplete;
    this.close();
    audioManager.pulse('success');
    if (typeof callback === 'function') {
      callback();
    }
  }

  fail(reason = 'fail') {
    const callback = this.onFail;
    this.close();
    audioManager.pulse('alert');
    if (typeof callback === 'function') {
      callback(reason);
    }
  }

  close() {
    if (!this.active) return;
    this.active = false;
    this.type = null;
    this.sequence = [];
    this.keyElements = [];
    this.index = 0;
    this.bodyEl.innerHTML = '';
    this.element.classList.add('hidden');
    this.timerEl.textContent = 'Timer: --';
    this.abortButton.classList.add('hidden');
    delete this.element.dataset.type;
    if (typeof this.onRelease === 'function') {
      this.onRelease();
    }
  }

  prepareSequenceElements() {
    this.bodyEl.innerHTML = '';
    this.keyElements = this.sequence.map((code, i) => {
      const keyEl = document.createElement('div');
      let classes = 'minigame-key';
      if (i === 0) {
        classes += ' active';
      }
      if (this.type === 'crypto') {
        classes += ' crypto';
      }
      keyEl.className = classes;
      keyEl.dataset.code = code;
      keyEl.textContent = keyLabelForCode(code);
      this.bodyEl.appendChild(keyEl);
      return keyEl;
    });
  }

  flashError(element) {
    if (!element) return;
    element.classList.remove('error');
    void element.offsetWidth;
    element.classList.add('error');
  }
}

function generateLockpickSequence(length) {
  const keys = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyA', 'KeyS', 'KeyD'];
  const sequence = [];
  for (let i = 0; i < length; i++) {
    sequence.push(keys[Math.floor(Math.random() * keys.length)]);
  }
  return sequence;
}

function generateCircuitSequence(length) {
  const keys = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
  const sequence = [];
  let last = null;
  for (let i = 0; i < length; i++) {
    let next = keys[Math.floor(Math.random() * keys.length)];
    if (next === last) {
      next = keys[(keys.indexOf(next) + 1) % keys.length];
    }
    sequence.push(next);
    last = next;
  }
  return sequence;
}

function generateCryptoSequence(length) {
  const keys = CRYPTO_KEYS;
  const sequence = [];
  let last = null;
  for (let i = 0; i < length; i++) {
    let next = keys[Math.floor(Math.random() * keys.length)];
    if (next === last) {
      next = keys[(keys.indexOf(next) + 2) % keys.length];
    }
    sequence.push(next);
    last = next;
  }
  return sequence;
}

function keyLabelForCode(code) {
  const map = {
    KeyQ: 'Q',
    KeyW: 'W',
    KeyE: 'E',
    KeyR: 'R',
    KeyA: 'A',
    KeyS: 'S',
    KeyD: 'D',
    KeyF: 'F',
    KeyG: 'G',
    KeyH: 'H',
    KeyJ: 'J',
    KeyV: 'V',
    KeyB: 'B',
    Digit1: '1',
    Digit2: '2',
    Digit3: '3',
    Digit4: '4',
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓'
  };
  return map[code] || code.replace('Key', '');
}

function randomAccompliceName() {
  const names = ['Riley', 'Jordan', 'Blaze', 'Sable', 'Nova', 'Reese', 'Axel', 'Morgan', 'Harper', 'Skye', 'Rowan'];
  return names[Math.floor(Math.random() * names.length)];
}

function randomOutfitPalette() {
  const palettes = [
    { jacket: '#24455c', pants: '#1f2733', accent: '#ff9f43', gloves: '#d7dbe1', shoes: '#111821' },
    { jacket: '#3b2f4d', pants: '#1b1629', accent: '#f25f5c', gloves: '#e8e0ff', shoes: '#241a2f' },
    { jacket: '#2d4739', pants: '#1b2d22', accent: '#ffce73', gloves: '#c9d2c5', shoes: '#16221a' },
    { jacket: '#44353c', pants: '#2b1b1e', accent: '#ef476f', gloves: '#f2d0df', shoes: '#2b1f2b' }
  ];
  return palettes[Math.floor(Math.random() * palettes.length)];
}

function randomPlayerPalette() {
  const palettes = [
    { jacket: '#1f3a4d', pants: '#121c26', accent: '#ff6b6b', gloves: '#d3dae4', shoes: '#1b1f29' },
    { jacket: '#3a2745', pants: '#1a1024', accent: '#f97316', gloves: '#f0d7ff', shoes: '#24142f' },
    { jacket: '#2a3f2c', pants: '#182319', accent: '#9be564', gloves: '#dbe5cd', shoes: '#0f1412' },
    { jacket: '#2f2a44', pants: '#16152a', accent: '#5ad1ff', gloves: '#d0e8ff', shoes: '#16182f' }
  ];
  return palettes[Math.floor(Math.random() * palettes.length)];
}

function generateAlias() {
  const adjectives = ['Silent', 'Midnight', 'Crimson', 'Neon', 'Shadow', 'Velvet', 'Static', 'Ghost', 'Iron', 'Feral'];
  const nouns = ['Rogue', 'Specter', 'Driver', 'Cipher', 'Echo', 'Viper', 'Tempest', 'Pulse', 'Nomad', 'Wraith'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mod(n, m) {
  return ((n % m) + m) % m;
}
