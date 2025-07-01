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

    // preload() { ... } // もしあれば

    create() {
        console.log("TitleScene: create called");

        // ステップ1: 背景色を元に戻す (または今のテスト用のままでもOK)
        this.cameras.main.setBackgroundColor(this.game.config.backgroundColor || '#0a141e');
        // this.cameras.main.setBackgroundColor('#FF00FF'); // ← テスト用を残すならこちら

        // ステップ2: ゲームタイトル表示を元に戻す
        // ★★★ まずはこのテキスト表示だけでテスト ★★★
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 100, 'League skill micro', {
            fontSize: '48px',
            fill: '#fff',
            fontFamily: 'Arial', // このフォントが利用可能か？
            fontStyle: 'bold'
        }).setOrigin(0.5);
        // ↑↑↑ ここまでで一度実行して表示を確認 ↑↑↑

        // ステップ3: 開始メッセージ表示を元に戻す
        const startText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 50, 'クリックして開始', {
            fontSize: '32px',
            fill: '#c8aa6e', // LoL風ゴールド
            fontFamily: 'Arial' // このフォントが利用可能か？
        }).setOrigin(0.5);
        // ↑↑↑ ここまでで一度実行して表示を確認 ↑↑↑

        // ステップ4: 開始メッセージのトゥイーンを元に戻す
        // ★★★ トゥイーンのターゲット (startText) が null でないことを確認 ★★★
        if (startText) { // startText が正しく生成されていればトゥイーンを実行
            this.startTextTween = this.tweens.add({
                targets: startText,
                alpha: { from: 0.5, to: 1 },
                ease: 'Linear', // 'Linear' は正しいイージング名
                duration: 800,
                repeat: -1,
                yoyo: true
            });
        } else {
            console.error("TitleScene: startText is not defined for tweening!");
        }
        // ↑↑↑ ここまでで一度実行して表示を確認 ↑↑↑

        // ステップ5: 入力リスナーと startGame メソッドを元に戻す
        // (startGame と shutdown メソッドのコメントアウトも解除する必要がある)
        this.startGamePointerHandler = () => this.startGame();
        this.startGameSpaceKeyHandler = () => this.startGame();
        this.startGameEnterKeyHandler = () => this.startGame();

        this.input.once('pointerdown', this.startGamePointerHandler, this);
        this.input.keyboard.once('keydown-SPACE', this.startGameSpaceKeyHandler, this);
        this.input.keyboard.once('keydown-ENTER', this.startGameEnterKeyHandler, this);
        // ↑↑↑ ここまでで一度実行して表示と動作を確認 ↑↑↑

        console.log("TitleScene: Original create finished. Waiting for input to start game.");
    }

    startGame() {
        console.log("TitleScene: startGame called");
        if (this.startGamePointerHandler) this.input.off('pointerdown', this.startGamePointerHandler, this);
        if (this.startGameSpaceKeyHandler) this.input.keyboard.off('keydown-SPACE', this.startGameSpaceKeyHandler, this);
        if (this.startGameEnterKeyHandler) this.input.keyboard.off('keydown-ENTER', this.startGameEnterKeyHandler, this);

        if (this.startTextTween && this.startTextTween.isPlaying()) {
            this.startTextTween.stop();
        }

        this.scene.start('GameScene');
        this.scene.launch('UIScene');
        this.scene.stop('TitleScene');
    }

    shutdown() {
        console.log("TitleScene shutdown");
        if (this.startGamePointerHandler) this.input.off('pointerdown', this.startGamePointerHandler, this);
        if (this.startGameSpaceKeyHandler) this.input.keyboard.off('keydown-SPACE', this.startGameSpaceKeyHandler, this);
        if (this.startGameEnterKeyHandler) this.input.keyboard.off('keydown-ENTER', this.startGameEnterKeyHandler, this);
        this.startGamePointerHandler = null;
        this.startGameSpaceKeyHandler = null;
        this.startGameEnterKeyHandler = null;

        if (this.startTextTween) {
            this.startTextTween.stop();
            this.startTextTween = null;
        }
        super.shutdown();
    }
}