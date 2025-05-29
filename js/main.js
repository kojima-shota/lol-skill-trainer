import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const config = {
    type: Phaser.AUTO,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    parent: 'phaser-game',
    backgroundColor: '#0a141e', // 基本の背景色
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            // debug: true // デバッグ表示が必要な場合
        }
    },
    scene: [BootScene, GameScene, UIScene, GameOverScene]
};

const game = new Phaser.Game(config);