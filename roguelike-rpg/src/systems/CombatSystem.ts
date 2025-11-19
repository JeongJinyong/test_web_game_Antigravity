import Phaser from 'phaser';
import Player from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { ICombatStats } from '../types';

export default class CombatSystem {
    private scene: Phaser.Scene;
    private player: Player;
    private enemies: Phaser.Physics.Arcade.Group;
    private hpBars: Map<Enemy, Phaser.GameObjects.Graphics>;

    constructor(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group) {
        this.scene = scene;
        this.player = player;
        this.enemies = enemies;
        this.hpBars = new Map();

        this.setupInput();
        this.setupCollisions();
    }

    private setupInput() {
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                this.handlePlayerAttack(pointer);
            }
        });
    }

    private setupCollisions() {
        // Player touches Enemy -> Player takes damage
        this.scene.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
            this.handlePlayerHit(player as Player, enemy as Enemy);
        });
    }

    private handlePlayerAttack(pointer: Phaser.Input.Pointer) {
        // Convert pointer to world coordinates
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

        if (this.player.attack(worldPoint.x, worldPoint.y)) {
            // Check for hits
            // Simple arc/cone check or distance check in front of player
            // For simplicity, let's use a distance check + angle check

            const attackRange = 50;
            const attackAngle = 90; // degrees

            const playerAngle = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(
                this.player.x, this.player.y,
                worldPoint.x, worldPoint.y
            ));

            this.enemies.getChildren().forEach((child) => {
                const enemy = child as Enemy;
                if (!enemy.active) return;

                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                if (dist <= attackRange) {
                    const angleToEnemy = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(
                        this.player.x, this.player.y,
                        enemy.x, enemy.y
                    ));

                    // Normalize angle difference
                    let angleDiff = Phaser.Math.Angle.ShortestBetween(playerAngle, angleToEnemy);

                    if (Math.abs(angleDiff) <= attackAngle / 2) {
                        this.damageEnemy(enemy);
                    }
                }
            });
        }
    }

    private damageEnemy(enemy: Enemy) {
        // Calculate damage
        const damage = Phaser.Math.Between(this.player.attackMin, this.player.attackMax) - enemy.defense;
        const finalDamage = Math.max(1, damage);

        enemy.hp -= finalDamage;

        // Show damage text
        this.showDamageText(enemy.x, enemy.y, finalDamage, 0xffffff);

        console.log(`Hit enemy! Damage: ${finalDamage}, HP: ${enemy.hp}`);

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    private killEnemy(enemy: Enemy) {
        enemy.disableBody(true, true); // Hide and disable physics
        // Clean up HP bar
        if (this.hpBars.has(enemy)) {
            this.hpBars.get(enemy)?.destroy();
            this.hpBars.delete(enemy);
        }

        // Drop loot logic hook here
        console.log('Enemy died!');
    }

    private handlePlayerHit(player: Player, enemy: Enemy) {
        // Simple cooldown for taking damage to avoid instant death
        // We can attach a 'lastHitTime' to player or manage it here.
        // For now, let's just log it and push back slightly

        // In a real game, we'd have an invulnerability timer on the player.
        // Let's assume we can just log for now as requested for "Collision -> Damage"
        // To prevent spam, we could check a timer.

        // TODO: Add player invulnerability timer

        const damage = Phaser.Math.Between(enemy.attackMin, enemy.attackMax) - player.defense;
        const finalDamage = Math.max(1, damage);

        player.hp -= finalDamage;
        console.log(`Player hit! Damage: ${finalDamage}, HP: ${player.hp}`);

        // Knockback
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        player.body!.velocity.x += Math.cos(angle) * 200;
        player.body!.velocity.y += Math.sin(angle) * 200;

        if (player.hp <= 0) {
            console.log('Player died!');
            // Restart scene or game over
            this.scene.scene.restart();
        }
    }

    private showDamageText(x: number, y: number, damage: number, color: number) {
        const text = this.scene.add.text(x, y - 20, damage.toString(), {
            fontSize: '16px',
            color: '#' + color.toString(16),
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: text,
            y: y - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });
    }

    public update() {
        this.updateEnemies();
        this.updateHPBars();
    }

    private updateEnemies() {
        this.enemies.getChildren().forEach((child) => {
            const enemy = child as Enemy;
            if (!enemy.active) return;

            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            if (dist < 100) {
                // Chase
                this.scene.physics.moveToObject(enemy, this.player, enemy.moveSpeed);
            } else {
                // Idle or Patrol (Random movement)
                // Simple random movement: if velocity is 0, pick a random direction
                if (enemy.body!.velocity.length() < 10) {
                    if (Math.random() < 0.02) {
                        const randAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                        this.scene.physics.velocityFromRotation(randAngle, enemy.moveSpeed * 0.5, enemy.body!.velocity);
                    }
                }
            }
        });
    }

    private updateHPBars() {
        this.enemies.getChildren().forEach((child) => {
            const enemy = child as Enemy;
            if (!enemy.active) return;

            let bar = this.hpBars.get(enemy);
            if (!bar) {
                bar = this.scene.add.graphics();
                this.hpBars.set(enemy, bar);
            }

            bar.clear();
            bar.fillStyle(0x000000);
            bar.fillRect(enemy.x - 10, enemy.y - 20, 20, 4);

            const hpPercent = enemy.hp / enemy.maxHp;
            bar.fillStyle(0xff0000);
            bar.fillRect(enemy.x - 10, enemy.y - 20, 20 * hpPercent, 4);
        });
    }
}
