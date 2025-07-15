// TitleScene.js
export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
        console.log("TitleScene: constructor called");
        this.startTextTween = null;
        this.startGamePointerHandler = null;
        this.startGameSpaceKeyHandler = null;
        this.startGameEnterKeyHandler = null;
    }

    create() {
        console.log("TitleScene: create called");

        this.cameras.main.setBackgroundColor(this.game.config.backgroundColor || '#0a141e');

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 100, 'League skill micro', {
            fontSize: '48px',
            fill: '#fff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const startText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 50, 'クリックして開始', {
            fontSize: '32px',
            fill: '#c8aa6e',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        if (startText) {
            this.startTextTween = this.tweens.add({
                targets: startText,
                alpha: { from: 0.5, to: 1 },
                ease: 'Linear',
                duration: 800,
                repeat: -1,
                yoyo: true
            });
        } else {
            console.error("TitleScene: startText is not defined for tweening!");
        }

        // once を使ってリスナーを登録
        this.input.once('pointerdown', () => this.startGame(), this);
        this.input.keyboard.once('keydown-SPACE', () => this.startGame(), this);
        this.input.keyboard.once('keydown-ENTER', () => this.startGame(), this);

        console.log("TitleScene: Original create finished. Waiting for input to start game.");
    }

    startGame() {
        console.log("TitleScene: startGame called");

        // onceで登録したので明示的な解除は不要だが、トゥイーンは止める
        if (this.startTextTween && this.startTextTween.isPlaying()) {
            this.startTextTween.stop();
        }

        // ★★★ これが最も重要な修正点 ★★★
        // UIScene も start で再起動する
        this.scene.start('GameScene');
        this.scene.start('UIScene'); // launch ではなく start を使う

        this.scene.stop('TitleScene'); // 最後に自分を停止
    }

    shutdown() {
        console.log("TitleScene shutdown");
        // トゥイーンが残っていれば停止
        if (this.startTextTween) {
            this.startTextTween.stop();
            this.startTextTween = null;
        }
        super.shutdown();
    }
}