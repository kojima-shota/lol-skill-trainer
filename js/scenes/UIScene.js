// UIScene.js
export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false });
        this.scoreText = null;
        this.flashCooldownText = null;
        this.flashStatusText = null;
        this.currentFlashCooldown = 0;

        // イベントリスナーの参照を保持するためのプロパティ
        this.updateScoreHandler = null;
        this.flashUsedHandler = null;
        this.flashReadyHandler = null;

        this.cooldownDisplayTimer = null; // クールダウン表示用タイマーの参照
    }

    create() {
        console.log("UIScene created.");
        // --- UI要素の作成 ---
        this.scoreText = this.add.text(20, 20, 'スコア: 0', {
            fontSize: '28px', fill: '#fff', fontFamily: 'Arial'
        });

        this.flashStatusText = this.add.text(this.cameras.main.width - 20, 20, 'Flash: READY', {
            fontSize: '20px', fill: '#0f0', fontFamily: 'Arial'
        }).setOrigin(1, 0);

        this.flashCooldownText = this.add.text(this.cameras.main.width - 20, 50, '', {
            fontSize: '18px', fill: '#ff0', fontFamily: 'Arial'
        }).setOrigin(1, 0);

        // --- GameSceneの準備完了イベントを待つ ---
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.events) {
            // 'gameReady' イベントを一度だけリッスンし、リスナー設定メソッドを呼び出す
            gameScene.events.once('gameReady', this.setupGameEventListeners, this);
        } else {
            console.warn("UIScene: GameScene not found on create, cannot listen for 'gameReady'.");
        }

        // --- クールダウン表示用タイマー ---
        if (this.cooldownDisplayTimer) {
            this.cooldownDisplayTimer.destroy();
        }
        this.cooldownDisplayTimer = this.time.addEvent({
            delay: 100,
            callback: this.updateFlashCooldown,
            callbackScope: this,
            loop: true
        });
    }

    // ★★★ メソッドを create() の外、クラスの直下に定義 ★★★
    setupGameEventListeners() {
        console.log("UIScene: GameScene is ready, setting up event listeners.");
        const gameScene = this.scene.get('GameScene');
        if (!gameScene || !gameScene.events) {
            console.warn("UIScene: GameScene not available for event setup.");
            return;
        }

        // リスナー関数をプロパティとして定義
        this.updateScoreHandler = (score) => {
            if (this.scoreText) {
                this.scoreText.setText('スコア: ' + score);
            }
        };
        this.flashUsedHandler = (cooldown) => {
            if (this.flashStatusText) {
                this.flashStatusText.setText('Flash: COOLDOWN').setColor('#f00');
            }
            this.currentFlashCooldown = cooldown / 1000;
            this.updateFlashCooldownText();
        };
        this.flashReadyHandler = () => {
            if (this.flashStatusText) {
                this.flashStatusText.setText('Flash: READY').setColor('#0f0');
            }
            if (this.flashCooldownText) {
                this.flashCooldownText.setText('');
            }
            this.currentFlashCooldown = 0;
        };

        // プロパティに保存したハンドラを使ってイベントをリッスン
        gameScene.events.on('updateScore', this.updateScoreHandler, this);
        gameScene.events.on('flashUsed', this.flashUsedHandler, this);
        gameScene.events.on('flashReady', this.flashReadyHandler, this);
    }


    updateFlashCooldown() {
        if (this.currentFlashCooldown > 0) {
            this.currentFlashCooldown = Math.max(0, this.currentFlashCooldown - 0.1);
            this.updateFlashCooldownText();
        }
    }

    updateFlashCooldownText() {
        if (!this.flashCooldownText) return;

        if (this.currentFlashCooldown > 0) {
            this.flashCooldownText.setText(this.currentFlashCooldown.toFixed(1) + 's');
        } else {
            this.flashCooldownText.setText('');
        }
    }

    shutdown() {
        console.log("UIScene shutdown");
        const gameScene = this.scene.get('GameScene');

        // --- GameSceneからのイベントリスナー解除 ---
        if (gameScene && gameScene.events) {
            // 'gameReady' リスナーも解除 (onceなので通常は不要だが、念のため)
            gameScene.events.off('gameReady', this.setupGameEventListeners, this);

            // 各ハンドラも解除
            if (this.updateScoreHandler) {
                gameScene.events.off('updateScore', this.updateScoreHandler, this);
            }
            if (this.flashUsedHandler) {
                gameScene.events.off('flashUsed', this.flashUsedHandler, this);
            }
            if (this.flashReadyHandler) {
                gameScene.events.off('flashReady', this.flashReadyHandler, this);
            }
        }

        // ハンドラ参照をクリア
        this.updateScoreHandler = null;
        this.flashUsedHandler = null;
        this.flashReadyHandler = null;

        // --- クールダウン表示用タイマーの破棄 ---
        if (this.cooldownDisplayTimer) {
            this.cooldownDisplayTimer.destroy();
            this.cooldownDisplayTimer = null;
        }

        // --- UI要素の破棄 ---
        if (this.scoreText) { this.scoreText.destroy(); this.scoreText = null; }
        if (this.flashStatusText) { this.flashStatusText.destroy(); this.flashStatusText = null; }
        if (this.flashCooldownText) { this.flashCooldownText.destroy(); this.flashCooldownText = null; }

        super.shutdown();
    }
}