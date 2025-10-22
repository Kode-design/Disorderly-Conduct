const Phaser = window.Phaser;

export default class StoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Story' });
    this.currentBeat = 0;
  }

  init(data) {
    this.chapterId = data.chapterId;
  }

  create() {
    window.dispatchEvent(new CustomEvent('phaser-hide-help'));

    const chapters = this.registry.get('storyChapters');
    this.chapter = chapters[this.chapterId];

    if (!this.chapter) {
      console.warn('Missing chapter', this.chapterId);
      this.scene.start('Game');
      return;
    }

    this.currentBeat = 0;
    this.dialogueBox = this.add.rectangle(640, 540, 1040, 260, 0x04121d, 0.92).setStrokeStyle(3, 0x1dd1a1, 0.8);
    this.locationText = this.add.text(80, 420, this.chapter.location || '', {
      fontFamily: 'Orbitron',
      fontSize: '20px',
      color: '#84a9c0',
    });

    this.speakerText = this.add.text(140, 470, '', {
      fontFamily: 'Rajdhani',
      fontSize: '28px',
      color: '#1dd1a1',
    });

    this.bodyText = this.add.text(140, 520, '', {
      fontFamily: 'Rajdhani',
      fontSize: '24px',
      color: '#e6f1ff',
      wordWrap: { width: 920 },
      lineSpacing: 6,
    });

    this.promptText = this.add.text(1060, 650, '[SPACE] Continue', {
      fontFamily: 'Rajdhani',
      fontSize: '20px',
      color: '#84a9c0',
    }).setOrigin(1, 0.5);

    this.typingTween = null;
    this.showBeat();

    this.input.keyboard.on('keydown-SPACE', this.advance, this);
    this.input.keyboard.on('keydown-ENTER', this.advance, this);

    this.input.on('pointerdown', this.advance, this);
  }

  showBeat() {
    const beat = this.chapter.beats[this.currentBeat];
    if (!beat) {
      this.finishChapter();
      return;
    }

    this.speakerText.setText(beat.speaker ? `${beat.speaker}` : '');
    this.bodyText.setText('');
    this.typeText(beat.text);
  }

  typeText(fullText) {
    if (this.typingTween) {
      this.typingTween.remove();
    }

    let progress = 0;
    const length = fullText.length;
    const speed = 20;

    this.typingTween = this.time.addEvent({
      delay: 18,
      loop: true,
      callback: () => {
        progress += speed * 0.05;
        const current = Math.min(Math.floor(progress), length);
        this.bodyText.setText(fullText.slice(0, current));
        if (current >= length) {
          this.typingTween.remove();
        }
      },
    });
  }

  advance() {
    if (this.typingTween) {
      this.typingTween.remove();
      const beat = this.chapter.beats[this.currentBeat];
      this.bodyText.setText(beat.text);
      this.typingTween = null;
      return;
    }

    this.currentBeat += 1;
    if (this.currentBeat >= this.chapter.beats.length) {
      this.finishChapter();
    } else {
      this.showBeat();
    }
  }

  finishChapter() {
    const next = this.chapter.next;
    if (!next) {
      this.scene.start('MainMenu');
      return;
    }

    if (next.scene === 'Game') {
      this.scene.start('Game', { missionId: next.missionId });
    } else {
      this.scene.start(next.scene, { missionId: next.missionId });
    }
  }
}
