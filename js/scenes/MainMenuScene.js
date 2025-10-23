const Phaser = window.Phaser;

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 180, 'DISORDERLY CONDUCT', {
        fontFamily: 'Orbitron',
        fontSize: '56px',
        color: '#1dd1a1',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 110, 'A top-down heist RPG set in 2030', {
        fontFamily: 'Rajdhani',
        fontSize: '24px',
        color: '#e6f1ff',
      })
      .setOrigin(0.5);

    const button = this.add
      .rectangle(width / 2, height / 2, 300, 70, 0x1dd1a1, 0.8)
      .setInteractive({ useHandCursor: true });

    const buttonText = this.add
      .text(width / 2, height / 2, 'START NEW RUN', {
        fontFamily: 'Orbitron',
        fontSize: '24px',
        color: '#00151f',
      })
      .setOrigin(0.5);

    button.on('pointerdown', () => {
      this.scene.start('Character');
    });

    const helpText = this.add
      .text(width / 2, height - 80, 'Press F1 for controls · Press C for Codex', {
        fontFamily: 'Rajdhani',
        fontSize: '22px',
        color: '#84a9c0',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: helpText,
      alpha: 0.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('Character'));
    this.input.keyboard.once('keydown-C', () => this.scene.launch('Codex'));

    window.dispatchEvent(new CustomEvent('phaser-show-help'));
  }
}
