# Disorderly-Conduct
A game inspired by GTA/crime games

# Disorderly Conduct — Demo README

> **Scope:** Vertical-slice demo covering Main Menu → Character Creation → Intro Cutscene → Prison Cell movement test. No open world yet.

## 1) Game Overview

* **Genre:** 2D side‑scroller, crime action/drama
* **Camera:** 2D side view, parallax background
* **Demo Pillars:** Quick onboarding, expressive character creator (limited), strong tone through intro cutscene, responsive movement feel

---

## 2) High-Level Flow (State Machine)

```
Boot → TitleScreen → MainMenu → (Start | Load | Settings | Extras | Quit)

Start → CharacterCreator → Confirm → IntroCutscene → PrisonCell_Tutorial → (PauseMenu available)

Load → SaveSelect → (if valid) → Appropriate scene

PauseMenu → Resume | Settings | Controls | Accessibility | QuitToMenu
```

**Scene IDs**

* `TitleScreen`
* `MainMenu`
* `CharacterCreator`
* `IntroCutscene`
* `PrisonCell_Tutorial`
* `SaveSelect`
* `Settings` (modal/panel)
* `PauseMenu` (overlay)

---

## 3) Main Menu Spec

**Entry:** Fade-in from black to animated logo and ambient rain SFX.

**Default focus order (keyboard/controller):** Start → Load → Settings → Extras → Quit.

**Items**

1. **Start**

   * New game. If an autosave exists, show "Overwrite existing save?" (Yes/No).
2. **Load**

   * Opens **Save Select** grid/list. Slots show: thumbnail, chapter/scene, playtime, timestamp.
3. **Continue** *(auto-shown if a valid save exists)*

   * Boot directly into latest save.
4. **Settings** (opens modal with tabs)

   * **Audio:** Master/Music/SFX sliders (0–100), Mute toggles
   * **Video:** Resolution, Fullscreen/Windowed, VSync, Frame limit (30/60/120/Unlimited)
   * **Gameplay:** Subtitles on/off, Subtitle size (S/M/L), Language placeholder
   * **Controls:** Rebinds + sensitivity for gamepad/keyboard
   * **Accessibility:** Colorblind-safe palettes (for UI), Reduce flashes, Hold-to-press vs Toggle, Remap-friendly prompts
5. **Extras**

   * **Credits**, **Legal**, **Licenses** (3rd-party), **Concept Art (stub)**
6. **Quit**

   * Desktop: exits application. Consoles: returns to system.

**Background behavior:** Parallax city loop, rain particles, menu SFX.

**Input Hints:** Bottom bar shows `Enter/A = Select`, `Esc/B = Back`, `F1 = Toggle Accessibility Preview`.

---

## 4) Character Creator (Constrained for Demo)

**Goal:** Create first character wearing **orange jumpsuit** (locked clothing), customize **skin tone** and **hair** (style & color). Enter name.

**Panels**

1. **Appearance** (carousel or grid)

   * **Skin Tone:** 8-step curated palette (tonal range with equal luminance steps)
   * **Hair Style:** 10 options (short, buzz, medium, long, pony, bun, mohawk, afro, undercut, shaved)
   * **Hair Color:** 10 colors (black, dark brown, brown, light brown, blonde, platinum, red, auburn, gray, white)
   * **Outfit:** *Locked: Orange Jumpsuit* (tooltip: "Issued on intake; change later.")
2. **Identity**

   * **Name Entry** (12 chars max; profanity filter placeholder)
   * **Randomize** (cycles skin/hair/name)

**3D/2D Preview**

* 2D character preview on turntable idle (left/right sway), swap pose when changing hair.
* Context lighting matches cutscene palette for continuity.

**Controls**

* `←/→` change selection, `↑/↓` switch category, `Enter` confirm, `Esc` back.

**CTA Buttons**

* **Confirm** (enabled once a name is valid)
* **Back** (to Main Menu)

**Save on Confirm**

* Persist `player_appearance` into save stub.

---

## 5) Intro Cutscene → Prison Cell Tutorial

**Style:** In‑engine scripted scene (letterbox bars), skippable after 3 seconds.

**Beats**

1. Black → siren light sweep → guard grunt VO.
2. Character in **orange jumpsuit** is **shoved into a cell**; camera shake + door slam SFX.
3. Guard barks: "Welcome home, hero." (subtitle on)
4. Bars close; control returns as letterbox lifts. **Objective:** "Test your moves." appears.

**Tutorial Objectives (PrisonCell_Tutorial)**

* Move left/right
* Jump (coyote time + input buffer)
* Crouch (if included) / Interact with bed (tooltip)
* Dash (if included) / Roll (optional)
* Light attack (air and ground) — dummy target in cell corner
* Pause menu test

**Environment**

* Small side‑view cell: bunk, toilet, barred door; subtle parallax corridor.
* Interactive markers show inputs the first time.

**Exit Condition**

* After completing all prompts, door opens slightly, fade to black → **Demo End** screen (or continue to next slice if ready).

---

## 6) Controls (Default)

* **Move:** `A/D` or `←/→`
* **Jump:** `Space`
* **Dash (if enabled):** `Left Shift`
* **Attack:** `J`
* **Interact:** `E`
* **Pause:** `Esc`
* **Gamepad:** Left Stick move, `A` Jump, `X` Attack, `B` Dash, `Y` Interact, `Start` Pause

---

## 7) Data Model (Demo)

```jsonc
// save_slot_#.json (stub)
{
  "meta": {
    "version": 1,
    "created_at": "ISO-8601",
    "playtime_s": 0
  },
  "player": {
    "name": "string",
    "appearance": {
      "skin_tone_index": 0,
      "hair_style_id": "mohawk",
      "hair_color_index": 3,
      "outfit": "orange_jumpsuit"
    }
  },
  "progress": {
    "scene_id": "PrisonCell_Tutorial",
    "checkpoint": "cell_start"
  },
  "settings_snapshot": {
    "difficulty": "normal",
    "accessibility": { "reduce_flashes": false, "colorblind_ui": false }
  }
}
```

**Enumerations**

* `hair_style_id ∈ { buzz, short, medium, long, pony, bun, mohawk, afro, undercut, shaved }`
* `hair_color_index ∈ [0..9]`, `skin_tone_index ∈ [0..7]`

---

## 8) UI/UX Rules

* **Focus Management:** Always keep a visible focus ring; wrap-around nav on carousels.
* **Readability:** Minimum 4.5:1 contrast for UI text.
* **Subtitles:** Enabled by default; indicate speaker with tag (e.g., `[Guard]`).
* **Skips:** Hold-to-skip for cutscene with 1.5s hold; single-tap after 3s grace.

---

## 9) Audio/Visual Direction (Demo Slice)

* **Audio:** Rain & hum in menus; metal slam, footsteps, guard bark lines in cutscene; soft UI blips.
* **Music:** Low, tension synth bed; pause menu muffles SFX by −6 dB.
* **VFX:** Screen shake on shove/door; light sweep; minimal spark particles.
* **Color:** Muted cold palette; **orange jumpsuit** stands out as focal color.

---

## 10) Technical Notes (Implementation-Agnostic)

* **Scene Loader:** Single entry `GoTo(scene_id)` with fade out/in; preserves `GameState` (settings + save context).
* **Pause Stack:** Pausable gameplay layers; UI remains responsive at 0 time scale.
* **Localization Ready:** All strings routed through a `tr(key)` map; English only in demo data.
* **Input:** Action mapping layer (supports keyboard + controller rebinding); glyphs swap based on device.
* **Performance:** Cap at 60 FPS by default; deterministic physics tick (e.g., 60 Hz fixed).

---

## 11) Acceptance Criteria

* **Menu**

  * Start/Load/Settings/Extras/Quit functional; Continue shows when save exists.
  * Settings persist across sessions; basic rebind works.
* **Character Creator**

  * Name, Skin, Hair style/color selectable; preview updates in real time.
  * Orange jumpsuit locked; tooltip visible.
  * Confirm writes save stub and proceeds.
* **Cutscene**

  * Shove → cell → door slam → guard line; skippable after 3s.
  * Letterbox bars animate in/out; subtitles work.
* **Tutorial**

  * Prompts for move/jump/attack/pausing; all complete to unlock door.
  * Pause menu functional; resume returns correctly.

---

## 12) Tasks Breakdown (Sprint‑ish)

**Menu & Shell**

* Title + Main Menu layout & navigation
* Save system stubs (slots, thumbnails placeholder)
* Settings panel with tabs (persist)

**Character Creator**

* Appearance palette + style list
* Name input + randomize
* Preview renderer (2D turntable)

**Narrative & Tutorial**

* Cutscene timeline (camera, SFX, subtitles)
* PrisonCell level (art blockout + colliders)
* Tutorial prompt manager + completion

**QA/Polish**

* Focus/hover states & sounds
* Fade transitions; letterbox
* Basic telemetry (time to confirm, tutorial completion)

---

## 13) Strings (EN demo)

* Title: **Disorderly Conduct**
* Buttons: **Start**, **Continue**, **Load**, **Settings**, **Extras**, **Quit**, **Confirm**, **Back**, **Resume**, **Controls**, **Accessibility**
* Tooltips: "Issued on intake; change later.", "Overwrite existing save?"
* Subtitles: `[Guard] Welcome home, hero.`
* Objectives: "Test your moves.", "Open the door." (on completion)

---

## 14) File/Folder Suggestions (agnostic)

```
/Content
  /UI
    MainMenu
    CharacterCreator
    PauseMenu
  /Scenes
    TitleScreen
    CharacterCreator
    IntroCutscene
    PrisonCell_Tutorial
  /Audio
    ui_blip.wav
    door_slam.wav
    guard_bark_01.wav
  /Localization
    en.json
  /Saves
    slot_01.json (example)
```

---

## 15) Future Hooks (Post‑demo)

* Hair physics and accessories
* Expanded creator (face features, body sliders)
* Heat/Notoriety system & city hub
* Combat depth (parry, stun, crowd control)

---

**End of Demo README (v0.1)**
