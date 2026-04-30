/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import * as THREE from 'three';

export enum AppState {
  STABLE = 'STABLE',
  DISMANTLING = 'DISMANTLING',
  REBUILDING = 'REBUILDING'
}

export enum MaterialType {
  SOLID = 'SOLID',
  WOOD = 'WOOD',
  METAL = 'METAL',
  GLASS = 'GLASS',
  STONE = 'STONE',
  PLASTIC = 'PLASTIC',
  FABRIC = 'FABRIC'
}

export enum BrushTool {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  PAINT = 'PAINT',
  SCULPT = 'SCULPT',
  DECAL = 'DECAL'
}

export enum ShapeType {
  CUBE = 'CUBE',
  CYLINDER = 'CYLINDER',
  PYRAMID = 'PYRAMID',
  HALF_BLOCK = 'HALF_BLOCK',
  STAIRS = 'STAIRS'
}

export interface VoxelData {
  x: number;
  y: number;
  z: number;
  color: number;
  material?: MaterialType;
  shape?: ShapeType;
  isDecal?: boolean;
  nx?: number;
  ny?: number;
  nz?: number;
}

export interface SimulationVoxel {
  id: number;
  x: number;
  y: number;
  z: number;
  color: THREE.Color;
  material: MaterialType;
  shape: ShapeType;
  isDecal?: boolean;
  nx?: number;
  ny?: number;
  nz?: number;
  // Physics state
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  rvx: number;
  rvy: number;
  rvz: number;
  chunkKey?: string;
}

export interface RebuildTarget {
  x: number;
  y: number;
  z: number;
  delay: number;
  isRubble?: boolean;
  colorTransitionDelay?: number;
  targetColor?: number;
}

export interface SavedModel {
  id: string;
  name: string;
  data: VoxelData[];
  baseModel?: string;
  folder?: string;
}

export interface HistoryState {
  voxels: VoxelData[];
  actionName?: string;
}

export interface SculptSettings {
  size: number;
  strength: number;
}

export type MaterialConfigMap = Record<MaterialType, any>;

export interface PhysicsConfig {
  gravity: number;
  bounce: number;
  friction: number;
  explosionForce: number;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
}
