const Phaser = window.Phaser;

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Pause' });
  }

  init(data) {
    this.parentSceneKey = data.parentSceneKey;
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

    this.add
      .text(width / 2, height / 2 - 140, 'PAUSED', {
        fontFamily: 'Orbitron',
        fontSize: '46px',
        color: '#1dd1a1',
      })
      .setOrigin(0.5);

    const resume = this.add
      .text(width / 2, height / 2, 'Resume', {
        fontFamily: 'Rajdhani',
        fontSize: '32px',
        color: '#e6f1ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const codex = this.add
      .text(width / 2, height / 2 + 70, 'Open Codex', {
        fontFamily: 'Rajdhani',
        fontSize: '28px',
        color: '#84a9c0',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const quit = this.add
      .text(width / 2, height / 2 + 140, 'Quit to Menu', {
        fontFamily: 'Rajdhani',
        fontSize: '28px',
        color: '#ff6b6b',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    resume.on('pointerdown', () => this.resumeParent());
    codex.on('pointerdown', () => {
      this.scene.launch('Codex');
    });
    quit.on('pointerdown', () => {
      this.scene.stop(this.parentSceneKey);
      this.scene.start('MainMenu');
    });

    this.input.keyboard.once('keydown-ESC', () => this.resumeParent());
  }

  resumeParent() {
    this.scene.resume(this.parentSceneKey);
    this.scene.stop();
  }
}
