import Phaser from 'phaser';
import Player from '../entities/Player';
import DungeonGenerator, { DungeonResult, TileType } from '../systems/DungeonGenerator';
import CombatSystem from '../systems/CombatSystem';
import LootSystem from '../systems/LootSystem';
import { Enemy, Slime, Skeleton, Demon } from '../entities/Enemy';
import ItemPickup from '../entities/ItemPickup';

export default class GameScene extends Phaser.Scene {
    private player!: Player;
    private map!: Phaser.Tilemaps.Tilemap;
    private tileset!: Phaser.Tilemaps.Tileset;
    private groundLayer!: Phaser.Tilemaps.TilemapLayer;

    private dungeon!: DungeonResult;
    private combatSystem!: CombatSystem;
    private lootSystem!: LootSystem;
    private enemies!: Phaser.Physics.Arcade.Group;

    constructor() {
        super('GameScene');
    }

    create() {
        this.scene.launch('UIScene');

        this.generateDungeon();
        this.setupEnemies();
        this.spawnPlayer();
        this.setupLoot();
        this.setupCombat();
        this.setupCamera();
        this.setupInput();
        this.setupEvents();
    }

    update() {
        if (this.player) {
            this.player.update();
        }
        if (this.combatSystem) {
            this.combatSystem.update();
        }
    }

    private generateDungeon() {
        const generator = new DungeonGenerator(80, 80);
        this.dungeon = generator.generateDungeon();

        // Create Tilemap
        this.map = this.make.tilemap({
            data: this.convertDungeonToMapData(this.dungeon.tiles),
            tileWidth: 16,
            tileHeight: 16
        });

        // Add tileset image
        this.tileset = this.map.addTilesetImage('roguelike-sheet', 'roguelike-sheet', 16, 16, 0, 1)!;

        // Create layers
        this.groundLayer = this.map.createLayer(0, this.tileset, 0, 0)!;

        // Set collision for walls (index 10 is wall)
        this.groundLayer.setCollision(10);
    }

    private convertDungeonToMapData(tiles: TileType[][]): number[][] {
        return tiles.map(row => row.map(tile => {
            switch (tile) {
                case TileType.WALL: return 10; // Wall index
                case TileType.FLOOR: return 5; // Floor index
                case TileType.DOOR: return 5; // Door as floor for now
                default: return 0; // Empty/Black
            }
        }));
    }

    private setupEnemies() {
        this.enemies = this.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });

        // Spawn enemies in rooms (skip start room)
        const { rooms, startRoom } = this.dungeon;

        rooms.forEach(room => {
            if (room === startRoom) {
                // Spawn a few weak enemies in start room for testing as requested
                this.spawnEnemyInRoom(room, 'slime');
                this.spawnEnemyInRoom(room, 'slime');
                this.spawnEnemyInRoom(room, 'skeleton');
                return;
            }

            // Randomly spawn 2-5 enemies per room
            const enemyCount = Phaser.Math.Between(2, 5);
            for (let i = 0; i < enemyCount; i++) {
                const typeRoll = Math.random();
                let type = 'slime';
                if (typeRoll > 0.7) type = 'demon';
                else if (typeRoll > 0.4) type = 'skeleton';

                this.spawnEnemyInRoom(room, type);
            }
        });

        this.physics.add.collider(this.enemies, this.groundLayer);
    }

    private spawnEnemyInRoom(room: any, type: string) {
        const x = Phaser.Math.Between(room.x + 1, room.x + room.width - 2) * 16 + 8;
        const y = Phaser.Math.Between(room.y + 1, room.y + room.height - 2) * 16 + 8;

        let enemy: Enemy;
        switch (type) {
            case 'demon':
                enemy = new Demon(this, x, y);
                break;
            case 'skeleton':
                enemy = new Skeleton(this, x, y);
                break;
            case 'slime':
            default:
                enemy = new Slime(this, x, y);
                break;
        }

        this.enemies.add(enemy);
    }

    private spawnPlayer() {
        const { startRoom } = this.dungeon;
        const x = startRoom.centerX * 16 + 8;
        const y = startRoom.centerY * 16 + 8;

        if (this.player) {
            this.player.setPosition(x, y);
        } else {
            this.player = new Player(this, x, y);
            this.physics.add.collider(this.player, this.groundLayer);
        }
    }

    private setupLoot() {
        this.lootSystem = new LootSystem(this);
    }

    private setupCombat() {
        this.combatSystem = new CombatSystem(this, this.player, this.enemies);

        // Hook up loot drop
        this.combatSystem.onEnemyKilled = (enemy: Enemy) => {
            this.lootSystem.dropItemForEnemy(enemy.x, enemy.y);
        };
    }

    private setupCamera() {
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(2);
    }

    private setupInput() {
        this.input.keyboard!.on('keydown-F5', () => {
            this.scene.restart();
        });
    }

    private setupEvents() {
        this.events.on('player-try-pickup', () => {
            const pickups = this.lootSystem.getPickups();
            let closest: ItemPickup | null = null;
            let minDist = 50; // Pickup radius

            pickups.getChildren().forEach(child => {
                const pickup = child as ItemPickup;
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, pickup.x, pickup.y);
                if (dist < minDist) {
                    minDist = dist;
                    closest = pickup;
                }
            });

            if (closest) {
                if (this.player.pickupItem(closest)) {
                    (closest as ItemPickup).destroy();
                }
            }
        });

        this.events.on('ui-inventory-item-clicked', (index: number) => {
            this.player.useItem(index);
        });
    }
}
