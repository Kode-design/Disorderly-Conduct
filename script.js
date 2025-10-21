const screens = {
  menu: document.getElementById('menuScreen'),
  customization: document.getElementById('customizationScreen'),
  tutorial: document.getElementById('tutorialScreen'),
};

const buttons = {
  startGame: document.getElementById('startGameBtn'),
  viewCredits: document.getElementById('viewCreditsBtn'),
  randomize: document.getElementById('randomizeBtn'),
};

const collapsible = document.getElementById('creditsPanel');
const customizationForm = document.getElementById('customizationForm');
const characterPreview = document.getElementById('characterPreview');
const previewAlias = document.getElementById('previewAlias');
const previewPronouns = document.getElementById('previewPronouns');
const previewStyle = document.getElementById('previewStyle');
const previewBackstory = document.getElementById('previewBackstory');
const colorPicker = document.getElementById('accentColor');

const objectiveListEl = document.getElementById('objectiveList');
const storyLogEl = document.getElementById('storyLog');
const heatLevelEl = document.getElementById('heatLevel');
const accompliceNameEl = document.getElementById('accompliceName');
const accompliceMoodEl = document.getElementById('accompliceMood');
const hudInstructionEl = document.getElementById('hudInstruction');
const hudActionEl = document.getElementById('hudAction');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const playerStyles = {
  street: { label: 'Street Vanguard', accent: '#ff4f5a' },
  sleek: { label: 'Sleek Minimalist', accent: '#46d1ff' },
  punk: { label: 'Neon Punk', accent: '#ff70ff' },
  retro: { label: 'Retro Hustler', accent: '#ffd166' },
};

const accompliceNames = [
  'Switchback',
  'Moxie Vega',
  'Recoil',
  'Flux Hart',
  'Jinx Verona',
  'Hexline',
  'Vapor Kane',
  'Coda Lyn',
];

const accompliceMoods = ['antsy', 'focused', 'calculating', 'reckless', 'stone-cold', 'impatient'];

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function showScreen(target) {
  Object.values(screens).forEach((screen) => screen.classList.remove('visible'));
  screens[target].classList.add('visible');
}

buttons.startGame.addEventListener('click', () => showScreen('customization'));

buttons.viewCredits.addEventListener('click', () => {
  const isHidden = collapsible.hasAttribute('hidden');
  if (isHidden) {
    collapsible.removeAttribute('hidden');
    buttons.viewCredits.textContent = 'Hide Credits';
  } else {
    collapsible.setAttribute('hidden', '');
    buttons.viewCredits.textContent = 'Credits';
  }
});

const formFields = {
  name: document.getElementById('playerName'),
  pronouns: document.getElementById('playerPronouns'),
  style: document.getElementById('playerStyle'),
  backstory: document.getElementById('backstory'),
};

function updatePreview() {
  const name = formFields.name.value.trim();
  previewAlias.innerHTML = `Alias: ${name ? name : '&mdash;'}`;
  previewPronouns.textContent = `Pronouns: ${formFields.pronouns.value}`;
  previewStyle.textContent = `Style: ${playerStyles[formFields.style.value].label}`;
  previewBackstory.textContent = formFields.backstory.value.trim()
    ? formFields.backstory.value
    : 'Write a backstory to set the tone.';

  const accent = colorPicker.value;
  characterPreview.style.setProperty('--accent-color', accent);
}

Object.values(formFields).forEach((field) => field.addEventListener('input', updatePreview));
colorPicker.addEventListener('input', updatePreview);

buttons.randomize.addEventListener('click', () => {
  const aliasSamples = ['Nova', 'Knox', 'Sable', 'Riot', 'Echo', 'Glitch'];
  formFields.name.value = aliasSamples[randomBetween(0, aliasSamples.length - 1)];
  const pronounOptions = Array.from(formFields.pronouns.options).map((opt) => opt.value);
  formFields.pronouns.value = pronounOptions[randomBetween(0, pronounOptions.length - 1)];
  const styleOptions = Object.keys(playerStyles);
  formFields.style.value = styleOptions[randomBetween(0, styleOptions.length - 1)];
  const sampleBackstories = [
    'Boosted bikes for the Ironside Syndicate until they sold me out.',
    'Raised by street racers. Learned crime and courtesy at 200 mph.',
    'Grew up splicing security cams for kicks. Now the cams watch for me.',
    'Atlas City DJ by day, debt collector by night.',
  ];
  formFields.backstory.value = sampleBackstories[randomBetween(0, sampleBackstories.length - 1)];
  colorPicker.value = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
  updatePreview();
});

const profile = {
  alias: '',
  pronouns: 'they/them',
  style: 'street',
  accentColor: '#ff4f5a',
  backstory: '',
};

let accomplice = {
  name: '',
  mood: 'focused',
};

let objectives = [];

function updateObjectives() {
  objectiveListEl.innerHTML = '';
  objectives.forEach((objective) => {
    const li = document.createElement('li');
    li.textContent = objective.text;
    if (objective.completed) {
      li.classList.add('completed');
    }
    objectiveListEl.appendChild(li);
  });
}

function addStoryLog(message) {
  const entry = document.createElement('p');
  entry.textContent = message;
  storyLogEl.appendChild(entry);
  storyLogEl.scrollTop = storyLogEl.scrollHeight;
}

const game = {
  worldWidth: 3200,
  groundHeight: 440,
  gravity: 0.9,
  player: null,
  platforms: [],
  pickups: [],
  store: { x: 1320, width: 320, height: 220 },
  getawayVan: { x: 2800, width: 180, height: 120 },
  police: [],
  keys: {},
  stage: 'approach',
  running: false,
  holdUp: {
    active: false,
    progress: 0,
    needed: 8,
  },
  captureTimer: 0,
  lastTimestamp: 0,
  cameraX: 0,
};

class Player {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.width = 48;
    this.height = 72;
    this.color = color;
    this.velocity = { x: 0, y: 0 };
    this.onGround = false;
    this.facing = 1;
  }

  update(delta) {
    const acceleration = 0.55;
    const maxSpeed = 6.5;

    if (!game.holdUp.active && !['captured', 'postCapture'].includes(game.stage)) {
      if (game.keys['ArrowLeft'] || game.keys['a']) {
        this.velocity.x = Math.max(this.velocity.x - acceleration, -maxSpeed);
        this.facing = -1;
      } else if (game.keys['ArrowRight'] || game.keys['d']) {
        this.velocity.x = Math.min(this.velocity.x + acceleration, maxSpeed);
        this.facing = 1;
      } else {
        this.velocity.x *= 0.7;
        if (Math.abs(this.velocity.x) < 0.1) this.velocity.x = 0;
      }
    } else {
      this.velocity.x *= 0.75;
    }

    if ((game.keys['ArrowUp'] || game.keys['w'] || game.keys[' ']) && this.onGround && !game.holdUp.active) {
      this.velocity.y = -15;
      this.onGround = false;
    }

    this.velocity.y += game.gravity;

    this.x += this.velocity.x * delta;
    this.y += this.velocity.y * delta;

    if (this.y + this.height >= game.groundHeight) {
      this.y = game.groundHeight - this.height;
      this.velocity.y = 0;
      this.onGround = true;
    }

    // clamp within world
    this.x = Math.max(0, Math.min(game.worldWidth - this.width, this.x));
  }

  draw(context, cameraX) {
    const drawX = this.x - cameraX;
    context.save();
    context.translate(drawX + this.width / 2, this.y + this.height / 2);
    context.scale(this.facing, 1);
    context.translate(-this.width / 2, -this.height / 2);

    context.fillStyle = this.color;
    context.fillRect(6, 0, this.width - 12, this.height - 20);
    context.fillStyle = '#12131c';
    context.fillRect(0, this.height - 20, this.width, 20);
    context.fillStyle = '#ffd3d3';
    context.fillRect(12, 8, this.width - 24, 18);
    context.fillStyle = '#07080f';
    context.fillRect(this.width / 2 - 6, this.height - 20, 12, 20);

    context.restore();
  }
}

class PoliceCar {
  constructor(x) {
    this.x = x;
    this.y = game.groundHeight - 60;
    this.width = 110;
    this.height = 60;
    this.lightsPhase = 0;
  }

  update(delta) {
    this.lightsPhase += delta * 0.1;
  }

  draw(context, cameraX) {
    const drawX = this.x - cameraX;
    context.fillStyle = '#1b274a';
    context.fillRect(drawX, this.y, this.width, this.height);
    context.fillStyle = '#f5f5f5';
    context.fillRect(drawX + 10, this.y + 18, this.width - 20, 24);
    const lightColor = Math.sin(this.lightsPhase) > 0 ? '#ff4f5a' : '#46d1ff';
    context.fillStyle = lightColor;
    context.fillRect(drawX + 12, this.y - 12, 20, 12);
    context.fillStyle = lightColor === '#ff4f5a' ? '#46d1ff' : '#ff4f5a';
    context.fillRect(drawX + this.width - 32, this.y - 12, 20, 12);
  }
}

function setupLevel() {
  game.player = new Player(80, game.groundHeight - 72, profile.accentColor);
  game.stage = 'approach';
  game.holdUp.active = false;
  game.holdUp.progress = 0;
  game.captureTimer = 0;
  game.cameraX = 0;
  game.police = [];
  hudInstructionEl.textContent = 'Use A/D or ←/→ to move, W or Space to jump.';
  hudActionEl.textContent = '';
  storyLogEl.innerHTML = '';
  addStoryLog(`${profile.alias} and ${accomplice.name} pull up behind the Midnight Express.`);
  addStoryLog(`${accomplice.name}: "Five minutes in and out. Don\'t get sentimental."`);
  objectives = [
    { text: 'Reach the Midnight Express store entrance.', completed: false },
    { text: 'Intimidate the clerk and grab the cash.', completed: false },
    { text: 'Dash to the getaway van.', completed: false },
  ];
  updateObjectives();
  updateHeat(15);
}

function updateHeat(level) {
  heatLevelEl.style.width = `${level}%`;
}

function generateAccomplice() {
  const name = accompliceNames[randomBetween(0, accompliceNames.length - 1)];
  const mood = accompliceMoods[randomBetween(0, accompliceMoods.length - 1)];
  accomplice = { name, mood };
  accompliceNameEl.textContent = name;
  accompliceMoodEl.textContent = `Mood: ${mood}`;
}

customizationForm.addEventListener('submit', (event) => {
  event.preventDefault();
  profile.alias = formFields.name.value.trim() || 'Ghost';
  profile.pronouns = formFields.pronouns.value;
  profile.style = formFields.style.value;
  profile.accentColor = colorPicker.value;
  profile.backstory = formFields.backstory.value.trim();

  generateAccomplice();
  setupLevel();
  showScreen('tutorial');
  startGameLoop();
});

function handleObjectiveProgress() {
  if (game.stage === 'approach') {
    const playerCenter = game.player.x + game.player.width / 2;
    const storeEntrance = game.store.x + game.store.width / 2;
    if (Math.abs(playerCenter - storeEntrance) < 80 && game.player.onGround) {
      hudActionEl.textContent = 'Press E to confront the clerk.';
      if (game.keys['e'] || game.keys['E']) {
        beginHoldUp();
      }
    } else {
      hudActionEl.textContent = '';
    }
  } else if (game.stage === 'escape' && !['captured', 'postCapture'].includes(game.stage)) {
    if (game.player.x + game.player.width > game.getawayVan.x + 40) {
      triggerCapture();
    }
  }

  if (game.holdUp.active) {
    hudActionEl.textContent = 'Mash SPACE to fill the duffel!';
  }
}

function beginHoldUp() {
  game.stage = 'holdUp';
  game.holdUp.active = true;
  game.holdUp.progress = 0;
  objectives[0].completed = true;
  addStoryLog(`${profile.alias} kicks the door in. ${accomplice.name} posts up by the door.`);
  updateObjectives();
  updateHeat(55);
}

window.addEventListener('keydown', (event) => {
  game.keys[event.key] = true;
  if (game.holdUp.active && event.key === ' ') {
    game.holdUp.progress += 1;
    if (game.holdUp.progress >= game.holdUp.needed) {
      completeHoldUp();
    }
  }
});

window.addEventListener('keyup', (event) => {
  delete game.keys[event.key];
});

function completeHoldUp() {
  game.holdUp.active = false;
  game.stage = 'escape';
  objectives[1].completed = true;
  hudActionEl.textContent = 'Sprint to the van!';
  addStoryLog('The clerk freezes. Cash drawer emptied into your duffel.');
  addStoryLog(`${accomplice.name}: "Sirens already wailing. Move!"`);
  updateObjectives();
  updateHeat(85);
}

function triggerCapture() {
  game.stage = 'captured';
  objectives[2].completed = true;
  updateObjectives();
  hudActionEl.textContent = '';
  addStoryLog('Police cruisers scream around the corner. An ambush.');
  addStoryLog(`${accomplice.name} guns the engine and bolts, leaving you surrounded.`);
  updateHeat(100);
  setTimeout(() => {
    game.stage = 'postCapture';
    addStoryLog('Atlas City PD: "On your knees! Hands where we can see them!"');
    addStoryLog(`${profile.alias} is cuffed on the asphalt as ${accomplice.name} disappears into the night.`);
    hudInstructionEl.textContent = 'Tutorial complete. Disorderly Conduct has only just begun...';
  }, 1800);

  // spawn police cars for dramatic effect
  game.police.push(new PoliceCar(game.player.x + 180));
  game.police.push(new PoliceCar(game.player.x - 260));
}

function startGameLoop() {
  if (game.running) return;
  game.running = true;
  game.lastTimestamp = performance.now();
  requestAnimationFrame(loop);
}

function loop(timestamp) {
  if (!game.running) return;
  const delta = Math.min((timestamp - game.lastTimestamp) / 16.67, 2);
  game.lastTimestamp = timestamp;

  update(delta);
  draw();

  requestAnimationFrame(loop);
}

function update(delta) {
  if (!game.player) return;
  game.player.update(delta);

  game.cameraX = Math.max(0, Math.min(game.player.x - canvas.width / 2 + game.player.width / 2, game.worldWidth - canvas.width));

  handleObjectiveProgress();

  if (game.stage === 'captured') {
    game.police.forEach((car) => {
      if (car.x > game.player.x + 90) {
        car.x -= 4 * delta;
      }
      if (car.x < game.player.x - 200) {
        car.x += 2 * delta;
      }
      car.update(delta);
    });
  } else {
    game.police.forEach((car) => car.update(delta));
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#080b16');
  gradient.addColorStop(1, '#141d33');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawBackground(cityLayers, 0.2);
  drawBackground(midgroundLayers, 0.5);
  drawGround();
  drawStore();
  drawGetawayVan();

  game.police.forEach((car) => car.draw(ctx, game.cameraX));

  if (game.player) {
    game.player.draw(ctx, game.cameraX);
  }

  if (game.holdUp.active) {
    drawHoldUpMeter();
  }
}

const cityLayers = [
  { color: 'rgba(57, 79, 136, 0.45)', height: 220, offset: 0 },
  { color: 'rgba(90, 118, 196, 0.4)', height: 260, offset: 120 },
  { color: 'rgba(40, 58, 102, 0.55)', height: 200, offset: 220 },
];

const midgroundLayers = [
  { color: 'rgba(26, 32, 52, 1)', height: 160, offset: 40 },
  { color: 'rgba(31, 43, 73, 1)', height: 140, offset: 110 },
];

function drawBackground(layers, parallax) {
  layers.forEach((layer, index) => {
    const speed = parallax + index * 0.1;
    const baseY = canvas.height - layer.height - layer.offset;
    const patternWidth = 320;
    const offsetX = -(game.cameraX * speed) % patternWidth;

    ctx.fillStyle = layer.color;
    for (let x = offsetX - patternWidth; x < canvas.width + patternWidth; x += patternWidth) {
      ctx.fillRect(x, baseY, patternWidth * 0.7, layer.height);
      ctx.fillRect(x + patternWidth * 0.75, baseY + 20, patternWidth * 0.25, layer.height - 20);
    }
  });
}

function drawGround() {
  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, game.groundHeight, canvas.width, canvas.height - game.groundHeight);

  ctx.fillStyle = '#1d263b';
  const stripeWidth = 64;
  const offset = -(game.cameraX * 1.1) % stripeWidth;
  for (let x = offset - stripeWidth; x < canvas.width + stripeWidth; x += stripeWidth) {
    ctx.fillRect(x, game.groundHeight, stripeWidth / 2, 10);
  }
}

function drawStore() {
  const drawX = game.store.x - game.cameraX;
  ctx.fillStyle = '#161d2f';
  ctx.fillRect(drawX, game.groundHeight - game.store.height, game.store.width, game.store.height);

  ctx.fillStyle = '#2e3a5d';
  ctx.fillRect(drawX + 18, game.groundHeight - game.store.height + 24, game.store.width - 36, game.store.height - 48);

  ctx.fillStyle = '#f9f871';
  ctx.fillRect(drawX + 40, game.groundHeight - game.store.height + 18, game.store.width - 80, 24);
  ctx.fillStyle = '#141b2f';
  ctx.font = '16px "Rajdhani", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MIDNIGHT EXPRESS', drawX + game.store.width / 2, game.groundHeight - game.store.height + 36);
}

function drawGetawayVan() {
  const drawX = game.getawayVan.x - game.cameraX;
  ctx.fillStyle = '#252a3f';
  ctx.fillRect(drawX, game.groundHeight - game.getawayVan.height, game.getawayVan.width, game.getawayVan.height);
  ctx.fillStyle = '#141825';
  ctx.fillRect(drawX + 20, game.groundHeight - game.getawayVan.height + 20, game.getawayVan.width - 40, 40);
  ctx.fillStyle = '#46d1ff';
  ctx.fillRect(drawX + 24, game.groundHeight - game.getawayVan.height + 24, game.getawayVan.width - 48, 32);
}

function drawHoldUpMeter() {
  const width = 320;
  const height = 28;
  const x = canvas.width / 2 - width / 2;
  const y = 80;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = profile.accentColor;
  const progressWidth = (game.holdUp.progress / game.holdUp.needed) * width;
  ctx.fillRect(x, y, progressWidth, height);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Stuffing the duffel...', canvas.width / 2, y - 8);
}

updatePreview();
