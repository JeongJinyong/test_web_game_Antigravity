import Phaser from 'phaser';
import Player from '../entities/Player';
import DungeonGenerator, { DungeonResult, TileType } from '../systems/DungeonGenerator';

export default class GameScene extends Phaser.Scene {
    private player!: Player;
    private map!: Phaser.Tilemaps.Tilemap;
    private tileset!: Phaser.Tilemaps.Tileset;
    private groundLayer!: Phaser.Tilemaps.TilemapLayer;

    private dungeon!: DungeonResult;

    constructor() {
        super('GameScene');
    }

    create() {
        this.generateDungeon();
        this.setupInput();
    }

    update() {
        if (this.player) {
            this.player.update();
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
        // We can put walls and floors on the same layer for simplicity, or separate them.
        // Let's use one layer for now, but we need to set collisions properly.
        this.groundLayer = this.map.createLayer(0, this.tileset, 0, 0)!;

        // Set collision for walls (index 10 is wall, 5 is floor in our mapping below)
        // Actually we need to check what indices we map to.
        // Let's say Wall = 570 (generic wall), Floor = 0 (generic floor) from the pack?
        // Kenney Roguelike pack indices are tricky without visual.
        // Let's assume:
        // Wall: Index 10 (from previous assumption, let's stick to it or refine)
        // Floor: Index 5
        // Empty: -1 (or a black tile)

        // Let's refine indices based on standard Kenney Roguelike sheet (often 57x31 tiles)
        // A safe bet for a wall is often around index 10-20.
        // A safe bet for floor is often index 0-5.
        // Let's use:
        // Wall: 10
        // Floor: 5
        // Empty: -1 (or a black tile)

        this.groundLayer.setCollision(10);

        // Spawn Player
        this.spawnPlayer();

        // Setup Camera
        this.setupCamera();
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

    private spawnPlayer() {
        const { startRoom } = this.dungeon;
        // Convert grid coordinates to world coordinates
        // Center of the tile
        const x = startRoom.centerX * 16 + 8;
        const y = startRoom.centerY * 16 + 8;

        if (this.player) {
            this.player.setPosition(x, y);
        } else {
            this.player = new Player(this, x, y);
            this.physics.add.collider(this.player, this.groundLayer);
        }
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
}
