import Phaser from 'phaser';
import { Item, ItemRarity } from '../types';

export default class InventoryUI extends Phaser.GameObjects.Container {
    private slots: Phaser.GameObjects.Container[] = [];
    private tooltip: Phaser.GameObjects.Container;
    private tooltipText: Phaser.GameObjects.Text;
    private tooltipBackground: Phaser.GameObjects.Rectangle;

    private isVisible: boolean = false;
    private inventoryData: (Item | null)[] = [];

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        this.scene.add.existing(this);

        // Background
        const bg = scene.add.rectangle(0, 0, 200, 150, 0x333333, 0.9).setOrigin(0);
        this.add(bg);

        // Title
        const title = scene.add.text(10, 10, 'Inventory', { fontSize: '16px', color: '#ffffff' });
        this.add(title);

        // Create Slots (2x4)
        this.createSlots();

        // Tooltip
        this.tooltip = scene.add.container(0, 0);
        this.tooltipBackground = scene.add.rectangle(0, 0, 150, 80, 0x000000, 0.8).setOrigin(0);
        this.tooltipText = scene.add.text(5, 5, '', { fontSize: '12px', color: '#ffffff', wordWrap: { width: 140 } });
        this.tooltip.add([this.tooltipBackground, this.tooltipText]);
        this.tooltip.setVisible(false);
        this.tooltip.setDepth(100); // Ensure tooltip is on top

        this.setVisible(false);
    }

    private createSlots() {
        const startX = 20;
        const startY = 40;
        const slotSize = 32;
        const padding = 10;

        for (let i = 0; i < 8; i++) {
            const row = Math.floor(i / 4);
            const col = i % 4;

            const slotX = startX + col * (slotSize + padding);
            const slotY = startY + row * (slotSize + padding);

            const slotContainer = this.scene.add.container(slotX, slotY);

            // Slot Background
            const slotBg = this.scene.add.rectangle(0, 0, slotSize, slotSize, 0x666666).setOrigin(0);
            slotBg.setInteractive();

            // Slot Icon (Text for now, or colored rect)
            const icon = this.scene.add.rectangle(2, 2, slotSize - 4, slotSize - 4, 0x000000).setOrigin(0);
            icon.setVisible(false);

            // Item Text (First letter)
            const text = this.scene.add.text(16, 16, '', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);

            slotContainer.add([slotBg, icon, text]);
            slotContainer.setData('index', i);

            // Interaction
            slotBg.on('pointerover', () => this.onSlotHover(i, slotContainer));
            slotBg.on('pointerout', () => this.onSlotOut());
            slotBg.on('pointerdown', () => this.onSlotClick(i));

            this.add(slotContainer);
            this.slots.push(slotContainer);
        }
    }

    public toggle() {
        this.isVisible = !this.isVisible;
        this.setVisible(this.isVisible);
        if (!this.isVisible) {
            this.tooltip.setVisible(false);
        }
    }

    public updateInventory(inventory: (Item | null)[]) {
        this.inventoryData = inventory;
        this.refresh();
    }

    private refresh() {
        this.slots.forEach((slot, index) => {
            const item = this.inventoryData[index];
            const icon = slot.getAt(1) as Phaser.GameObjects.Rectangle;
            const text = slot.getAt(2) as Phaser.GameObjects.Text;

            if (item) {
                icon.setVisible(true);
                icon.setFillStyle(this.getRarityColor(item.rarity));
                text.setText(item.name.charAt(0));
            } else {
                icon.setVisible(false);
                text.setText('');
            }
        });
    }

    private onSlotHover(index: number, slot: Phaser.GameObjects.Container) {
        const item = this.inventoryData[index];
        if (!item) return;

        // Update Tooltip
        let desc = `${item.name}\n${item.rarity}\n${item.type}`;
        if (item.modifiers.attackBonus) desc += `\nATK +${item.modifiers.attackBonus}`;
        if (item.modifiers.hpBonus) desc += `\nHP +${item.modifiers.hpBonus}`;
        if (item.modifiers.critChance) desc += `\nCRIT +${item.modifiers.critChance}%`;
        if (item.modifiers.healAmount) desc += `\nHeals ${item.modifiers.healAmount}`;

        this.tooltipText.setText(desc);
        this.tooltipBackground.setSize(this.tooltipText.width + 10, this.tooltipText.height + 10);

        // Position Tooltip relative to slot but global
        // Since InventoryUI is a container, we need to get world position
        const worldPos = slot.getBounds();
        this.tooltip.setPosition(worldPos.x + 40, worldPos.y);
        this.tooltip.setVisible(true);
    }

    private onSlotOut() {
        this.tooltip.setVisible(false);
    }

    private onSlotClick(index: number) {
        this.scene.events.emit('inventory-item-clicked', index);
        this.tooltip.setVisible(false); // Hide tooltip on click to avoid stuck tooltip if item moves
    }

    private getRarityColor(rarity: ItemRarity): number {
        switch (rarity) {
            case ItemRarity.COMMON: return 0xaaaaaa;
            case ItemRarity.RARE: return 0x0000ff;
            case ItemRarity.EPIC: return 0x800080;
            case ItemRarity.LEGENDARY: return 0xffd700;
            default: return 0xffffff;
        }
    }
}
