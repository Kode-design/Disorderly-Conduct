const Phaser = window.Phaser;

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    const { width } = scene.scale;

    this.panel = scene.add.rectangle(0, 0, width, 120, 0x020b12, 0.82).setOrigin(0, 0).setScrollFactor(0);
    this.panel.setStrokeStyle(2, 0x1dd1a1, 0.6);

    this.healthText = scene.add
      .text(24, 18, 'HP: 100', {
        fontFamily: 'Rajdhani',
        fontSize: '22px',
        color: '#ff6b6b',
      })
      .setScrollFactor(0);

    this.stealthText = scene.add
      .text(24, 50, 'Stealth: 0', {
        fontFamily: 'Rajdhani',
        fontSize: '20px',
        color: '#84a9c0',
      })
      .setScrollFactor(0);

    this.walletText = scene.add
      .text(24, 82, 'Wallet: 0 Bc2', {
        fontFamily: 'Rajdhani',
        fontSize: '20px',
        color: '#ffd166',
      })
      .setScrollFactor(0);

    this.objectiveText = scene.add
      .text(width - 24, 18, '', {
        fontFamily: 'Rajdhani',
        fontSize: '20px',
        color: '#e6f1ff',
        align: 'right',
        wordWrap: { width: 520 },
      })
      .setScrollFactor(0)
      .setOrigin(1, 0);

    this.alertBar = scene.add
      .rectangle(width - 180, 90, 300, 16, 0x1dd1a1, 0.3)
      .setScrollFactor(0)
      .setOrigin(1, 0.5);

    this.alertFill = scene.add
      .rectangle(width - 180, 90, 0, 16, 0xff6b6b, 0.6)
      .setScrollFactor(0)
      .setOrigin(1, 0.5);

    this.alertLabel = scene.add
      .text(width - 180, 70, 'Alert', {
        fontFamily: 'Rajdhani',
        fontSize: '18px',
        color: '#ff6b6b',
      })
      .setScrollFactor(0)
      .setOrigin(1, 0.5);
  }

  updateStats(stats) {
    this.healthText.setText(`HP: ${Math.round(stats.health)}/${stats.maxHealth}`);
    this.stealthText.setText(`Stance: ${stats.stealthMode ? 'STEALTH' : 'ENGAGED'}`);
    this.walletText.setText(`Wallet: ${stats.wallet.toLocaleString()} Bc2`);
  }

  updateObjectives(title, lines) {
    this.objectiveText.setText(`${title}\n${lines.map((l) => `• ${l}`).join('\n')}`);
  }

  updateAlert(level) {
    const clamped = Phaser.Math.Clamp(level, 0, 1);
    this.alertFill.width = 300 * clamped;
    this.alertFill.setFillStyle(clamped > 0.6 ? 0xff6b6b : 0x1dd1a1, 0.6);
  }
}
