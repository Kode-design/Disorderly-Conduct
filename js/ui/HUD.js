const Phaser = window.Phaser;

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    const { width } = scene.scale;

    this.panel = scene.add.rectangle(0, 0, width, 170, 0x020b12, 0.82).setOrigin(0, 0).setScrollFactor(0);
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

    this.ammoText = scene.add
      .text(24, 82, 'Ammo: 0/0', {
        fontFamily: 'Rajdhani',
        fontSize: '20px',
        color: '#e6f1ff',
      })
      .setScrollFactor(0);

    this.walletText = scene.add
      .text(24, 114, 'Wallet: 0 Bc2', {
        fontFamily: 'Rajdhani',
        fontSize: '20px',
        color: '#ffd166',
      })
      .setScrollFactor(0);

    this.infiltrationText = scene.add
      .text(24, 146, 'Infiltration: 100', {
        fontFamily: 'Rajdhani',
        fontSize: '20px',
        color: '#1dd1a1',
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

    this.noiseBar = scene.add
      .rectangle(width - 180, 126, 300, 12, 0x84a9c0, 0.24)
      .setScrollFactor(0)
      .setOrigin(1, 0.5);

    this.noiseFill = scene.add
      .rectangle(width - 180, 126, 0, 12, 0x00bcd4, 0.6)
      .setScrollFactor(0)
      .setOrigin(1, 0.5);

    this.noiseLabel = scene.add
      .text(width - 180, 106, 'Noise', {
        fontFamily: 'Rajdhani',
        fontSize: '18px',
        color: '#84a9c0',
      })
      .setScrollFactor(0)
      .setOrigin(1, 0.5);
  }

  updateStats(stats) {
    this.healthText.setText(`HP: ${Math.round(stats.health)}/${stats.maxHealth}`);
    this.stealthText.setText(`Stance: ${stats.stealthMode ? 'STEALTH' : 'ENGAGED'}`);
    this.ammoText.setText(`Ammo: ${stats.ammo.current}/${stats.ammo.clipSize} (${stats.ammo.reserve})`);
    this.walletText.setText(`Wallet: ${stats.wallet.toLocaleString()} Bc2`);
    this.infiltrationText.setText(`Infiltration: ${Math.round(stats.infiltrationRating)}`);
  }

  updateObjectives(title, lines) {
    this.objectiveText.setText(`${title}\n${lines.map((l) => `• ${l}`).join('\n')}`);
  }

  updateAlert(level) {
    const clamped = Phaser.Math.Clamp(level, 0, 1);
    this.alertFill.width = 300 * clamped;
    this.alertFill.setFillStyle(clamped > 0.6 ? 0xff6b6b : 0x1dd1a1, 0.6);
  }

  updateNoise(level) {
    const clamped = Phaser.Math.Clamp(level, 0, 1);
    this.noiseFill.width = 300 * clamped;
    this.noiseFill.setFillStyle(clamped > 0.6 ? 0xff6b6b : 0x00bcd4, 0.6);
  }
}
