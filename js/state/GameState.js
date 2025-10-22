const Phaser = window.Phaser;

export default class GameState {
  constructor() {
    this.playerProfile = {
      name: 'Nova',
      background: 'Street Runner',
      perk: 'Steady Hand',
      attributes: {
        health: 110,
        stamina: 90,
        stealth: 50,
        hacking: 40,
        perception: 60,
        marksmanship: 55,
      },
      loadout: {
        weapon: 'Kestrel P20',
        damage: 16,
        clipSize: 12,
        fireRate: 200,
      },
    };

    this.wallet = 1200; // Bc2
    this.crew = [{
      id: 'larry',
      name: 'Larry Vega',
      role: 'Getaway Driver',
      loyalty: 65,
      notes: 'Wheelman with a heart of synth. Expert at drone scouting.',
    }];

    this.journalEntries = [];
    this.completedMissions = [];
    this.currentMissionIndex = 0;
    this.storyFlags = {};
    this.inventory = [];
    this.codexUnlocked = new Set();
    this.resetMissionStats();
  }

  setProfile(profile) {
    this.playerProfile = profile;
  }

  resetMissionStats() {
    this.missionStats = {
      infiltration: 100,
      noiseFootprint: 0,
      detectionEvents: 0,
      elapsed: 0,
    };
  }

  applyNoise(amount) {
    this.missionStats.noiseFootprint += amount;
    this.missionStats.infiltration = Math.max(0, this.missionStats.infiltration - amount * 0.35);
  }

  registerDetection(severity = 10) {
    this.missionStats.detectionEvents += 1;
    this.missionStats.infiltration = Math.max(0, this.missionStats.infiltration - severity);
  }

  tickMissionTime(delta) {
    this.missionStats.elapsed += delta;
  }

  getMissionStats() {
    return { ...this.missionStats };
  }

  addJournalEntry(entry) {
    this.journalEntries.push({ ...entry, timestamp: Date.now() });
  }

  getJournal() {
    return this.journalEntries.slice(-8);
  }

  setFlag(key, value = true) {
    this.storyFlags[key] = value;
  }

  getFlag(key) {
    return this.storyFlags[key];
  }

  addItem(item) {
    this.inventory.push(item);
  }

  consumeItem(itemId) {
    const idx = this.inventory.findIndex((i) => i.id === itemId);
    if (idx >= 0) {
      return this.inventory.splice(idx, 1)[0];
    }
    return null;
  }

  unlockCodex(id) {
    this.codexUnlocked.add(id);
  }

  hasCodex(id) {
    return this.codexUnlocked.has(id);
  }
}
