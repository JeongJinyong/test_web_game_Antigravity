import Phaser from 'phaser';
import { Item, ItemRarity, ItemType } from '../types';
import ItemPickup from '../entities/ItemPickup';

export default class LootSystem {
    private scene: Phaser.Scene;
    private itemPickups: Phaser.Physics.Arcade.Group;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.itemPickups = this.scene.physics.add.group({
            classType: ItemPickup,
            runChildUpdate: true
        });
    }

    public getPickups(): Phaser.Physics.Arcade.Group {
        return this.itemPickups;
    }

    public dropItemForEnemy(x: number, y: number) {
        if (Math.random() > 0.2) return; // 20% drop chance

        const item = this.generateRandomItem();
        const pickup = new ItemPickup(this.scene, x, y, item);
        this.itemPickups.add(pickup);
    }

    private generateRandomItem(): Item {
        const rarity = this.rollRarity();
        const type = this.rollType();

        return this.createItem(rarity, type);
    }

    private rollRarity(): ItemRarity {
        const rand = Math.random();
        if (rand < 0.05) return ItemRarity.LEGENDARY;
        if (rand < 0.20) return ItemRarity.EPIC;
        if (rand < 0.50) return ItemRarity.RARE;
        return ItemRarity.COMMON;
    }

    private rollType(): ItemType {
        const types = [ItemType.WEAPON, ItemType.ARMOR, ItemType.RING, ItemType.POTION];
        return types[Math.floor(Math.random() * types.length)];
    }

    private createItem(rarity: ItemRarity, type: ItemType): Item {
        const id = Phaser.Math.RND.uuid();
        let name = `${this.capitalize(rarity)} ${this.capitalize(type)}`;
        let modifiers: any = {};

        // Base stats multiplier based on rarity
        let multiplier = 1;
        switch (rarity) {
            case ItemRarity.COMMON: multiplier = 1; break;
            case ItemRarity.RARE: multiplier = 2; break;
            case ItemRarity.EPIC: multiplier = 3; break;
            case ItemRarity.LEGENDARY: multiplier = 5; break;
        }

        switch (type) {
            case ItemType.WEAPON:
                modifiers.attackBonus = Math.floor(Phaser.Math.Between(2, 5) * multiplier);
                name = `${this.getRarityPrefix(rarity)} Sword`;
                break;
            case ItemType.ARMOR:
                modifiers.hpBonus = Math.floor(Phaser.Math.Between(10, 20) * multiplier);
                name = `${this.getRarityPrefix(rarity)} Armor`;
                break;
            case ItemType.RING:
                modifiers.critChance = Math.floor(Phaser.Math.Between(1, 3) * multiplier);
                name = `${this.getRarityPrefix(rarity)} Ring`;
                break;
            case ItemType.POTION:
                modifiers.healAmount = 50;
                name = "Health Potion";
                // Potions might not scale with rarity in this simple model, or maybe they do?
                // Let's keep it simple for now.
                break;
        }

        return {
            id,
            name,
            rarity,
            type,
            modifiers
        };
    }

    private capitalize(s: string): string {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    private getRarityPrefix(rarity: ItemRarity): string {
        switch (rarity) {
            case ItemRarity.COMMON: return "Rusty";
            case ItemRarity.RARE: return "Iron";
            case ItemRarity.EPIC: return "Enchanted";
            case ItemRarity.LEGENDARY: return "Godly";
            default: return "";
        }
    }
}
