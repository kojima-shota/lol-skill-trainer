// GameScene.js
import Enemy from './Enemy.js';
import Bullet from './Bullet.js';
import ObstacleWall from './ObstacleWall.js';

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
const OBSTACLE_BULLET_COLOR = 0xff0000;

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
        this.wallTimer = null;
        this.flashCooldownTimer = null;
        this.scoreTimer = null;
        this.score = 0;
        this.canFlash = true;
        this.currentSpawnRate = INITIAL_SPAWN_RATE;
        this.currentBulletBaseSpeed = 200;
        this.playerTargetPosition = null;
        this.isGameOver = false;
        this.flashKey = null;
        this.pointerDownHandler = null;
    }

    init() {
        console.log("GameScene init");
        this.score = 0;
        this.currentSpawnRate = INITIAL_SPAWN_RATE;
        this.currentBulletBaseSpeed = 200;
        this.canFlash = true;
        this.playerTargetPosition = null;
        this.isGameOver = false;
        this.bulletTimer = null;
        this.enemySpawnTimer = null;
        this.difficultyTimer = null;
        this.wallTimer = null;
        this.flashCooldownTimer = null;
        this.scoreTimer = null;
    }

    preload() {
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
            const bulletGraphics = this.make.graphics({ fillStyle: { color: 0xffffff } });
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
        this.physics.world.setBounds(-worldMargin, -worldMargin, this.cameras.main.width + worldMargin * 2, this.cameras.main.height + worldMargin * 2);

        this.player = this.physics.add.sprite(this.cameras.main.width / 2, this.cameras.main.height / 2, 'playerTexture');
        this.player.setCollideWorldBounds(true);
        this.player.body.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.player.body.allowGravity = false;
        this.player.setDepth(1);
        this.playerTargetPosition = new Phaser.Math.Vector2(this.player.x, this.player.y);

        this.bullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
        this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });

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

        this.physics.add.overlap(this.player, this.bullets, this.playerHitBullet, null, this);

        this.physics.world.on('worldbounds', (body) => {
            const gameObject = body.gameObject;
            if (this.bullets.contains(gameObject)) {
                if (this.isGameOver) { gameObject.destroy(); return; }
                this.score += 10;
                this.events.emit('updateScore', this.score);
                gameObject.destroy();
            }
        });
        
        this.cleanupAllTimers();
        this.scoreTimer = this.time.addEvent({
            delay: 100,
            callback: () => { if (!this.isGameOver) { this.score++; this.events.emit('updateScore', this.score); } },
            callbackScope: this,
            loop: true
        });
        this.bulletTimer = this.time.addEvent({
            delay: this.currentSpawnRate,
            callback: this.spawnBullet,
            callbackScope: this,
            loop: true,
            startAt: 1000
        });
        this.enemySpawnTimer = this.time.addEvent({
            delay: 5000,
            callback: this.spawnNewEnemy,
            callbackScope: this,
            loop: true
        });
        this.wallTimer = this.time.addEvent({
            delay: 4200,
            callback: this.spawnBullet, // spawnWall の代わりに spawnBullet を呼ぶ
            callbackScope: this,
            loop: true
        });

        this.difficultyTimer = this.time.addEvent({
            delay: DIFFICULTY_INCREASE_INTERVAL,
            callback: this.increaseDifficulty,
            callbackScope: this,
            loop: true
        });
        this.events.emit('gameReady');
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
        console.log("--- Spawning Obstacle Bullet ---");
        const side = Phaser.Math.Between(0, 3);
        let x, y, velocityX = 0, velocityY = 0;
        const bulletSize = Phaser.Math.FloatBetween(15, 30);
        const bulletSpeed = this.currentBulletBaseSpeed + Phaser.Math.FloatBetween(-30, 30);
        const bulletColor = OBSTACLE_BULLET_COLOR;
        
        const bullet = this.bullets.get(); // ★★★ new Bullet(...) をやめて get() を使う
        
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
                console.error("spawnBullet: Bullet instance from get() does not have spawnAsObstacle method.");
                bullet.destroy();
            }
        }
    }
    /*spawnWall() {
        if (this.isGameOver) return;
        const speed = this.currentBulletBaseSpeed * 0.8;
        const color = 0x888888;
        let x, y, width, height, velocityX, velocityY;
        if (Phaser.Math.Between(0, 1) === 0) {
            width = Phaser.Math.Between(100, 300); height = 20;
            x = Phaser.Math.Between(0, this.cameras.main.width - width); velocityX = 0;
            if (Phaser.Math.Between(0, 1) === 0) { y = -height; velocityY = speed; } else { y = this.cameras.main.height + height; velocityY = -speed; }
        } else {
            width = 20; height = Phaser.Math.Between(100, 300);
            y = Phaser.Math.Between(0, this.cameras.main.height - height); velocityY = 0;
            if (Phaser.Math.Between(0, 1) === 0) { x = -width; velocityX = speed; } else { x = this.cameras.main.width + width; velocityX = -speed; }
        }
        const wall = new ObstacleWall(this, 0, 0);
        this.bullets.add(wall, true);
        if (typeof wall.spawn === 'function') {
            wall.spawn(x, y, width, height, color, velocityX, velocityY);
        } else {
            console.error("spawnWall: Wall instance does not have spawn method.");
            wall.destroy();
        }
    }
*/
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
        if (this.isGameOver || !player.active) return;
        if (bullet.splitTimer) { bullet.splitTimer.destroy(); }
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
        if (this.wallTimer) { this.wallTimer.destroy(); this.wallTimer = null; }
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
        if (this.input && this.pointerDownHandler) {
            this.input.off('pointerdown', this.pointerDownHandler, this);
            this.pointerDownHandler = null;
        }
        if (this.physics && this.physics.world) {
            this.physics.world.off('worldbounds');
        }
        super.shutdown();
    }
}

