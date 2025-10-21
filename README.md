# Disorderly Conduct

Disorderly Conduct is a browser-based, side-scrolling crime caper inspired by the high-stakes energy of classic open-world getaways. Built with vanilla HTML, CSS, and JavaScript, the game walks you through a fully scripted convenience-store heist that swiftly goes sideways.

## Features

- **Cinematic flow** – Navigate a moody menu, review the control primer, and drop straight into the robbery scenario without loading screens.
- **Expanded customization** – Randomize or hand-pick an alias, mix-and-match jacket, pant, accent, glove, and shoe palettes, and choose a mask style and attitude that color in-game banter.
- **Living HUD** – Track objectives, dialogue, a dynamic heat meter, and an intel feed that chronicles every slip-up and tactical note in real time.
- **Interactive minigames** – Crack the convenience store mag-lock with a key-sequence challenge, then manage a tension meter by holding the clerk at bay before scooping cash with precision.
- **Reactive tutorial** – Parallax skylines, environmental obstacles, and branching dialogue react to your inputs as you sprint, collide with barricades, or let the clerk inch toward the panic alarm.
- **Inevitable finale** – Police units swarm the alley, your randomly named accomplice flees, and the capture overlay summarizes the fallout of the botched score.

## Getting Started

No build tools are required. Open `index.html` in any modern desktop browser to play.

```bash
# from the repository root
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux (with xdg-utils installed)
```

## Controls

- **Move:** `A` / `D` or arrow keys
- **Jump:** `Space`
- **Interact / threaten:** `E`
- **Hold the clerk at bay:** Hold `E` during the intimidation phase
- **Scoop the register:** Hold `E` while inside the cash zone
- **Lockpick prompts:** Follow the on-screen key sequence (Q, W, E, R, A, S, D)

## Tutorial Flow Highlights

1. **Recon & sync** – Approach your accomplice and signal when you are ready to breach.
2. **Lockpick sequence** – Complete the key prompt minigame to bypass the QuickFix Mart door quietly.
3. **Control the clerk** – Hold `E` to keep the fear meter high; slip-ups raise the heat and encourage the clerk to tap the alarm.
4. **Grab & go** – Scoop the cash while monitoring the intel log for silent alarm updates.
5. **Street dash** – Sprint toward the alley, jumping new barricade obstacles as the heat meter spikes.
6. **Capture** – Police box you in, the accomplice ditches you, and the capture overlay delivers the bleak wrap-up.

## Project Structure

```
├── AGENTS.md          # Repository-specific assistant instructions
├── index.html         # Main entry point with menu, customization, and game canvas
├── styles.css         # Visual styling for UI screens and in-game HUD
├── game.js            # Gameplay logic, rendering, and tutorial scripting
└── README.md          # You are here
```

## License

Distributed under the MIT License. See `LICENSE` for more information.
