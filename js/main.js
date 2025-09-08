
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const DEBUG_MODE = false;

const config = {
    type: Phaser.AUTO,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    parent: 'phaser-game',
    backgroundColor: '#4a2c2a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: DEBUG_MODE 
        }
    },
    scale: { 
        mode: Phaser.Scale.FIT, 
        autoCenter: Phaser.Scale.CENTER_BOTH, 
       
    },
    callbacks: {
        postBoot: function (game) {
          
            const canvas = game.canvas;
            if (canvas) {
                canvas.addEventListener('contextmenu', function(event) {
                    event.preventDefault();
                });
                console.log("Context menu prevention applied via Phaser callback.");
            }
        }
    },
    scene: [BootScene,
     TitleScene,
      GameScene, 
      UIScene,
     GameOverScene
    ] 
};

const game = new Phaser.Game(config);