// GameScene.js
import Enemy from './Enemy.js'; // Enemy.jsのパスを確認
// ... (他の定数) ...
const PLAYER_SIZE = 30;
const PLAYER_COLOR = 0x3498db;
const PLAYER_SPEED = 360;
const BULLET_COLORS = [0xe74c3c, 0xf1c40f, 0x2ecc71, 0x9b59b6, 0x1abc9c];
const FLASH_DISTANCE = 150;
const FLASH_COOLDOWN = 5000;
const INITIAL_SPAWN_RATE = 1200; // ★ これがエラーの原因
const MIN_SPAWN_RATE = 250;
const DIFFICULTY_INCREASE_INTERVAL = 2000;
const PLAYER_COLOR = 0x3498db;
const SPAWN_RATE_DECREMENT = 50;
const BULLET_SPEED_INCREASE = 10;
const ENEMY_DETECTION_RANGE = 250;
const ENEMY_SKILL_CAST_TIME = 1000;
const ENEMY_SKILL_COOLDOWN = 3000;

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        // プロパティ初期化 (nullで)
        this.player = null;
        this.bullets = null;
        this.enemies = null; // ★ 追加
        this.bulletTimer = null;
        this.enemySpawnTimer = null; // ★ 追加
        this.difficultyTimer = null;
        this.flashCooldownTimer = null;
        this.score = 0;
        this.canFlash = true;
        this.currentSpawnRate = INITIAL_SPAWN_RATE;
        this.currentBulletBaseSpeed = 200;
        this.playerTargetPosition = null;
        // キーボード用
        this.flashKey = null;
        // this.keyW = null; ... (WASD用)
    }

    init() { // シーン開始時のリセット
        console.log("GameScene init");
        this.score = 0;
        this.currentSpawnRate = INITIAL_SPAWN_RATE;
        this.currentBulletBaseSpeed = 200;
        this.canFlash = true;
        this.playerTargetPosition = null; // 右クリック移動用

        // タイマー参照をnullで初期化
        this.bulletTimer = null;
        this.enemySpawnTimer = null;
        this.difficultyTimer = null;
        this.flashCooldownTimer = null;
    }

    preload() {
        // 敵用のテクスチャもロードまたは動的に生成
        if (!this.textures.exists('enemyTexture')) {
            const enemyGraphics = this.make.graphics({ fillStyle: { color: 0xff0000 } });
            enemyGraphics.fillRect(0, 0, PLAYER_SIZE, PLAYER_SIZE); // PLAYER_SIZEは適切か確認
            enemyGraphics.generateTexture('enemyTexture', PLAYER_SIZE, PLAYER_SIZE);
            enemyGraphics.destroy();
        }
    }

    create() {
    console.log("GameScene create");
    this.cameras.main.setBackgroundColor(this.game.config.backgroundColor);
    this.events.emit('updateScore', this.score);
    this.events.emit('flashReady');

        // --- テクスチャ生成 (プレイヤー、弾) ---
        if (!this.textures.exists('playerTexture')) {
            const playerGraphics = this.make.graphics({ fillStyle: { color: PLAYER_COLOR } });
            // playerGraphics.fillRect(0, 0, PLAYER_SIZE, PLAYER_SIZE); // 四角形の場合
            // 三角形プレイヤーの場合
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


        // --- プレイヤー作成 (enemiesグループより先に) ---
        this.player = this.physics.add.sprite(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        'playerTexture'
    );
    this.player.setCollideWorldBounds(true);
    this.player.body.allowGravity = false;
    this.player.setDepth(1);
    if (this.playerTargetPosition === null) {
        this.playerTargetPosition = new Phaser.Math.Vector2(this.player.x, this.player.y);
    }

        // --- グループ作成 (enemiesグループより先にbulletsを作成) ---
        this.bullets = this.physics.add.group({
            classType: Bullet,
            runChildUpdate: true
        });

        // 敵キャラクターのグループ (playerとbulletsが初期化された後に作成)
        this.enemies = this.physics.add.group({
        classType: Enemy,
        runChildUpdate: true
    });
        // --- 入力設定 ---
        this.pointerDownHandler = (pointer) => {
        if (pointer.rightButtonDown()) {
            if (this.player && this.player.active) {
                this.playerTargetPosition.set(pointer.worldX, pointer.worldY);
                this.physics.moveToObject(this.player, this.playerTargetPosition, PLAYER_SPEED);
            }
        }
    };
    this.input.on('pointerdown', this.pointerDownHandler, this); // thisを渡す

    this.flashKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        // --- 衝突判定 ---
        this.physics.add.overlap(this.player, this.bullets, this.playerHitBullet, null, this);
        // this.physics.add.overlap(this.player, this.enemies, this.playerHitByEnemyBody, null, this); // 任意

        // --- タイマー設定 ---
        this.cleanupAllTimers(); // 念のため既存タイマーを破棄

        this.bulletTimer = this.time.addEvent({ /* ... 障害物弾スポーン ... */ });
        this.enemySpawnTimer = this.time.addEvent({ // 敵スポーンタイマー
            delay: 5000,
            callback: this.spawnNewEnemy,
            callbackScope: this,
            loop: true
        });
        this.difficultyTimer = this.time.addEvent({ /* ... 難易度上昇 ... */ });
    }

    update(time, delta) {
        // ... (既存のupdateロジック) ...

        // 敵の画面外処理などを追加しても良い
        if (this.enemies && this.enemies.getChildren()) { // enemiesグループが存在し、子要素がある場合
            this.enemies.getChildren().forEach(enemy => {
                if (enemy.active && !this.physics.world.bounds.contains(enemy.x, enemy.y)) {
                    const enemyMargin = enemy.displayWidth * 2; // 画面外判定の余裕
                    if (enemy.x < -enemyMargin || enemy.x > this.cameras.main.width + enemyMargin ||
                        enemy.y < -enemyMargin || enemy.y > this.cameras.main.height + enemyMargin) {
                        if (typeof enemy.destroyTimers === 'function') {
                            enemy.destroyTimers();
                        }
                        enemy.destroy(); // または非アクティブ化して再利用
                        console.log("Enemy destroyed (offscreen)");
                    }
                }
            });
        }
    }

    performFlash() { /* ... (変更なし) ... */ }
    spawnBullet() { /* ... (変更なし) ... */ }
    increaseDifficulty() { /* ... (変更なし) ... */ }

    // ★ GameScene クラスのメソッドとして定義
    spawnNewEnemy() {
        if (!this.player || !this.player.active || !this.enemies) return; // enemiesグループもチェック

        const side = Phaser.Math.Between(0, 3);
        let x, y;
        const enemyVisualSize = 40; // EnemyクラスのsetDisplaySizeと合わせるか、Enemyクラス側でサイズを持つ

        switch (side) {
            case 0: x = Phaser.Math.Between(0, this.cameras.main.width); y = -enemyVisualSize; break;
            case 1: x = this.cameras.main.width + enemyVisualSize; y = Phaser.Math.Between(0, this.cameras.main.height); break;
            case 2: x = Phaser.Math.Between(0, this.cameras.main.width); y = this.cameras.main.height + enemyVisualSize; break;
            case 3: x = -enemyVisualSize; y = Phaser.Math.Between(0, this.cameras.main.height); break;
        }

        const enemy = this.enemies.get();
        if (enemy) {
            if (typeof enemy.spawnSelf === 'function') {
                enemy.spawnSelf(x, y);
            } else {
                console.error("Enemy instance does not have spawnSelf method");
                // fallback or destroy enemy instance
                enemy.destroy();
            }
        }
    }

    // playerHitByEnemyBody(player, enemy) { /* ... (実装する場合) ... */ }

    playerHitBullet(player, bullet) {
        if (!player.active) return;
        player.setActive(false).setVisible(false);

        this.cleanupAllTimers(); // ★ すべてのタイマーをクリーンアップ
        if (this.input.keyboard) this.input.keyboard.enabled = false;
        if (this.input.mouse) this.input.mouse.enabled = false;


        this.physics.pause();
        this.cameras.main.shake(200, 0.01);

        this.time.delayedCall(500, () => {
            // UISceneの停止はGameOverScene側で行うか、ここで明示的に行う
            if (this.scene.isActive('UIScene') || this.scene.isSleeping('UIScene')) {
                this.scene.stop('UIScene');
            }
            this.scene.start('GameOverScene', { score: this.score });
        });
    }

    cleanupAllTimers() { // すべてのタイマーを破棄するメソッド
        console.log("GameScene: Cleaning up all timers");
        if (this.bulletTimer) { this.bulletTimer.destroy(); this.bulletTimer = null; }
        if (this.enemySpawnTimer) { this.enemySpawnTimer.destroy(); this.enemySpawnTimer = null; }
        if (this.difficultyTimer) { this.difficultyTimer.destroy(); this.difficultyTimer = null; }
        if (this.flashCooldownTimer) { this.flashCooldownTimer.destroy(); this.flashCooldownTimer = null; }
    }

    shutdown() { // シーン停止時のクリーンアップ
        console.log("GameScene shutdown");
        this.cleanupAllTimers();

        if (this.input.keyboard) {
            this.input.keyboard.resetKeys(); // 押下状態リセット
            this.input.keyboard.enabled = true; // 次のシーンのために有効化
        }
        if (this.input.mouse) {
            this.input.mouse.enabled = true; // 次のシーンのために有効化
        }


        if (this.player) { this.player.destroy(); this.player = null; }
        if (this.bullets) { this.bullets.destroy(true, true); this.bullets = null; }
        if (this.enemies) {
            this.enemies.getChildren().forEach(enemy => {
                if (enemy && typeof enemy.destroyTimers === 'function') { // enemyが存在し、メソッドがあるか確認
                    enemy.destroyTimers();
                }
            });
            this.enemies.destroy(true, true);
            this.enemies = null;
        }

        if (this.physics && this.physics.world && this.physics.world.isPaused) { // physicsオブジェクトの存在確認
            this.physics.resume();
        }

        // イベントリスナーの解除
        this.events.off('updateScore');
        this.events.off('flashUsed');
        this.events.off('flashReady');

        super.shutdown();
    if (this.input && this.pointerDownHandler) { // pointerDownHandlerの存在も確認
        this.input.off('pointerdown', this.pointerDownHandler, this); // thisを渡す
        this.pointerDownHandler = null;
    }
    }
    spawnBullet() { // これは障害物弾を生成するメソッド
    if (!this.player || !this.player.active || !this.bullets) return;

    const side = Phaser.Math.Between(0, 3);
    let x, y;
    const bulletSize = Phaser.Math.FloatBetween(15, 30);
    const bulletSpeed = this.currentBulletBaseSpeed + Phaser.Math.FloatBetween(-30, 30);
    const bulletColor = Phaser.Utils.Array.GetRandom(BULLET_COLORS);

    const bullet = this.bullets.get(); // Bulletインスタンスを取得

    if (bullet) {
        let targetXForAngle, targetYForAngle; // 角度計算用の仮ターゲット
        switch (side) {
            case 0: // 上から
                x = Phaser.Math.Between(0, this.cameras.main.width); y = -bulletSize;
                targetXForAngle = x; targetYForAngle = this.cameras.main.height + bulletSize; // 画面下方向
                break;
            case 1: // 右から
                x = this.cameras.main.width + bulletSize; y = Phaser.Math.Between(0, this.cameras.main.height);
                targetXForAngle = -bulletSize; targetYForAngle = y; // 画面左方向
                break;
            case 2: // 下から
                x = Phaser.Math.Between(0, this.cameras.main.width); y = this.cameras.main.height + bulletSize;
                targetXForAngle = x; targetYForAngle = -bulletSize; // 画面上方向
                break;
            case 3: // 左から
            default:
                x = -bulletSize; y = Phaser.Math.Between(0, this.cameras.main.height);
                targetXForAngle = this.cameras.main.width + bulletSize; targetYForAngle = y; // 画面右方向
                break;
        }
        // Bulletクラスのspawnメソッドを呼び出すが、targetPlayerはnullにするか、
        // 別の方法で方向を指定できるようにBullet.spawnを修正する必要がある。
        // ここでは簡易的に、targetPlayerをnullとして渡すが、Bullet.spawn内のフォールバックが適切に働くか確認が必要。
        // または、角度を計算して速度を直接設定する。
        const tempTarget = new Phaser.Geom.Point(targetXForAngle, targetYForAngle); // 速度計算用の仮のターゲット
        bullet.spawn(x, y, bulletSize, bulletColor, tempTarget, bulletSpeed);
        // ↑ Bullet.spawn が Point オブジェクトを targetPlayer として受け取れるように修正するか、
        //   spawn メソッドを分けるか、速度を直接設定する方が良い。

        // より直接的な方法 (Bullet.spawn を使わない場合):
        /*
        bullet.enableBody(true, x, y, true, true);
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setDisplaySize(bulletSize, bulletSize);
        bullet.setTint(bulletColor);
        if(bullet.body) bullet.body.setCircle(bulletSize / 2);
        bullet.setCollideWorldBounds(false);
        const angleToTempTarget = Phaser.Math.Angle.Between(x, y, targetXForAngle, targetYForAngle);
        if(bullet.body && this.physics) this.physics.velocityFromRotation(angleToTempTarget, bulletSpeed, bullet.body.velocity);
        */
    }
}

    // (オプション) 障害物弾専用のスポーンメソッド
    // spawnAsObstacle(x, y, size, color, velocityX, velocityY) {
    //     this.enableBody(true, x, y, true, true);
    //     this.setActive(true);
    //     this.setVisible(true);
    //     this.setDisplaySize(size, size);
    //     this.setTint(color);
    //     if (this.body) {
    //         this.body.setCircle(size / 2);
    //         this.body.setVelocity(velocityX, velocityY);
    //     }
    //     this.setCollideWorldBounds(false);
    // }
}

// --- Bulletクラス ---
// GameScene.js の一番下に（export default class GameScene { ... } の波括弧の外側）

class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture = 'bulletTexture') {
        super(scene, x, y, texture);
        // グループに追加される際に物理ボディが有効化されるので、
        // ここでは setActive(false) と setVisible(false) だけで良い
        this.setActive(false);
        this.setVisible(false);
    }

    // Enemyクラスが期待する spawn メソッド
    // GameSceneの障害物弾もこのメソッドを共通で使うか、
    // 別途 spawnObstacleBullet のようなメソッドを用意するかは設計次第。
    // ここでは Enemy からの呼び出しを想定した spawn メソッド。
    spawn(x, y, size, color, targetPlayer, speed) {
        // 物理ボディを有効化し、位置を設定、アクティブ化、表示化
        // enableBody(reset, x, y, enableGameObject, showGameObject)
        this.enableBody(true, x, y, true, true);

        this.setDisplaySize(size, size);
        this.setTint(color);

        // 当たり判定の形状を円形にする
        // setCircle の引数は半径なので、size の半分
        if (this.body) { // body が存在することを確認
            this.body.setCircle(size / 2);
        } else {
            console.error("Bullet: Body not available for setCircle in spawn");
        }


        this.setCollideWorldBounds(false); // 弾は画面外に出られるように

        // ターゲット（プレイヤー）に向かうように速度を設定
        if (targetPlayer && targetPlayer.active) {
            if (this.scene && this.scene.physics && this.body) { // 必要なオブジェクトが存在するか確認
                const angle = Phaser.Math.Angle.Between(this.x, this.y, targetPlayer.x, targetPlayer.y);
                this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
            } else {
                console.error("Bullet: Scene, physics, or body not available for velocity setting in spawn (with target)");
            }
        } else {
            // targetPlayerがいない場合のフォールバック (例えば、GameSceneの障害物弾用)
            // この部分は、このspawnメソッドの使われ方によって調整が必要
            console.warn("Bullet: Spawned without a targetPlayer or targetPlayer is not active. Setting default velocity.");
            if (this.body) {
                this.body.setVelocityY(speed); // 例: とりあえず下方向に (要調整)
            }
        }
    }
    // GameScene.js

}

// Enemyクラスは Enemy.js からインポートされる想定なので、ここでは不要