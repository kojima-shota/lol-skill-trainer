export default class ObstacleWall extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bulletTexture');
        this.setActive(false);
        this.setVisible(false);
    }

    spawn(x, y, width, height, color, velocityX, velocityY) {
        this.enableBody(true, x, y, true, true);
        this.setDisplaySize(width, height);
        this.setTint(color);

        const textureKey = `wall_${color.toString(16)}`;
        if (!this.scene.textures.exists(textureKey)) {
       
            const wallGraphics = this.scene.make.graphics({ fillStyle: { color: color } });
            wallGraphics.fillRect(0, 0, 10, 10); 
            wallGraphics.generateTexture(textureKey, 10, 10);
            wallGraphics.destroy();
        }
        this.setTexture(textureKey);

        if (this.body) {
            this.body.setCollideWorldBounds(true, 0, 0, true);
            this.body.onWorldBounds = true;
            this.body.setSize(width, height);
            this.body.setVelocity(velocityX, velocityY);
        }
    }
}