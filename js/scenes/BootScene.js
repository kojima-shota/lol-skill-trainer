export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // 将来的に画像アセットなどを読み込む場合はここに記述
        // 例: this.load.image('player_sprite', 'assets/player.png');
        // 例: this.load.image('skill_effect', 'assets/effect.png');

        console.log("BootScene: Preloading assets...");
    }

    create() {
        console.log("BootScene: Create complete, starting GameScene and UIScene.");
        // 最初にGameSceneとUISceneを並行して開始
        this.scene.start('GameScene');
        this.scene.launch('UIScene'); // launchで並行起動
    }
}