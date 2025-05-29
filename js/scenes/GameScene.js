// --- 定数 ---
const PLAYER_SIZE = 30;
const PLAYER_COLOR = 0x3498db; // 青系
const PLAYER_SPEED = 250; // プレイヤーの移動速度 (ピクセル/秒)
const BULLET_COLORS = [0xe74c3c, 0xf1c40f, 0x2ecc71, 0x9b59b6, 0x1abc9c];
const FLASH_DISTANCE = 150;
const FLASH_COOLDOWN = 5000; // 5秒 (ミリ秒)
const INITIAL_SPAWN_RATE = 1200;
const MIN_SPAWN_RATE = 250;
const DIFFICULTY_INCREASE_INTERVAL = 2000;
const SPAWN_RATE_DECREMENT = 50;
const BULLET_SPEED_INCREASE = 10;

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.player = null;
        this.bullets = null;
        this.bulletTimer = null;
        this.difficultyTimer = null;
        this.score = 0;

        this.flashKey = null;
        this.canFlash = true;
        this.flashCooldownTimer = null;

        this.currentSpawnRate = INITIAL_SPAWN_RATE;
        this.currentBulletBaseSpeed = 200;

        this.playerTargetPosition = null; // プレイヤーの移動目標地点
    }

    create() {
        this.cameras.main.setBackgroundColor(this.game.config.backgroundColor);
        this.score = 0;
        this.currentSpawnRate = INITIAL_SPAWN_RATE;
        this.currentBulletBaseSpeed = 200;
        this.canFlash = true;

        this.events.emit('updateScore', this.score);
        this.events.emit('flashReady');

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
            const bulletGraphics = this.make.graphics({ fillStyle: { color: 0xffffff } });
            const bulletBaseSize = 20;
            bulletGraphics.fillCircle(bulletBaseSize / 2, bulletBaseSize / 2, bulletBaseSize / 2);
            bulletGraphics.generateTexture('bulletTexture', bulletBaseSize, bulletBaseSize);
            bulletGraphics.destroy();
        }

        this.player = this.physics.add.sprite(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2, // 初期位置を画面中央に変更
            'playerTexture'
        );
        this.player.setCollideWorldBounds(true);
        this.player.body.allowGravity = false;
        this.player.setDepth(1);
        this.playerTargetPosition = new Phaser.Math.Vector2(this.player.x, this.player.y); // 初期目標は現在位置

        this.bullets = this.physics.add.group({
            classType: Bullet,
            runChildUpdate: true
        });

        // 右クリックで移動目標を設定
        this.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {
                if (this.player && this.player.active) {
                    this.playerTargetPosition.set(pointer.worldX, pointer.worldY);
                    // プレイヤーを目標地点へ移動開始
                    this.physics.moveToObject(this.player, this.playerTargetPosition, PLAYER_SPEED);
                }
            }
        });

        this.flashKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.physics.add.overlap(this.player, this.bullets, this.playerHitBullet, null, this);

        this.bulletTimer = this.time.addEvent({
            delay: this.currentSpawnRate,
            callback: this.spawnBullet,
            callbackScope: this,
            loop: true
        });

        this.difficultyTimer = this.time.addEvent({
            delay: DIFFICULTY_INCREASE_INTERVAL,
            callback: this.increaseDifficulty,
            callbackScope: this,
            loop: true
        });
    }

    update(time, delta) {
        if (!this.player || !this.player.active) return;

        // プレイヤーが目標地点に近づいたら停止
        if (this.player.body.speed > 0) {
            const distance = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                this.playerTargetPosition.x,
                this.playerTargetPosition.y
            );

            // 速度の1フレーム分の移動量より近い場合、または目標を超えた場合に停止
            // (moveToObjectは正確に止まらないことがあるため、微調整)
            if (distance < (PLAYER_SPEED * (delta / 1000)) * 1.5 || distance < 5) {
                this.player.body.reset(this.playerTargetPosition.x, this.playerTargetPosition.y); // 正確な位置に補正
                this.player.body.setVelocity(0, 0); // 速度を0に
            }
        }


        if (Phaser.Input.Keyboard.JustDown(this.flashKey) && this.canFlash) {
            this.performFlash();
        }

        this.bullets.getChildren().forEach(bullet => {
            if (bullet.active && !this.physics.world.bounds.contains(bullet.x, bullet.y)) {
                const margin = bullet.displayWidth * 2;
                if (bullet.x < -margin || bullet.x > this.cameras.main.width + margin ||
                    bullet.y < -margin || bullet.y > this.cameras.main.height + margin) {
                    this.score++;
                    this.events.emit('updateScore', this.score);
                    bullet.destroy();
                }
            }
        });
    }

    performFlash() {
        this.canFlash = false;
        this.events.emit('flashUsed', FLASH_COOLDOWN);

        const pointer = this.input.activePointer; // マウスカーソルの現在の位置
        // Flashの方向はプレイヤーからマウスカーソルへ
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);

        let targetX = this.player.x + Math.cos(angle) * FLASH_DISTANCE;
        let targetY = this.player.y + Math.sin(angle) * FLASH_DISTANCE;

        targetX = Phaser.Math.Clamp(targetX, PLAYER_SIZE / 2, this.cameras.main.width - PLAYER_SIZE / 2);
        targetY = Phaser.Math.Clamp(targetY, PLAYER_SIZE / 2, this.cameras.main.height - PLAYER_SIZE / 2);

        // Flash後の移動目標も更新する
        this.playerTargetPosition.set(targetX, targetY);

        this.tweens.add({
            targets: this.player,
            alpha: { from: 0.3, to: 1 },
            duration: 100,
            onStart: () => {
                this.player.setPosition(targetX, targetY);
                this.player.body.reset(targetX, targetY); // 物理ボディの位置も更新
                this.player.body.setVelocity(0,0); // Flash後は一旦停止
            }
        });

        if (this.flashCooldownTimer) this.flashCooldownTimer.destroy();
        this.flashCooldownTimer = this.time.delayedCall(FLASH_COOLDOWN, () => {
            this.canFlash = true;
            this.events.emit('flashReady');
            console.log("Flash Ready!");
        }, [], this);
    }

    spawnBullet() {
        if (!this.player || !this.player.active) return;

        const side = Phaser.Math.Between(0, 3);
        let x, y;
        const bulletSize = Phaser.Math.FloatBetween(15, 30);
        const bulletSpeed = this.currentBulletBaseSpeed + Phaser.Math.FloatBetween(-30, 30);
        const bulletColor = Phaser.Utils.Array.GetRandom(BULLET_COLORS);

        const bullet = this.bullets.get();

        if (bullet) {
            switch (side) {
                case 0: x = Phaser.Math.Between(0, this.cameras.main.width); y = -bulletSize; break;
                case 1: x = this.cameras.main.width + bulletSize; y = Phaser.Math.Between(0, this.cameras.main.height); break;
                case 2: x = Phaser.Math.Between(0, this.cameras.main.width); y = this.cameras.main.height + bulletSize; break;
                case 3: x = -bulletSize; y = Phaser.Math.Between(0, this.cameras.main.height); break;
            }
            bullet.spawn(x, y, bulletSize, bulletColor, this.player, bulletSpeed);
        }
    }

    increaseDifficulty() {
        if (this.currentSpawnRate > MIN_SPAWN_RATE) {
            this.currentSpawnRate = Math.max(MIN_SPAWN_RATE, this.currentSpawnRate - SPAWN_RATE_DECREMENT);
            if (this.bulletTimer) {
                this.bulletTimer.delay = this.currentSpawnRate;
            }
        }
        this.currentBulletBaseSpeed += BULLET_SPEED_INCREASE;
    }

    playerHitBullet(player, bullet) {
        if (!player.active) return;
        player.setActive(false).setVisible(false);

        if (this.bulletTimer) this.bulletTimer.destroy();
        if (this.difficultyTimer) this.difficultyTimer.destroy();
        if (this.flashCooldownTimer) this.flashCooldownTimer.destroy();
        this.bulletTimer = null;
        this.difficultyTimer = null;
        this.flashCooldownTimer = null;

        this.physics.pause();
        this.cameras.main.shake(200, 0.01);

        this.time.delayedCall(500, () => {
            this.scene.stop('UIScene');
            this.scene.start('GameOverScene', { score: this.score });
        });
    }
}

// --- Bulletクラス (変更なし) ---
class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bulletTexture');
    }

    spawn(x, y, size, color, targetPlayer, speed) {
        this.body.reset(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.setDisplaySize(size, size);
        this.setTint(color);
        this.setCircle(size / 2);
        this.setCollideWorldBounds(false);

        if (targetPlayer && targetPlayer.active) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, targetPlayer.x, targetPlayer.y);
            this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
        } else {
            if (x < 0) this.body.setVelocityX(speed);
            else if (x > this.scene.cameras.main.width) this.body.setVelocityX(-speed);
            else if (y < 0) this.body.setVelocityY(speed);
            else if (y > this.scene.cameras.main.height) this.body.setVelocityY(-speed);
            else {
                 const randomAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                 this.scene.physics.velocityFromRotation(randomAngle, speed, this.body.velocity);
            }
        }
    }
}