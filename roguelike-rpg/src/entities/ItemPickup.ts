import Phaser from 'phaser';
import { Item, ItemRarity } from '../types';

export default class ItemPickup extends Phaser.Physics.Arcade.Sprite {
    public item: Item;

    constructor(scene: Phaser.Scene, x: number, y: number, item: Item) {
        super(scene, x, y, 'roguelike-sheet', 80); // Frame 80 generic item bag/chest
        this.item = item;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setRarityColor();
        this.addFloatingAnimation();
    }

    private setRarityColor() {
        let color = 0xffffff;
        switch (this.item.rarity) {
            case ItemRarity.COMMON: color = 0xaaaaaa; break;
            case ItemRarity.RARE: color = 0x0000ff; break;
            case ItemRarity.EPIC: color = 0x800080; break;
            case ItemRarity.LEGENDARY: color = 0xffd700; break;
        }
        this.setTint(color);

        // Add a small glow/circle behind (using Graphics) - Optional polish
        // For now, just the tint is enough as per requirements "Grade color border/aura"
        // We can simulate aura with a tweening circle if needed, but let's stick to tint + tween first.
    }

    private addFloatingAnimation() {
        this.scene.tweens.add({
            targets: this,
            y: this.y - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}
