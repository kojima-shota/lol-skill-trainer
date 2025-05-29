export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false }); // 最初は非アクティブでも良いが、launchで起動する
        this.scoreText = null;
        this.flashCooldownText = null;
        this.flashStatusText = null;
        this.currentFlashCooldown = 0;
    }

    create() {
        console.log("UIScene created.");
        this.scoreText = this.add.text(20, 20, 'スコア: 0', {
            fontSize: '28px', fill: '#fff', fontFamily: 'Arial'
        });

        this.flashStatusText = this.add.text(this.cameras.main.width - 20, 20, 'Flash: READY', {
            fontSize: '20px', fill: '#0f0', fontFamily: 'Arial'
        }).setOrigin(1, 0); // 右上基準

        this.flashCooldownText = this.add.text(this.cameras.main.width - 20, 50, '', {
            fontSize: '18px', fill: '#ff0', fontFamily: 'Arial'
        }).setOrigin(1, 0);

        // GameSceneからのイベントをリッスン
        const gameScene = this.scene.get('GameScene');

        gameScene.events.on('updateScore', (score) => {
            this.scoreText.setText('スコア: ' + score);
        }, this);

        gameScene.events.on('flashUsed', (cooldown) => {
            this.flashStatusText.setText('Flash: COOLDOWN').setColor('#f00');
            this.currentFlashCooldown = cooldown / 1000; // 秒単位に
            this.updateFlashCooldownText();
        }, this);

        gameScene.events.on('flashReady', () => {
            this.flashStatusText.setText('Flash: READY').setColor('#0f0');
            this.flashCooldownText.setText('');
            this.currentFlashCooldown = 0;
        }, this);

        // クールダウン表示用のタイマー
        this.time.addEvent({
            delay: 100, // 0.1秒ごとに更新
            callback: this.updateFlashCooldown,
            callbackScope: this,
            loop: true
        });
    }

    updateFlashCooldown() {
        if (this.currentFlashCooldown > 0) {
            this.currentFlashCooldown = Math.max(0, this.currentFlashCooldown - 0.1);
            this.updateFlashCooldownText();
        }
    }

    updateFlashCooldownText() {
        if (this.currentFlashCooldown > 0) {
            this.flashCooldownText.setText(this.currentFlashCooldown.toFixed(1) + 's');
        } else {
            this.flashCooldownText.setText('');
        }
    }

    // シーンがシャットダウンまたはスリープするときにイベントリスナーをクリーンアップ
    shutdown() {
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.events.off('updateScore', this.updateScoreListener);
            gameScene.events.off('flashUsed', this.flashUsedListener);
            gameScene.events.off('flashReady', this.flashReadyListener);
        }
        super.shutdown();
    }
}