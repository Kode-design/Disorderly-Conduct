# Disorderly Conduct

Disorderly Conduct is a top-down, neon-soaked micro-sandbox inspired by classic open-world crime games—reimagined with a 2025 pixel aesthetic. Dive into a bustling synth metropolis, snatch loot, and outrun enforcers as the wanted level ticks upward.

## Features

- **Procedural neon sprawl** with roads, plazas, waterfronts, and lush park pockets laid out on a Manhattan-style grid.
- **Day/night lighting and reactive weather** that blend atmospheric gradients, ion rain, and holographic haze across the city.
- **Animated hologram billboards** and synthwave scanline overlays that sell the futuristic pixel mood.
- **Dash-enabled movement** with dynamic camera shake, luminous trails, and responsive collisions.
- **Roaming civilians, traffic, and enforcer patrols** that escalate your heat and chase you through alleyways.
- **Glassmorphic HUD** featuring City Pulse readouts, vitals, objectives, and accessibility-friendly live status messaging.

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

- Core gameplay, atmosphere systems, and rendering live in [`src/main.js`](src/main.js).
- Styling, glass UI, and layout are in [`style.css`](style.css); tweak variables in `:root` to reskin the palette quickly.
- `generateWorld()` orchestrates city generation, while `updateWorldAtmosphere()` drives the day/night cycle and weather.
- `seedBillboards()` and `drawBillboards()` manage holographic signage—swap out slogans or colors to theme new districts.
- Assets are drawn programmatically to keep the footprint light; feel free to extend with custom sprites or imported pixel art.

## License

This project is released under the [MIT License](LICENSE).
