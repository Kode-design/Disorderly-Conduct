const Phaser = window.Phaser;

export default class CodexScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Codex' });
  }

  create() {
    const { width, height } = this.scale;
    const entries = this.registry.get('codexEntries');
    const gameState = this.registry.get('gameState');

    this.add.rectangle(width / 2, height / 2, width, height, 0x00131f, 0.92);
    this.add
      .text(width / 2, 60, 'Codex', {
        fontFamily: 'Orbitron',
        fontSize: '42px',
        color: '#1dd1a1',
      })
      .setOrigin(0.5);

    const listContainer = this.add.container(140, 120);
    const detailText = this.add.text(width / 2 + 80, 140, '', {
      fontFamily: 'Rajdhani',
      fontSize: '22px',
      color: '#e6f1ff',
      wordWrap: { width: 460 },
      lineSpacing: 6,
    });

    Object.values(entries).forEach((entry, index) => {
      if (!gameState.hasCodex(entry.id)) {
        return;
      }
      const y = index * 64;
      const itemBg = this.add
        .rectangle(0, y, 360, 52, 0x04121d, 0.85)
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });

      const text = this.add
        .text(16, y, entry.title, {
          fontFamily: 'Rajdhani',
          fontSize: '22px',
          color: '#e6f1ff',
        })
        .setOrigin(0, 0.5);

      itemBg.on('pointerdown', () => {
        detailText.setText(entry.body);
      });

      listContainer.add(itemBg);
      listContainer.add(text);
    });

    this.add
      .text(width - 60, height - 40, 'Press ESC to close', {
        fontFamily: 'Rajdhani',
        fontSize: '20px',
        color: '#84a9c0',
      })
      .setOrigin(1, 0.5);

    this.input.keyboard.once('keydown-ESC', () => this.scene.stop());
    this.input.once('pointerdown', () => this.scene.stop());
  }
}
