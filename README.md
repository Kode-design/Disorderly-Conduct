# Disorderly Conduct

Disorderly Conduct is a browser-based, side-scrolling crime caper inspired by the high-stakes energy of classic open-world getaways. Built with vanilla HTML, CSS, and JavaScript, the game walks you through a fully scripted convenience-store heist—now centered on ripping the shop's BC2 cryptocurrency wallet—that swiftly goes sideways.

## Features

- **Operational timeline HUD** – A mission tracker, radio comms log, intel feed, and dual Heat/Focus meters keep the score readable. Focus drifts with mistakes while the heat meter pumps into the ambient synth mix.
- **Expanded customization** – Randomize or hand-pick an alias, mix jacket, pant, accent, glove, and shoe palettes, and choose a mask style and attitude that remix dialogue beats and comms flavor.
- **Ambient audio engine** – Toggle a procedural synth bed that swells with rising heat and fractures when focus crumbles. Short stingers punctuate successes, failures, and dispatch chatter.
- **Interactive minigames** – Crack the convenience-store mag-lock with a precision keyboard sequence, reroute the CCTV junction via an arrow-key circuit trace, then siphon the BC2 wallet through a neon crypto-hacking handshake.
- **Layered storefront interior** – Breach the mag-lock to expose the recessed shop floor, step past the glowing door frame, and square up to the clerk tucked safely behind the counter.
- **Reactive tutorial** – Dynamic obstacles, accomplice callouts, timeline pulses, and intel alerts respond to delays, collisions, or hesitations, ratcheting pressure as the clerk reaches for the panic alarm.
- **Inevitable finale** – Police box you in, the accomplice disappears down a side street, and the capture overlay chronicles how the run imploded.

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
- **Siphon the BC2 wallet:** Press `E` at the glowing terminal to trigger the crypto handshake prompts (F/G/H/J/V/B and 1–4)
- **Lockpick prompts:** Follow the on-screen key sequence (Q, W, E, R, A, S, D)
- **CCTV circuit trace:** Match the glowing arrow key path after slipping inside

## Tutorial Flow Highlights

1. **Recon & sync** – Approach your accomplice, pulse the timeline into the next beat, and steady your focus meter.
2. **Lockpick sequence** – Clear the mag-lock via the QWER/ASD prompt before the cameras stir.
3. **Loop CCTV** – Step onto the interior floor through the opened doorway, jam the glowing panel with the arrow-key circuit minigame, and watch the timeline acknowledge the ghosted feeds while the clerk frets behind the counter.
4. **Control the clerk** – Hold `E` once you breach the counter to keep the fear bar full; flagging focus or heat spikes trigger new intel and comms warnings.
5. **Grab & go** – Hijack the BC2 wallet by cycling neon handshake prompts as the intel feed warns of silent-alarm escalations.
6. **Street dash** – Sprint toward the alley, hop road crew barricades, and listen as the ambient mix boils when heat hits the redline.
7. **Capture** – Cruisers box you in, the accomplice bails, and the capture overlay wraps the run.

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
