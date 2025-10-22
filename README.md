# Disorderly Conduct

Disorderly Conduct is a fully playable top-down shooter RPG built in Phaser 3. The game follows Nova and their getaway driver Larry in a neon-drenched 2030 megasprawl as they rise from gas station stickups to dismantling Hyperion Financial's hold over bitcoin-II.

## Play the game

Open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge). No build step is required — all assets are generated at runtime.

## Core Features

- **Character creation:** Choose Nova's background, perk, and name to customize stats, stealth, and hacking capability.
- **Narrative campaign (~1 hour):** Four missions with dialogue-rich story chapters covering the gas station heist, Neon Lot alliance, Hyperion annex raid, and finale broadcast.
- **Top-down combat & stealth:** Twin-stick aiming with WASD movement, stealth stance toggles, suppressible alert meter, and holo-decoy gadgetry.
- **Living enemy AI:** Guards sweep with patrol/search/investigate/combat states, vision cones, and responsive hearing that reacts to your noise footprint.
- **RPG interactions:** Hack terminals via mini-games, open locked doors, pick up food for buffs, gather loot (cold wallets, qubits), and interact with allies for branching outcomes.
- **Dynamic HUD + minimap:** A refreshed HUD tracks ammo, infiltration rating, noise, and alert levels alongside a live minimap of threats and exits.
- **Mission log & codex:** TAB opens a live objective tracker and journal. Unlock lore entries about locations, factions, and technology.
- **Atmospheric lighting:** Dynamic light sources, generator-powered ambience, and stealth-sensitive player glow immerse each map.

## Controls

| Action | Input |
| --- | --- |
| Move | WASD |
| Aim | Mouse |
| Fire | Left mouse button |
| Toggle stealth | Shift |
| Interact | E |
| Deploy holo-decoy | Q |
| Reload | R |
| Mission log | Tab |
| Pause | Esc |
| Show help overlay | F1 |
| Advance dialogue | Space / Click |

## Development Notes

- Built with Phaser 3 (via CDN) and modular ES6 scenes.
- All textures are procedurally generated in `BootScene` to keep the repo asset-light.
- Maps, missions, and codex data live in `js/data/`.
- `GameScene` now layers in advanced AI, stealth acoustics, dynamic lights, a minimap renderer, and mission-performance scoring.

Enjoy causing some disorderly conduct! Nova's fate is in your hands.
