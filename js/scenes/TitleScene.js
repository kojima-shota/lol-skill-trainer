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

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 100, '反射神経テスト', {
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

        this.input.once('pointerdown', () => this.startGame(), this);
        this.input.keyboard.once('keydown-SPACE', () => this.startGame(), this);
        this.input.keyboard.once('keydown-ENTER', () => this.startGame(), this);

        console.log("TitleScene: Original create finished. Waiting for input to start game.");
    }

    startGame() {
        console.log("TitleScene: startGame called");

        if (this.startTextTween && this.startTextTween.isPlaying()) {
            this.startTextTween.stop();
        }

        this.scene.start('GameScene');
        this.scene.start('UIScene'); 

        this.scene.stop('TitleScene'); 
    }

    shutdown() {
        console.log("TitleScene shutdown");
        if (this.startTextTween) {
            this.startTextTween.stop();
            this.startTextTween = null;
        }
        super.shutdown();
    }
}