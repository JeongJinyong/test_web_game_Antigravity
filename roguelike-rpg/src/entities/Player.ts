import Phaser from 'phaser';
import { ICombatStats } from '../types';

export default class Player extends Phaser.Physics.Arcade.Sprite implements ICombatStats {
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

    // ICombatStats implementation
    public hp: number = 100;
    public maxHp: number = 100;
    public attackMin: number = 10;
    public attackMax: number = 15;
    public defense: number = 0;
    public moveSpeed: number = 150;

    public lastAttackTime: number = 0;
    public attackCooldown: number = 500; // ms

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'roguelike-sheet', 24); // Frame 24 is usually a character in Kenney pack

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);

        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
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
}
