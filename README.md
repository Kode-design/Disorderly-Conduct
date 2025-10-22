# Disorderly Conduct

A web-based top-down action RPG set in 2030 where cryptocurrency runs the world. You play as a street-level thief teaming with the getaway driver Larry to topple the Helios exchange.

## Features

- **Four-chapter campaign** that spans an hour of narrative, from a gas station heist to a stock exchange blackout.
- **Top-down shooter combat** with stealth, sprinting, reloads, and dynamic noise generation that summons reinforcements.
- **RPG-lite systems** including consumable food, keycard-gated doors, intel collection, and mission objectives that evolve with story beats.
- **Cinematic interludes** before and after each mission delivered through in-game dialogue panels.
- **Mission timeline log** capturing key beats, loot events, and Larry's comm chatter.

## Controls

| Action | Input |
| --- | --- |
| Move | `WASD` |
| Sprint | `Shift` |
| Aim | Mouse |
| Fire | Left Mouse Button |
| Reload | `R` |
| Interact / Open doors | `E` |
| Consume food | `F` |

## Getting Started

The project is entirely client-side with no build step required.

1. Serve the `src` directory with any static server (for example `npx serve src` or VSCode Live Server).
2. Open `http://localhost:3000` (or the port provided by your server) in your browser.
3. Click **Begin the Heist** to start the campaign.

## Structure

```
src/
├─ index.html   # Landing overlay, HUD, and canvas
├─ style.css    # UI styling and neon-inspired visuals
└─ main.js      # Core gameplay loop, campaign data, and scene management
```

## Roadmap Ideas

- Add sprite sheets or WebGL shaders for richer visuals.
- Introduce save slots, weapon upgrades, and skill trees.
- Expand AI with cone-based stealth detection and squad tactics.
- Integrate ambient audio and voice-over for Larry's comms.
