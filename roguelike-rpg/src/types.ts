export interface ICombatStats {
    hp: number;
    maxHp: number;
    attackMin: number;
    attackMax: number;
    defense: number;
    moveSpeed: number;
}

export enum ItemRarity {
    COMMON = 'common',
    RARE = 'rare',
    EPIC = 'epic',
    LEGENDARY = 'legendary'
}

export enum ItemType {
    WEAPON = 'weapon',
    ARMOR = 'armor',
    RING = 'ring',
    POTION = 'potion'
}

export interface ItemModifiers {
    attackBonus?: number;
    hpBonus?: number;
    critChance?: number;
    healAmount?: number;
}

export interface Item {
    id: string;
    name: string;
    rarity: ItemRarity;
    type: ItemType;
    modifiers: ItemModifiers;
    description?: string;
}

export interface EquipmentSlots {
    weapon?: Item;
    armor?: Item;
    ring?: Item;
}
