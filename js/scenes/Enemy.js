// Enemy.js

// --- 敵の色候補を定数として定義 ---
const ENEMY_COLORS = [
    0xff0000, // 赤
    0xff7f00, // オレンジ
    0x00ff00, // 緑
    0x0000ff, // 青
    0x4b0082, // インディゴ
    0x9400d3, // 紫
];

// --- 他の定数 ---
const ENEMY_DETECTION_RANGE = 250;
const ENEMY_SKILL_CAST_TIME = 1000;
const ENEMY_SKILL_COOLDOWN = 3000;

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture = 'enemyTexture') {
        super(scene, x, y, texture);

        // 初期状態は非アクティブ・非表示
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
        this.originalColor = 0xffffff; // スポーン時に設定される元の色
    }

    spawnSelf(x, y) {
        this.enableBody(true, x, y, true, true);
        this.setActive(true);
        this.setVisible(true);

        // スポーン時に物理特性を設定
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(1);
        this.setDisplaySize(40, 40);

        // ★★★ 色をランダムに設定する処理 (デバッグ強化版) ★★★
        this.originalColor = Phaser.Utils.Array.GetRandom(ENEMY_COLORS);
        console.log(`Spawning enemy. Attempting to set tint to: 0x${this.originalColor.toString(16)}`);

        // 既存のtintをクリアしてから新しいtintを設定
        this.clearTint();
        this.setTint(this.originalColor);

        // tintが適用されたかプロパティを確認
        console.log(`Tint property after set: 0x${this.tint.toString(16)}`);

        // スキル状態をリセット
        this.canCastSkill = true;
        this.isCasting = false;

        // 移動開始
        const initialAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        if (this.body && this.scene.physics) {
            this.scene.physics.velocityFromRotation(initialAngle, this.speed, this.body.velocity);
        } else {
            console.warn("Enemy body or scene.physics not ready for velocityFromRotation in spawnSelf");
        }
    }

    update(time, delta) {
        if (!this.active || !this.player || !this.player.active) {
            if (this.active && this.body) this.body.setVelocity(0,0);
            return;
        }

        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);

        if (this.canCastSkill && !this.isCasting && distanceToPlayer <= this.detectionRange) {
            this.startCastingSkill();
        }
    }

    startCastingSkill() {
        if (!this.canCastSkill || !this.active) return;

        this.isCasting = true;
        this.canCastSkill = false;
        if(this.body) this.body.setVelocity(0,0);

        // 詠唱中の色は黄色で固定
        this.setTint(0xffff00);

        if (this.castTimer) this.castTimer.destroy();
        this.castTimer = this.scene.time.delayedCall(this.skillCastTime, () => {
            if (!this.active) {
                this.isCasting = false;
                this.destroyTimers();
                return;
            }
            this.castSkill();
            this.isCasting = false;

            // ★★★ 詠唱前の元の色に戻す ★★★
            this.setTint(this.originalColor);

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
        if (!this.active || !this.player || !this.player.active || !this.bulletsGroup) return;

        const skillBullet = this.bulletsGroup.get();
        if (skillBullet) {
            const bulletSize = 25;
            const bulletColor = 0x9400d3; // スキル弾の色は紫で固定
            const bulletSpeed = 280;
            if (typeof skillBullet.spawnAsSkill === 'function') {
                skillBullet.spawnAsSkill(this.x, this.y, bulletSize, bulletColor, this.player, bulletSpeed);
            } else {
                console.error("Enemy's castSkill: skillBullet does not have a spawnAsSkill method.");
                skillBullet.destroy();
            }
        }
    }

    destroyTimers() {
        if (this.castTimer) {
            this.castTimer.destroy();
            this.castTimer = null;
        }
        if (this.cooldownTimer) {
            this.cooldownTimer.destroy();
            this.cooldownTimer = null;
        }
    }

    preDestroy() {
        this.destroyTimers();
        super.preDestroy();
    }
}