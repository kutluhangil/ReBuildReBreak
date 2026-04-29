/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { VoxelData } from '../types';
import { COLORS, CONFIG } from './voxelConstants';

// Helper to prevent overlapping voxels
function setBlock(map: Map<string, VoxelData>, x: number, y: number, z: number, color: number) {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rz = Math.round(z);
    const key = `${rx},${ry},${rz}`;
    map.set(key, { x: rx, y: ry, z: rz, color });
}

function generateSphere(map: Map<string, VoxelData>, cx: number, cy: number, cz: number, r: number, col: number, sy = 1) {
    const r2 = r * r;
    const xMin = Math.floor(cx - r);
    const xMax = Math.ceil(cx + r);
    const yMin = Math.floor(cy - r * sy);
    const yMax = Math.ceil(cy + r * sy);
    const zMin = Math.floor(cz - r);
    const zMax = Math.ceil(cz + r);

    for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
            for (let z = zMin; z <= zMax; z++) {
                const dx = x - cx;
                const dy = (y - cy) / sy;
                const dz = z - cz;
                if (dx * dx + dy * dy + dz * dz <= r2) {
                    setBlock(map, x, y, z, col);
                }
            }
        }
    }
}

export const Generators = {
    Eagle: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        // Branch
        for (let x = -8; x < 8; x++) {
            const y = Math.sin(x * 0.2) * 1.5;
            const z = Math.cos(x * 0.1) * 1.5;
            generateSphere(map, x, y, z, 1.8, COLORS.WOOD);
            if (Math.random() > 0.7) generateSphere(map, x, y + 2, z + (Math.random() - 0.5) * 3, 1.5, COLORS.GREEN);
        }
        // Body
        const EX = 0, EY = 2, EZ = 2;
        generateSphere(map, EX, EY + 6, EZ, 4.5, COLORS.DARK, 1.4);
        // Chest
        for (let x = EX - 2; x <= EX + 2; x++) for (let y = EY + 4; y <= EY + 9; y++) setBlock(map, x, y, EZ + 3, COLORS.LIGHT);
        // Wings (Rough approximation)
        for (let x of [-4, -3, 3, 4]) for (let y = EY + 4; y <= EY + 10; y++) for (let z = EZ - 2; z <= EZ + 3; z++) setBlock(map, x, y, z, COLORS.DARK);
        // Tail
        for (let x = EX - 2; x <= EX + 2; x++) for (let y = EY; y <= EY + 4; y++) for (let z = EZ - 5; z <= EZ - 3; z++) setBlock(map, x, y, z, COLORS.WHITE);
        // Head
        const HY = EY + 12, HZ = EZ + 1;
        generateSphere(map, EX, HY, HZ, 2.8, COLORS.WHITE);
        generateSphere(map, EX, HY - 2, HZ, 2.5, COLORS.WHITE);
        // Talons
        [[-2, 0], [-2, 1], [2, 0], [2, 1]].forEach(o => setBlock(map, EX + o[0], EY + o[1], EZ, COLORS.TALON));
        // Beak
        [[0, 1], [0, 2], [1, 1], [-1, 1]].forEach(o => setBlock(map, EX + o[0], HY, HZ + 2 + o[1], COLORS.GOLD));
        setBlock(map, EX, HY - 1, HZ + 3, COLORS.GOLD);
        // Eyes
        [[-1.5, COLORS.BLACK], [1.5, COLORS.BLACK]].forEach(o => setBlock(map, EX + o[0], HY + 0.5, HZ + 1.5, o[1]));
        [[-1.5, COLORS.WHITE], [1.5, COLORS.WHITE]].forEach(o => setBlock(map, EX + o[0], HY + 1.5, HZ + 1.5, o[1]));

        return Array.from(map.values());
    },

    Cat: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const CY = CONFIG.FLOOR_Y + 1; const CX = 0, CZ = 0;
        // Paws
        generateSphere(map, CX - 3, CY + 2, CZ, 2.2, COLORS.DARK, 1.2);
        generateSphere(map, CX + 3, CY + 2, CZ, 2.2, COLORS.DARK, 1.2);
        // Body
        for (let y = 0; y < 7; y++) {
            const r = 3.5 - (y * 0.2);
            generateSphere(map, CX, CY + 2 + y, CZ, r, COLORS.DARK);
            generateSphere(map, CX, CY + 2 + y, CZ + 2, r * 0.6, COLORS.WHITE);
        }
        // Legs
        for (let y = 0; y < 5; y++) {
            setBlock(map, CX - 1.5, CY + y, CZ + 3, COLORS.WHITE); setBlock(map, CX + 1.5, CY + y, CZ + 3, COLORS.WHITE);
            setBlock(map, CX - 1.5, CY + y, CZ + 2, COLORS.WHITE); setBlock(map, CX + 1.5, CY + y, CZ + 2, COLORS.WHITE);
        }
        // Head
        const CHY = CY + 9;
        generateSphere(map, CX, CHY, CZ, 3.2, COLORS.LIGHT, 0.8);
        // Ears
        [[-2, 1], [2, 1]].forEach(side => {
            setBlock(map, CX + side[0], CHY + 3, CZ, COLORS.DARK); setBlock(map, CX + side[0] * 0.8, CHY + 3, CZ + 1, COLORS.WHITE);
            setBlock(map, CX + side[0], CHY + 4, CZ, COLORS.DARK);
        });
        // Tail
        for (let i = 0; i < 12; i++) {
            const a = i * 0.3, tx = Math.cos(a) * 4.5, tz = Math.sin(a) * 4.5;
            if (tz > -2) { setBlock(map, CX + tx, CY, CZ + tz, COLORS.DARK); setBlock(map, CX + tx, CY + 1, CZ + tz, COLORS.DARK); }
        }
        // Face
        setBlock(map, CX - 1, CHY + 0.5, CZ + 2.5, COLORS.GOLD); setBlock(map, CX + 1, CHY + 0.5, CZ + 2.5, COLORS.GOLD);
        setBlock(map, CX - 1, CHY + 0.5, CZ + 3, COLORS.BLACK); setBlock(map, CX + 1, CHY + 0.5, CZ + 3, COLORS.BLACK);
        setBlock(map, CX, CHY, CZ + 3, COLORS.TALON);
        return Array.from(map.values());
    },

    Rabbit: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const LOG_Y = CONFIG.FLOOR_Y + 2.5;
        const RX = 0, RZ = 0;
        // Log
        for (let x = -6; x <= 6; x++) {
            const radius = 2.8 + Math.sin(x * 0.5) * 0.2;
            generateSphere(map, x, LOG_Y, 0, radius, COLORS.DARK);
            if (x === -6 || x === 6) generateSphere(map, x, LOG_Y, 0, radius - 0.5, COLORS.WOOD);
            if (Math.random() > 0.8) setBlock(map, x, LOG_Y + radius, (Math.random() - 0.5) * 2, COLORS.GREEN);
        }
        // Body
        const BY = LOG_Y + 2.5;
        generateSphere(map, RX - 1.5, BY + 1.5, RZ - 1.5, 1.8, COLORS.WHITE);
        generateSphere(map, RX + 1.5, BY + 1.5, RZ - 1.5, 1.8, COLORS.WHITE);
        generateSphere(map, RX, BY + 2, RZ, 2.2, COLORS.WHITE, 0.8);
        generateSphere(map, RX, BY + 2.5, RZ + 1.5, 1.5, COLORS.WHITE);
        setBlock(map, RX - 1.2, BY, RZ + 2.2, COLORS.LIGHT); setBlock(map, RX + 1.2, BY, RZ + 2.2, COLORS.LIGHT);
        setBlock(map, RX - 2.2, BY, RZ - 0.5, COLORS.WHITE); setBlock(map, RX + 2.2, BY, RZ - 0.5, COLORS.WHITE);
        generateSphere(map, RX, BY + 1.5, RZ - 2.5, 1.0, COLORS.WHITE);
        // Head
        const HY = BY + 4.5; const HZ = RZ + 1;
        generateSphere(map, RX, HY, HZ, 1.7, COLORS.WHITE);
        generateSphere(map, RX - 1.1, HY - 0.5, HZ + 0.5, 1.0, COLORS.WHITE);
        generateSphere(map, RX + 1.1, HY - 0.5, HZ + 0.5, 1.0, COLORS.WHITE);
        // Ears
        for (let y = 0; y < 5; y++) {
            const curve = y * 0.2;
            setBlock(map, RX - 0.8, HY + 1.5 + y, HZ - curve, COLORS.WHITE); setBlock(map, RX - 1.2, HY + 1.5 + y, HZ - curve, COLORS.WHITE);
            setBlock(map, RX - 1.0, HY + 1.5 + y, HZ - curve + 0.5, COLORS.LIGHT);
            setBlock(map, RX + 0.8, HY + 1.5 + y, HZ - curve, COLORS.WHITE); setBlock(map, RX + 1.2, HY + 1.5 + y, HZ - curve, COLORS.WHITE);
            setBlock(map, RX + 1.0, HY + 1.5 + y, HZ - curve + 0.5, COLORS.LIGHT);
        }
        setBlock(map, RX - 0.8, HY + 0.2, HZ + 1.5, COLORS.BLACK); setBlock(map, RX + 0.8, HY + 0.2, HZ + 1.5, COLORS.BLACK);
        setBlock(map, RX, HY - 0.5, HZ + 1.8, COLORS.TALON);
        return Array.from(map.values());
    },

    Twins: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        function buildMiniEagle(offsetX: number, offsetZ: number, mirror: boolean) {
            // Branch
            for (let x = -5; x < 5; x++) {
                const y = Math.sin(x * 0.4) * 0.5;
                generateSphere(map, offsetX + x, y, offsetZ, 1.2, COLORS.WOOD);
                if (Math.random() > 0.8) generateSphere(map, offsetX + x, y + 1, offsetZ, 1, COLORS.GREEN);
            }
            const EX = offsetX, EY = 1.5, EZ = offsetZ;
            generateSphere(map, EX, EY + 4, EZ, 3.0, COLORS.DARK, 1.4);
            for (let x = EX - 1; x <= EX + 1; x++) for (let y = EY + 2; y <= EY + 6; y++) setBlock(map, x, y, EZ + 2, COLORS.LIGHT);
            for (let x = EX - 1; x <= EX + 1; x++) for (let y = EY + 2; y <= EY + 3; y++) setBlock(map, x, y, EZ - 3, COLORS.WHITE);
            for (let y = EY + 2; y <= EY + 6; y++) for (let z = EZ - 1; z <= EZ + 2; z++) { setBlock(map, EX - 3, y, z, COLORS.DARK); setBlock(map, EX + 3, y, z, COLORS.DARK); }
            const HY = EY + 8, HZ = EZ + 1;
            generateSphere(map, EX, HY, HZ, 2.0, COLORS.WHITE);
            setBlock(map, EX, HY, HZ + 2, COLORS.GOLD); setBlock(map, EX, HY - 0.5, HZ + 2, COLORS.GOLD);
            setBlock(map, EX - 1, HY + 0.5, HZ + 1, COLORS.BLACK); setBlock(map, EX + 1, HY + 0.5, HZ + 1, COLORS.BLACK);
            setBlock(map, EX - 1, EY, EZ, COLORS.TALON); setBlock(map, EX + 1, EY, EZ, COLORS.TALON);
        }
        buildMiniEagle(-10, 2, false);
        buildMiniEagle(10, -2, true);
        return Array.from(map.values());
    },

    Tree: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const TY = CONFIG.FLOOR_Y;
        const TX = 0, TZ = 0;
        // Trunk
        for (let y = 0; y < 14; y++) {
            const rad = Math.max(1, 4 - (y * 0.25));
            generateSphere(map, TX, TY + y, TZ, rad, COLORS.WOOD, 1);
        }
        // Roots
        for(let a=0; a<Math.PI*2; a+=Math.PI/2) {
            for(let r=3; r<7; r++) {
                const h = Math.max(0, 3 - (r-3)*0.8);
                if (h > 0.5) generateSphere(map, Math.cos(a)*r, TY + h/2, Math.sin(a)*r, h, COLORS.WOOD);
            }
        }
        // Canopy Layers
        generateSphere(map, TX, TY + 14, TZ, 7, COLORS.GREEN, 0.7);
        generateSphere(map, TX + 2, TY + 17, TZ + 2, 6, COLORS.GREEN, 0.8);
        generateSphere(map, TX - 3, TY + 16, TZ - 2, 5.5, COLORS.GREEN, 0.8);
        generateSphere(map, TX, TY + 21, TZ, 4.5, COLORS.GREEN, 0.9);
        // Apples
        for(let i=0; i<15; i++) {
            const ax = (Math.random()-0.5)*12;
            const ay = TY + 14 + Math.random()*7;
            const az = (Math.random()-0.5)*12;
            if (ax*ax + az*az < 36) {
                setBlock(map, TX+ax, ay, TZ+az, 0xFF3333); // Red apple
            }
        }
        return Array.from(map.values());
    },

    House: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const HY = CONFIG.FLOOR_Y + 1;
        const W = 7, D = 5, H = 6;
        const WALL_C = COLORS.LIGHT;
        const ROOF_C = COLORS.DARK;
        
        // Base and Walls
        for(let x=-W; x<=W; x++) {
            for(let z=-D; z<=D; z++) {
                for(let y=0; y<=H; y++) {
                    if (x===-W || x===W || z===-D || z===D || y===0) {
                        setBlock(map, x, HY+y, z, WALL_C);
                    }
                }
            }
        }
        // Roof
        for(let y=0; y<=6; y++) {
            const shrink = y;
            for(let x=-(W+1)+shrink; x<=(W+1)-shrink; x++) {
                for(let z=-(D+1); z<=(D+1); z++) {
                    if (x >= -W && x <= W && z >= -D && z <= D && y < 5) continue; // Hollow roof
                    setBlock(map, x, HY+H+y, z, ROOF_C);
                }
            }
        }
        // Door
        for(let x=-1; x<=1; x++) for(let y=1; y<=4; y++) {
            setBlock(map, x, HY+y, D, COLORS.WOOD);
        }
        setBlock(map, 1, HY+2, D+1, COLORS.GOLD); // knob
        // Windows
        for(let x of [-4, 4]) {
            for(let dx=-1; dx<=1; dx++) for(let dy=2; dy<=4; dy++) {
                setBlock(map, x+dx, HY+dy, D, 0x88CCFF);
            }
        }
        // Chimney
        for(let y=0; y<6; y++) {
            for(let cx=-4; cx<=-2; cx++) for(let cz=-2; cz<=0; cz++) {
                setBlock(map, cx, HY+H+y, cz, 0x995544);
            }
        }
        return Array.from(map.values());
    },

    Robot: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const RY = CONFIG.FLOOR_Y + 1;
        const BODY_C = 0xAAABB8;
        const JOINT_C = 0x555555;
        const EYE_C = 0x33FFCC;
        const ACCENT_C = 0xFF5555;

        // Legs (Wheels/Treads)
        generateSphere(map, -3, RY+2, 0, 3, JOINT_C, 0.5);
        generateSphere(map, 3, RY+2, 0, 3, JOINT_C, 0.5);
        for(let x=-4; x<=4; x++) for(let z=-2; z<=2; z++) setBlock(map, x, RY+2, z, JOINT_C);

        // Body Torso
        for(let x=-5; x<=5; x++) for(let y=4; y<=12; y++) for(let z=-4; z<=4; z++) {
            setBlock(map, x, RY+y, z, BODY_C);
        }
        // Chest Screen
        for(let x=-3; x<=3; x++) for(let y=6; y<=10; y++) setBlock(map, x, RY+y, 5, 0x222222);
        // Arms
        generateSphere(map, -7, RY+10, 0, 2.5, JOINT_C);
        generateSphere(map, 7, RY+10, 0, 2.5, JOINT_C);
        for(let y=5; y<=9; y++) {
            setBlock(map, -8, RY+y, 0, BODY_C); setBlock(map, -7, RY+y, 0, BODY_C);
            setBlock(map, 8, RY+y, 0, BODY_C); setBlock(map, 7, RY+y, 0, BODY_C);
        }
        // Claws
        setBlock(map, -8, RY+4, 1, ACCENT_C); setBlock(map, -8, RY+4, -1, ACCENT_C);
        setBlock(map, 8, RY+4, 1, ACCENT_C); setBlock(map, 8, RY+4, -1, ACCENT_C);

        // Neck
        generateSphere(map, 0, RY+13, 0, 1.5, JOINT_C);

        // Head
        for(let x=-3; x<=3; x++) for(let y=14; y<=18; y++) for(let z=-3; z<=3; z++) {
            setBlock(map, x, RY+y, z, BODY_C);
        }
        // Eyes
        setBlock(map, -1.5, RY+16, 4, EYE_C); setBlock(map, -1.5, RY+16.5, 4, EYE_C);
        setBlock(map, 1.5, RY+16, 4, EYE_C); setBlock(map, 1.5, RY+16.5, 4, EYE_C);

        // Antenna
        for(let y=19; y<=21; y++) setBlock(map, 0, RY+y, 0, JOINT_C);
        setBlock(map, 0, RY+22, 0, ACCENT_C);

        return Array.from(map.values());
    },

    Terrain: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const size = 15;
        for (let x = -size; x <= size; x++) {
            for (let z = -size; z <= size; z++) {
                // simple pseudo-random "noise" based on sine waves
                const h = Math.floor(Math.sin(x * 0.2) * Math.cos(z * 0.2) * 5 + Math.sin(x * 0.5) * 2);
                for (let y = -2; y <= h; y++) {
                    let color = COLORS.DIRT;
                    if (y === h) {
                        color = COLORS.GREEN;
                        if (h > 4) color = 0xEEEEEE; // Snow peak
                        if (h < -1) color = COLORS.SAND; // Sand/beach
                    }
                    setBlock(map, x, CONFIG.FLOOR_Y + 1 + y, z, color);
                }
                // Trees
                if (h >= 0 && h < 4 && Math.random() < 0.05) {
                    for (let ty = 1; ty <= 4; ty++) setBlock(map, x, CONFIG.FLOOR_Y + 1 + h + ty, z, COLORS.WOOD);
                    for (let tx = -1; tx <= 1; tx++) {
                        for (let tz = -1; tz <= 1; tz++) {
                            for (let ty = 3; ty <= 5; ty++) {
                                if (Math.abs(tx) === 1 && Math.abs(tz) === 1 && ty === 5) continue;
                                setBlock(map, x + tx, CONFIG.FLOOR_Y + 1 + h + ty, z + tz, COLORS.GREEN);
                            }
                        }
                    }
                }
            }
        }
        return Array.from(map.values());
    }
};
