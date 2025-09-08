// js/scenes/Bullet.js


export default class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, '__DEFAULT');
        this.setActive(false).setVisible(false);
        this.splitTimer = null;
    }

    activate(x, y, size, color) {
        this.enableBody(true, x, y, true, true);
        this.setDisplaySize(size, size);

        const textureKey = `bullet_${color.toString(16)}`;
        if (!this.scene.textures.exists(textureKey)) {
            const BULLET_BASE_SIZE = 20;
            const bulletGraphics = this.scene.make.graphics({ fillStyle: { color: color } });
            bulletGraphics.fillCircle(BULLET_BASE_SIZE / 2, BULLET_BASE_SIZE / 2, BULLET_BASE_SIZE / 2);
            bulletGraphics.generateTexture(textureKey, BULLET_BASE_SIZE, BULLET_BASE_SIZE);
            bulletGraphics.destroy();
        }
        this.setTexture(textureKey);

        if (this.body) {
            this.body.setCollideWorldBounds(true, 0, 0, true);
            this.body.onWorldBounds = true;
            this.body.setCircle(size / 2);
        } else {
            console.error("Bullet.activate: FAILED to get physics body.");
        }
    }

    spawnAsObstacle(x, y, size, color, velocityX, velocityY) {
        console.log(`[Bullet.js] Spawning Obstacle Bullet. Color: 0x${color.toString(16)}`);
        this.activate(x, y, size, color);
        if (this.body) {
            this.body.setVelocity(velocityX, velocityY);
            console.log(`[Bullet.js] Obstacle velocity set to: vx=${this.body.velocity.x}, vy=${this.body.velocity.y}`);
        }
    }

    spawnAsSkill(x, y, size, color, targetPlayer, speed) {
        console.log(`[Bullet.js] Spawning Skill Bullet. Color: 0x${color.toString(16)}`);
        this.activate(x, y, size, color);
        if (targetPlayer && targetPlayer.active && this.body) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, targetPlayer.x, targetPlayer.y);
            this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
        } else if (this.body) {
            this.body.setVelocity(0, 0);
        }
    }

    spawnAsSplittingBullet(x, y, size, color, targetPlayer, speed) {
        console.log(`[Bullet.js] Spawning Splitting Bullet (Parent). Color: 0x${color.toString(16)}`);
        this.activate(x, y, size, color);
        if (targetPlayer && targetPlayer.active && this.body) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, targetPlayer.x, targetPlayer.y);
            this.scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
        } else if (this.body) {
            this.body.setVelocity(0, 0);
        }
        if (this.splitTimer) this.splitTimer.destroy();
        this.splitTimer = this.scene.time.delayedCall(1000, this.split, [], this);
    }
    
    split() {
        if (!this.active || !this.body) return;
        console.log("[Bullet.js] A bullet is splitting!");
        
        const parentVelocity = this.body.velocity.clone();
        const angle = parentVelocity.angle();
        const speed = parentVelocity.length();
        const childBulletSize = 20;
        const childBulletColor = 0xffa500;
        const splitAngle = Math.PI / 8;

        for (let i = -1; i <= 1; i += 2) {
            const childBullet = new Bullet(this.scene, this.x, this.y);
            this.scene.bullets.add(childBullet, true); // GameSceneのbulletsグループに追加

            if (childBullet) {
                const newAngle = angle + (splitAngle * i);
                const velocity = this.scene.physics.velocityFromRotation(newAngle, speed);
                childBullet.spawnAsObstacle(this.x, this.y, childBulletSize, childBulletColor, velocity.x, velocity.y);
            }
        }

        this.destroy();
    }

    preDestroy() {
        if(this.splitTimer) {
            this.splitTimer.destroy();
            this.splitTimer = null;
        }
        super.preDestroy();
    }
}