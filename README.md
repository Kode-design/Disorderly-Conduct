# Disorderly Conduct Demo

A single-page web prototype that walks through the vertical-slice experience for **Disorderly Conduct** — from the boot screen to the prison tutorial.

## Getting Started

1. Clone or download this repository.
2. Open `index.html` in any modern desktop browser (Chrome, Edge, Firefox, Safari). No build step is required.
3. Keep the browser console open during development to surface potential warnings or errors.

> **Tip:** If you prefer to run a local web server, `npx serve` or `python -m http.server` from the project root works great.

## Game Flow

1. **Boot Screen** – brief splash before the title appears.
2. **Title Screen** – press <kbd>Enter</kbd> or click to reach the main menu.
3. **Main Menu**
   - **Start** – begins a new game with a pre-filled (random) name so you can dive in immediately.
   - **Continue / Load** – resume your last save or pick from existing slots.
   - **Settings / Extras** – tweak the experience or browse lore & credits.
4. **Character Creator** – adjust skin tone, hair, and name. The confirm button is enabled from the start thanks to the auto-generated name, but you can customise anything before proceeding.
5. **Intro Cutscene** – cinematic setup; hold the skip button if you want to jump ahead.
6. **Prison Cell Tutorial** – clear the move/jump/attack/pause objectives to unlock the door, preview the hallway, and wrap the demo.

Progress (including appearance, settings, and tutorial completion) automatically saves to `localStorage` under the key `disorderlyConductDemoState-v1`.

## Controls

| Context | Keyboard / Mouse |
| --- | --- |
| Global | <kbd>F1</kbd> toggles the accessibility preview mode. |
| Menus | <kbd>Enter</kbd>/<kbd>Space</kbd> to select, arrow keys to navigate, <kbd>Esc</kbd> to back. |
| Character Creator | Click or use arrows to change options; type directly into the name field. |
| Cutscene | Hold the on-screen skip button or keep watching. |
| Tutorial | <kbd>A</kbd>/<kbd>D</kbd> or arrow keys to move, <kbd>Space</kbd> to jump, <kbd>J</kbd> to punch, <kbd>Esc</kbd> to pause. |

## Accessibility & Settings

* Subtitle toggles and sizing scale with the Gameplay settings tab.
* Colourblind preview modes apply a CSS token to the document body.
* Hold-to-skip interactions respect the "Hold-to-Press" accessibility toggle.

Settings persist per browser profile and update live as you adjust sliders or toggles.

## Project Structure

```
index.html   # Static markup templates for every scene
styles.css   # Styling, animations, and responsive treatments
main.js      # Game state, scene rendering, and interaction logic
```

Feel free to iterate on any layer — this repo is intentionally dependency-free so you can focus on gameplay and UI polish.
