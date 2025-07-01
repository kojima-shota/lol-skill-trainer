// Enemy.js
// export default をつけると GameScene.js で import Enemy from './Enemy.js'; できる
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture = 'enemyTexture') {
        super(scene, x, y, texture);

        this.setActive(false);
        this.setVisible(false);

        this.player = scene.player;
        this.bulletsGroup = scene.bullets;

        // --- ★★★ 定数を直接ここで使用 ★★★ ---
        this.detectionRange = 250; // ENEMY_DETECTION_RANGE の値を直接記述
        this.skillCastTime = 1000;  // ENEMY_SKILL_CAST_TIME の値を直接記述
        this.skillCooldown = 3000; // ENEMY_SKILL_COOLDOWN の値を直接記述

        this.canCastSkill = true;
        this.isCasting = false;
        this.castTimer = null;
        this.cooldownTimer = null;

        this.speed = 50;
    
    // ... 以降のメソッド (spawnSelf, update, etc.) ...
}

    spawnSelf(x, y) {
        // ... (このメソッド内ではdetectionRangeなどはthis経由で参照するので変更不要) ...
        this.enableBody(true, x, y, true, true);
        this.setActive(true);
        this.setVisible(true);

        this.body.setCollideWorldBounds(true);
        this.body.setBounce(1);
        this.setDisplaySize(40, 40);
        this.setTint(0xff0000);

        this.canCastSkill = true;
        this.isCasting = false;

        const initialAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        if (this.body && this.scene.physics) {
            this.scene.physics.velocityFromRotation(initialAngle, this.speed, this.body.velocity);
        } else {
            console.warn("Enemy body or scene.physics not ready for velocityFromRotation in spawnSelf");
        }
    }

    update(time, delta) {
        if (!this.active || !this.player || !this.player.active) {
            // もしactiveだがbodyがない場合も考慮
            if (this.active && this.body) this.body.setVelocity(0,0);
            return;
        }

        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);

        if (this.canCastSkill && !this.isCasting && distanceToPlayer <= this.detectionRange) {
            this.startCastingSkill();
        }
        // 他の移動ロジック
    }

    startCastingSkill() {
        if (!this.canCastSkill || !this.active) return;

        this.isCasting = true;
        this.canCastSkill = false;
        if(this.body) this.body.setVelocity(0,0); // bodyが存在するか確認
        this.setTint(0xffff00);

        console.log("Enemy is casting skill!");

        if (this.castTimer) this.castTimer.destroy();
        this.castTimer = this.scene.time.delayedCall(this.skillCastTime, () => {
            if (!this.active) { // 詠唱完了前に敵が非アクティブ化された場合
                this.isCasting = false;
                this.destroyTimers(); //念のためタイマーも破棄
                return;
            }
            this.castSkill();
            this.isCasting = false;
            this.setTint(0xff0000);

            if (this.cooldownTimer) this.cooldownTimer.destroy();
            this.cooldownTimer = this.scene.time.delayedCall(this.skillCooldown, () => {
                this.canCastSkill = true;
                if(this.active) console.log("Enemy skill ready again!");
            }, [], this);

            if (this.active && this.body && this.scene.physics) { // 再度移動開始
                const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
            }
        }, [], this);
    }

    castSkill() {
        if (!this.active || !this.player || !this.player.active || !this.bulletsGroup) return;

        console.log("Enemy casts skill!");
        const skillBullet = this.bulletsGroup.get();
        if (skillBullet) {
            const bulletSize = 25;
            const bulletColor = 0x9400D3;
            const bulletSpeed = 280;
            // Bulletクラスのspawnメソッドが存在し、正しい引数を取ることを確認
            if (typeof skillBullet.spawn === 'function') {
                skillBullet.spawn(this.x, this.y, bulletSize, bulletColor, this.player, bulletSpeed);
            } else {
                console.error("skillBullet does not have a spawn method or it's not a function.");
                // 代替処理またはエラー処理
                skillBullet.setPosition(this.x, this.y);
                skillBullet.setActive(true).setVisible(true);
                // 手動で速度設定など
            }
        }
    }

    destroyTimers() {
        console.log("Enemy: Destroying timers for", this);
        if (this.castTimer) {
            this.castTimer.destroy();
            this.castTimer = null;
        }
        if (this.cooldownTimer) {
            this.cooldownTimer.destroy();
            this.cooldownTimer = null;
        }
    }

    // SpriteがGroupからremoveされる時やdestroyされる時に呼ばれることがある
    // PhaserのバージョンやGroupの設定による
    // より確実に呼ばれるのは preDestroy
    // disableBody(disableGameObject = true, hideGameObject = true) {
    //     this.destroyTimers();
    //     super.disableBody(disableGameObject, hideGameObject);
    // }

    preDestroy() {
        console.log("Enemy: preDestroy called for", this);
        this.destroyTimers();
        super.preDestroy();
    }
}