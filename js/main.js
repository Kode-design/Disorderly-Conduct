import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import CharacterScene from './scenes/CharacterScene.js';
import StoryScene from './scenes/StoryScene.js';
import GameScene from './scenes/GameScene.js';
import PauseScene from './scenes/PauseScene.js';
import CodexScene from './scenes/CodexScene.js';

const Phaser = window.Phaser;

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#030b12',
  width: 1280,
  height: 720,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 },
    },
  },
  dom: {
    createContainer: true,
  },
  scene: [
    BootScene,
    MainMenuScene,
    CharacterScene,
    StoryScene,
    GameScene,
    PauseScene,
    CodexScene,
  ],
};

const game = new Phaser.Game(config);

const helpOverlay = document.getElementById('help-overlay');
const closeHelp = document.getElementById('close-help');

function showHelp() {
  helpOverlay.classList.remove('hidden');
}

function hideHelp() {
  helpOverlay.classList.add('hidden');
}

closeHelp.addEventListener('click', hideHelp);

window.addEventListener('keydown', (event) => {
  if (event.key === 'F1') {
    event.preventDefault();
    if (helpOverlay.classList.contains('hidden')) {
      showHelp();
    } else {
      hideHelp();
    }
  }
});

window.addEventListener('phaser-show-help', showHelp);
window.addEventListener('phaser-hide-help', hideHelp);

export default game;
