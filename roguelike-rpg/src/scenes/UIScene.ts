import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
    private hpText!: Phaser.GameObjects.Text;
    private playerHp: number = 100;
    private playerMaxHp: number = 100;

    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        this.hpText = this.add.text(10, 10, 'HP: 100 / 100', {
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });

        // Listen for events from GameScene
        const gameScene = this.scene.get('GameScene');
        gameScene.events.on('player-hp-changed', this.updateHp, this);
    }

    private updateHp(currentHp: number, maxHp: number) {
        this.playerHp = currentHp;
        this.playerMaxHp = maxHp;
        this.hpText.setText(`HP: ${this.playerHp} / ${this.playerMaxHp}`);
    }
}
