// Enemy.js

// --- 敵の色候補を定数として定義 ---
const FIXED_ENEMY_COLOR =0x0000cd;
// --- 他の定数 ---
const ENEMY_DETECTION_RANGE = 250;
const ENEMY_SKILL_CAST_TIME = 1000;
const ENEMY_SKILL_COOLDOWN = 3000;
const ENEMY_VISUAL_SIZE = 30; // 敵の描画サイズ (半径)

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // コンストラクタでは、デフォルトのテクスチャキーは使わないか、
        // プレースホルダーとして指定するだけにする
        super(scene, x, y, '__DEFAULT'); // Phaserが内部的に使うデフォルトの白いテクスチャ

        this.setActive(false);
        this.setVisible(false);

        // GameSceneへの参照
        this.player = scene.player;
        this.bulletsGroup = scene.bullets;

        // スキル関連のプロパティ
        this.detectionRange = ENEMY_DETECTION_RANGE;
        this.skillCastTime = ENEMY_SKILL_CAST_TIME;
        this.skillCooldown = ENEMY_SKILL_COOLDOWN;
        this.canCastSkill = true;
        this.isCasting = false;
        this.castTimer = null;
        this.cooldownTimer = null;

        // 移動と色のプロパティ
        this.speed = 50;
        this.originalColor = 0xffffff;
        this.originalTextureKey = ''; // 元のテクスチャキーを保持
    }
    update(time, delta) {
        if (!this.active || !this.player || !this.player.active) {
            return;
        }

        // プレイヤーとの距離を計算
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);

        // ★★★ デバッグ用のログを追加 ★★★
        // 毎フレームではなく、一定間隔でログを出すようにする (コンソールが埋まらないように)
        // this.logTimer は constructor で this.logTimer = 0; と初期化しておく
        if (time > (this.logTimer || 0)) {
            console.log(
                `Enemy Update:`,
                `distance=${Math.floor(distanceToPlayer)}`, // 距離
                `detectionRange=${this.detectionRange}`,   // 検知範囲
                `canCast=${this.canCastSkill}`,             // スキル使用可能か
                `isCasting=${this.isCasting}`               // 詠唱中か
            );
            this.logTimer = time + 1000; // 次のログは1秒後
        }

        // スキル発動ロジック
        if (this.canCastSkill && !this.isCasting && distanceToPlayer <= this.detectionRange) {
            this.startCastingSkill();
        }
    }

    spawnSelf(x, y) {
        this.enableBody(true, x, y, true, true);
        this.setActive(true);
        this.setVisible(true);

        this.body.setCollideWorldBounds(true);
        this.body.setBounce(1);
        this.setDisplaySize(40, 40);

        // ★★★ スポーン時に色付きのテクスチャを生成・適用 ★★★
        //this.originalColor = Phaser.Utils.Array.GetRandom(ENEMY_COLORS);
         this.originalColor = FIXED_ENEMY_COLOR;
        this.originalTextureKey = `enemy_${this.originalColor.toString(16)}`;

        // もしその色のテクスチャがまだ存在しなければ、新しく生成する
        if (!this.scene.textures.exists(this.originalTextureKey)) {
            console.log(`Creating new texture: ${this.originalTextureKey}`);
            const enemyGraphics = this.scene.make.graphics({ fillStyle: { color: this.originalColor } });
            enemyGraphics.fillCircle(ENEMY_VISUAL_SIZE, ENEMY_VISUAL_SIZE, ENEMY_VISUAL_SIZE);
            enemyGraphics.generateTexture(this.originalTextureKey, ENEMY_VISUAL_SIZE * 2, ENEMY_VISUAL_SIZE * 2);
            enemyGraphics.destroy();
        }

        // 生成したテクスチャをこのインスタンスにセット
        this.setTexture(this.originalTextureKey);


        this.canCastSkill = true;
        this.isCasting = false;

        const initialAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        if (this.body && this.scene.physics) {
            this.scene.physics.velocityFromRotation(initialAngle, this.speed, this.body.velocity);
        }
    }

    startCastingSkill() {
        if (!this.canCastSkill || !this.active) return;

        this.isCasting = true;
        this.canCastSkill = false;
        if(this.body) this.body.setVelocity(0,0);

        // ★★★ 詠唱中の黄色いテクスチャに切り替え ★★★
        const castingTextureKey = 'enemy_casting';
        if (!this.scene.textures.exists(castingTextureKey)) {
            const castingGraphics = this.scene.make.graphics({ fillStyle: { 
                color: 0xff0000 } }); // 黄色
            castingGraphics.fillCircle(ENEMY_VISUAL_SIZE, ENEMY_VISUAL_SIZE, ENEMY_VISUAL_SIZE);
            castingGraphics.generateTexture(castingTextureKey, ENEMY_VISUAL_SIZE * 2, ENEMY_VISUAL_SIZE * 2);
            castingGraphics.destroy();
        }
        this.setTexture(castingTextureKey);

        if (this.castTimer) this.castTimer.destroy();
        this.castTimer = this.scene.time.delayedCall(this.skillCastTime, () => {
            if (!this.active) {
                this.isCasting = false;
                this.destroyTimers();
                return;
            }
            this.castSkill();
            this.isCasting = false;

            // ★★★ 詠唱後、元の色のテクスチャに戻す ★★★
            if (this.scene.textures.exists(this.originalTextureKey)) {
                this.setTexture(this.originalTextureKey);
            }

            // ... (クールダウンタイマーと再移動のロジック) ...
            if (this.cooldownTimer) this.cooldownTimer.destroy();
            this.cooldownTimer = this.scene.time.delayedCall(this.skillCooldown, () => {
                this.canCastSkill = true;
            }, [], this);
            if (this.active && this.body && this.scene.physics) {
                const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
            }
        }, [], this);
    }

    castSkill() {
        if (!this.active || !this.player || !this.player.active || !this.bulletsGroup) 
        return;
         console.log("Enemy casts skill!");
        const skillBullet = this.bulletsGroup.get();
        if (skillBullet) {
            if (Phaser.Math.Between(0, 1) === 0) {
                this.fireStraightBullet(skillBullet);
            } else {
                this.fireSplittingBullet(skillBullet);
            }
        }
    }
    
     fireStraightBullet(bullet) {
        console.log("-> Firing a SPLITTING bullet!");
        const bulletSize = 30;
        const bulletColor = 0x00ffff; // 分裂前の弾はシアン
        const bulletSpeed = 300; // 少し速め

         if (typeof bullet.spawnAsSplittingBullet === 'function') {
            bullet.spawnAsSplittingBullet(this.x, this.y, bulletSize, bulletColor, this.player, bulletSpeed);
        } else {
            console.error("Enemy's fireSplittingBullet: bullet does not have a spawnAsSplittingBullet method.");
            bullet.destroy();
        }
    }

     fireSplittingBullet(bullet) {
        console.log("-> Firing a SPLITTING bullet!");
        const bulletSize = 35;
        const bulletColor = 0x00ffff; // 弧を描く弾はシアン
        const duration = 2000; // 2秒かけて到達

        // 弧のゴール地点を予測する
        // プレイヤーの現在の位置ではなく、少し未来の位置を狙うと避けにくくなる
        let targetX = this.player.x;
        let targetY = this.player.y;

        // プレイヤーが動いていれば、その移動方向にもう少し先を狙う (任意)
        if (this.player.body.speed > 0) {
            targetX += this.player.body.velocity.x * 0.5; // 0.5秒先の位置を予測
            targetY += this.player.body.velocity.y * 0.5;
        }

        // 画面外に出ないように目標地点を調整
        targetX = Phaser.Math.Clamp(targetX, 0, this.scene.cameras.main.width);
        targetY = Phaser.Math.Clamp(targetY, 0, this.scene.cameras.main.height);


        if (typeof bullet.spawnAsArc === 'function') {
            bullet.spawnAsArc(this.x, this.y, targetX, targetY, bulletSize, bulletColor, duration);
        } else {
            console.error("Enemy's fireArcBullet: bullet does not have a spawnAsArc method.");
            bullet.destroy();
        }
    }

    destroyTimers() {
        if (this.castTimer) { this.castTimer.destroy(); this.castTimer = null; }
        if (this.cooldownTimer) { this.cooldownTimer.destroy(); this.cooldownTimer = null; }
    }

    preDestroy() {
        this.destroyTimers();
        super.preDestroy();
    }
}