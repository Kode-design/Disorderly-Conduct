const Phaser = window.Phaser;

const BACKGROUNDS = [
  {
    name: 'Street Runner',
    description: 'Grew up outrunning drone patrols in the megasprawl. High agility and stealth.',
    attributes: { health: 110, stamina: 120, stealth: 80, hacking: 45, perception: 65, marksmanship: 55 },
  },
  {
    name: 'Mesh Ghost',
    description: 'Once a black-hat for hire. Lower health but unmatched hacking prowess.',
    attributes: { health: 95, stamina: 90, stealth: 70, hacking: 95, perception: 60, marksmanship: 50 },
  },
  {
    name: 'Ex-Corpo Enforcer',
    description: 'Former Hyperion security specialist. Tough with superior weapon handling.',
    attributes: { health: 130, stamina: 100, stealth: 55, hacking: 40, perception: 70, marksmanship: 85 },
  },
];

const PERKS = [
  {
    name: 'Steady Hand',
    description: 'Reduce recoil, improved accuracy and crit chance.',
    modifier: { marksmanship: 10 },
  },
  {
    name: 'Shadowstep',
    description: 'Enhanced stealth. Enemies take longer to spot you.',
    modifier: { stealth: 12 },
  },
  {
    name: 'Codebreaker',
    description: 'Better hacking mini-game tolerances and faster terminal cracking.',
    modifier: { hacking: 15 },
  },
  {
    name: 'Adrenal Surge',
    description: 'Movement speed boost after eating food or adrenaline shots.',
    modifier: { stamina: 12 },
  },
];

export default class CharacterScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Character' });
  }

  create() {
    window.dispatchEvent(new CustomEvent('phaser-hide-help'));

    this.gameState = this.registry.get('gameState');
    this.selectedBackground = BACKGROUNDS[0];
    this.selectedPerk = PERKS[0];

    const { width, height } = this.scale;
    this.add
      .text(width / 2, 60, 'Build your outlaw', {
        fontFamily: 'Orbitron',
        fontSize: '40px',
        color: '#1dd1a1',
      })
      .setOrigin(0.5);

    const nameLabel = this.add.text(width / 2 - 260, 140, 'Handle:', {
      fontFamily: 'Rajdhani',
      fontSize: '28px',
      color: '#84a9c0',
    });

    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.value = this.gameState.playerProfile.name;
    this.nameInput.placeholder = 'Nova';
    this.nameInput.maxLength = 14;
    this.nameInput.classList.add('character-input');
    this.nameElement = this.add.dom(width / 2 + 60, 150, this.nameInput).setOrigin(0, 0.5);

    this.createList(width / 2 - 420, 220, 'Background', BACKGROUNDS, (bg) => {
      this.selectedBackground = bg;
      this.refreshStats();
    });

    this.createList(width / 2 + 80, 220, 'Signature Perk', PERKS, (perk) => {
      this.selectedPerk = perk;
      this.refreshStats();
    });

    this.statsText = this.add.text(width / 2 - 180, height - 240, '', {
      fontFamily: 'Rajdhani',
      fontSize: '22px',
      color: '#e6f1ff',
      lineSpacing: 8,
    });

    this.refreshStats();

    const beginButton = this.add
      .rectangle(width / 2, height - 90, 320, 64, 0x1dd1a1, 0.9)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(width / 2, height - 90, 'Commit to the Run', {
        fontFamily: 'Orbitron',
        fontSize: '26px',
        color: '#00151f',
      })
      .setOrigin(0.5);

    beginButton.on('pointerdown', () => this.startStory());
    this.input.keyboard.once('keydown-ENTER', () => this.startStory());
  }

  createList(x, y, title, options, onSelect) {
    const titleText = this.add.text(x, y, title, {
      fontFamily: 'Orbitron',
      fontSize: '26px',
      color: '#1dd1a1',
    });

    const container = this.add.container(x, y + 40);

    options.forEach((option, index) => {
      const itemY = index * 80;
      const bgRect = this.add
        .rectangle(0, itemY, 320, 70, 0x04121d, 0.8)
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });

      const text = this.add
        .text(16, itemY, `${option.name}`, {
          fontFamily: 'Rajdhani',
          fontSize: '22px',
          color: '#e6f1ff',
          wordWrap: { width: 280 },
        })
        .setOrigin(0, 0.5);

      const desc = this.add
        .text(16, itemY + 22, option.description, {
          fontFamily: 'Rajdhani',
          fontSize: '18px',
          color: '#84a9c0',
          wordWrap: { width: 280 },
        })
        .setOrigin(0, 0);

      bgRect.on('pointerdown', () => {
        onSelect(option);
        container.iterate((child) => {
          if (child.isFilled) {
            child.setStrokeStyle();
          }
        });
        bgRect.setStrokeStyle(3, 0x1dd1a1, 1);
      });

      if (index === 0) {
        bgRect.setStrokeStyle(3, 0x1dd1a1, 1);
      }

      container.add(bgRect);
      container.add(text);
      container.add(desc);
    });
  }

  refreshStats() {
    const merged = { ...this.selectedBackground.attributes };
    Object.entries(this.selectedPerk.modifier).forEach(([key, value]) => {
      merged[key] = (merged[key] || 0) + value;
    });

    const lines = Object.entries(merged)
      .map(([key, value]) => `${key.toUpperCase().padEnd(12, ' ')} ${value}`)
      .join('\n');

    this.statsText.setText(
      `Attributes\n${lines}\n\nPerk: ${this.selectedPerk.name}\n${this.selectedPerk.description}`,
    );
  }

  startStory() {
    const profile = {
      name: this.nameInput.value || 'Nova',
      background: this.selectedBackground.name,
      perk: this.selectedPerk.name,
      attributes: { ...this.selectedBackground.attributes },
      loadout: {
        weapon: 'Kestrel P20',
        damage: 18,
        clipSize: 12,
        fireRate: 180,
      },
    };

    Object.entries(this.selectedPerk.modifier).forEach(([key, value]) => {
      profile.attributes[key] = (profile.attributes[key] || 0) + value;
    });

    this.gameState.setProfile(profile);
    this.gameState.addJournalEntry({
      title: 'New Run',
      body: `Handle ${profile.name} steps back into the sprawl as a ${profile.background}.`,
    });

    const missions = this.registry.get('missions');
    const firstMission = missions[0];
    this.scene.start('Story', { chapterId: firstMission.introChapter });
  }
}
