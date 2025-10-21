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

const PROHIBITED_NAMES = ["fuck", "shit", "bitch"];

const EXTRAS_SECTIONS = {
  credits: {
    title: "Credits",
    description:
      "This vertical slice was assembled by a three-person strike team: designer, artist, and engineer working in lockstep.",
    list: [
      { role: "Design & Narrative", name: "J. Monroe" },
      { role: "Art & UI", name: "L. Campos" },
      { role: "Engineering", name: "S. Idris" }
    ],
    footer: "Additional shout-outs to the audio collective 'Steel Rain' for placeholder ambience."
  },
  lore: {
    title: "Lore Drop",
    description:
      "Rival crews set you up after a failed job. The demo ends before you meet the mysterious fixer whispering about a jailbreak.",
    list: [
      { role: "Setting", name: "Caligo City Detention Annex" },
      { role: "Known Ally", name: "Rook — smuggler with a conscience" },
      { role: "Known Threat", name: "Warden Kessel — believes in loyalty through fear" }
    ],
    footer: "Full campaign pivots between the prison complex interior and a neon-soaked industrial district."
  },
  concept: {
    title: "Concept Art",
    description:
      "Mood frames showcasing the prison's brutalist geometry against warm human details. Swipe to imagine them in motion.",
    gallery: [
      { title: "Intake Hall", caption: "Floodlights through rain-slicked grates." },
      { title: "Cell Block C", caption: "Graffiti coded in inmate cipher." },
      { title: "Maintenance Tunnel", caption: "Steam haze and the hum of transformers." }
    ],
    footer: "Visual targets lean on high-contrast lighting and saturated accent colors for clarity."
  }
};

const SUBTITLE_SCALE = { S: 0.9, M: 1, L: 1.25 };

const CUTSCENE_STEPS = [
  {
    id: "transport",
    duration: 3600,
    subtitle: "[Guard] Welcome home, hero.",
    caption: "Armored transport rattles through the rain.",
    effect: "rumble"
  },
  {
    id: "cell",
    duration: 3200,
    subtitle: "Metal door slams shut.",
    caption: "Intake cell lights strobe once as the latch slams.",
    effect: "flash"
  },
  {
    id: "resolve",
    duration: 2600,
    subtitle: "The night goes quiet.",
    caption: "Silence presses in. Footsteps fade down the hall.",
    effect: "breath"
  }
];

const CUTSCENE_HOLD_DURATION = 1500;

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
    this.applySettingsToDocument();
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

  applySettingsToDocument() {
    const { gameplay, accessibility } = this.state.settings;
    const subtitleScale = SUBTITLE_SCALE[gameplay.subtitleSize] ?? 1;
    document.documentElement.style.setProperty("--subtitle-scale", subtitleScale);
    document.body.classList.toggle("subtitles-disabled", !gameplay.subtitles);
    if (accessibility.colorblind && accessibility.colorblind !== "Off") {
      document.body.dataset.colorblind = accessibility.colorblind.toLowerCase();
    } else {
      delete document.body.dataset.colorblind;
    }
    document.body.classList.toggle("reduce-flashes", Boolean(accessibility.reduceFlashes));
    document.body.classList.toggle("hold-to-press", Boolean(accessibility.holdToPress));
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
    const parallaxCleanup = this.createParallaxController(node);

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
          this.populateExtrasPanel(extrasPanel);
          extrasPanel.classList.add("active");
          break;
        }
        case "settings": {
          closePanels();
          this.populateSettingsPanel(settingsPanel);
          settingsPanel.classList.add("active");
          const activeTab = settingsPanel.querySelector('[role="tab"][aria-selected="true"]');
          window.requestAnimationFrame(() => activeTab?.focus());
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

    const cleanup = () => {
      window.removeEventListener("keydown", keyHandler);
      if (parallaxCleanup) parallaxCleanup();
    };

    return { node, onCleanup: cleanup };
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
    const progressLabel =
      slot.progress === "PrisonCell_Tutorial" ? "Prison Cell Tutorial" : "Intro Cutscene";
    const timestamp = slot.timestamp ? new Date(slot.timestamp) : new Date();
    const hairStyle = (slot.appearance?.hairStyle || "Short").toLowerCase();
    const skinTone = slot.appearance?.skinTone || "#f6d6c1";
    const hairColor = slot.appearance?.hairColor || "#2b2115";
    const objectivesStatus = slot.objectivesComplete ? "Checklist cleared" : "Checklist pending";
    const hallwayStatus = slot.hallwayPreviewed ? "Hallway scouted" : "Hallway unseen";
    const slotName = slot.name?.trim() ? slot.name : "Unnamed Inmate";
    card.dataset.hallway = slot.hallwayPreviewed ? "scouted" : "unseen";
    card.innerHTML = `
      <div class="save-thumbnail" data-style="${hairStyle}">
        <span class="save-skin" style="background: ${skinTone};"></span>
        <span class="save-hair" style="background: ${hairColor};"></span>
      </div>
      <div class="save-meta">
        <strong>Slot 01 — ${slotName}</strong>
        <span class="save-progress">${progressLabel}</span>
        <span class="save-objectives">${objectivesStatus}</span>
        <span class="save-hallway">${hallwayStatus}</span>
        <time datetime="${timestamp.toISOString()}">Saved ${timestamp.toLocaleString()}</time>
      </div>
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
    const tabList = Array.from(tabs);
    const sectionMap = new Map(Array.from(sections, (section) => [section.dataset.tabPanel, section]));

    const setActiveTab = (tabName) => {
      const resolved = tabName || "audio";
      panel.dataset.activeTab = resolved;
      tabList.forEach((tab) => {
        const isActive = tab.dataset.tab === resolved;
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
        tab.tabIndex = isActive ? 0 : -1;
        const section = sectionMap.get(tab.dataset.tab);
        if (section) section.hidden = !isActive;
      });
    };

    tabList.forEach((tab, index) => {
      if (tab.dataset.bound === "true") return;
      tab.dataset.bound = "true";
      tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
      tab.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          const direction = event.key === "ArrowRight" ? 1 : -1;
          const nextIndex = (index + direction + tabList.length) % tabList.length;
          const nextTab = tabList[nextIndex];
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
            this.applySettingsToDocument();
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
            this.applySettingsToDocument();
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
            this.applySettingsToDocument();
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

    setActiveTab(panel.dataset.activeTab || "audio");
  }

  createParallaxController(container) {
    const layers = container.querySelectorAll(".parallax");
    if (!layers.length) return null;

    let animationFrame = null;
    let containerRect = container.getBoundingClientRect();
    const current = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const updateTargetFromPointer = (event) => {
      const centerX = containerRect.left + containerRect.width / 2;
      const centerY = containerRect.top + containerRect.height / 2;
      target.x = ((event.clientX - centerX) / containerRect.width) * 40;
      target.y = ((event.clientY - centerY) / containerRect.height) * 20;
    };

    const handlePointerMove = (event) => {
      updateTargetFromPointer(event);
    };

    const handlePointerLeave = () => {
      target.x = 0;
      target.y = 0;
    };

    const handleResize = () => {
      containerRect = container.getBoundingClientRect();
    };

    const animate = (time) => {
      const driftX = Math.sin(time / 4200) * 18;
      const driftY = Math.cos(time / 5300) * 10;
      const goalX = target.x + driftX;
      const goalY = target.y + driftY;
      current.x += (goalX - current.x) * 0.08;
      current.y += (goalY - current.y) * 0.08;
      layers.forEach((layer, index) => {
        const depth = (index + 1) / layers.length;
        layer.style.transform = `translate3d(${current.x * depth}px, ${current.y * depth}px, 0)`;
      });
      animationFrame = window.requestAnimationFrame(animate);
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerdown", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("resize", handleResize);
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerdown", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", handleResize);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      layers.forEach((layer) => {
        layer.style.transform = "";
      });
    };
  }

  populateExtrasPanel(panel) {
    if (!panel) return;
    const tabs = panel.querySelectorAll("[role=\"tab\"][data-extra]");
    const container = panel.querySelector("[data-extra-container]");
    if (!container || !tabs.length) return;

    container.id = container.id || "extras-panel-content";
    container.setAttribute("role", "tabpanel");
    container.tabIndex = 0;

    const render = (id) => {
      const data = EXTRAS_SECTIONS[id];
      container.innerHTML = "";
      if (!data) {
        const empty = document.createElement("p");
        empty.textContent = "Content unavailable.";
        container.append(empty);
        return;
      }

      const heading = document.createElement("h3");
      heading.textContent = data.title;
      container.append(heading);

      if (data.description) {
        const desc = document.createElement("p");
        desc.textContent = data.description;
        container.append(desc);
      }

      if (data.list) {
        const list = document.createElement("dl");
        list.className = "extras-list";
        data.list.forEach((item) => {
          const term = document.createElement("dt");
          term.textContent = item.role;
          const detail = document.createElement("dd");
          detail.textContent = item.name;
          list.append(term, detail);
        });
        container.append(list);
      }

      if (data.gallery) {
        const gallery = document.createElement("div");
        gallery.className = "extras-gallery";
        const cards = [];

        const status = document.createElement("p");
        status.className = "extras-gallery-status";
        status.setAttribute("role", "status");

        const hint = document.createElement("p");
        hint.className = "extras-gallery-hint";
        hint.textContent = "Use ←/→ or click to inspect concept frames.";

        const setActiveCard = (index) => {
          if (!cards.length) return;
          const nextIndex = (index + cards.length) % cards.length;
          cards.forEach((card, idx) => {
            const isActive = idx === nextIndex;
            card.classList.toggle("active", isActive);
            card.setAttribute("aria-selected", isActive ? "true" : "false");
          });
          status.textContent = `Frame ${nextIndex + 1} of ${cards.length}`;
        };

        data.gallery.forEach((item, index) => {
          const card = document.createElement("article");
          card.className = "extras-card";
          card.dataset.index = String(index + 1);
          card.tabIndex = 0;
          card.setAttribute("role", "button");
          card.setAttribute("aria-selected", index === 0 ? "true" : "false");
          card.setAttribute("aria-label", `${item.title}. ${item.caption}`);
          const title = document.createElement("h4");
          title.textContent = item.title;
          const caption = document.createElement("p");
          caption.textContent = item.caption;
          card.append(title, caption);
          card.addEventListener("focus", () => setActiveCard(index));
          card.addEventListener("mouseenter", () => setActiveCard(index));
          card.addEventListener("click", () => {
            setActiveCard(index);
            card.focus();
          });
          card.addEventListener("keydown", (event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              const direction = event.key === "ArrowRight" ? 1 : -1;
              const next = (index + direction + cards.length) % cards.length;
              setActiveCard(next);
              cards[next].focus();
            }
          });
          gallery.append(card);
          cards.push(card);
        });
        gallery.append(status, hint);
        setActiveCard(0);
        container.append(gallery);
      }

      if (data.footer) {
        const footer = document.createElement("p");
        footer.className = "extras-footer";
        footer.textContent = data.footer;
        container.append(footer);
      }
      container.dataset.activeExtra = id;
      window.requestAnimationFrame(() => container.focus());
    };

    const setActiveTab = (id) => {
      tabs.forEach((tab) => {
        const isActive = tab.dataset.extra === id;
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
        if (isActive) tab.classList.add("active");
        else tab.classList.remove("active");
      });
      render(id);
    };

    tabs.forEach((tab, index) => {
      tab.setAttribute("aria-controls", container.id);
      if (tab.dataset.bound === "true") return;
      tab.dataset.bound = "true";
      tab.addEventListener("click", () => setActiveTab(tab.dataset.extra));
      tab.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          const direction = event.key === "ArrowRight" ? 1 : -1;
          const nextIndex = (index + direction + tabs.length) % tabs.length;
          const nextTab = tabs[nextIndex];
          nextTab.focus();
          setActiveTab(nextTab.dataset.extra);
        }
      });
    });

    const initialize = () => {
      setActiveTab(tabs[0].dataset.extra);
      panel.dataset.initialized = "true";
      window.requestAnimationFrame(() => tabs[0].focus());
    };

    if (panel.dataset.initialized === "true") {
      const active = panel.querySelector('[role="tab"][aria-selected="true"]');
      const target = active?.dataset.extra ?? tabs[0].dataset.extra;
      setActiveTab(target);
      window.requestAnimationFrame(() => active?.focus());
      return;
    }

    initialize();
  }

  renderCharacterCreator() {
    const node = cloneTemplate("character-creator-template");
    const preview = node.querySelector(".preview-character");
    const hair = node.querySelector(".preview-hair");
    const nameInput = node.querySelector('[data-field="name"]');
    const confirmBtn = node.querySelector('[data-action="confirm"]');
    const randomizeBtn = node.querySelector('[data-action="randomize"]');
    const nameError = node.querySelector('[data-field="name-error"]');

    const working = structuredClone(this.state.playerAppearance);
    let nameTouched = Boolean(working.name.trim());

    const applyPreview = () => {
      preview.style.background = `linear-gradient(180deg, ${working.skinTone} 35%, #f97316 35%)`;
      hair.style.background = working.hairColor;
      hair.dataset.style = working.hairStyle.toLowerCase();
      preview.classList.add("animate");
      window.setTimeout(() => preview.classList.remove("animate"), 400);
    };

    const validateName = () => {
      const trimmed = working.name.trim();
      if (!trimmed) {
        return { valid: false, message: "Enter a name to continue." };
      }
      if (trimmed.length > 12) {
        return { valid: false, message: "Name must be 12 characters or fewer." };
      }
      const normalized = trimmed.toLowerCase();
      if (PROHIBITED_NAMES.some((word) => normalized.includes(word))) {
        return { valid: false, message: "That name contains blocked language." };
      }
      return { valid: true, message: "" };
    };

    const updateConfirmState = () => {
      const { valid, message } = validateName();
      confirmBtn.disabled = !valid;
      nameInput.setCustomValidity(message);
      if (nameError) {
        const shouldShow = nameTouched && !valid;
        nameError.textContent = shouldShow ? message : "";
        nameError.hidden = !shouldShow;
      }
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
      nameTouched = true;
      updateConfirmState();
    });
    nameInput.addEventListener("blur", () => {
      nameTouched = true;
      updateConfirmState();
    });

    randomizeBtn.addEventListener("click", () => {
      working.skinTone = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
      working.hairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
      working.hairStyle = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)];
      working.name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
      nameInput.value = working.name;
      nameTouched = true;
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
      if (action === "confirm") {
        const { valid } = validateName();
        if (!valid) {
          nameTouched = true;
          updateConfirmState();
          nameInput.focus();
          return;
        }
        this.state.playerAppearance = structuredClone(working);
        this.state.saveSlot = {
          name: working.name,
          appearance: structuredClone(working),
          timestamp: Date.now(),
          progress: "IntroCutscene",
          objectivesComplete: false,
          hallwayPreviewed: false
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
    const stage = node.querySelector(".cutscene-stage");
    const caption = node.querySelector("[data-cutscene-caption]");
    const skipButton = node.querySelector("[data-action=\"skip\"]");
    const progressEl = skipButton.querySelector(".skip-progress");
    const panels = Object.fromEntries(
      CUTSCENE_STEPS.map((step) => [step.id, node.querySelector(`[data-panel="${step.id}"]`)]).filter(([, el]) => Boolean(el))
    );
    const subtitles = Object.fromEntries(
      Object.entries(panels).map(([id, panel]) => [id, panel.querySelector(".cutscene-subtitle")])
    );

    node.querySelectorAll(".letterbox").forEach((box) => box.classList.add("active"));
    progressEl.classList.add("skip-bar");
    progressEl.style.setProperty("--progress", 0);

    const timers = [];
    const typewriters = [];
    const showSubtitles = this.state.settings.gameplay.subtitles;
    const reduceFlashes = this.state.settings.accessibility.reduceFlashes;

    const clearTypewriters = () => {
      while (typewriters.length) {
        const handle = typewriters.pop();
        window.clearInterval(handle);
      }
    };

    const typeSubtitle = (id, text) => {
      const element = subtitles[id];
      if (!element) return;
      clearTypewriters();
      if (!showSubtitles) {
        element.hidden = true;
        element.textContent = "";
        return;
      }
      element.hidden = false;
      element.textContent = "";
      let index = 0;
      const handle = window.setInterval(() => {
        if (index >= text.length) {
          window.clearInterval(handle);
          return;
        }
        element.textContent += text[index];
        index += 1;
      }, 28);
      typewriters.push(handle);
    };

    const showPanel = (id) => {
      Object.entries(panels).forEach(([panelId, panel]) => {
        panel.hidden = panelId !== id;
      });
    };

    const applyStageEffect = (effect) => {
      stage.classList.remove("effect-rumble", "effect-flash", "effect-breath");
      if (!effect) return;
      if (effect === "flash" && reduceFlashes) {
        stage.classList.add("effect-breath");
        return;
      }
      stage.classList.add(`effect-${effect}`);
    };

    const runStep = (index) => {
      const step = CUTSCENE_STEPS[index];
      if (!step) return;
      showPanel(step.id);
      stage.dataset.cutsceneState = step.id;
      caption.textContent = step.caption;
      typeSubtitle(step.id, step.subtitle);
      applyStageEffect(step.effect);
      const timer = window.setTimeout(() => {
        if (index + 1 < CUTSCENE_STEPS.length) {
          runStep(index + 1);
        } else {
          this.finishCutscene();
        }
      }, step.duration);
      timers.push(timer);
    };

    runStep(0);

    let skipEnabled = false;
    const enableSkipTimer = window.setTimeout(() => {
      skipEnabled = true;
      skipButton.dataset.state = "ready";
    }, 3000);
    timers.push(enableSkipTimer);

    let holdStart = null;
    let frameId = null;

    const updateProgress = (now) => {
      if (!holdStart) return;
      const elapsed = now - holdStart;
      const ratio = Math.min(1, elapsed / CUTSCENE_HOLD_DURATION);
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
      clearTypewriters();
      this.finishCutscene();
    };

    skipButton.addEventListener("mousedown", startHold);
    skipButton.addEventListener("touchstart", startHold, { passive: true });
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
        timers.forEach((id) => window.clearTimeout(id));
        clearTypewriters();
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
    const stage = node.querySelector(".cell-stage");
    const characterSize = { width: 60, height: 140 };
    let stageRect = null;
    const doorHint = node.querySelector("[data-door-hint]");
    const objectivesElements = {
      move: node.querySelector('[data-objective="move"]'),
      jump: node.querySelector('[data-objective="jump"]'),
      attack: node.querySelector('[data-objective="attack"]'),
      pause: node.querySelector('[data-objective="pause"]')
    };
    const completionOverlay = node.querySelector(".tutorial-complete");
    const resumeButton = completionOverlay?.querySelector('[data-action="resume-play"]');
    const stepOutButton = completionOverlay?.querySelector('[data-action="step-out"]');
    const completionReturnButton = completionOverlay?.querySelector('[data-action="return-menu"]');
    const hallwayOverlay = node.querySelector(".hallway-preview");
    const hallwayBackButton = hallwayOverlay?.querySelector('[data-action="hallway-back"]');
    const hallwayReturnButton = hallwayOverlay?.querySelector('[data-action="return-menu"]');
    const objectivesState = {
      move: false,
      jump: false,
      attack: false,
      pause: false
    };
    let doorInteractive = false;
    let hallwayVisible = false;

    const showCompletion = () => {
      if (!completionOverlay || !resumeButton || !completionReturnButton) return;
      if (!completionOverlay.hidden) return;
      completionOverlay.hidden = false;
      window.requestAnimationFrame(() => resumeButton.focus());
    };

    const hideCompletion = () => {
      if (!completionOverlay) return;
      completionOverlay.hidden = true;
    };

    const disableDoorInteraction = () => {
      doorInteractive = false;
      door.classList.remove("interactive", "highlight", "open");
      door.setAttribute("aria-hidden", "true");
      door.removeAttribute("role");
      door.removeAttribute("tabindex");
      if (doorHint) {
        doorHint.hidden = true;
        doorHint.classList.remove("show");
      }
    };

    const enableDoorInteraction = () => {
      doorInteractive = true;
      door.classList.add("interactive");
      door.classList.add("open");
      door.removeAttribute("aria-hidden");
      door.setAttribute("role", "button");
      door.tabIndex = 0;
      door.setAttribute("aria-label", "Step into the hallway");
    };

    const bounds = () => {
      if (!stageRect || stageRect.width === 0) {
        stageRect = stage.getBoundingClientRect();
      }
      return stageRect;
    };

    const isNearDoor = () => {
      const rect = bounds();
      if (!rect || !rect.width) return false;
      return position.x + characterSize.width >= rect.width - 160;
    };

    const updateDoorHint = () => {
      if (!doorHint) return;
      if (!doorInteractive || hallwayVisible || paused) {
        door.classList.remove("highlight");
        doorHint.hidden = true;
        doorHint.classList.remove("show");
        return;
      }
      if (isNearDoor()) {
        door.classList.add("highlight");
        doorHint.hidden = false;
        doorHint.classList.add("show");
      } else {
        door.classList.remove("highlight");
        doorHint.hidden = true;
        doorHint.classList.remove("show");
      }
    };

    const openHallwayPreview = () => {
      if (!doorInteractive || hallwayVisible) return;
      hallwayVisible = true;
      paused = true;
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      hideCompletion();
      if (doorHint) {
        doorHint.hidden = true;
        doorHint.classList.remove("show");
      }
      door.classList.remove("highlight");
      if (hallwayOverlay) {
        hallwayOverlay.hidden = false;
        window.requestAnimationFrame(() => hallwayBackButton?.focus());
      }
      if (this.state.saveSlot) {
        this.state.saveSlot.hallwayPreviewed = true;
        this.state.saveSlot.timestamp = Date.now();
        saveState(this.state);
      }
    };

    const closeHallwayPreview = (reopenCompletion = true) => {
      if (!hallwayVisible) return;
      hallwayVisible = false;
      if (hallwayOverlay) hallwayOverlay.hidden = true;
      paused = false;
      window.requestAnimationFrame(() => character.focus());
      startLoop();
      updateDoorHint();
      if (reopenCompletion) {
        showCompletion();
      }
    };

    disableDoorInteraction();

    const handleResize = () => {
      stageRect = stage.getBoundingClientRect();
      updateDoorHint();
    };

    const completeObjective = (key) => {
      if (objectivesState[key]) return;
      objectivesState[key] = true;
      objectivesElements[key]?.classList.add("completed");
      checkAllObjectives();
    };

    const checkAllObjectives = () => {
      if (Object.values(objectivesState).every(Boolean)) {
        enableDoorInteraction();
        const list = node.querySelector(".tutorial-objectives h2");
        list.textContent = "Open the door.";
        node.querySelector(".tutorial-objectives")?.classList.add("complete");
        if (this.state.saveSlot) {
          this.state.saveSlot.progress = "PrisonCell_Tutorial";
          this.state.saveSlot.objectivesComplete = true;
          this.state.saveSlot.timestamp = Date.now();
          saveState(this.state);
        }
        window.setTimeout(showCompletion, 600);
        updateDoorHint();
      }
    };

    const velocity = { x: 0, y: 0 };
    const position = { x: 32, y: 0 };
    const input = { left: false, right: false };
    let grounded = true;
    let attackCooldown = false;
    let animationFrame = null;
    let paused = false;

    const update = () => {
      if (paused) {
        updateDoorHint();
        return;
      }
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
      updateDoorHint();
      animationFrame = window.requestAnimationFrame(update);
    };

    const startLoop = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(update);
    };

    startLoop();
    window.addEventListener("resize", handleResize);
    window.requestAnimationFrame(handleResize);

    const keydown = (event) => {
      if (hallwayVisible) return;
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
      if (hallwayVisible) return;
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
    const hallwayKeyHandler = (event) => {
      if (event.key === "Escape" && hallwayVisible) {
        event.preventDefault();
        closeHallwayPreview();
      }
    };
    window.addEventListener("keydown", hallwayKeyHandler);

    door.addEventListener("click", () => {
      if (!doorInteractive) return;
      openHallwayPreview();
    });

    door.addEventListener("keydown", (event) => {
      if (!doorInteractive) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openHallwayPreview();
      }
    });

    const pauseOverlay = node.querySelector(".pause-overlay");
    const pauseMenu = node.querySelector(".pause-menu");

    const togglePause = (value) => {
      if (hallwayVisible) return;
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
        updateDoorHint();
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

    resumeButton?.addEventListener("click", () => {
      hideCompletion();
      updateDoorHint();
      window.requestAnimationFrame(() => character.focus());
    });

    stepOutButton?.addEventListener("click", () => {
      openHallwayPreview();
    });

    completionReturnButton?.addEventListener("click", () => {
      hideCompletion();
      this.goTo("MainMenu");
    });

    hallwayBackButton?.addEventListener("click", () => {
      closeHallwayPreview();
    });

    hallwayReturnButton?.addEventListener("click", () => {
      closeHallwayPreview(false);
      this.goTo("MainMenu");
    });

    character.addEventListener("focus", () => startLoop());
    window.requestAnimationFrame(() => character.focus());

    if (this.state.saveSlot?.objectivesComplete) {
      Object.keys(objectivesState).forEach((key) => {
        objectivesState[key] = true;
        objectivesElements[key]?.classList.add("completed");
      });
      enableDoorInteraction();
      node.querySelector(".tutorial-objectives h2").textContent = "Open the door.";
      node.querySelector(".tutorial-objectives")?.classList.add("complete");
      window.setTimeout(() => {
        showCompletion();
        updateDoorHint();
      }, 400);
    }

    return {
      node,
      onCleanup: () => {
        window.removeEventListener("keydown", keydown);
        window.removeEventListener("keyup", keyup);
        window.removeEventListener("keydown", hallwayKeyHandler);
        window.removeEventListener("resize", handleResize);
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
    window.requestAnimationFrame(() => {
      const focusTarget = wrapper.querySelector('[role="tab"][aria-selected="true"]');
      focusTarget?.focus();
    });
    wrapper.querySelector("[data-action=\"dismiss\"]").addEventListener("click", close, { once: true });
    return wrapper;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("game-root");
  new Game(root);
});
