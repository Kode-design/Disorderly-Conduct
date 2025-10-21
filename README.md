# Disorderly Conduct

Disorderly Conduct is a top-down, neon-soaked micro-sandbox inspired by classic open-world crime games. Dive into a bustling pixel metropolis, snatch loot, and outrun enforcers as the wanted level ticks upward.

## Features

- **Procedurally-styled city blocks** featuring roads, plazas, waterfronts, and parks.
- **Dash-enabled player movement** with responsive camera follow and motion trails.
- **Roaming civilians and traffic** that react to collisions and escalate your heat.
- **Dynamic wanted system** that summons high-tech enforcers when chaos erupts.
- **Glowing loot crates** scattered across the city to collect while managing your notoriety.
- **Minimalist HUD** with objectives, control reference, and live heat meter.

## Controls

| Action | Input |
| ------ | ----- |
| Move | WASD / Arrow Keys |
| Dash | Spacebar |
| Pause | P or the on-screen Resume button |

## Getting Started

This project is a fully client-side web game. You can play it in any modern browser by opening `index.html`, or serve it locally for hot reloading.

### Quick Play

1. Clone the repository.
2. Open `index.html` in your browser.

### Local Dev Server

Any static file server works. For example, using `npm`:

```bash
npm install
npm run dev
```

(If you prefer not to install dependencies globally, you can run `npx http-server .` or another static server.)

## Development Notes

- Core logic lives in [`src/main.js`](src/main.js) and renders to a pixel-art canvas.
- Styling is handled by [`style.css`](style.css), leaning on retro-futuristic palettes.
- Modify `generateWorld()` in `main.js` to tweak city generation rules or add new biomes.
- Assets are drawn programmatically to keep the footprint light; feel free to extend with custom sprites.

## License

This project is released under the [MIT License](LICENSE).
