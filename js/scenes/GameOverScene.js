const DEFEAT_TEXT_COLOR = '#e84118'; // LoLの「敗北」のような赤色

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.finalScore = data.score;
    }

    create() {
        this.cameras.main.setBackgroundColor(this.game.config.backgroundColor);

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 100, '敗北 (DEFEAT)', {
            fontSize: '60px', fill: DEFEAT_TEXT_COLOR, fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, `最終スコア: ${this.finalScore}`, {
            fontSize: '36px', fill: '#fff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 70, "「R」キーでリスタート", {
            fontSize: '24px', fill: '#fff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-R', () => {
            // ゲームシーンとUIシーンを再起動
            this.scene.stop('GameOverScene'); // このシーンを停止
            this.scene.start('BootScene'); // BootSceneからやり直して適切に初期化
        });
    }
}