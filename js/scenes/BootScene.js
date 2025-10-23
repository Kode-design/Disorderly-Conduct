import GameState from '../state/GameState.js';
import { missions, storyChapters, codexEntries } from '../data/storyData.js';
import { maps, tileSize } from '../data/mapData.js';

const Phaser = window.Phaser;

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload() {}

  create() {
    const gameState = new GameState();
    gameState.unlockCodex('protagonist');
    this.registry.set('gameState', gameState);
    this.registry.set('missions', missions);
    this.registry.set('storyChapters', storyChapters);
    this.registry.set('codexEntries', codexEntries);
    this.registry.set('maps', maps);
    this.registry.set('tileSize', tileSize);

    this.generateTextures();

    this.scene.start('MainMenu');
  }

  generateTextures() {
    const g = this.add.graphics();

    const createRect = (key, color, width = tileSize, height = tileSize) => {
      g.clear();
      g.fillStyle(color, 1);
      g.fillRoundedRect(0, 0, width, height, 8);
      g.generateTexture(key, width, height);
    };

    createRect('player', 0x1dd1a1, tileSize * 0.7, tileSize * 0.7);
    createRect('player-stealth', 0x0f7862, tileSize * 0.7, tileSize * 0.7);
    createRect('enemy', 0xff6b6b, tileSize * 0.7, tileSize * 0.7);
    createRect('larry', 0xffd166, tileSize * 0.8, tileSize * 0.8);
    createRect('sera', 0x7f5af0, tileSize * 0.8, tileSize * 0.8);

    // Floor texture with subtle grid
    g.clear();
    g.fillStyle(0x07121c, 1);
    g.fillRect(0, 0, tileSize, tileSize);
    g.lineStyle(2, 0x0f2a3c, 1);
    g.strokeRect(1, 1, tileSize - 2, tileSize - 2);
    g.generateTexture('floor', tileSize, tileSize);

    // Wall texture
    g.clear();
    g.fillStyle(0x0d1e2b, 1);
    g.fillRect(0, 0, tileSize, tileSize);
    g.lineStyle(3, 0x1dd1a1, 0.4);
    g.strokeRect(0, 0, tileSize, tileSize);
    g.generateTexture('wall', tileSize, tileSize);

    // Door texture locked/unlocked
    g.clear();
    g.fillStyle(0x123a4d, 1);
    g.fillRect(0, 0, tileSize, tileSize);
    g.fillStyle(0xffd166, 1);
    g.fillRect(tileSize * 0.4, 4, tileSize * 0.2, tileSize - 8);
    g.generateTexture('door-locked', tileSize, tileSize);

    g.clear();
    g.fillStyle(0x134a62, 1);
    g.fillRect(0, 0, tileSize, tileSize);
    g.fillStyle(0x1dd1a1, 1);
    g.fillRect(tileSize * 0.35, 4, tileSize * 0.3, tileSize - 8);
    g.generateTexture('door-open', tileSize, tileSize);

    // Food
    g.clear();
    g.fillStyle(0xc3f584, 1);
    g.fillCircle(tileSize / 2, tileSize / 2, tileSize / 3);
    g.lineStyle(3, 0x5bba6f, 1);
    g.strokeCircle(tileSize / 2, tileSize / 2, tileSize / 3);
    g.generateTexture('food', tileSize, tileSize);

    // Terminal
    g.clear();
    g.fillStyle(0x07283c, 1);
    g.fillRect(0, 0, tileSize, tileSize);
    g.fillStyle(0x1dd1a1, 1);
    g.fillRect(8, 8, tileSize - 16, tileSize / 2);
    g.fillStyle(0xffd166, 1);
    g.fillRect(8, tileSize / 2 + 8, tileSize - 16, tileSize / 4);
    g.generateTexture('terminal', tileSize, tileSize);

    // Wallet loot
    g.clear();
    g.fillStyle(0x0c2b3a, 1);
    g.fillRoundedRect(0, 0, tileSize, tileSize, 12);
    g.fillStyle(0xffd166, 1);
    g.fillRect(8, tileSize / 2 - 6, tileSize - 16, 12);
    g.generateTexture('loot-wallet', tileSize, tileSize);

    // Qubit loot
    g.clear();
    g.fillStyle(0x091c2a, 1);
    g.fillRoundedRect(0, 0, tileSize, tileSize, 12);
    g.lineStyle(3, 0x7f5af0, 1);
    g.strokeRoundedRect(4, 4, tileSize - 8, tileSize - 8, 10);
    g.fillStyle(0x1dd1a1, 1);
    g.fillCircle(tileSize / 2, tileSize / 2, tileSize / 4);
    g.generateTexture('loot-qubit', tileSize, tileSize);

    // Bullet
    g.clear();
    g.fillStyle(0xfff275, 1);
    g.fillRect(0, 0, 10, 4);
    g.fillStyle(0xffc947, 1);
    g.fillRect(6, 1, 4, 2);
    g.generateTexture('bullet', 10, 4);

    // Sonic ping for minimap/noise visualization
    g.clear();
    g.lineStyle(2, 0x1dd1a1, 1);
    g.strokeCircle(tileSize / 2, tileSize / 2, tileSize / 2 - 4);
    g.generateTexture('noise-ping', tileSize, tileSize);

    // HUD minimap backdrop
    g.clear();
    g.fillStyle(0x020b12, 0.82);
    g.fillRoundedRect(0, 0, 160, 160, 12);
    g.lineStyle(2, 0x1dd1a1, 0.6);
    g.strokeRoundedRect(0, 0, 160, 160, 12);
    g.generateTexture('hud-minimap', 160, 160);

    // Cover
    g.clear();
    g.fillStyle(0x17303f, 1);
    g.fillRect(0, 0, tileSize, tileSize);
    g.lineStyle(4, 0x7f5af0, 0.6);
    g.strokeRect(2, 2, tileSize - 4, tileSize - 4);
    g.generateTexture('cover', tileSize, tileSize);

    // Generator
    g.clear();
    g.fillStyle(0x0c2b3a, 1);
    g.fillRect(0, 0, tileSize, tileSize);
    g.fillStyle(0xff6b6b, 1);
    g.fillRect(8, 8, tileSize - 16, tileSize - 16);
    g.generateTexture('generator', tileSize, tileSize);

    g.destroy();
  }
}
