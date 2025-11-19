import Phaser from 'phaser';
import { ICombatStats, Item, EquipmentSlots, ItemType } from '../types';
import ItemPickup from './ItemPickup';

export default class Player extends Phaser.Physics.Arcade.Sprite implements ICombatStats {
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys!: { [key: string]: Phaser.Input.Keyboard.Key };

    // ICombatStats implementation
    public hp: number = 100;
    public maxHp: number = 100;
    public attackMin: number = 10;
    public attackMax: number = 15;
    public defense: number = 0;
    public moveSpeed: number = 150;
    public critChance: number = 0;

    public lastAttackTime: number = 0;
    public attackCooldown: number = 500; // ms

    // Inventory & Equipment
    public inventory: (Item | null)[] = new Array(8).fill(null);
    public equipment: EquipmentSlots = {};

    // Base stats to recalculate from
    private baseStats = {
        maxHp: 100,
        attackMin: 10,
        attackMax: 15,
        defense: 0,
        critChance: 0
    };

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'roguelike-sheet', 24); // Frame 24 is usually a character in Kenney pack

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);

        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
            this.keys = scene.input.keyboard.addKeys('E,I') as { [key: string]: Phaser.Input.Keyboard.Key };
        }
    }

    update() {
        if (!this.cursors) return;

        const { left, right, up, down } = this.cursors;
        const body = this.body as Phaser.Physics.Arcade.Body;

        body.setVelocity(0);

        // Horizontal movement
        if (left.isDown) {
            body.setVelocityX(-this.moveSpeed);
            this.setFlipX(false); // Kenney sprites usually face right or front
        } else if (right.isDown) {
            body.setVelocityX(this.moveSpeed);
            this.setFlipX(true);
        }

        // Vertical movement
        if (up.isDown) {
            body.setVelocityY(-this.moveSpeed);
        } else if (down.isDown) {
            body.setVelocityY(this.moveSpeed);
        }

        // Normalize velocity for diagonal movement
        body.velocity.normalize().scale(this.moveSpeed);

        // Check for pickup input
        if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
            this.scene.events.emit('player-try-pickup');
        }
        // Check for inventory toggle
        if (Phaser.Input.Keyboard.JustDown(this.keys.I)) {
            this.scene.events.emit('toggle-inventory');
        }
    }

    public attack(targetX: number, targetY: number) {
        const now = this.scene.time.now;
        if (now - this.lastAttackTime < this.attackCooldown) {
            return false;
        }

        this.lastAttackTime = now;

        // Play attack animation (tween for now)
        this.scene.tweens.add({
            targets: this,
            angle: { from: -30, to: 30 },
            duration: 100,
            yoyo: true,
            onComplete: () => {
                this.setAngle(0);
            }
        });

        return true;
    }

    public pickupItem(pickup: ItemPickup): boolean {
        // Find first empty slot
        const emptyIndex = this.inventory.findIndex(item => item === null);
        if (emptyIndex === -1) {
            console.log("Inventory full!");
            return false;
        }

        this.inventory[emptyIndex] = pickup.item;
        console.log(`Picked up ${pickup.item.name}`);
        this.scene.events.emit('inventory-updated', this.inventory);
        return true;
    }

    public useItem(index: number) {
        const item = this.inventory[index];
        if (!item) return;

        if (item.type === ItemType.POTION) {
            this.consumePotion(item);
            this.inventory[index] = null;
        } else {
            this.equipItemAtIndex(index); // This method now handles the inventory slot update
        }

        this.scene.events.emit('inventory-updated', this.inventory);
        this.scene.events.emit('equipment-updated', this.equipment);
    }

    private consumePotion(item: Item) {
        if (item.modifiers.healAmount) {
            this.hp = Math.min(this.hp + item.modifiers.healAmount, this.maxHp);
            console.log(`Used potion. HP: ${this.hp}/${this.maxHp}`);
            this.scene.events.emit('player-hp-changed', this.hp, this.maxHp);
        }
    }

    // Revised equip logic to support swapping
    public equipItemAtIndex(index: number) {
        const item = this.inventory[index];
        if (!item || item.type === ItemType.POTION) return;

        let unequippedItem: Item | undefined;

        switch (item.type) {
            case ItemType.WEAPON:
                unequippedItem = this.equipment.weapon;
                this.equipment.weapon = item;
                break;
            case ItemType.ARMOR:
                unequippedItem = this.equipment.armor;
                this.equipment.armor = item;
                break;
            case ItemType.RING:
                unequippedItem = this.equipment.ring;
                this.equipment.ring = item;
                break;
        }

        this.inventory[index] = unequippedItem || null;
        this.recalculateStats();

        this.scene.events.emit('inventory-updated', this.inventory);
        this.scene.events.emit('equipment-updated', this.equipment);
    }

    private recalculateStats() {
        this.maxHp = this.baseStats.maxHp;
        this.attackMin = this.baseStats.attackMin;
        this.attackMax = this.baseStats.attackMax;
        this.defense = this.baseStats.defense;
        this.critChance = this.baseStats.critChance;

        const items = [this.equipment.weapon, this.equipment.armor, this.equipment.ring];
        items.forEach(item => {
            if (!item) return;
            if (item.modifiers.hpBonus) this.maxHp += item.modifiers.hpBonus;
            if (item.modifiers.attackBonus) {
                this.attackMin += item.modifiers.attackBonus;
                this.attackMax += item.modifiers.attackBonus;
            }
            if (item.modifiers.critChance) this.critChance += item.modifiers.critChance;
            // Defense not in modifiers yet, but could be
        });

        // Cap HP if needed, or just keep current HP
        this.hp = Math.min(this.hp, this.maxHp);
        this.scene.events.emit('player-hp-changed', this.hp, this.maxHp);

        console.log("Stats updated:", {
            atk: `${this.attackMin}-${this.attackMax}`,
            hp: this.maxHp,
            crit: this.critChance
        });
    }
}
