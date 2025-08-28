export default class ObstacleWall extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // テクスチャは Bullet と同じものを一時的に使う
        // 別のテクスチャキーを使いたい場合は preload で生成する
        super(scene, x, y, 'bulletTexture');
        this.setActive(false);
        this.setVisible(false);
    }

    // 壁をスポーンさせるためのメソッド
    spawn(x, y, width, height, color, velocityX, velocityY) {
        this.enableBody(true, x, y, true, true);
        this.setDisplaySize(width, height); // ★ 幅と高さを指定できるように
        this.setTint(color);

        // --- 色付きテクスチャの生成と適用 ---
        const textureKey = `wall_${color.toString(16)}`;
        if (!this.scene.textures.exists(textureKey)) {
            // 四角形のテクスチャを生成
            const wallGraphics = this.scene.make.graphics({ fillStyle: { color: color } });
            wallGraphics.fillRect(0, 0, 10, 10); // 基準となる小さな四角形
            wallGraphics.generateTexture(textureKey, 10, 10);
            wallGraphics.destroy();
        }
        this.setTexture(textureKey);

        if (this.body) {
            this.body.setCollideWorldBounds(true, 0, 0, true);
            this.body.onWorldBounds = true;
            // 当たり判定のサイズをオブジェクトの表示サイズに合わせる
            this.body.setSize(width, height);
            this.body.setVelocity(velocityX, velocityY);
        }
    }
}