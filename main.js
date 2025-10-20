const STORAGE_KEY = "disorderlyConductDemoState-v1";

const DEFAULT_STATE = {
  settings: {
    audio: { master: 80, music: 70, sfx: 80, mute: false },
    video: { resolution: "1920x1080", fullscreen: true, vsync: true, frameLimit: "60" },
    gameplay: { subtitles: true, subtitleSize: "M", language: "en" },
    controls: { sensitivity: 55, invertY: false },
    accessibility: { colorblind: "Off", reduceFlashes: false, holdToPress: true }
  },
  playerAppearance: {
    skinTone: "#f6d6c1",
    hairStyle: "Short",
    hairColor: "#2b2115",
    name: ""
  },
  saveSlot: null,
  progress: "TitleScreen"
};

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return mergeState(DEFAULT_STATE, parsed);
  } catch (err) {
    console.warn("Failed to load save state", err);
    return structuredClone(DEFAULT_STATE);
  }
}

function mergeState(base, incoming) {
  if (Array.isArray(base)) return incoming ?? base;
  if (typeof base !== "object" || base === null) return incoming ?? base;
  const result = { ...base };
  for (const key of Object.keys(base)) {
    if (incoming && Object.prototype.hasOwnProperty.call(incoming, key)) {
      result[key] = mergeState(base[key], incoming[key]);
    }
  }
  for (const key of Object.keys(incoming || {})) {
    if (!Object.prototype.hasOwnProperty.call(result, key)) {
      result[key] = incoming[key];
    }
  }
  return result;
}

function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Failed to persist state", err);
  }
}

function cloneTemplate(id) {
  const tpl = document.getElementById(id);
  if (!tpl) throw new Error(`Template ${id} not found`);
  return tpl.content.firstElementChild.cloneNode(true);
}

const SKIN_TONES = [
  "#f9e0d0",
  "#f3cdb0",
  "#d9a274",
  "#c48355",
  "#a06237",
  "#7d4b2b",
  "#5a3824",
  "#3a2418"
];

const HAIR_STYLES = [
  "Short",
  "Buzz",
  "Medium",
  "Long",
  "Ponytail",
  "Bun",
  "Mohawk",
  "Afro",
  "Undercut",
  "Shaved"
];

const HAIR_COLORS = [
  "#0b0b0b",
  "#362312",
  "#5c3a1a",
  "#855d2c",
  "#c6a15b",
  "#f4edd0",
  "#9d342c",
  "#7b3f2f",
  "#a8a8a8",
  "#f2f2f2"
];

const RANDOM_NAMES = [
  "Reese",
  "Devon",
  "Kai",
  "Rowan",
  "Morgan",
  "Nia",
  "Imani",
  "Skye",
  "Noor",
  "Dante",
  "Lux",
  "Harper"
];

const SETTINGS_SCHEMA = {
  audio: [
    { type: "range", key: "master", label: "Master Volume", min: 0, max: 100 },
    { type: "range", key: "music", label: "Music Volume", min: 0, max: 100 },
    { type: "range", key: "sfx", label: "SFX Volume", min: 0, max: 100 },
    { type: "toggle", key: "mute", label: "Mute All" }
  ],
  video: [
    {
      type: "select",
      key: "resolution",
      label: "Resolution",
      options: ["1280×720", "1600×900", "1920×1080", "2560×1440"]
    },
    { type: "toggle", key: "fullscreen", label: "Fullscreen" },
    { type: "toggle", key: "vsync", label: "VSync" },
    {
      type: "select",
      key: "frameLimit",
      label: "Frame Limit",
      options: ["30", "60", "120", "Unlimited"]
    }
  ],
  gameplay: [
    { type: "toggle", key: "subtitles", label: "Subtitles" },
    { type: "select", key: "subtitleSize", label: "Subtitle Size", options: ["S", "M", "L"] },
    { type: "select", key: "language", label: "Language", options: ["en", "es", "fr"] }
  ],
  controls: [
    { type: "range", key: "sensitivity", label: "Look Sensitivity", min: 0, max: 100 },
    { type: "toggle", key: "invertY", label: "Invert Y Axis" }
  ],
  accessibility: [
    { type: "select", key: "colorblind", label: "Colorblind Palette", options: ["Off", "Deuteranopia", "Protanopia", "Tritanopia"] },
    { type: "toggle", key: "reduceFlashes", label: "Reduce Flashes" },
    { type: "toggle", key: "holdToPress", label: "Hold-to-Press" }
  ]
};

class Game {
  constructor(root) {
    this.root = root;
    this.state = loadState();
    this.currentScene = null;
    this.cleanupHandlers = [];
    this.accessibilityPreview = false;
    this.bootTimeout = null;
    this.setupGlobalHandlers();
    this.startBootSequence();
  }

  setupGlobalHandlers() {
    window.addEventListener("keydown", (event) => {
      if (event.key === "F1") {
        event.preventDefault();
        this.toggleAccessibilityPreview();
      }
    });

    window.addEventListener("beforeunload", () => saveState(this.state));
  }

  startBootSequence() {
    this.bootTimeout = window.setTimeout(() => this.goTo("TitleScreen"), 1400);
  }

  addCleanup(handler) {
    this.cleanupHandlers.push(handler);
  }

  goTo(sceneId, options = {}) {
    while (this.root.firstChild) {
      this.root.removeChild(this.root.firstChild);
    }
    if (this.cleanupHandlers.length) {
      for (const handler of this.cleanupHandlers) {
        try {
          handler();
        } catch (err) {
          console.warn("Cleanup handler failed", err);
        }
      }
    }
    this.cleanupHandlers = [];
    this.currentScene = sceneId;

    const { node, onCleanup } = this.renderScene(sceneId, options);
    if (onCleanup) this.addCleanup(onCleanup);
    node.classList.add("fade-in");
    this.root.append(node);
  }

  renderScene(sceneId, options) {
    switch (sceneId) {
      case "TitleScreen":
        return this.renderTitleScreen();
      case "MainMenu":
        return this.renderMainMenu();
      case "CharacterCreator":
        return this.renderCharacterCreator();
      case "IntroCutscene":
        return this.renderCutscene();
      case "PrisonCell_Tutorial":
        return this.renderPrisonTutorial();
      default:
        console.warn(`Scene ${sceneId} not implemented`);
        return this.renderTitleScreen();
    }
  }

  toggleAccessibilityPreview() {
    this.accessibilityPreview = !this.accessibilityPreview;
    document.body.classList.toggle("accessibility-preview", this.accessibilityPreview);
  }

  renderTitleScreen() {
    const node = cloneTemplate("title-screen-template");
    const cta = node.querySelector("[data-action=\"enter-menu\"]");

    const enterMenu = () => {
      this.goTo("MainMenu");
    };

    cta.addEventListener("click", enterMenu);
    const keyHandler = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        enterMenu();
      }
    };
    window.addEventListener("keydown", keyHandler);

    window.requestAnimationFrame(() => cta.focus());

    return {
      node,
      onCleanup: () => window.removeEventListener("keydown", keyHandler)
    };
  }

  renderMainMenu() {
    const node = cloneTemplate("main-menu-template");
    const continueBtn = node.querySelector('[data-action="continue"]');
    const startBtn = node.querySelector('[data-action="start"]');
    const loadPanel = node.querySelector('[data-panel="load"]');
    const extrasPanel = node.querySelector('[data-panel="extras"]');
    const settingsPanel = node.querySelector('[data-panel="settings"]');

    const hasSave = Boolean(this.state.saveSlot);
    if (!hasSave) {
      continueBtn.disabled = true;
      continueBtn.textContent = "Continue (No Save)";
    } else {
      continueBtn.disabled = false;
      continueBtn.textContent = "Continue";
    }

    const focusDefault = () => {
      const target = hasSave ? continueBtn : startBtn;
      window.requestAnimationFrame(() => target.focus());
    };

    focusDefault();

    const closePanels = () => {
      for (const panel of [loadPanel, extrasPanel, settingsPanel]) {
        panel.classList.remove("active");
      }
    };

    node.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (!action) return;
      switch (action) {
        case "start": {
          if (this.state.saveSlot && !window.confirm("Overwrite existing save?")) return;
          this.state.progress = "CharacterCreator";
          this.goTo("CharacterCreator");
          break;
        }
        case "continue": {
          if (!this.state.saveSlot) return;
          const progress = this.state.saveSlot.progress ?? "IntroCutscene";
          this.state.progress = progress;
          this.goTo(progress === "PrisonCell_Tutorial" ? "PrisonCell_Tutorial" : "IntroCutscene");
          break;
        }
        case "load": {
          closePanels();
          this.populateLoadPanel(loadPanel);
          loadPanel.classList.add("active");
          break;
        }
        case "extras": {
          closePanels();
          extrasPanel.classList.add("active");
          break;
        }
        case "settings": {
          closePanels();
          this.populateSettingsPanel(settingsPanel);
          settingsPanel.classList.add("active");
          settingsPanel.querySelector('[role="tab"][data-tab="audio"]').focus();
          break;
        }
        case "close-panel": {
          closePanels();
          focusDefault();
          break;
        }
        case "quit": {
          window.alert("Demo build: Quit disabled in browser.");
          break;
        }
        default:
          break;
      }
    });

    const keyHandler = (event) => {
      if (event.key === "Escape") {
        closePanels();
        focusDefault();
      }
    };

    window.addEventListener("keydown", keyHandler);

    return {
      node,
      onCleanup: () => window.removeEventListener("keydown", keyHandler)
    };
  }

  populateLoadPanel(panel) {
    const grid = panel.querySelector(".save-grid");
    grid.innerHTML = "";
    const slot = this.state.saveSlot;
    if (!slot) {
      const empty = document.createElement("p");
      empty.textContent = "No saves found.";
      grid.append(empty);
      return;
    }

    const card = document.createElement("button");
    card.className = "save-card";
    card.setAttribute("role", "listitem");
    card.innerHTML = `
      <strong>Slot 01</strong>
      <span>${slot.name}</span>
      <span>Scene: ${slot.progress === "PrisonCell_Tutorial" ? "Prison Cell" : "Intro Cutscene"}</span>
      <span>Timestamp: ${new Date(slot.timestamp).toLocaleString()}</span>
    `;
    card.addEventListener("click", () => {
      this.state.progress = slot.progress;
      this.goTo(slot.progress === "PrisonCell_Tutorial" ? "PrisonCell_Tutorial" : "IntroCutscene");
    });
    grid.append(card);
  }

  populateSettingsPanel(panel, onClose) {
    const tabs = panel.querySelectorAll("[role=\"tab\"]");
    const sections = panel.querySelectorAll("[data-tab-panel]");

    const setActiveTab = (tabName) => {
      tabs.forEach((tab) => {
        const isActive = tab.dataset.tab === tabName;
        tab.setAttribute("aria-selected", isActive);
      });
      sections.forEach((section) => {
        section.hidden = section.dataset.tabPanel !== tabName;
      });
    };

    tabs.forEach((tab) => {
      if (tab.dataset.bound === "true") return;
      tab.dataset.bound = "true";
      tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
      tab.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          const index = [...tabs].indexOf(tab);
          const dir = event.key === "ArrowRight" ? 1 : -1;
          const next = (index + dir + tabs.length) % tabs.length;
          const nextTab = tabs[next];
          nextTab.focus();
          setActiveTab(nextTab.dataset.tab);
        }
      });
    });

    for (const section of sections) {
      const key = section.dataset.tabPanel;
      section.innerHTML = "";
      const controls = SETTINGS_SCHEMA[key];
      const categoryState = this.state.settings[key];
      if (!controls) continue;
      for (const control of controls) {
        if (control.type === "range") {
          const wrapper = document.createElement("label");
          wrapper.className = "range-field";
          wrapper.textContent = control.label;

          const value = document.createElement("span");
          value.textContent = categoryState[control.key];

          const input = document.createElement("input");
          input.type = "range";
          input.min = control.min;
          input.max = control.max;
          input.value = categoryState[control.key];
          input.addEventListener("input", () => {
            categoryState[control.key] = Number(input.value);
            value.textContent = input.value;
            saveState(this.state);
          });

          wrapper.append(input, value);
          section.append(wrapper);
        } else if (control.type === "toggle") {
          const wrapper = document.createElement("label");
          wrapper.className = "toggle-field";
          const text = document.createElement("span");
          text.textContent = control.label;
          const input = document.createElement("input");
          input.type = "checkbox";
          input.checked = Boolean(categoryState[control.key]);
          input.addEventListener("change", () => {
            categoryState[control.key] = input.checked;
            saveState(this.state);
          });
          wrapper.append(text, input);
          section.append(wrapper);
        } else if (control.type === "select") {
          const wrapper = document.createElement("label");
          wrapper.className = "select-field";
          const text = document.createElement("span");
          text.textContent = control.label;
          const select = document.createElement("select");
          for (const option of control.options) {
            const opt = document.createElement("option");
            opt.value = option;
            opt.textContent = option;
            if (categoryState[control.key] === option) opt.selected = true;
            select.append(opt);
          }
          select.addEventListener("change", () => {
            categoryState[control.key] = select.value;
            saveState(this.state);
          });
          wrapper.append(text, select);
          section.append(wrapper);
        }
      }
    }

    if (onClose) {
      panel.querySelectorAll("[data-action=\"close-panel\"]").forEach((button) => {
        button.addEventListener("click", onClose, { once: true });
      });
    }

    setActiveTab("audio");
  }

  renderCharacterCreator() {
    const node = cloneTemplate("character-creator-template");
    const preview = node.querySelector(".preview-character");
    const hair = node.querySelector(".preview-hair");
    const nameInput = node.querySelector('[data-field="name"]');
    const confirmBtn = node.querySelector('[data-action="confirm"]');
    const randomizeBtn = node.querySelector('[data-action="randomize"]');

    const working = structuredClone(this.state.playerAppearance);

    const applyPreview = () => {
      preview.style.background = `linear-gradient(180deg, ${working.skinTone} 35%, #f97316 35%)`;
      hair.style.background = working.hairColor;
      hair.dataset.style = working.hairStyle.toLowerCase();
      preview.classList.add("animate");
      window.setTimeout(() => preview.classList.remove("animate"), 400);
    };

    const isNameValid = () => working.name.trim().length >= 1;
    const updateConfirmState = () => {
      confirmBtn.disabled = !isNameValid();
    };

    const buildSwatch = (value, groupName, current) => {
      const button = document.createElement("button");
      button.type = "button";
      button.style.background = value;
      button.dataset.value = value;
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", value === current);
      button.addEventListener("click", () => {
        working[groupName] = value;
        updateSwatchSelection(button.parentElement, value);
        applyPreview();
      });
      button.addEventListener("keydown", (event) => {
        const siblings = [...button.parentElement.querySelectorAll("button")];
        const index = siblings.indexOf(button);
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          siblings[(index + 1) % siblings.length].focus();
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          siblings[(index - 1 + siblings.length) % siblings.length].focus();
        }
      });
      return button;
    };

    const updateSwatchSelection = (container, value) => {
      container.querySelectorAll("button").forEach((btn) => {
        btn.setAttribute("aria-checked", btn.dataset.value === value ? "true" : "false");
      });
    };

    const skinRow = node.querySelector('[data-category="skin"] .swatch-row');
    SKIN_TONES.forEach((tone) => skinRow.append(buildSwatch(tone, "skinTone", working.skinTone)));

    const hairColorRow = node.querySelector('[data-category="hairColor"] .swatch-row');
    HAIR_COLORS.forEach((color) => hairColorRow.append(buildSwatch(color, "hairColor", working.hairColor)));

    const hairStyleList = node.querySelector('[data-category="hairStyle"] .option-list');
    HAIR_STYLES.forEach((style) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = style;
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", working.hairStyle === style ? "true" : "false");
      button.addEventListener("click", () => {
        working.hairStyle = style;
        hairStyleList.querySelectorAll("button").forEach((btn) => btn.setAttribute("aria-checked", btn === button ? "true" : "false"));
        applyPreview();
      });
      hairStyleList.append(button);
    });

    nameInput.value = working.name;
    nameInput.addEventListener("input", () => {
      working.name = nameInput.value;
      updateConfirmState();
    });

    randomizeBtn.addEventListener("click", () => {
      working.skinTone = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
      working.hairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
      working.hairStyle = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)];
      working.name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
      nameInput.value = working.name;
      skinRow.querySelectorAll("button").forEach((btn) => btn.setAttribute("aria-checked", btn.dataset.value === working.skinTone ? "true" : "false"));
      hairColorRow.querySelectorAll("button").forEach((btn) => btn.setAttribute("aria-checked", btn.dataset.value === working.hairColor ? "true" : "false"));
      hairStyleList.querySelectorAll("button").forEach((btn) => btn.setAttribute("aria-checked", btn.textContent === working.hairStyle ? "true" : "false"));
      applyPreview();
      updateConfirmState();
    });

    node.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (!action) return;
      if (action === "back-to-menu") {
        this.goTo("MainMenu");
      }
      if (action === "confirm" && isNameValid()) {
        this.state.playerAppearance = structuredClone(working);
        this.state.saveSlot = {
          name: working.name,
          appearance: structuredClone(working),
          timestamp: Date.now(),
          progress: "IntroCutscene"
        };
        this.state.progress = "IntroCutscene";
        saveState(this.state);
        this.goTo("IntroCutscene");
      }
    });

    applyPreview();
    updateConfirmState();

    window.requestAnimationFrame(() => nameInput.focus());

    return { node };
  }

  renderCutscene() {
    this.state.progress = "IntroCutscene";
    if (this.state.saveSlot) {
      this.state.saveSlot.progress = "IntroCutscene";
      saveState(this.state);
    }
    const node = cloneTemplate("cutscene-template");
    const panels = {
      transport: node.querySelector('[data-panel="transport"]'),
      cell: node.querySelector('[data-panel="cell"]'),
      resolve: node.querySelector('[data-panel="resolve"]')
    };
    const letterboxes = node.querySelectorAll(".letterbox");
    letterboxes.forEach((box) => box.classList.add("active"));

    const skipButton = node.querySelector("[data-action=\"skip\"]");

    const stepTimers = [];
    const showPanel = (current) => {
      Object.entries(panels).forEach(([key, panel]) => {
        panel.hidden = key !== current;
      });
    };

    const schedule = [
      { panel: "transport", duration: 3500 },
      { panel: "cell", duration: 3000 },
      { panel: "resolve", duration: 2500 }
    ];

    const runStep = (index) => {
      const step = schedule[index];
      showPanel(step.panel);
      const timer = window.setTimeout(() => {
        if (index + 1 < schedule.length) {
          runStep(index + 1);
        } else {
          this.finishCutscene();
        }
      }, step.duration);
      stepTimers.push(timer);
    };

    runStep(0);

    let skipEnabled = false;
    window.setTimeout(() => {
      skipEnabled = true;
      skipButton.dataset.state = "ready";
    }, 3000);

    let holdStart = null;
    let frameId = null;
    const progressEl = skipButton.querySelector(".skip-progress");
    progressEl.classList.add("skip-bar");
    progressEl.style.setProperty("--progress", 0);

    const updateProgress = (now) => {
      if (!holdStart) return;
      const elapsed = now - holdStart;
      const ratio = Math.min(1, elapsed / 1500);
      progressEl.style.setProperty("--progress", ratio);
      if (ratio >= 1) {
        completeSkip();
        return;
      }
      frameId = window.requestAnimationFrame(updateProgress);
    };

    const startHold = () => {
      if (!skipEnabled) return;
      holdStart = performance.now();
      progressEl.style.setProperty("--progress", 0);
      frameId = window.requestAnimationFrame(updateProgress);
    };

    const cancelHold = () => {
      holdStart = null;
      progressEl.style.setProperty("--progress", 0);
      if (frameId) window.cancelAnimationFrame(frameId);
    };

    const completeSkip = () => {
      cancelHold();
      this.finishCutscene();
    };

    skipButton.addEventListener("mousedown", startHold);
    skipButton.addEventListener("touchstart", startHold);
    skipButton.addEventListener("mouseup", cancelHold);
    skipButton.addEventListener("mouseleave", cancelHold);
    skipButton.addEventListener("touchend", cancelHold);
    skipButton.addEventListener("touchcancel", cancelHold);

    const skipKeyHandler = (event) => {
      if (event.key === "Escape" && skipEnabled) {
        event.preventDefault();
        completeSkip();
      }
    };
    window.addEventListener("keydown", skipKeyHandler);

    return {
      node,
      onCleanup: () => {
        stepTimers.forEach((id) => window.clearTimeout(id));
        cancelHold();
        window.removeEventListener("keydown", skipKeyHandler);
      }
    };
  }

  finishCutscene() {
    this.state.progress = "PrisonCell_Tutorial";
    if (this.state.saveSlot) {
      this.state.saveSlot.progress = "PrisonCell_Tutorial";
      this.state.saveSlot.timestamp = Date.now();
    }
    saveState(this.state);
    this.goTo("PrisonCell_Tutorial");
  }

  renderPrisonTutorial() {
    this.state.progress = "PrisonCell_Tutorial";
    if (this.state.saveSlot) {
      this.state.saveSlot.progress = "PrisonCell_Tutorial";
      saveState(this.state);
    }
    const node = cloneTemplate("prison-template");
    const character = node.querySelector(".cell-character");
    const door = node.querySelector(".cell-door");
    const objectivesElements = {
      move: node.querySelector('[data-objective="move"]'),
      jump: node.querySelector('[data-objective="jump"]'),
      attack: node.querySelector('[data-objective="attack"]'),
      pause: node.querySelector('[data-objective="pause"]')
    };
    const objectivesState = {
      move: false,
      jump: false,
      attack: false,
      pause: false
    };

    const completeObjective = (key) => {
      if (objectivesState[key]) return;
      objectivesState[key] = true;
      objectivesElements[key]?.classList.add("completed");
      checkAllObjectives();
    };

    const checkAllObjectives = () => {
      if (Object.values(objectivesState).every(Boolean)) {
        door.classList.add("open");
        const list = node.querySelector(".tutorial-objectives h2");
        list.textContent = "Open the door.";
        if (this.state.saveSlot) {
          this.state.saveSlot.progress = "PrisonCell_Tutorial";
          this.state.saveSlot.objectivesComplete = true;
          this.state.saveSlot.timestamp = Date.now();
          saveState(this.state);
        }
      }
    };

    const velocity = { x: 0, y: 0 };
    const position = { x: 32, y: 0 };
    const stage = node.querySelector(".cell-stage");
    const input = { left: false, right: false };
    let grounded = true;
    let attackCooldown = false;
    let animationFrame = null;
    let paused = false;

    const bounds = () => stage.getBoundingClientRect();
    const characterSize = { width: 60, height: 140 };

    const update = () => {
      if (paused) return;
      velocity.x = 0;
      const speed = 3;
      if (input.left) velocity.x -= speed;
      if (input.right) velocity.x += speed;
      if (velocity.x !== 0) completeObjective("move");

      position.x = Math.max(24, Math.min(bounds().width - characterSize.width - 24, position.x + velocity.x));

      if (!grounded) {
        velocity.y -= 0.5;
        position.y += velocity.y;
        if (position.y <= 0) {
          position.y = 0;
          velocity.y = 0;
          grounded = true;
        }
      }

      character.style.transform = `translate(${position.x}px, ${-position.y}px)`;
      animationFrame = window.requestAnimationFrame(update);
    };

    const startLoop = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(update);
    };

    startLoop();

    const keydown = (event) => {
      switch (event.code) {
        case "ArrowLeft":
        case "KeyA":
          input.left = true;
          break;
        case "ArrowRight":
        case "KeyD":
          input.right = true;
          break;
        case "Space":
        case "ArrowUp":
        case "KeyW":
          if (grounded) {
            grounded = false;
            velocity.y = 8;
            completeObjective("jump");
          }
          break;
        case "KeyJ":
        case "KeyF":
          if (!attackCooldown) {
            attackCooldown = true;
            character.animate(
              [
                { transform: character.style.transform + " rotate(0deg)" },
                { transform: character.style.transform + " rotate(-6deg)" }
              ],
              { duration: 200 }
            );
            completeObjective("attack");
            window.setTimeout(() => (attackCooldown = false), 400);
          }
          break;
        case "Escape":
          togglePause(true);
          completeObjective("pause");
          break;
        default:
          break;
      }
    };

    const keyup = (event) => {
      switch (event.code) {
        case "ArrowLeft":
        case "KeyA":
          input.left = false;
          break;
        case "ArrowRight":
        case "KeyD":
          input.right = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);

    const pauseOverlay = node.querySelector(".pause-overlay");
    const pauseMenu = node.querySelector(".pause-menu");

    const togglePause = (value) => {
      paused = value;
      pauseOverlay.hidden = !value;
      if (value) {
        if (animationFrame) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
        window.requestAnimationFrame(() => pauseMenu.querySelector("[data-action=\"resume\"]").focus());
      } else {
        window.requestAnimationFrame(() => character.focus());
        startLoop();
      }
    };

    pauseOverlay.addEventListener("click", (event) => {
      if (event.target === pauseOverlay) {
        togglePause(false);
      }
    });

    pauseMenu.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (!action) return;
      switch (action) {
        case "resume":
          togglePause(false);
          break;
        case "settings": {
          pauseOverlay.querySelectorAll('.menu-panel.settings[data-modal="settings"]').forEach((panel) => panel.remove());
          const modal = this.buildSettingsModal(() => {
            pauseMenu.querySelector("[data-action=\"resume\"]").focus();
          });
          pauseOverlay.append(modal);
          break;
        }
        case "quit":
          togglePause(false);
          this.goTo("MainMenu");
          break;
        default:
          break;
      }
    });

    character.addEventListener("focus", () => startLoop());
    window.requestAnimationFrame(() => character.focus());

    return {
      node,
      onCleanup: () => {
        window.removeEventListener("keydown", keydown);
        window.removeEventListener("keyup", keyup);
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
      }
    };
  }

  buildSettingsModal(onClose) {
    const wrapper = document.createElement("div");
    wrapper.className = "menu-panel settings active";
    wrapper.dataset.modal = "settings";
    wrapper.setAttribute("role", "dialog");
    wrapper.innerHTML = `
      <header>
        <h2>Settings</h2>
        <button class="panel-close" data-action="dismiss" aria-label="Close settings">×</button>
      </header>
      <div class="settings-tabs" role="tablist">
        <button role="tab" aria-selected="true" data-tab="audio">Audio</button>
        <button role="tab" aria-selected="false" data-tab="video">Video</button>
        <button role="tab" aria-selected="false" data-tab="gameplay">Gameplay</button>
        <button role="tab" aria-selected="false" data-tab="controls">Controls</button>
        <button role="tab" aria-selected="false" data-tab="accessibility">Accessibility</button>
      </div>
      <div class="settings-content">
        <section data-tab-panel="audio"></section>
        <section data-tab-panel="video" hidden></section>
        <section data-tab-panel="gameplay" hidden></section>
        <section data-tab-panel="controls" hidden></section>
        <section data-tab-panel="accessibility" hidden></section>
      </div>
    `;

    const keyHandler = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    wrapper.addEventListener("keydown", keyHandler);
    const close = () => {
      wrapper.removeEventListener("keydown", keyHandler);
      wrapper.remove();
      onClose?.();
    };

    this.populateSettingsPanel(wrapper, close);
    wrapper.querySelector("[data-action=\"dismiss\"]").addEventListener("click", close, { once: true });
    return wrapper;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("game-root");
  new Game(root);
});
