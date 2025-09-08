// UIScene.js
export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false });
        this.scoreText = null;
        this.flashCooldownText = null;
        this.flashStatusText = null;
        this.currentFlashCooldown = 0;
        
        this.updateScoreHandler = null;
        this.flashUsedHandler = null;
        this.flashReadyHandler = null;

        this.cooldownDisplayTimer = null;
        
         this.isListenersSetup = false;
    }

    create() {
        console.log("UIScene created.");
         this.isListenersSetup = false;

        this.scoreText = this.add.text(20, 20, 'スコア: 0', {
            fontSize: '28px', fill: '#fff', fontFamily: 'Arial'
        });
        this.flashStatusText = this.add.text(this.cameras.main.width - 20, 20, 'Flash: READY', {
            fontSize: '20px', fill: '#0f0', fontFamily: 'Arial'
        }).setOrigin(1, 0);
        this.flashCooldownText = this.add.text(this.cameras.main.width - 20, 50, '', {
            fontSize: '18px', fill: '#ff0', fontFamily: 'Arial'
        }).setOrigin(1, 0);

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

    update(time, delta) {
        if (!this.isListenersSetup) {
            this.setupGameEventListeners();
        }
        
    }

    setupGameEventListeners() {
        const gameScene = this.scene.get('GameScene');

        if (!gameScene || !gameScene.scene.isActive() || this.isListenersSetup) {
            return;
        }

        console.log("UIScene: GameScene is active, setting up event listeners.");

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

        this.isListenersSetup = true;

        if (this.scoreText) {
            this.scoreText.setText(`スコア: ${gameScene.score}`);
        }
    }

    updateFlashCooldown() {
    }

    updateFlashCooldownText() {
    }

    shutdown() {
        console.log("UIScene shutdown");
        const gameScene = this.scene.get('GameScene');

        if (gameScene && gameScene.events) {
            gameScene.events.off('updateScore');
            gameScene.events.off('flashUsed');
            gameScene.events.off('flashReady');
        }
        
        if (this.cooldownDisplayTimer) { /* ... */ }
        if (this.scoreText) { /* ... */ }
       
        super.shutdown();
    }
}