import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load the Roguelike pack spritesheet
        // The sheet is 16x16 tiles with 1px spacing (usually Kenney packs have spacing)
        // Let's assume standard Kenney roguelike pack format: 16x16 tiles, 1px spacing
        this.load.spritesheet('roguelike-sheet', 'assets/sprites/roguelike-pack/Spritesheet/roguelikeSheet_transparent.png', {
            frameWidth: 16,
            frameHeight: 16,
            margin: 0,
            spacing: 1
        });
    }

    create() {
        this.scene.start('GameScene');
    }
}
