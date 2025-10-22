import HUD from '../ui/HUD.js';
import { tileSize } from '../data/mapData.js';

const Phaser = window.Phaser;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  init(data) {
    this.missionId = data?.missionId || null;
  }

  create() {
    window.dispatchEvent(new CustomEvent('phaser-hide-help'));
    this.gameState = this.registry.get('gameState');
    this.missions = this.registry.get('missions');
    this.maps = this.registry.get('maps');

    this.physics.world.setBounds(0, 0, tileSize * 40, tileSize * 30);

    this.setupInput();

    this.hud = new HUD(this);

    this.cameras.main.setZoom(1.2);

    this.loadMission(this.missionId);

    this.setupEvents();
  }

  setupInput() {
    this.keys = this.input.keyboard.addKeys({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D',
      interact: 'E',
      stealth: 'SHIFT',
      reload: 'R',
      holo: 'Q',
      log: 'TAB',
      pause: 'ESC',
    });

    this.isTriggerHeld = false;
    this.input.on('pointerdown', () => {
      this.isTriggerHeld = true;
    });
    this.input.on('pointerup', () => {
      this.isTriggerHeld = false;
    });

    this.keys.stealth.on('down', () => this.toggleStealth());
    this.keys.interact.on('down', () => this.tryInteract());
    this.keys.reload.on('down', () => this.reloadWeapon());
    this.keys.holo.on('down', () => this.deployDecoy());
    this.keys.log.on('down', () => this.toggleLog());
    this.keys.pause.on('down', () => this.pauseGame());
  }

  setupEvents() {
    this.events.on('mission-complete', () => {
      const nextChapter = this.currentMission.outroChapter;
      this.scene.start('Story', { chapterId: nextChapter });
    });
  }

  loadMission(missionId) {
    this.clearScene();

    if (!missionId) {
      const current = this.gameState.currentMissionIndex;
      this.currentMission = this.missions[current];
    } else {
      this.currentMission = this.missions.find((m) => m.id === missionId) || this.missions[0];
    }

    this.registry.set('currentMission', this.currentMission.id);

    this.alertLevel = 0;
    this.objectiveIndex = 0;
    this.objectiveStatus = this.currentMission.objectives.map(() => false);

    this.currentMap = this.maps[this.currentMission.mapId];
    this.buildMap();

    this.playerStats = {
      maxHealth: this.gameState.playerProfile.attributes.health,
      health: this.gameState.playerProfile.attributes.health,
      stamina: this.gameState.playerProfile.attributes.stamina,
      stealthSkill: this.gameState.playerProfile.attributes.stealth,
      hacking: this.gameState.playerProfile.attributes.hacking,
      perception: this.gameState.playerProfile.attributes.perception,
      marksmanship: this.gameState.playerProfile.attributes.marksmanship,
      stealthMode: false,
      wallet: this.gameState.wallet,
      ammo: {
        clipSize: this.gameState.playerProfile.loadout.clipSize,
        current: this.gameState.playerProfile.loadout.clipSize,
        reserve: 72,
        fireRate: this.gameState.playerProfile.loadout.fireRate,
        damage: this.gameState.playerProfile.loadout.damage,
        lastFired: 0,
      },
    };

    this.hud.updateStats(this.playerStats);
    this.hud.updateObjectives(this.currentMission.name, this.getObjectiveStatus());

    this.messageQueue = [];
    this.createMissionLog();
  }
  clearScene() {
    if (this.walls) this.walls.clear(true, true);
    if (this.enemies) this.enemies.clear(true, true);
    if (this.enemySprites) this.enemySprites.forEach((enemy) => enemy.sprite.destroy());
    if (this.floorLayer) this.floorLayer.forEach((tile) => tile.destroy());
    if (this.doors) this.doors.clear(true, true);
    if (this.foodItems) this.foodItems.clear(true, true);
    if (this.terminals) this.terminals.clear(true, true);
    if (this.exits) this.exits.clear(true, true);
    if (this.allies) this.allies.clear(true, true);

    if (this.player) {
      this.player.destroy();
    }

    this.enemySprites = [];
    this.decoys = [];
    this.activeMessages?.destroy();
  }

  buildMap() {
    const map = this.currentMap;
    this.floorLayer = [];
    this.walls = this.physics.add.staticGroup();
    this.doors = this.physics.add.staticGroup();
    this.foodItems = this.physics.add.staticGroup();
    this.terminals = this.physics.add.staticGroup();
    this.exits = this.physics.add.staticGroup();
    this.coverGroup = this.physics.add.staticGroup();
    this.generatorGroup = this.physics.add.staticGroup();
    this.allies = this.physics.add.staticGroup();
    this.lootItems = this.physics.add.staticGroup();

    let playerSpawn = { x: tileSize * 2, y: tileSize * 2 };

    map.layout.forEach((row, y) => {
      [...row].forEach((char, x) => {
        const info = map.legend[char] || map.legend['.'];
        const px = x * tileSize + tileSize / 2;
        const py = y * tileSize + tileSize / 2;

        const floor = this.add.image(px, py, 'floor');
        floor.setDepth(0);
        this.floorLayer.push(floor);

        switch (info.type) {
          case 'wall':
            const wall = this.walls.create(px, py, 'wall');
            wall.refreshBody();
            break;
          case 'player':
            playerSpawn = { x: px, y: py };
            break;
          case 'enemy':
            break;
          case 'door':
            const door = this.doors.create(px, py, info.locked ? 'door-locked' : 'door-open');
            door.setData('locked', info.locked);
            door.setData('open', false);
            door.setData('position', { x, y });
            door.refreshBody();
            break;
          case 'food':
            const food = this.foodItems.create(px, py, 'food');
            food.setData('healing', 25);
            break;
          case 'terminal':
            const term = this.terminals.create(px, py, 'terminal');
            term.setData('hacked', false);
            term.setData('sequence', this.generateHackSequence());
            term.setData('trigger', 'terminal-hacked');
            break;
          case 'loot':
            const lootKey = info.item === 'wallet' ? 'loot-wallet' : 'loot-qubit';
            const loot = this.lootItems.create(px, py, lootKey);
            loot.setData('item', info.item);
            break;
          case 'exit':
            const exit = this.exits.create(px, py, 'door-open');
            exit.setData('trigger', 'mission-exit');
            break;
          case 'ally':
            const allyKey = info.id === 'larry' ? 'larry' : 'sera';
            const ally = this.allies.create(px, py, allyKey);
            ally.setData('id', info.id);
            break;
          case 'cover':
            this.coverGroup.create(px, py, 'cover');
            break;
          case 'generator':
            const gen = this.generatorGroup.create(px, py, 'generator');
            gen.setData('health', 100);
            break;
          default:
            break;
        }
      });
    });

    this.player = this.physics.add.sprite(playerSpawn.x, playerSpawn.y, 'player');
    this.player.setCollideWorldBounds(true);

    this.bullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 40, runChildUpdate: true });
    this.enemyBullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 50, runChildUpdate: true });

    this.enemies = this.physics.add.group();
    this.enemySprites = [];

    const enemyTiles = [];
    map.layout.forEach((row, y) => {
      [...row].forEach((char, x) => {
        if (char === 'E') {
          enemyTiles.push({ x, y });
        }
      });
    });

    map.enemyConfigs.forEach((config, index) => {
      const tile = enemyTiles[index] || enemyTiles[0] || { x: 4, y: 4 };
      const px = tile.x * tileSize + tileSize / 2;
      const py = tile.y * tileSize + tileSize / 2;
      const sprite = this.enemies.create(px, py, 'enemy');
      sprite.setData('config', config);
      sprite.setData('state', 'patrol');
      sprite.setData('patrolIndex', 0);
      sprite.setData('health', 60);
      sprite.setData('lastShot', 0);
      this.enemySprites.push({ sprite, config });
    });

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.enemies, this.coverGroup);
    this.physics.add.collider(this.player, this.coverGroup);
    this.physics.add.collider(this.player, this.doors, (player, door) => this.onCollideDoor(door));
    this.physics.add.overlap(this.player, this.doors, (player, door) => {
      this.nearbyDoor = door;
    });

    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => this.onBulletHitEnemy(bullet, enemy));
    this.physics.add.overlap(this.enemyBullets, this.player, (bullet) => this.onPlayerHit(bullet));

    this.physics.add.overlap(this.player, this.foodItems, (player, food) => this.onFoodNearby(food));
    this.physics.add.overlap(this.player, this.terminals, (player, terminal) => this.onTerminalNearby(terminal));
    this.physics.add.overlap(this.player, this.lootItems, (player, loot) => this.onLootNearby(loot));
    this.physics.add.overlap(this.player, this.exits, () => this.onExitReached());
    this.physics.add.overlap(this.player, this.allies, (player, ally) => this.onAllyNearby(ally));
    this.physics.add.overlap(this.player, this.generatorGroup, (player, generator) => this.onGeneratorNearby(generator));

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.messageText = this.add.text(640, 140, '', {
      fontFamily: 'Rajdhani',
      fontSize: '22px',
      color: '#1dd1a1',
      align: 'center',
      wordWrap: { width: 720 },
    }).setOrigin(0.5).setScrollFactor(0);

    this.hackingOverlay = this.add.text(640, 360, '', {
      fontFamily: 'Orbitron',
      fontSize: '24px',
      color: '#ffd166',
      align: 'center',
      wordWrap: { width: 520 },
    }).setOrigin(0.5).setScrollFactor(0);
    this.hackingOverlay.setVisible(false);
  }
  createMissionLog() {
    if (this.logContainer) this.logContainer.destroy(true);

    this.logContainer = this.add.container(20, 140);
    this.logBackground = this.add.rectangle(0, 0, 420, 520, 0x020b12, 0.88)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setVisible(false);
    this.logBackground.setStrokeStyle(2, 0x1dd1a1, 0.6);

    this.logText = this.add.text(24, 24, '', {
      fontFamily: 'Rajdhani',
      fontSize: '20px',
      color: '#e6f1ff',
      wordWrap: { width: 360 },
      lineSpacing: 6,
    }).setScrollFactor(0).setVisible(false);

    this.logContainer.add([this.logBackground, this.logText]);
  }

  update(time, delta) {
    if (!this.player) return;
    if (this.isHacking) {
      this.updateHacking(delta);
      return;
    }

    this.handleMovement(delta);
    this.handleShooting(time);
    this.updateEnemies(time, delta);
    this.updateDecoys(delta);
    if (this.enemies && this.enemies.countActive(true) === 0) {
      this.advanceObjective('Protect the Orion convoy from the Redline Gang.');
      this.advanceObjective('Hold the line with Larry while Sera deploys the broadcast.');
    }
    this.hud.updateStats(this.playerStats);
    this.hud.updateObjectives(this.currentMission.name, this.getObjectiveStatus());
    this.hud.updateAlert(this.alertLevel);

    if (this.playerStats.health <= 0) {
      this.onPlayerDown();
    }
  }

  handleMovement(delta) {
    const speedBase = 220;
    const stealthPenalty = 0.55;
    const body = this.player.body;
    const { up, down, left, right } = this.keys;

    const speed = this.playerStats.stealthMode ? speedBase * stealthPenalty : speedBase;

    let vx = 0;
    let vy = 0;

    if (up.isDown) vy -= 1;
    if (down.isDown) vy += 1;
    if (left.isDown) vx -= 1;
    if (right.isDown) vx += 1;

    const magnitude = Math.hypot(vx, vy) || 1;
    body.setVelocity((vx / magnitude) * speed, (vy / magnitude) * speed);

    const pointer = this.input.activePointer;
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
    this.player.setRotation(angle);
  }

  handleShooting(time) {
    if (!this.isTriggerHeld) return;
    const ammo = this.playerStats.ammo;
    if (ammo.current <= 0) return;
    if (time - ammo.lastFired < ammo.fireRate) return;

    const bullet = this.bullets.get(this.player.x, this.player.y, 'bullet');
    if (!bullet) return;

    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setAngle((this.player.rotation * 180) / Math.PI);
    this.physics.velocityFromRotation(this.player.rotation, 600, bullet.body.velocity);
    bullet.body.setAllowGravity(false);
    this.time.delayedCall(600, () => {
      if (bullet.active) bullet.destroy();
    });
    ammo.current -= 1;
    ammo.lastFired = time;
  }

  updateEnemies(time, delta) {
    const detectionModifier = this.playerStats.stealthMode ? 0.45 : 1;
    this.enemySprites.forEach((enemyData) => {
      const sprite = enemyData.sprite;
      if (!sprite.active) return;
      const config = enemyData.config;
      const state = sprite.getData('state');
      const patrolIndex = sprite.getData('patrolIndex');
      const patrolPoints = config.patrol;

      if (state === 'patrol' && patrolPoints?.length) {
        const target = patrolPoints[patrolIndex % patrolPoints.length];
        const targetX = target.x * tileSize + tileSize / 2;
        const targetY = target.y * tileSize + tileSize / 2;
        const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, targetX, targetY);
        if (dist < 6) {
          sprite.setData('patrolIndex', (patrolIndex + 1) % patrolPoints.length);
        } else {
          this.physics.moveTo(sprite, targetX, targetY, 90);
        }
      }

      const detectionRadius = config.detection * detectionModifier;
      const distToPlayer = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y);

      if (distToPlayer < detectionRadius) {
        sprite.setData('state', 'alert');
        this.alertLevel = Phaser.Math.Clamp(this.alertLevel + delta / 8000, 0, 1.2);
      }

      if (sprite.getData('state') === 'alert') {
        this.physics.moveToObject(sprite, this.player, 140);
        const lastShot = sprite.getData('lastShot');
        if (time - lastShot > 600) {
          this.enemyFire(sprite, config, time);
        }
      }
    });
  }

  updateDecoys(delta) {
    if (!this.decoys) return;
    this.decoys = this.decoys.filter((decoy) => {
      decoy.timer -= delta;
      if (decoy.timer <= 0) {
        decoy.sprite.destroy();
        return false;
      }
      return true;
    });
  }

  enemyFire(enemySprite, config, time) {
    const bullet = this.enemyBullets.get(enemySprite.x, enemySprite.y, 'bullet');
    if (!bullet) return;
    const inaccuracy = Phaser.Math.Between(-20, 20) * (1 - config.accuracy);
    const angle = Phaser.Math.Angle.Between(enemySprite.x, enemySprite.y, this.player.x, this.player.y) + Phaser.Math.DegToRad(inaccuracy);
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setRotation(angle);
    this.physics.velocityFromRotation(angle, 520, bullet.body.velocity);
    bullet.body.setAllowGravity(false);
    this.time.delayedCall(800, () => {
      if (bullet.active) bullet.destroy();
    });
    enemySprite.setData('lastShot', time);
  }
  onBulletHitEnemy(bullet, enemy) {
    bullet.destroy();
    const damage = this.playerStats.ammo.damage;
    const current = enemy.getData('health') - damage;
    enemy.setData('health', current);
    enemy.setData('state', 'alert');
    if (current <= 0) {
      this.createFloatingText(enemy.x, enemy.y, 'Neutralized');
      enemy.destroy();
    }
  }

  onPlayerHit(bullet) {
    bullet.destroy();
    this.playerStats.health -= 18;
    this.createFloatingText(this.player.x, this.player.y, '-18 HP', '#ff6b6b');
  }

  onPlayerDown() {
    this.createFloatingText(this.player.x, this.player.y, 'Downed!');
    this.scene.start('MainMenu');
  }

  onCollideDoor(door) {
    if (door.getData('open')) return;
    this.nearbyDoor = door;
    this.showMessage('Press E to open door');
  }

  onFoodNearby(food) {
    if (food.getData('consumed')) return;
    this.showMessage('Press E to grab nutrient pack');
    this.nearbyFood = food;
  }

  onLootNearby(loot) {
    if (loot.getData('collected')) return;
    const item = loot.getData('item');
    const prompt = item === 'wallet' ? 'Press E to snag the cold wallet' : 'Press E to secure the qubit';
    this.showMessage(prompt);
    this.nearbyLoot = loot;
  }

  onTerminalNearby(terminal) {
    if (terminal.getData('hacked')) return;
    this.showMessage('Press E to initiate hack');
    this.nearbyTerminal = terminal;
  }

  onExitReached() {
    if (this.isMissionComplete()) {
      this.completeMission();
    } else {
      this.showMessage('Objective incomplete. Check your log (Tab).');
    }
  }

  onAllyNearby(ally) {
    const id = ally.getData('id');
    if (id === 'larry') {
      this.showMessage('Larry: Need a lift? Finish the job then hit the exit.');
      this.nearbyAlly = ally;
    } else if (id === 'sera') {
      this.showMessage('Sera: Decide fast. Interact to choose the syndicate\'s fate.');
      this.nearbyAlly = ally;
    }
  }

  onGeneratorNearby(generator) {
    this.showMessage('Press E to reroute generator power');
    this.nearbyGenerator = generator;
  }

  tryInteract() {
    this.advanceObjective('Infiltrate the gas station without triggering the alarm.');
    const within = (entity) =>
      entity && Phaser.Math.Distance.Between(this.player.x, this.player.y, entity.x, entity.y) < tileSize * 0.9;

    if (within(this.nearbyFood) && !this.nearbyFood.getData('consumed')) {
      this.collectFood(this.nearbyFood);
      this.nearbyFood = null;
      return;
    }

    if (within(this.nearbyTerminal) && !this.nearbyTerminal.getData('hacked')) {
      this.beginHack(this.nearbyTerminal);
      this.nearbyTerminal = null;
      return;
    }

    if (within(this.nearbyGenerator)) {
      this.rerouteGenerator(this.nearbyGenerator);
      this.nearbyGenerator = null;
      return;
    }

    if (within(this.nearbyLoot) && !this.nearbyLoot.getData('collected')) {
      this.collectLoot(this.nearbyLoot);
      this.nearbyLoot = null;
      return;
    }

    if (
      within(this.nearbyAlly) &&
      this.nearbyAlly.getData('id') === 'sera' &&
      this.currentMission.id === 'finale-breakout'
    ) {
      this.triggerNarrative('final-choice');
      this.presentFinalChoice();
      return;
    }

    if (within(this.nearbyAlly) && this.currentMission.id !== 'finale-breakout') {
      this.interactAlly(this.nearbyAlly);
      return;
    }

    if (within(this.nearbyDoor)) {
      this.openDoor(this.nearbyDoor);
      this.nearbyDoor = null;
    }
  }

  collectFood(food) {
    food.setTexture('floor');
    food.setData('consumed', true);
    this.playerStats.health = Math.min(this.playerStats.maxHealth, this.playerStats.health + food.getData('healing'));
    this.createFloatingText(this.player.x, this.player.y, '+Health', '#c3f584');
    if (this.playerStats.stealthMode) {
      this.playerStats.stealthMode = false;
    }
  }

  collectLoot(loot) {
    loot.setData('collected', true);
    loot.setVisible(false);
    const item = loot.getData('item');
    if (item === 'wallet') {
      this.createFloatingText(loot.x, loot.y, 'Cold wallet secured', '#ffd166');
      this.advanceObjective('Loot the bitcoin-II wallet from the clerk\'s safe.');
    } else if (item === 'qubit') {
      this.createFloatingText(loot.x, loot.y, 'Qubit retrieved', '#7f5af0');
      this.advanceObjective('Retrieve the qubit from the data vault.');
    }
  }

  interactAlly(ally) {
    const id = ally.getData('id');
    if (id === 'sera') {
      this.triggerNarrative('allies-talked');
      this.advanceObjective('Locate Fixer Sera at the lot.');
      this.advanceObjective('Secure the convoy drones and gather intel.');
    } else if (id === 'larry') {
      this.advanceObjective('Exfiltrate to the service elevator with Larry.');
      this.advanceObjective('Hold the line with Larry while Sera deploys the broadcast.');
      this.advanceObjective("Escape to Larry's car.");
    }
    this.nearbyAlly = null;
  }

  beginHack(terminal) {
    this.isHacking = true;
    this.hackingTarget = terminal;
    this.hackingSequence = terminal.getData('sequence');
    this.hackingProgress = 0;
    this.hackingTimer = 11000 - this.gameState.playerProfile.attributes.hacking * 20;
    this.hackingOverlay.setVisible(true);
    this.updateHackingOverlay();
    this.keys.stealth.enabled = false;
    this.hackListener = this.input.keyboard.on('keydown', this.handleHackKey, this);
  }

  updateHacking(delta) {
    this.hackingTimer -= delta;
    if (this.hackingTimer <= 0) {
      this.failHack();
      return;
    }

    const remaining = Math.max(0, Math.ceil(this.hackingTimer / 1000));
    this.hackingOverlay.setText(
      `HACKING TERMINAL\nKey sequence: ${this.hackingSequence}\nType letters before ${remaining}s`
    );
  }

  updateHackingOverlay() {
    const typed = this.hackingSequence
      .split('')
      .map((char, index) => (index < this.hackingProgress ? `[${char}]` : char))
      .join(' ');
    this.hackingOverlay.setText(`HACKING TERMINAL\nSequence: ${typed}`);
  }

  completeHack() {
    this.finishHackingState();
    this.hackingTarget.setData('hacked', true);
    this.triggerNarrative(this.hackingTarget.getData('trigger'));
    this.advanceObjective('Hack the ghost node terminal to locate the cold wallet.');
    this.advanceObjective('Disable the surveillance grid via terminal hacking.');
    this.advanceObjective('Defend the safehouse generators to keep power online.');
  }

  failHack() {
    this.finishHackingState();
    this.triggerNarrative('hack-failed');
    this.alertLevel = Math.min(1, this.alertLevel + 0.3);
  }

  finishHackingState() {
    this.isHacking = false;
    this.hackingOverlay.setVisible(false);
    if (this.hackListener) {
      this.input.keyboard.off('keydown', this.handleHackKey, this);
      this.hackListener = null;
    }
    this.keys.stealth.enabled = true;
  }

  handleHackKey(event) {
    if (!this.isHacking) return;
    const expected = this.hackingSequence[this.hackingProgress];
    if (!expected) return;
    const key = event.key.length === 1 ? event.key.toUpperCase() : event.key.toUpperCase();
    if (key === expected) {
      this.hackingProgress += 1;
      if (this.hackingProgress >= this.hackingSequence.length) {
        this.completeHack();
      } else {
        this.updateHackingOverlay();
      }
    } else if (event.key.length === 1) {
      this.hackingTimer -= 1500;
      this.createFloatingText(this.player.x, this.player.y, 'Sequence error', '#ff6b6b');
    }
  }

  rerouteGenerator(generator) {
    const health = generator.getData('health');
    if (health <= 0) {
      this.createFloatingText(generator.x, generator.y, 'Offline');
      return;
    }

    generator.setData('health', Math.max(0, health - 10));
    this.triggerNarrative('generators-stable');
    this.advanceObjective('Defend the safehouse generators to keep power online.');
  }

  openDoor(door) {
    if (door.getData('locked')) {
      door.setData('locked', false);
      door.setTexture('door-open');
      this.createFloatingText(door.x, door.y, 'Door unlocked');
    }
    door.setData('open', true);
    door.disableBody(true, true);
  }

  generateHackSequence() {
    const letters = 'QWERTYUIOPASDFGHJKLZXCVBNM';
    const length = Phaser.Math.Between(4, 6);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += letters[Phaser.Math.Between(0, letters.length - 1)];
    }
    return result;
  }

  toggleStealth() {
    this.playerStats.stealthMode = !this.playerStats.stealthMode;
    this.createFloatingText(this.player.x, this.player.y, this.playerStats.stealthMode ? 'Stealth' : 'Engaged', '#84a9c0');
  }

  reloadWeapon() {
    const ammo = this.playerStats.ammo;
    if (ammo.current >= ammo.clipSize || ammo.reserve <= 0) return;
    const needed = ammo.clipSize - ammo.current;
    const taken = Math.min(needed, ammo.reserve);
    ammo.current += taken;
    ammo.reserve -= taken;
    this.createFloatingText(this.player.x, this.player.y, 'Reloaded', '#ffd166');
  }

  deployDecoy() {
    const decoySprite = this.physics.add.sprite(this.player.x, this.player.y, 'player');
    decoySprite.setTint(0x7f5af0);
    this.decoys.push({ sprite: decoySprite, timer: 6000 });
    this.createFloatingText(this.player.x, this.player.y, 'Holo-decoy deployed', '#7f5af0');
    this.enemySprites.forEach((enemyData) => {
      if (!enemyData.sprite.active) return;
      enemyData.sprite.setData('state', 'distracted');
      this.time.delayedCall(2000, () => {
        if (enemyData.sprite.active) enemyData.sprite.setData('state', 'patrol');
      });
    });
  }
  toggleLog() {
    const visible = !this.logBackground.visible;
    this.logBackground.setVisible(visible);
    this.logText.setVisible(visible);
    if (visible) {
      const entries = this.gameState.getJournal();
      const objectives = this.getObjectiveStatus().map((line, index) => `${this.objectiveStatus[index] ? '[X]' : '[ ]'} ${line}`);
      const entryLines = entries.map((entry) => `— ${entry.title}\n${entry.body}`).join('\n\n');
      this.logText.setText(`Mission: ${this.currentMission.name}\nObjectives:\n${objectives.join('\n')}\n\nJournal:\n${entryLines}`);
    }
  }

  pauseGame() {
    this.scene.launch('Pause', { parentSceneKey: 'Game' });
    this.scene.pause();
  }

  createFloatingText(x, y, text, color = '#1dd1a1') {
    const label = this.add.text(x, y, text, {
      fontFamily: 'Rajdhani',
      fontSize: '18px',
      color,
    });
    label.setDepth(10);
    this.tweens.add({
      targets: label,
      y: y - 40,
      alpha: 0,
      duration: 1200,
      onComplete: () => label.destroy(),
    });
  }

  showMessage(text) {
    if (this.messageTimer) {
      this.time.removeEvent(this.messageTimer);
    }
    this.messageText.setText(text);
    this.messageText.setAlpha(1);
    this.messageTimer = this.time.addEvent({
      delay: 2200,
      callback: () => {
        this.tweens.add({
          targets: this.messageText,
          alpha: 0,
          duration: 600,
        });
      },
    });
  }

  triggerNarrative(trigger) {
    if (!trigger) return;
    const event = this.currentMap.narrativeEvents?.find((evt) => evt.trigger === trigger);
    if (event) {
      this.showMessage(event.text);
      this.gameState.addJournalEntry({ title: this.currentMission.name, body: event.text });
    }
  }

  getObjectiveStatus() {
    return this.currentMission.objectives.map((objective, index) => {
      return `${this.objectiveStatus[index] ? 'Completed' : 'Pending'} — ${objective}`;
    });
  }

  advanceObjective(matchText) {
    this.currentMission.objectives.forEach((objective, index) => {
      if (objective === matchText || objective.includes(matchText.split(' ')[0])) {
        this.objectiveStatus[index] = true;
      }
    });
  }

  isMissionComplete() {
    return this.objectiveStatus.every(Boolean);
  }

  completeMission() {
    this.gameState.wallet += this.currentMission.rewards.wallet;
    this.playerStats.wallet = this.gameState.wallet;
    this.gameState.completedMissions.push(this.currentMission.id);
    this.gameState.currentMissionIndex = Math.min(
      this.gameState.currentMissionIndex + 1,
      this.missions.length - 1,
    );
    this.currentMission.rewards.codexUnlocks?.forEach((id) => this.gameState.unlockCodex(id));
    this.events.emit('mission-complete');
  }

  presentFinalChoice() {
    this.messageText.setAlpha(1);
    this.messageText.setText('Decision: Press 1 to sell qubit · Press 2 to broadcast truth');
    this.input.keyboard.once('keydown-ONE', () => {
      this.showMessage('You sold the qubit. Credits flood in, but Hyperion will hunt you.');
      this.advanceObjective('Choose to sell the qubit or leak the data.');
    });
    this.input.keyboard.once('keydown-TWO', () => {
      this.showMessage('Broadcast unleashed! Hyperion ledgers leak across the Mesh.');
      this.advanceObjective('Choose to sell the qubit or leak the data.');
    });
  }
}
