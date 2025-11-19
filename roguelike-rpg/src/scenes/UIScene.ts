import Phaser from 'phaser';
import InventoryUI from '../ui/InventoryUI';
import { Item, EquipmentSlots } from '../types';

export default class UIScene extends Phaser.Scene {
    private hpText!: Phaser.GameObjects.Text;
    private equipmentText!: Phaser.GameObjects.Text;
    private inventoryUI!: InventoryUI;

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

        this.equipmentText = this.add.text(10, 40, 'Eq: None', {
            fontSize: '14px',
            color: '#dddddd',
            stroke: '#000000',
            strokeThickness: 2
        });

        this.inventoryUI = new InventoryUI(this, 100, 100);

        // Listen for events from GameScene
        const gameScene = this.scene.get('GameScene');
        gameScene.events.on('player-hp-changed', this.updateHp, this);
        gameScene.events.on('toggle-inventory', this.toggleInventory, this);
        gameScene.events.on('inventory-updated', this.updateInventory, this);
        gameScene.events.on('equipment-updated', this.updateEquipment, this);

        // Forward UI events back to GameScene if needed (e.g. clicking item)
        this.events.on('inventory-item-clicked', (index: number) => {
            gameScene.events.emit('ui-inventory-item-clicked', index);
        });
    }

    private updateHp(currentHp: number, maxHp: number) {
        this.playerHp = currentHp;
        this.playerMaxHp = maxHp;
        this.hpText.setText(`HP: ${this.playerHp} / ${this.playerMaxHp}`);
    }

    private toggleInventory() {
        this.inventoryUI.toggle();
    }

    private updateInventory(inventory: (Item | null)[]) {
        this.inventoryUI.updateInventory(inventory);
    }

    private updateEquipment(equipment: EquipmentSlots) {
        const w = equipment.weapon ? equipment.weapon.name : 'None';
        const a = equipment.armor ? equipment.armor.name : 'None';
        const r = equipment.ring ? equipment.ring.name : 'None';
        this.equipmentText.setText(`W: ${w}\nA: ${a}\nR: ${r}`);
    }
}
