import Phaser from 'phaser';

export enum TileType {
    EMPTY = 0,
    WALL = 1,
    FLOOR = 2,
    DOOR = 3
}

export interface Room {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
}

export interface Corridor {
    path: { x: number; y: number }[];
}

export interface DungeonResult {
    tiles: TileType[][];
    rooms: Room[];
    corridors: Corridor[];
    startRoom: Room;
    bossRoom: Room;
}

interface Partition {
    x: number;
    y: number;
    width: number;
    height: number;
    leftChild?: Partition;
    rightChild?: Partition;
    room?: Room;
}

export default class DungeonGenerator {
    private width: number;
    private height: number;
    private minRoomSize: number = 6;
    private maxRoomSize: number = 14;
    private minPartitionSize: number = 10; // minRoomSize + padding
    private maxPartitionSize: number = 25;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    public generateDungeon(): DungeonResult {
        // Initialize grid with walls
        const tiles: TileType[][] = Array(this.height).fill(null).map(() => Array(this.width).fill(TileType.EMPTY));

        // Root partition covering the whole map
        const root: Partition = {
            x: 1,
            y: 1,
            width: this.width - 2,
            height: this.height - 2
        };

        // Recursive BSP
        this.splitPartition(root);

        // Collect rooms
        const rooms: Room[] = [];
        this.createRooms(root, rooms);

        // Fill tiles with rooms
        rooms.forEach(room => {
            for (let y = room.y; y < room.y + room.height; y++) {
                for (let x = room.x; x < room.x + room.width; x++) {
                    tiles[y][x] = TileType.FLOOR;
                }
            }
        });

        // Connect rooms
        const corridors: Corridor[] = [];
        this.connectPartitions(root, tiles, corridors);

        // Add walls around floors
        this.generateWalls(tiles);

        // Find Start and Boss rooms
        const { startRoom, bossRoom } = this.findStartAndBossRooms(rooms);

        return {
            tiles,
            rooms,
            corridors,
            startRoom,
            bossRoom
        };
    }

    private splitPartition(partition: Partition) {
        // If partition is too small, don't split
        if (partition.width < this.maxPartitionSize && partition.height < this.maxPartitionSize) {
            return;
        }

        // Determine split direction (random or based on aspect ratio)
        let splitH = Math.random() > 0.5;
        if (partition.width > partition.height && partition.width / partition.height >= 1.25) splitH = false;
        else if (partition.height > partition.width && partition.height / partition.width >= 1.25) splitH = true;

        const max = (splitH ? partition.height : partition.width) - this.minPartitionSize;

        // If not enough space to split
        if (max <= this.minPartitionSize) return;

        const splitAt = Phaser.Math.Between(this.minPartitionSize, max);

        if (splitH) {
            // Horizontal split
            partition.leftChild = { x: partition.x, y: partition.y, width: partition.width, height: splitAt };
            partition.rightChild = { x: partition.x, y: partition.y + splitAt, width: partition.width, height: partition.height - splitAt };
        } else {
            // Vertical split
            partition.leftChild = { x: partition.x, y: partition.y, width: splitAt, height: partition.height };
            partition.rightChild = { x: partition.x + splitAt, y: partition.y, width: partition.width - splitAt, height: partition.height };
        }

        this.splitPartition(partition.leftChild);
        this.splitPartition(partition.rightChild);
    }

    private createRooms(partition: Partition, rooms: Room[]) {
        if (partition.leftChild || partition.rightChild) {
            if (partition.leftChild) this.createRooms(partition.leftChild, rooms);
            if (partition.rightChild) this.createRooms(partition.rightChild, rooms);
        } else {
            // Leaf node: create a room
            const roomWidth = Phaser.Math.Between(this.minRoomSize, Math.min(partition.width, this.maxRoomSize));
            const roomHeight = Phaser.Math.Between(this.minRoomSize, Math.min(partition.height, this.maxRoomSize));

            // Center room in partition
            const x = partition.x + Math.floor((partition.width - roomWidth) / 2);
            const y = partition.y + Math.floor((partition.height - roomHeight) / 2);

            const room: Room = {
                id: rooms.length,
                x,
                y,
                width: roomWidth,
                height: roomHeight,
                centerX: x + Math.floor(roomWidth / 2),
                centerY: y + Math.floor(roomHeight / 2)
            };

            partition.room = room;
            rooms.push(room);
        }
    }

    private connectPartitions(partition: Partition, tiles: TileType[][], corridors: Corridor[]) {
        if (partition.leftChild && partition.rightChild) {
            this.connectPartitions(partition.leftChild, tiles, corridors);
            this.connectPartitions(partition.rightChild, tiles, corridors);

            // Connect the two children
            const leftRoom = this.getRoomInPartition(partition.leftChild);
            const rightRoom = this.getRoomInPartition(partition.rightChild);

            if (leftRoom && rightRoom) {
                this.createCorridor(leftRoom, rightRoom, tiles, corridors);
            }
        }
    }

    private getRoomInPartition(partition: Partition): Room | null {
        if (partition.room) return partition.room;
        if (partition.leftChild) {
            const room = this.getRoomInPartition(partition.leftChild);
            if (room) return room;
        }
        if (partition.rightChild) {
            return this.getRoomInPartition(partition.rightChild);
        }
        return null;
    }

    private createCorridor(roomA: Room, roomB: Room, tiles: TileType[][], corridors: Corridor[]) {
        const path: { x: number; y: number }[] = [];

        let x = roomA.centerX;
        let y = roomA.centerY;

        while (x !== roomB.centerX || y !== roomB.centerY) {
            if (x !== roomB.centerX) {
                x += x < roomB.centerX ? 1 : -1;
            } else if (y !== roomB.centerY) {
                y += y < roomB.centerY ? 1 : -1;
            }

            if (tiles[y][x] !== TileType.FLOOR) {
                tiles[y][x] = TileType.FLOOR;
                path.push({ x, y });
            }
        }

        corridors.push({ path });
    }

    private generateWalls(tiles: TileType[][]) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (tiles[y][x] === TileType.FLOOR) {
                    // Check neighbors
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (tiles[y + dy] && tiles[y + dy][x + dx] === TileType.EMPTY) {
                                tiles[y + dy][x + dx] = TileType.WALL;
                            }
                        }
                    }
                }
            }
        }
    }

    private findStartAndBossRooms(rooms: Room[]): { startRoom: Room, bossRoom: Room } {
        let maxDist = 0;
        let startRoom = rooms[0];
        let bossRoom = rooms[rooms.length - 1];

        for (let i = 0; i < rooms.length; i++) {
            for (let j = i + 1; j < rooms.length; j++) {
                const dist = Phaser.Math.Distance.Between(rooms[i].centerX, rooms[i].centerY, rooms[j].centerX, rooms[j].centerY);
                if (dist > maxDist) {
                    maxDist = dist;
                    startRoom = rooms[i];
                    bossRoom = rooms[j];
                }
            }
        }

        return { startRoom, bossRoom };
    }
}
