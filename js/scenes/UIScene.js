// UIScene.js
export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false });
        this.scoreText = null;
        this.flashCooldownText = null;
        this.flashStatusText = null;
        this.currentFlashCooldown = 0;
        
        // ★★★ ハンドラプロパティは不要になるので削除しても良いが、残しても害はない
        this.updateScoreHandler = null;
        this.flashUsedHandler = null;
        this.flashReadyHandler = null;

        this.cooldownDisplayTimer = null;
        
        // ★★★ GameSceneとの接続が完了したかどうかのフラグ ★★★
        this.isListenersSetup = false;
    }

    create() {
        console.log("UIScene created.");
        // isListenersSetup フラグをリセット
        this.isListenersSetup = false;

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

    // ★★★ update メソッドを追加 ★★★
    update(time, delta) {
        // まだリスナーがセットアップされていなければ、セットアップを試みる
        if (!this.isListenersSetup) {
            this.setupGameEventListeners();
        }
        
        // クールダウン表示の更新はここで行っても良いが、タイマーでもOK
        // this.updateFlashCooldown();
    }

    setupGameEventListeners() {
        // GameScene が取得できるか確認
        const gameScene = this.scene.get('GameScene');

        // GameScene がまだ準備できていない、または既にセットアップ済みなら何もしない
        if (!gameScene || !gameScene.scene.isActive() || this.isListenersSetup) {
            return;
        }

        console.log("UIScene: GameScene is active, setting up event listeners.");

        // --- リスナーを登録 ---
        gameScene.events.on('updateScore', (score) => {
            if (this.scoreText) {
                this.scoreText.setText(`スコア: ${score}`);
            }
        }, this);

        gameScene.events.on('flashUsed', (cooldown) => {
            if (this.flashStatusText) {
                this.flashStatusText.setText('Flash: COOLDOWN').setColor('#f00');
            }
            this.currentFlashCooldown = cooldown / 1000;
            this.updateFlashCooldownText();
        }, this);

        gameScene.events.on('flashReady', () => {
            if (this.flashStatusText) {
                this.flashStatusText.setText('Flash: READY').setColor('#0f0');
            }
            if (this.flashCooldownText) {
                this.flashCooldownText.setText('');
            }
            this.currentFlashCooldown = 0;
        }, this);

        // ★★★ セットアップが完了したことをフラグで記録 ★★★
        this.isListenersSetup = true;

        // ★★★ 最初のスコアを即時反映 ★★★
        if (this.scoreText) {
            this.scoreText.setText(`スコア: ${gameScene.score}`);
        }
    }

    updateFlashCooldown() {
        // ... (変更なし) ...
    }

    updateFlashCooldownText() {
        // ... (変更なし) ...
    }

    shutdown() {
        console.log("UIScene shutdown");
        const gameScene = this.scene.get('GameScene');

        // shutdown時には、gameSceneがまだ存在すればリスナーを解除しようと試みる
        // ただし、GameSceneが先に破棄されることもあるので、エラーチェックは重要
        if (gameScene && gameScene.events) {
            // 全てのイベントリスナーを解除する方が確実
            gameScene.events.off('updateScore');
            gameScene.events.off('flashUsed');
            gameScene.events.off('flashReady');
        }
        
        // ... (他のクリーンアップ処理は変更なし) ...
        if (this.cooldownDisplayTimer) { /* ... */ }
        if (this.scoreText) { /* ... */ }
        // ...
        super.shutdown();
    }
}