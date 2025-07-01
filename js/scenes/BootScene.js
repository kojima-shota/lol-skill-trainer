
// BootScene.js
export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene'); // キー名を文字列で渡す
    }

    preload() {


        console.log("BootScene: Preloading assets...");

        let width = this.cameras.main.width;
        let height = this.cameras.main.height;

        // --- プログレスバー表示の準備 ---
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

        // --- ローダーイベント ---
        this.load.on('progress', function (value) {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            // バーの描画位置をボックスの内側に調整
            progressBar.fillRect(width / 2 - 160 + 5, height / 2 - 25 + 5, (320 - 10) * value, 50 - 10);
            percentText.setText(parseInt(value * 100) + '%');
        }, this);

        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            console.log("BootScene: Preload complete.");
            // createメソッドで次のシーンを開始するので、ここでのstartは不要
        }, this);

        // --- ★★★ 実際のアセット読み込み (ここを修正) ★★★ ---
        // テスト用のロゴ画像読み込みループをコメントアウトまたは削除
        /*
        for (let i = 0; i < 100; i++) {
            this.load.image('logo' + i, 'assets/logo.png');
        }
        */

        // ここで、ゲーム全体で本当に必要な最小限のアセットを読み込みます。
        // this.load.image('titleBackground', 'assets/title_bg.jpg');
        // this.load.audio('backgroundMusic', ['assets/music.ogg', 'assets/music.mp3']);

        // 今回のプロジェクトでは、他のシーンで動的にテクスチャを生成しているため、
        // BootSceneで事前にロードしなければならない必須アセットは今のところ無さそうです。
        // もし共通で使うフォントファイルなどがあれば、ここでロードします。
    }

    create() { // ★ create メソッドを必ず定義
        console.log("BootScene: Create complete, starting TitleScene.");
        this.scene.start('TitleScene');
    }
}