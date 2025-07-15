// GameScene.js
import Enemy from './Enemy.js';

// --- 定数定義 ---
const PLAYER_SIZE = 30;
const PLAYER_COLOR = 0x3498db;
const PLAYER_SPEED = 360;
const BULLET_COLORS = [0xe74c3c, 0xf1c40f, 0x2ecc71, 0x9b59b6, 0x1abc9c];
const FLASH_DISTANCE = 150;
const FLASH_COOLDOWN = 5000;
const INITIAL_SPAWN_RATE = 1200;
const MIN_SPAWN_RATE = 250;
const DIFFICULTY_INCREASE_INTERVAL = 2000;
const SPAWN_RATE_DECREMENT = 50;
const BULLET_SPEED_INCREASE = 10;
const OBSTACLE_BULLET_COLOR = 0xff0000; // 障害物弾用の赤色

// ★★★ GameScene クラスの開始 ★★★
export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        // --- プロパティ初期化 ---
        this.player = null;
        this.bullets = null;
        this.enemies = null;
        this.bulletTimer = null;
        this.enemySpawnTimer = null;
        this.difficultyTimer = null;
        this.flashCooldownTimer = null;
        this.scoreTimer = null;
        this.score = 0; 
        this.scoreTimer = null;
        this.canFlash = true;
        this.currentSpawnRate = INITIAL_SPAWN_RATE;
        this.currentBulletBaseSpeed = 200;
        this.playerTargetPosition = null;
        this.isGameOver = false; // ゲームオーバーフラグ
        this.flashKey = null;
        this.pointerDownHandler = null;
        this.scoreTimer = null;
        
    }

    init() {
        console.log("GameScene init");
        // --- シーン開始時のプロパティリセット ---
        this.score = 0;
        this.currentSpawnRate = INITIAL_SPAWN_RATE;
        this.currentBulletBaseSpeed = 200;
        this.canFlash = true;
        this.playerTargetPosition = null;
        this.isGameOver = false;
        this.bulletTimer = null;
        this.enemySpawnTimer = null;
        this.difficultyTimer = null;
        this.flashCooldownTimer = null;
        this.scoreTimer = null;
    }

    preload() {
        // --- テクスチャの動的生成 ---
        if (!this.textures.exists('playerTexture')) {
            const playerGraphics = this.make.graphics({ fillStyle: { color: PLAYER_COLOR } });
            playerGraphics.beginPath();
            playerGraphics.moveTo(PLAYER_SIZE / 2, 0);
            playerGraphics.lineTo(PLAYER_SIZE, PLAYER_SIZE);
            playerGraphics.lineTo(0, PLAYER_SIZE);
            playerGraphics.closePath();
            playerGraphics.fillPath();
            playerGraphics.generateTexture('playerTexture', PLAYER_SIZE, PLAYER_SIZE);
            playerGraphics.destroy();
        }
        if (!this.textures.exists('bulletTexture')) {
            const BULLET_BASE_SIZE = 20;
            const bulletGraphics = this.make.graphics({ fillStyle: { color: 0xffffff } }); // ベースは白
            bulletGraphics.fillCircle(BULLET_BASE_SIZE / 2, BULLET_BASE_SIZE / 2, BULLET_BASE_SIZE / 2);
            bulletGraphics.generateTexture('bulletTexture', BULLET_BASE_SIZE, BULLET_BASE_SIZE);
            bulletGraphics.destroy();
        }
    }

    create() {
        console.log("GameScene create");
        this.cameras.main.setBackgroundColor(this.game.config.backgroundColor);
       this.events.emit('updateScore', this.score);
        this.events.emit('flashReady');

         const worldMargin = 100;
        this.physics.world.setBounds(
            -worldMargin,
            -worldMargin,
            this.cameras.main.width + worldMargin * 2,
            this.cameras.main.height + worldMargin * 2
        );

        // --- プレイヤー作成 ---
         this.player = this.physics.add.sprite(this.cameras.main.width / 2, this.cameras.main.height / 2, 'playerTexture');
        this.player.setCollideWorldBounds(true); // プレイヤーは画面内で動く
        this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height); // プレイヤー用の境界は画面ぴったりに
        this.player.body.allowGravity = false;
        this.player.setDepth(1);
        this.playerTargetPosition = new Phaser.Math.Vector2(this.player.x, this.player.y);

        // --- グループ作成 ---
        this.bullets = this.physics.add.group({
            classType: Bullet,
            runChildUpdate: true
        });
        this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
         // --- 入力設定 ---
        this.pointerDownHandler = (pointer) => {
            if (this.isGameOver) return;
            if (pointer.rightButtonDown()) {
                if (this.player && this.player.active) {
                    this.playerTargetPosition.set(pointer.worldX, pointer.worldY);
                    this.physics.moveToObject(this.player, this.playerTargetPosition, PLAYER_SPEED);
                }
            }
        };
        this.input.on('pointerdown', this.pointerDownHandler, this);
        this.flashKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        // --- 衝突判定 ---
        this.physics.add.overlap(this.player, this.bullets, this.playerHitBullet, null, this);

 this.physics.world.on('worldbounds', (body) => {
            const gameObject = body.gameObject;
            // 弾がワールド境界に触れたら「避けた」とみなす
            if (this.bullets.contains(gameObject)) {
                this.score += 10;
                this.events.emit('updateScore', this.score);
                console.log("Bullet dodged (worldbounds)! Score: " + this.score);
                gameObject.destroy(); // 弾を破棄
            }
        });
        
        // --- タイマー設定 ---
        this.cleanupAllTimers();
        this.scoreTimer = this.time.addEvent({
            delay: 100, 
            callback: () => {
                if (!this.isGameOver) { 
                    this.score++; 
                    this.events.emit('updateScore', this.score);
                }
            },
            callbackScope: this,
            loop: true
        });
        this.bulletTimer = this.time.addEvent({ delay: 1200, callback: this.spawnBullet, callbackScope: this, loop: true, startAt: 1000 });
        this.enemySpawnTimer = this.time.addEvent({ delay: 5000, callback: this.spawnNewEnemy, callbackScope: this, loop: true });
        this.difficultyTimer = this.time.addEvent({ delay: 2000, callback: this.increaseDifficulty, callbackScope: this, loop: true });

        this.events.emit('gameReady');
        console.log("GameScene ready, 'gameReady' event emitted.");
    }

    update(time, delta) {
        if (this.isGameOver) return;
        if (!this.player || !this.player.active) return;
        if (this.player.body.speed > 0) {
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.playerTargetPosition.x, this.playerTargetPosition.y);
            if (distance < 5) {
                this.player.body.reset(this.playerTargetPosition.x, this.playerTargetPosition.y);
                this.player.body.setVelocity(0, 0);
            }
        }
        if (this.flashKey && Phaser.Input.Keyboard.JustDown(this.flashKey)) {
            this.performFlash();
        }

         if (this.bullets && this.bullets.getChildren()) {
            // ループは逆順で行うのが安全 (ループ中に要素を削除するため)
            for (let i = this.bullets.getChildren().length - 1; i >= 0; i--) {
                const bullet = this.bullets.getChildren()[i];

                // 弾がアクティブで、かつ画面外に出たかどうかをチェック
                if (bullet.active && this.isBulletOffScreen(bullet)) {
                    // スコアに10点加算
                    this.score += 10;
                    // UIシーンにスコア更新を通知
                    this.events.emit('updateScore', this.score);
                    
                    console.log("Bullet dodged! Score: " + this.score);

                    // 弾を破棄
                    bullet.destroy();
                }
                }
        }
    }
    isBulletOffScreen(bullet) {
        const bounds = this.cameras.main.worldView;
        const margin = bullet.displayWidth; // 弾のサイズ分のマージン

        return (
            bullet.x < bounds.x - margin ||
            bullet.x > bounds.right + margin ||
            bullet.y < bounds.y - margin ||
            bullet.y > bounds.bottom + margin
        );
    }

    performFlash() {
        if (this.isGameOver || !this.canFlash) return;
        this.canFlash = false;
        this.events.emit('flashUsed', FLASH_COOLDOWN);
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
        let targetX = this.player.x + Math.cos(angle) * FLASH_DISTANCE;
        let targetY = this.player.y + Math.sin(angle) * FLASH_DISTANCE;
        targetX = Phaser.Math.Clamp(targetX, PLAYER_SIZE / 2, this.cameras.main.width - PLAYER_SIZE / 2);
        targetY = Phaser.Math.Clamp(targetY, PLAYER_SIZE / 2, this.cameras.main.height - PLAYER_SIZE / 2);
        if (this.playerTargetPosition) this.playerTargetPosition.set(targetX, targetY);
        this.tweens.add({
            targets: this.player, alpha: { from: 0.3, to: 1 }, duration: 100,
            onStart: () => {
                this.player.setPosition(targetX, targetY);
                if (this.player.body) { this.player.body.reset(targetX, targetY); this.player.body.setVelocity(0, 0); }
            }
        });
        if (this.flashCooldownTimer) this.flashCooldownTimer.destroy();
        this.flashCooldownTimer = this.time.delayedCall(FLASH_COOLDOWN, () => { this.canFlash = true; this.events.emit('flashReady'); }, [], this);
    }

    spawnBullet() {
        if (this.isGameOver) return;
        const side = Phaser.Math.Between(0, 3);
        let x, y, velocityX = 0, velocityY = 0;
        const bulletSize = Phaser.Math.FloatBetween(15, 30);
        const bulletSpeed = this.currentBulletBaseSpeed + Phaser.Math.FloatBetween(-30, 30);
        const bulletColor = OBSTACLE_BULLET_COLOR; // ★ 赤色に固定
        const bullet = this.bullets.get();
        if (bullet) {
            switch (side) {
                case 0: x = Phaser.Math.Between(0, this.cameras.main.width); y = -bulletSize; velocityX = Phaser.Math.Between(-bulletSpeed * 0.3, bulletSpeed * 0.3); velocityY = bulletSpeed; break;
                case 1: x = this.cameras.main.width + bulletSize; y = Phaser.Math.Between(0, this.cameras.main.height); velocityX = -bulletSpeed; velocityY = Phaser.Math.Between(-bulletSpeed * 0.3, bulletSpeed * 0.3); break;
                case 2: x = Phaser.Math.Between(0, this.cameras.main.width); y = this.cameras.main.height + bulletSize; velocityX = Phaser.Math.Between(-bulletSpeed * 0.3, bulletSpeed * 0.3); velocityY = -bulletSpeed; break;
                case 3: default: x = -bulletSize; y = Phaser.Math.Between(0, this.cameras.main.height); velocityX = bulletSpeed; velocityY = Phaser.Math.Between(-bulletSpeed * 0.3, bulletSpeed * 0.3); break;
            }
            if (typeof bullet.spawnAsObstacle === 'function') {
                bullet.spawnAsObstacle(x, y, bulletSize, bulletColor, velocityX, velocityY);
            } else {
                console.error("spawnBullet: Bullet instance does not have spawnAsObstacle method.");
                bullet.destroy();
            }
        }
    }

    increaseDifficulty() {
        if (this.isGameOver) return;
        if (this.currentSpawnRate > MIN_SPAWN_RATE) {
            this.currentSpawnRate = Math.max(MIN_SPAWN_RATE, this.currentSpawnRate - SPAWN_RATE_DECREMENT);
            if (this.bulletTimer) { this.bulletTimer.delay = this.currentSpawnRate; }
        }
        this.currentBulletBaseSpeed += BULLET_SPEED_INCREASE;
    }

    spawnNewEnemy() {
        if (this.isGameOver) return;
        const side = Phaser.Math.Between(0, 3);
        let x, y;
        const enemyVisualSize = 40;
        switch (side) {
            case 0: x = Phaser.Math.Between(0, this.cameras.main.width); y = -enemyVisualSize; break;
            case 1: x = this.cameras.main.width + enemyVisualSize; y = Phaser.Math.Between(0, this.cameras.main.height); break;
            case 2: x = Phaser.Math.Between(0, this.cameras.main.width); y = this.cameras.main.height + enemyVisualSize; break;
            case 3: default: x = -enemyVisualSize; y = Phaser.Math.Between(0, this.cameras.main.height); break;
        }
        const enemy = this.enemies.get();
        if (enemy) {
            if (typeof enemy.spawnSelf === 'function') {
                enemy.spawnSelf(x, y);
            } else {
                console.error("Enemy instance does not have spawnSelf method");
                enemy.destroy();
            }
        }
    }
     

    playerHitBullet(player, bullet) {
         if (bullet.arcTween && bullet.arcTween.isPlaying()) {
            bullet.arcTween.stop();
        }
        if (this.isGameOver || !player.active) return;
        this.isGameOver = true;
        player.setActive(false).setVisible(false);
        console.log("Player hit by bullet, starting game over sequence.");
        this.cleanupAllTimers();
        this.physics.pause();
        
        this.cameras.main.shake(200, 0.01);
        this.time.delayedCall(500, () => {
            if (this.scene.isActive('UIScene')) { this.scene.stop('UIScene'); }
             this.scene.start('GameOverScene', { score: this.score });
        });
    }

    cleanupAllTimers() {
       console.log("GameScene: Cleaning up all timers");
        if (this.scoreTimer) { this.scoreTimer.destroy(); this.scoreTimer = null; }
        if (this.bulletTimer) { this.bulletTimer.destroy(); this.bulletTimer = null; }
        if (this.enemySpawnTimer) { this.enemySpawnTimer.destroy(); this.enemySpawnTimer = null; }
        if (this.difficultyTimer) { this.difficultyTimer.destroy(); this.difficultyTimer = null; }
        if (this.flashCooldownTimer) { this.flashCooldownTimer.destroy(); this.flashCooldownTimer = null; }
    }

    shutdown() {
        console.log("GameScene shutdown");
        this.cleanupAllTimers();
        if (this.player) { this.player.destroy(); this.player = null; }
        if (this.bullets) { this.bullets.destroy(true, true); this.bullets = null; }
        if (this.enemies) {
            this.enemies.getChildren().forEach(enemy => { if (enemy && typeof enemy.destroyTimers === 'function') enemy.destroyTimers(); });
            this.enemies.destroy(true, true);
            this.enemies = null;
        }
        if (this.physics && this.physics.world && this.physics.world.isPaused) this.physics.resume();
        this.events.off('updateScore');
        this.events.off('flashUsed');
        this.events.off('flashReady');
        this.events.off('gameReady');
        this.events.off('updateSurvivalTime');
        if (this.input && this.pointerDownHandler) {
            this.input.off('pointerdown', this.pointerDownHandler, this);
            this.pointerDownHandler = null;
        }
        super.shutdown();
    }
} // ★★★ GameScene クラスの定義はここで終了 ★★★

// --- Bulletクラスの定義 (ここに1つだけ) ---
class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture = 'bulletTexture') {
        super(scene, x, y, texture);
        this.setActive(false);
        this.setVisible(false);
        this.arcTween = null;
        this.splitTimer = null;
    }
    activate(x, y, size) {
        this.enableBody(true, x, y, true, true);
        this.setDisplaySize(size, size);
        
        // ★★★ ワールド境界との衝突を有効化 ★★★
        if (this.body) {
            this.body.setCollideWorldBounds(true, 0, 0, true); // (collide, bounceX, bounceY, onWorldBounds)
            this.body.onWorldBounds = true; // worldbounds イベントを発行するように設定
            this.body.setCircle(size / 2);
        }
    }

    spawnAsArc(startX, startY, endX, endY, size, color, duration) {
        this.enableBody(true, startX, startY, true, true);
        this.setDisplaySize(size, size);
         const textureKey = `bullet_${color.toString(16)}`;
        if (!this.scene.textures.exists(textureKey)) {
            console.log(`Creating new bullet texture: ${textureKey}`);
            const BULLET_BASE_SIZE = 20; // 基準サイズ
            const bulletGraphics = this.scene.make.graphics({ fillStyle: { color: color } });
            bulletGraphics.fillCircle(BULLET_BASE_SIZE / 2, BULLET_BASE_SIZE / 2, BULLET_BASE_SIZE / 2);
            bulletGraphics.generateTexture(textureKey, BULLET_BASE_SIZE, BULLET_BASE_SIZE);
            bulletGraphics.destroy();
        }
        this.setTexture(textureKey); // 色付きのテクスチャをセット
        
        if (this.body) {
            this.body.setCircle(size / 2);
            this.body.setVelocity(0, 0); // トゥイーンで動かすので物理速度は0
        }
        this.setCollideWorldBounds(false);

        // 既存のトゥイーンがあれば停止
        if (this.arcTween) {
            this.arcTween.stop();
        }

        // ★★★ 弧を描くためのプロパティを追加 ★★★
        // spawnAsArc のトゥイーン設定の別案 (放物線)
this.arcTween = this.scene.tweens.add({
    targets: this,
    x: endX,
    y: endY,
    ease: 'Linear', // xとyの基本的な動きは線形
    duration: duration,
    onUpdate: (tween, target) => {
        // トゥイーンの進行度 (0から1) を使って、擬似的な重力を加える
        const progress = tween.progress;
        // 進行度に応じてY座標を上に持ち上げる (放物線の頂点は進行度0.5の時)
        const peakHeight = -150; // 弧の高さ (マイナスで上方向)
        target.y += peakHeight * (1 - Math.abs(0.5 - progress) / 0.5) * Math.sin(Math.PI * progress);
    },
    onComplete: () => {
        if (this.active) {
            this.destroy();
        }
    }
});
    

        this.setTint(color);
        if (this.body) {
            this.body.setCircle(size / 2);
            // 物理的な速度は0にする（トゥイーンで動かすため）
            this.body.setVelocity(0, 0);
        }
        this.setCollideWorldBounds(false);

        // 既存のトゥイーンがあれば停止・削除
        if (this.arcTween) {
            this.arcTween.stop();
            this.arcTween = null;
        }

        // 弧を描くトゥイーンを作成
        this.arcTween = this.scene.tweens.add({
            targets: this,
            x: endX,
            y: endY,
            duration: duration,
            ease: 'Sine.easeInOut', // サインカーブで滑らかな動き
            onComplete: () => {
                // 画面外に到達したら弾を破棄
                this.destroy();
            }
        });
    }
    

    spawnAsSkill(x, y, size, color, targetPlayer, speed) {
        this.enableBody(true, x, y, true, true);
        this.setDisplaySize(size, size);
        this.setTint(color);
        if (this.body) this.body.setCircle(size / 2);
        this.setCollideWorldBounds(false);
        if (targetPlayer && targetPlayer.active) {
            if (this.scene && this.scene.physics && this.body) {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, targetPlayer.x, targetPlayer.y);
                this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
            }
        } else {
            if (this.body) this.body.setVelocity(0, 0);
        }
    }
    spawnAsObstacle(x, y, size, color, velocityX, velocityY) {
        this.enableBody(true, x, y, true, true);
        this.setDisplaySize(size, size);
        this.setTint(color);
        if (this.body) {
            this.body.setCircle(size / 2);
            this.body.setVelocity(velocityX, velocityY);
        }
        this.setCollideWorldBounds(false);
    }
}