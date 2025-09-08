
// BootScene.js
export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene'); 
    }

    preload() {


        console.log("BootScene: Preloading assets...");

        let width = this.cameras.main.width;
        let height = this.cameras.main.height;

        let progressBox = this.add.graphics();
        let progressBar = this.add.graphics();

        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        let loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        let percentText = this.add.text(width / 2, height / 2, '0%', { // Y座標をバーの中央に調整
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.load.on('progress', function (value) {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 160 + 5, height / 2 - 25 + 5, (320 - 10) * value, 50 - 10);
            percentText.setText(parseInt(value * 100) + '%');
        }, this);

        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            console.log("BootScene: Preload complete.");
         
        }, this);

    }

    create() { 
        console.log("BootScene: Create complete, starting TitleScene.");
        this.scene.start('TitleScene');
    }
}