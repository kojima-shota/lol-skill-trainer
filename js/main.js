import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const DEBUG_MODE = false; // デバッグモードの切り替え用 (例)

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
            debug: DEBUG_MODE // デバッグ表示が必要な場合
        }
    },
    scale: { // スケールマネージャーの設定を追加
        mode: Phaser.Scale.FIT, // ゲームを指定された幅と高さにフィットさせ、アスペクト比を維持
        autoCenter: Phaser.Scale.CENTER_BOTH, // 親要素（またはウィンドウ）の中央に配置
        // width: CANVAS_WIDTH, // FITモードでは暗黙的に使用される
        // height: CANVAS_HEIGHT,
    },
    callbacks: { // postBootコールバックを追加
        postBoot: function (game) {
            // ゲームの起動が完了し、最初のシーンが処理を開始する直前
            const canvas = game.canvas;
            if (canvas) {
                canvas.addEventListener('contextmenu', function(event) {
                    event.preventDefault(); // デフォルトのコンテキストメニュー表示をキャンセル
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
    ] // すべてのシーンを登録
};

const game = new Phaser.Game(config);