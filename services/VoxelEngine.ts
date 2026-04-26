/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AppState, SimulationVoxel, RebuildTarget, VoxelData, MaterialType, BrushTool, PhysicsConfig, SculptSettings, MaterialConfigMap } from '../types';
import { CONFIG, COLORS } from '../utils/voxelConstants';

interface MeshGroup {
  materialType: MaterialType;
  mesh: THREE.InstancedMesh;
}

export class VoxelEngine {
  private container: HTMLElement;
  public scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  private meshGroups: Map<MaterialType, THREE.InstancedMesh> = new Map();
  private dummy = new THREE.Object3D();
  
  private voxels: SimulationVoxel[] = [];
  private rebuildTargets: RebuildTarget[] = [];
  private rebuildStartTime: number = 0;
  
  private state: AppState = AppState.STABLE;
  private onStateChange: (state: AppState) => void;
  private onCountChange: (count: number) => void;
  private animationId: number = 0;
  private MAX_VOXELS = 5000;
  
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  
  // Brush Interactions
  public currentTool: BrushTool = BrushTool.ADD;
  public currentColor: number = 0xff0000;
  public currentMaterial: MaterialType = MaterialType.SOLID;
  public sculptSettings: SculptSettings = { size: 1.5, strength: 0.2 };
  
  public materialConfig: MaterialConfigMap = {
      [MaterialType.GLASS]: { roughness: 0.1, metalness: 0.1, transmission: 0.9, thickness: 0.5, transparent: true, opacity: 1.0 },
      [MaterialType.METAL]: { roughness: 0.2, metalness: 0.9 },
      [MaterialType.WOOD]: { roughness: 0.9, metalness: 0.0 },
      [MaterialType.STONE]: { roughness: 1.0, metalness: 0.0 },
      [MaterialType.PLASTIC]: { roughness: 0.4, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.1 },
      [MaterialType.FABRIC]: { roughness: 1.0, metalness: 0.0, sheen: 1.0, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffffff) },
      [MaterialType.SOLID]: { roughness: 0.8, metalness: 0.1 }
  };
  
  private gravityGizmo: THREE.ArrowHelper;
  private bounceGizmo: THREE.ArrowHelper;
  private frictionGizmo: THREE.ArrowHelper;
  
  private onInteraction: () => void;

  public physicsConfig: PhysicsConfig = {
      gravity: -14.0,
      bounce: 0.6,
      friction: 0.85,
      explosionForce: 1.5
  };

  constructor(
    container: HTMLElement, 
    onStateChange: (state: AppState) => void,
    onCountChange: (count: number) => void,
    onInteraction: () => void = () => {}
  ) {
    this.container = container;
    this.onStateChange = onStateChange;
    this.onCountChange = onCountChange;
    this.onInteraction = onInteraction;

    // Init Three.js
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.BG_COLOR);
    this.scene.fog = new THREE.Fog(CONFIG.BG_COLOR, 60, 140); // Reduced haze

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Slightly zoomed out start position
    this.camera.position.set(30, 30, 60);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.target.set(0, 5, 0);

    // Gizmos
    this.gravityGizmo = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(-15, 10, -15), 5, 0xff0000, 1.5, 1);
    this.scene.add(this.gravityGizmo);
    this.bounceGizmo = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-12, CONFIG.FLOOR_Y, -15), 5, 0x00ff00, 1.5, 1);
    this.scene.add(this.bounceGizmo);
    this.frictionGizmo = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-12, CONFIG.FLOOR_Y + 0.5, -15), 5, 0x0000ff, 1.5, 1);
    this.scene.add(this.frictionGizmo);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(50, 80, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    this.scene.add(dirLight);

    // Floor
    const planeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 1 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), planeMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = CONFIG.FLOOR_Y;
    floor.receiveShadow = true;
    this.scene.add(floor);

    this.animate = this.animate.bind(this);
    this.animate();
    
    // Interaction listener
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
  }

  private gridSnapping: boolean = true;
  
  public toggleGridSnapping() {
      this.gridSnapping = !this.gridSnapping;
  }
  
  private onPointerDown(event: PointerEvent) {
    if (this.state !== AppState.STABLE) return;
    if (event.button !== 0) return; // Only left click
    
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const meshArray = Array.from(this.meshGroups.values());
    const intersects = this.raycaster.intersectObjects(meshArray);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const instanceId = intersect.instanceId;
      if (instanceId === undefined) return;
      
      const mesh = intersect.object as THREE.InstancedMesh;
      
      // Find which voxel this maps to
      const matrix = new THREE.Matrix4();
      mesh.getMatrixAt(instanceId, matrix);
      const pos = new THREE.Vector3().setFromMatrixPosition(matrix);
      
      const voxelIndex = this.voxels.findIndex(v => 
          Math.abs(v.x - pos.x) < 0.1 && 
          Math.abs(v.y - pos.y) < 0.1 && 
          Math.abs(v.z - pos.z) < 0.1
      );
      
      if (voxelIndex === -1) return;
      
      if (this.currentTool === BrushTool.REMOVE) {
          // Remove voxel
          this.voxels.splice(voxelIndex, 1);
          this.createVoxels(this.getData()); // Recreate meshes
          this.onInteraction();
      } else if (this.currentTool === BrushTool.PAINT) {
          // Paint voxel
          this.voxels[voxelIndex].color = new THREE.Color(this.currentColor);
          this.voxels[voxelIndex].material = this.currentMaterial;
          this.createVoxels(this.getData());
          this.onInteraction();
      } else if (this.currentTool === BrushTool.ADD) {
          // Add voxel
          if (this.voxels.length >= this.MAX_VOXELS) return;
          
          if (intersect.face) {
              const normal = intersect.face.normal.clone();
              normal.transformDirection(mesh.matrixWorld);
              const newPos = pos.clone().add(normal);
              if (!this.gridSnapping) {
                  // If not snapping, place it closer, half a size.
                  newPos.copy(pos.clone().add(normal.multiplyScalar(0.5)));
              }
              
              this.voxels.push({
                  id: this.voxels.length > 0 ? Math.max(...this.voxels.map(v => v.id)) + 1 : 0,
                  x: newPos.x, y: newPos.y, z: newPos.z,
                  color: new THREE.Color(this.currentColor),
                  material: this.currentMaterial,
                  vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0,
                  rvx: 0, rvy: 0, rvz: 0
              });
              
              this.createVoxels(this.getData());
              this.onInteraction();
          }
      } else if (this.currentTool === BrushTool.SCULPT) {
          // Flatten / push inwards based on normal, pull if shift key
          if (intersect.face) {
            const normal = intersect.face.normal.clone();
            normal.transformDirection(mesh.matrixWorld);
            const direction = event.shiftKey ? 1 : -1;
            const radius = this.sculptSettings.size;
            const sculptStrength = this.sculptSettings.strength;
            
            // Also sculpt neighbors lightly for smoother look
            const targetPos = this.voxels[voxelIndex];
            this.voxels.forEach(v => {
                const dist = Math.sqrt((v.x - targetPos.x)**2 + (v.y - targetPos.y)**2 + (v.z - targetPos.z)**2);
                if (dist < radius) {
                    const falloff = Math.pow(1 - (dist / radius), 2);
                    v.x += normal.x * sculptStrength * direction * falloff;
                    v.y += normal.y * sculptStrength * direction * falloff;
                    v.z += normal.z * sculptStrength * direction * falloff;
                }
            });

            this.createVoxels(this.getData());
            this.onInteraction();
          }
      }
    } else {
        // If clicked on plane and tool is ADD
        if (this.currentTool === BrushTool.ADD) {
            if (this.voxels.length >= this.MAX_VOXELS) return;
            const intersectsPlane = this.raycaster.intersectObject(this.scene.children.find(c => c.type === 'Mesh')!); // Floor
            if (intersectsPlane.length > 0) {
                const intersect = intersectsPlane[0];
                const pt = intersect.point;
                // Snap to grid
                const x = this.gridSnapping ? Math.round(pt.x) : pt.x;
                const z = this.gridSnapping ? Math.round(pt.z) : pt.z;
                const y = this.gridSnapping ? Math.round(pt.y) + 0.5 : pt.y + 0.5;
                
                this.voxels.push({
                  id: this.voxels.length > 0 ? Math.max(...this.voxels.map(v => v.id)) + 1 : 0,
                  x: x, y: y, z: z,
                  color: new THREE.Color(this.currentColor),
                  material: this.currentMaterial,
                  vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0,
                  rvx: 0, rvy: 0, rvz: 0
              });
              this.createVoxels(this.getData());
              this.onInteraction();
            }
        }
    }
  }

  public getData(): VoxelData[] {
      return this.voxels.map(v => ({
          x: v.x, y: v.y, z: v.z,
          color: v.color.getHex(),
          material: v.material
      }));
  }

  public loadInitialModel(data: VoxelData[]) {
    this.createVoxels(data);
    this.onCountChange(this.voxels.length);
    this.state = AppState.STABLE;
    this.onStateChange(this.state);
  }

  public createVoxels(data: VoxelData[]) {
    // Clear existing
    this.meshGroups.forEach((mesh) => {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
        } else {
            mesh.material.dispose();
        }
    });
    this.meshGroups.clear();

    this.voxels = data.map((v, i) => {
        const c = new THREE.Color(v.color);
        // Slight color variation for realism
        c.offsetHSL(0, 0, (Math.random() * 0.1) - 0.05);
        return {
            id: i,
            x: v.x, y: v.y, z: v.z, color: c,
            material: v.material || MaterialType.SOLID,
            vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0,
            rvx: 0, rvy: 0, rvz: 0
        };
    });

    // Group by material
    const groups: Map<MaterialType, SimulationVoxel[]> = new Map();
    this.voxels.forEach(v => {
        if (!groups.has(v.material)) groups.set(v.material, []);
        groups.get(v.material)!.push(v);
    });

    const geometry = new THREE.BoxGeometry(CONFIG.VOXEL_SIZE - 0.05, CONFIG.VOXEL_SIZE - 0.05, CONFIG.VOXEL_SIZE - 0.05);

    groups.forEach((voxels, materialType) => {
        let material: THREE.Material;
        const config = this.materialConfig[materialType] || this.materialConfig[MaterialType.SOLID];
        
        switch (materialType) {
            case MaterialType.GLASS:
            case MaterialType.PLASTIC:
            case MaterialType.FABRIC:
                material = new THREE.MeshPhysicalMaterial({ ...config, side: THREE.DoubleSide });
                break;
            default:
                material = new THREE.MeshStandardMaterial(config);
        }

        const mesh = new THREE.InstancedMesh(geometry, material, voxels.length);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        voxels.forEach((v, i) => {
            this.dummy.position.set(v.x, v.y, v.z);
            this.dummy.rotation.set(v.rx, v.ry, v.rz);
            this.dummy.updateMatrix();
            mesh.setMatrixAt(i, this.dummy.matrix);
            mesh.setColorAt(i, v.color);
        });
        
        this.scene.add(mesh);
        this.meshGroups.set(materialType, mesh);
    });

    this.draw();
    this.onCountChange(this.voxels.length);
  }

  private draw() {
    // Redraw matrix/colors for all groups based on physics simulation
    // This is less efficient if many materials, but still okay for reasonable voxel counts.
    const groupIndices: Record<MaterialType, number> = {
        [MaterialType.SOLID]: 0,
        [MaterialType.GLASS]: 0,
        [MaterialType.METAL]: 0,
        [MaterialType.WOOD]: 0
    };
    
    this.voxels.forEach((v) => {
        const mesh = this.meshGroups.get(v.material);
        if (mesh) {
            const i = groupIndices[v.material]++;
            this.dummy.position.set(v.x, v.y, v.z);
            this.dummy.rotation.set(v.rx, v.ry, v.rz);
            this.dummy.updateMatrix();
            mesh.setMatrixAt(i, this.dummy.matrix);
            mesh.setColorAt(i, v.color);
        }
    });

    this.meshGroups.forEach(mesh => {
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }

  public dismantle() {
    if (this.state !== AppState.STABLE) return;
    this.state = AppState.DISMANTLING;
    this.onStateChange(this.state);

    this.voxels.forEach(v => {
        // More dynamic explosion
        v.vx = (Math.random() - 0.5) * this.physicsConfig.explosionForce;
        v.vy = Math.random() * (this.physicsConfig.explosionForce * 0.8) + 0.5;
        v.vz = (Math.random() - 0.5) * this.physicsConfig.explosionForce;
        v.rvx = (Math.random() - 0.5) * 0.5;
        v.rvy = (Math.random() - 0.5) * 0.5;
        v.rvz = (Math.random() - 0.5) * 0.5;
    });
  }

  private getColorDist(c1: THREE.Color, hex2: number): number {
    const c2 = new THREE.Color(hex2);
    const r = (c1.r - c2.r) * 0.3;
    const g = (c1.g - c2.g) * 0.59;
    const b = (c1.b - c2.b) * 0.11;
    return Math.sqrt(r * r + g * g + b * b);
  }

  public rebuild(targetModel: VoxelData[]) {
    if (this.state === AppState.REBUILDING) return;

    const available = this.voxels.map((v, i) => ({ index: i, color: v.color, taken: false }));
    const mappings: RebuildTarget[] = new Array(this.voxels.length).fill(null);

    // Simple greedy matching for colors
    targetModel.forEach(target => {
        let bestDist = 9999;
        let bestIdx = -1;

        for (let i = 0; i < available.length; i++) {
            if (available[i].taken) continue;

            const d = this.getColorDist(available[i].color, target.color);
            // Penalties for wrong material types
            const isLeafOrWood = (available[i].color.g > 0.4) || (available[i].color.r < 0.25 && available[i].color.b < 0.25);
            const targetIsGreen = target.color === COLORS.GREEN || target.color === COLORS.WOOD;
            const penalty = (isLeafOrWood && !targetIsGreen) ? 100 : 0;

            if (d + penalty < bestDist) {
                bestDist = d + penalty;
                bestIdx = i;
                if (d < 0.01) break; // Perfect match
            }
        }

        if (bestIdx !== -1) {
            available[bestIdx].taken = true;
            const h = Math.max(0, (target.y - CONFIG.FLOOR_Y) / 15);
            mappings[available[bestIdx].index] = {
                x: target.x, y: target.y, z: target.z,
                delay: h * 800
            };
        }
    });

    // Leftover voxels become rubble
    for (let i = 0; i < this.voxels.length; i++) {
        if (!mappings[i]) {
            mappings[i] = {
                x: this.voxels[i].x, y: this.voxels[i].y, z: this.voxels[i].z,
                isRubble: true, delay: 0
            };
        }
    }

    this.rebuildTargets = mappings;
    this.rebuildStartTime = Date.now();
    this.state = AppState.REBUILDING;
    this.onStateChange(this.state);
  }

  private updatePhysics() {
    // Gizmos Logic
    this.gravityGizmo.visible = this.state === AppState.DISMANTLING;
    this.bounceGizmo.visible = this.state === AppState.DISMANTLING;
    this.frictionGizmo.visible = this.state === AppState.DISMANTLING;
    
    if (this.state === AppState.DISMANTLING) {
        this.gravityGizmo.setLength(Math.abs(this.physicsConfig.gravity) * 0.4);
        this.bounceGizmo.setLength(Math.max(0.1, this.physicsConfig.bounce * 6));
        this.frictionGizmo.setLength(Math.max(0.1, this.physicsConfig.friction * 6));
    }

    if (this.state === AppState.DISMANTLING) {
        this.voxels.forEach(v => {
            v.vy += this.physicsConfig.gravity * 0.01; // Gravity
            v.x += v.vx; v.y += v.vy; v.z += v.vz;
            v.rx += v.rvx; v.ry += v.rvy; v.rz += v.rvz;

            // Floor bounce
            if (v.y < CONFIG.FLOOR_Y + 0.5) {
                v.y = CONFIG.FLOOR_Y + 0.5;
                v.vy *= -this.physicsConfig.bounce;
                v.vx *= this.physicsConfig.friction; 
                v.vz *= this.physicsConfig.friction;
                v.rvx *= this.physicsConfig.friction; 
                v.rvy *= this.physicsConfig.friction; 
                v.rvz *= this.physicsConfig.friction;
            }
        });
    } else if (this.state === AppState.REBUILDING) {
        const now = Date.now();
        const elapsed = now - this.rebuildStartTime;
        let allDone = true;

        this.voxels.forEach((v, i) => {
            const t = this.rebuildTargets[i];
            if (t.isRubble) return;

            if (elapsed < t.delay) {
                allDone = false;
                return;
            }

            const speed = 0.18; // Faster snap
            v.x += (t.x - v.x) * Math.min(speed + (elapsed-t.delay)*0.0001, 0.4);
            v.y += (t.y - v.y) * Math.min(speed + (elapsed-t.delay)*0.0001, 0.4);
            v.z += (t.z - v.z) * Math.min(speed + (elapsed-t.delay)*0.0001, 0.4);
            // Rotate back to zero faster
            v.rx += (0 - v.rx) * 0.2;
            v.ry += (0 - v.ry) * 0.2;
            v.rz += (0 - v.rz) * 0.2;

            // Check if reached
            if ((t.x - v.x) ** 2 + (t.y - v.y) ** 2 + (t.z - v.z) ** 2 > 0.01) {
                allDone = false;
            } else {
                // Snap to grid
                v.x = t.x; v.y = t.y; v.z = t.z;
                v.rx = 0; v.ry = 0; v.rz = 0;
            }
        });

        if (allDone) {
            this.state = AppState.STABLE;
            this.onStateChange(this.state);
        }
    }
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.updatePhysics();
    
    // Optimize: only draw if moving
    if (this.state !== AppState.STABLE || this.controls.autoRotate) {
        this.draw();
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  public handleResize() {
      if (this.camera && this.renderer) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }
  }
  
  public setAutoRotate(enabled: boolean) {
    if (this.controls) {
        this.controls.autoRotate = enabled;
    }
  }

  public getJsonData(): string {
      const data = this.voxels.map((v, i) => ({
          id: i,
          x: +v.x.toFixed(2),
          y: +v.y.toFixed(2),
          z: +v.z.toFixed(2),
          c: '#' + v.color.getHexString(),
          m: v.material
      }));
      return JSON.stringify(data, null, 2);
  }
  
  public getUniqueColors(): string[] {
    const colors = new Set<string>();
    this.voxels.forEach(v => {
        colors.add('#' + v.color.getHexString());
    });
    return Array.from(colors);
  }

  public cleanup() {
    cancelAnimationFrame(this.animationId);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown.bind(this));
    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }
}
