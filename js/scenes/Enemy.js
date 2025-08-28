// Enemy.js
import Bullet from './Bullet.js';
// --- 定数 ---
const FIXED_ENEMY_COLOR = 0x0000cd; // 敵本体の色 (青系)
const ENEMY_DETECTION_RANGE = 350;  // スキル発動の検知範囲 (少し広げる)
const ENEMY_SKILL_CAST_TIME = 800;  // スキル詠唱時間 (ミリ秒)
const ENEMY_SKILL_COOLDOWN = 2500;  // スキルクールダウン (ミリ秒)
const ENEMY_VISUAL_SIZE = 30;

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, '__DEFAULT');
        this.setActive(false).setVisible(false);
        this.player = scene.player;
        this.bulletsGroup = scene.bullets;
        this.detectionRange = ENEMY_DETECTION_RANGE;
        this.skillCastTime = ENEMY_SKILL_CAST_TIME;
        this.skillCooldown = ENEMY_SKILL_COOLDOWN;
        this.canCastSkill = true;
        this.isCasting = false;
        this.castTimer = null;
        this.cooldownTimer = null;
        this.speed = 50;
        this.originalTextureKey = '';
    }

    spawnSelf(x, y) {
        this.enableBody(true, x, y, true, true);
        this.body.setCollideWorldBounds(true).setBounce(1);
        this.setDisplaySize(40, 40);

        // --- 色付きテクスチャの生成と適用 ---
        this.originalTextureKey = `enemy_${FIXED_ENEMY_COLOR.toString(16)}`;
        if (!this.scene.textures.exists(this.originalTextureKey)) {
            console.log(`Creating new texture: ${this.originalTextureKey}`);
            const enemyGraphics = this.scene.make.graphics({ fillStyle: { color: FIXED_ENEMY_COLOR } });
            enemyGraphics.fillCircle(ENEMY_VISUAL_SIZE, ENEMY_VISUAL_SIZE, ENEMY_VISUAL_SIZE);
            enemyGraphics.generateTexture(this.originalTextureKey, ENEMY_VISUAL_SIZE * 2, ENEMY_VISUAL_SIZE * 2);
            enemyGraphics.destroy();
        }
        this.setTexture(this.originalTextureKey);

        this.canCastSkill = true;
        this.isCasting = false;
        const initialAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        if (this.body) this.scene.physics.velocityFromRotation(initialAngle, this.speed, this.body.velocity);
    }

    update(time, delta) {
        if (!this.active || !this.player || !this.player.active || this.isCasting) return;
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
        if (this.canCastSkill && distanceToPlayer <= this.detectionRange) {
            this.startCastingSkill();
        }
    }

    startCastingSkill() {
        if (!this.canCastSkill || !this.active) return;
        this.isCasting = true;
        this.canCastSkill = false;
        if(this.body) this.body.setVelocity(0,0);

        // --- 詠唱中テクスチャに切り替え ---
        const castingTextureKey = 'enemy_casting_red'; // 詠唱色は赤
        if (!this.scene.textures.exists(castingTextureKey)) {
            const castingGraphics = this.scene.make.graphics({ fillStyle: { color: 0xff0000 } });
            castingGraphics.fillCircle(ENEMY_VISUAL_SIZE, ENEMY_VISUAL_SIZE, ENEMY_VISUAL_SIZE);
            castingGraphics.generateTexture(castingTextureKey, ENEMY_VISUAL_SIZE * 2, ENEMY_VISUAL_SIZE * 2);
            castingGraphics.destroy();
        }
        this.setTexture(castingTextureKey);

        if (this.castTimer) this.castTimer.destroy();
        this.castTimer = this.scene.time.delayedCall(this.skillCastTime, () => {
            if (!this.active) { this.isCasting = false; this.destroyTimers(); return; }
            this.castSkill();
            this.isCasting = false;
            if (this.scene.textures.exists(this.originalTextureKey)) { this.setTexture(this.originalTextureKey); }
            if (this.cooldownTimer) this.cooldownTimer.destroy();
            this.cooldownTimer = this.scene.time.delayedCall(this.skillCooldown, () => { this.canCastSkill = true; }, [], this);
            if (this.active && this.body) {
                const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
            }
        }, [], this);
    }

     castSkill() {
        if (!this.active || !this.bulletsGroup) return;
        console.log("[Enemy.js] Enemy casts skill!");
        
        // ★★★ 弾のインスタンスを手動で作成し、グループに追加 ★★★
        const skillBullet = new Bullet(this.scene, 0, 0);
        this.bulletsGroup.add(skillBullet, true);

        if (skillBullet) {
            if (Phaser.Math.Between(0, 1) === 0) {
                this.fireStraightBullet(skillBullet);
            } else {
                this.fireSplittingBullet(skillBullet);
            }
        }
    }

    // ★★★ 直線弾を発射するメソッド ★★★
    fireStraightBullet(bullet) {
        console.log("[Enemy.js] -> Firing a STRAIGHT bullet!");
        const bulletSize = 25;
        const bulletColor = 0xff0000;
        const bulletSpeed = 350;
        bullet.spawnAsSkill(this.x, this.y, bulletSize, bulletColor, this.player, bulletSpeed);
    }

    fireSplittingBullet(bullet) {
        console.log("[Enemy.js] -> Firing a SPLITTING bullet!");
        const bulletSize = 30;
        const bulletColor = 0x00ffff;
        const bulletSpeed = 250;
        bullet.spawnAsSplittingBullet(this.x, this.y, bulletSize, bulletColor, this.player, bulletSpeed);
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