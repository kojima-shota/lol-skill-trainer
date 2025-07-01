
const DEFEAT_TEXT_COLOR = '#e84118'; // LoLの「敗北」のような赤色

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
        this.finalScore = 0; // initで設定される前に参照エラーが出ないように初期化
        this.restartKeyListener = null; // リスナー関数を保持
    }

    init(data) {
        this.finalScore = data.score !== undefined ? data.score : 0; // data.scoreが存在しない場合のフォールバック
    }

    create() {
        // キーボード入力を有効にする (もし前のシーンで無効化されていた場合)
        if (this.input && this.input.keyboard && !this.input.keyboard.enabled) {
            this.input.keyboard.enabled = true;
        }

        this.cameras.main.setBackgroundColor(this.game.config.backgroundColor || '#0a141e');

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 100, 'DEFEAT', {
            fontSize: '60px', fill: DEFEAT_TEXT_COLOR, fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, `最終スコア: ${this.finalScore}`, {
            fontSize: '36px', fill: '#fff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 70, "「R」キーでタイトルへ", {
            fontSize: '24px', fill: '#fff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // リスナー関数を定義してプロパティに保存
        this.restartKeyListener = () => {
            console.log("R key pressed in GameOverScene");
            // UISceneがアクティブまたはスリープ状態であれば停止
            if (this.scene.manager.isActive('UIScene') || this.scene.manager.isSleeping('UIScene')) {
                this.scene.stop('UIScene');
            }
            // GameSceneも同様に停止（通常は不要かもしれないが念のため）
            if (this.scene.manager.isActive('GameScene') || this.scene.manager.isSleeping('GameScene')) {
                this.scene.stop('GameScene');
            }
            this.scene.start('BootScene');
        };

        // プロパティに保存したハンドラを使ってイベントをリッスン
        this.input.keyboard.on('keydown-R', this.restartKeyListener);
    }

    shutdown() {
        console.log("GameOverScene shutdown");
        // このシーンで登録したキーボードイベントリスナーを解除
        if (this.input && this.input.keyboard && this.restartKeyListener) {
            this.input.keyboard.off('keydown-R', this.restartKeyListener);
            this.restartKeyListener = null; // ハンドラ参照をクリア
        }
        super.shutdown();
    }
}