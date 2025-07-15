// GameOverScene.js
const DEFEAT_TEXT_COLOR = '#e84118';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
        this.finalScore = 0;
    }

    init(data) {
        this.finalScore = data.score !== undefined ? data.score : 0;
    }

    create() {
        this.cameras.main.setBackgroundColor(this.game.config.backgroundColor || '#0a141e');

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 100, 'DEFEAT', { fontSize: '60px', fill: DEFEAT_TEXT_COLOR, fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, `最終スコア: ${this.finalScore}`, { fontSize: '36px', fill: '#fff', fontFamily: 'Arial' }).setOrigin(0.5);
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 70, "「R」キーでリスタート", { fontSize: '24px', fill: '#fff', fontFamily: 'Arial' }).setOrigin(0.5);

        // キーが一度押されたら、ページをリロードしてゲームを完全にリセットする
        this.input.keyboard.once('keydown-R', () => {
            console.log("R key pressed in GameOverScene, reloading the page...");
            window.location.reload();
        });
    }

    // shutdownメソッドは、ページリロードにより不要になるため、省略しても良い
    // shutdown() {
    //     console.log("GameOverScene shutdown on page reload.");
    // }
}