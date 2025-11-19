import Phaser from 'phaser';
import { ICombatStats } from '../types';

export enum EnemyType {
    SLIME = 'slime',
    SKELETON = 'skeleton',
    DEMON = 'demon'
}

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite implements ICombatStats {
    public hp: number;
    public maxHp: number;
    public attackMin: number;
    public attackMax: number;
    public defense: number;
    public moveSpeed: number;

    public enemyType: EnemyType;

    constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType, frame: number) {
        super(scene, x, y, 'roguelike-sheet', frame);
        this.enemyType = type;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Default stats, should be overridden
        this.hp = 10;
        this.maxHp = 10;
        this.attackMin = 1;
        this.attackMax = 2;
        this.defense = 0;
        this.moveSpeed = 50;
    }
}

export class Slime extends Enemy {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Frame 54 is often a slime-like creature in Kenney pack, or we can pick another.
        // Let's assume 54 for now.
        super(scene, x, y, EnemyType.SLIME, 54);

        this.hp = 30;
        this.maxHp = 30;
        this.attackMin = 5;
        this.attackMax = 5;
        this.defense = 0;
        this.moveSpeed = 60;

        this.setTint(0x00ff00); // Green tint
    }
}

export class Skeleton extends Enemy {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Frame 55 for Skeleton
        super(scene, x, y, EnemyType.SKELETON, 55);

        this.hp = 50;
        this.maxHp = 50;
        this.attackMin = 10;
        this.attackMax = 10;
        this.defense = 1;
        this.moveSpeed = 90;

        this.setTint(0xcccccc); // Grey tint
    }
}

export class Demon extends Enemy {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Frame 56 for Demon
        super(scene, x, y, EnemyType.DEMON, 56);

        this.hp = 80;
        this.maxHp = 80;
        this.attackMin = 15;
        this.attackMax = 15;
        this.defense = 2;
        this.moveSpeed = 120;

        this.setTint(0xff0000); // Red tint
    }
}
