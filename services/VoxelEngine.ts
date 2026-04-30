/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import {
  AppState,
  SimulationVoxel,
  RebuildTarget,
  VoxelData,
  MaterialType,
  BrushTool,
  PhysicsConfig,
  SculptSettings,
  MaterialConfigMap,
} from "../types";
import { CONFIG, COLORS } from "../utils/voxelConstants";
// audioService removed; audio disabled globally

interface MeshGroup {
  materialType: MaterialType;
  mesh: THREE.InstancedMesh;
}

export class VoxelEngine {
  private container: HTMLElement;
  public scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private isOrthographic: boolean = false;
  private renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  private meshGroups: Map<MaterialType, THREE.InstancedMesh> = new Map();
  private dummy = new THREE.Object3D();

  private ambientLight!: THREE.AmbientLight;
  private dirLight!: THREE.DirectionalLight;
  private floorMesh!: THREE.Mesh;

  private voxels: SimulationVoxel[] = [];
  private rebuildTargets: RebuildTarget[] = [];
  private projectiles: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    mass: number;
  }[] = [];
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
  public brushSize: number = 1;
  public symmetry = { x: false, y: false, z: false };
  public sculptSettings: SculptSettings = { size: 1.5, strength: 0.2 };

  public materialConfig: MaterialConfigMap = {
    [MaterialType.GLASS]: {
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
      transparent: true,
      opacity: 1.0,
    },
    [MaterialType.METAL]: { roughness: 0.2, metalness: 0.9 },
    [MaterialType.WOOD]: { roughness: 0.9, metalness: 0.0 },
    [MaterialType.STONE]: { roughness: 1.0, metalness: 0.0 },
    [MaterialType.PLASTIC]: {
      roughness: 0.4,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    },
    [MaterialType.FABRIC]: {
      roughness: 1.0,
      metalness: 0.0,
      sheen: 1.0,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color(0xffffff),
    },
    [MaterialType.SOLID]: { roughness: 0.8, metalness: 0.1 },
  };

  private gravityGizmo: THREE.ArrowHelper;
  private bounceGizmo: THREE.ArrowHelper;
  private frictionGizmo: THREE.ArrowHelper;
  public physicsGizmosVisible: boolean = false;

  private highlightBox: THREE.Mesh;
  private previewVoxel: THREE.Mesh;
  private previewSphere: THREE.Mesh;

  private onInteraction: (action?: string) => void;

  public onHoverChange?: (
    info: { x: number; y: number; z: number; material: string } | null,
  ) => void;

  private stats: Stats;

  public physicsConfig: PhysicsConfig = {
    gravity: -14.0,
    bounce: 0.6,
    friction: 0.85,
    explosionForce: 1.5,
  };

  constructor(
    container: HTMLElement,
    onStateChange: (state: AppState) => void,
    onCountChange: (count: number) => void,
    onInteraction: (action?: string) => void = () => {},
  ) {
    this.container = container;
    this.onStateChange = onStateChange;
    this.onCountChange = onCountChange;
    this.onInteraction = onInteraction;

    // Init Three.js
    this.scene = new THREE.Scene();

    // Basic Background
    this.scene.background = new THREE.Color(0xf1f5f9);
    this.scene.fog = new THREE.Fog(0xf1f5f9, 50, 150);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    // Slightly zoomed out start position
    this.camera.position.set(30, 30, 60);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = false;
    container.appendChild(this.renderer.domElement);

    // Initialize FPS Stats
    this.stats = new Stats();
    this.stats.dom.style.position = "absolute";
    this.stats.dom.style.top = "10px";
    this.stats.dom.style.left = "10px";
    this.stats.dom.style.zIndex = "100";
    container.appendChild(this.stats.dom);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.target.set(0, 5, 0);

    // Gizmos (Gravity: Red, Bounce: Green, Friction: Blue) -> refined colors and sizes
    this.gravityGizmo = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(-15, 10, -15),
      5,
      0xff3366,
      2,
      1.5,
    );
    this.scene.add(this.gravityGizmo);
    this.bounceGizmo = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(-12, CONFIG.FLOOR_Y, -15),
      5,
      0x33cc66,
      2,
      1.5,
    );
    this.scene.add(this.bounceGizmo);
    this.frictionGizmo = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-12, CONFIG.FLOOR_Y + 0.5, -15),
      5,
      0x3399ff,
      2,
      1.5,
    );
    this.scene.add(this.frictionGizmo);

    // Highlight and Preview Box
    const boxGeo = new THREE.BoxGeometry(
      CONFIG.VOXEL_SIZE,
      CONFIG.VOXEL_SIZE,
      CONFIG.VOXEL_SIZE,
    );

    // Highlight Box (Outline)
    const edges = new THREE.EdgesGeometry(boxGeo);
    this.highlightBox = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 2,
        transparent: true,
        opacity: 0.8,
      }),
    ) as unknown as THREE.Mesh; // cast for typing
    this.highlightBox.visible = false;
    this.scene.add(this.highlightBox);

    // Add Preview Voxel
    this.previewVoxel = new THREE.Mesh(
      boxGeo,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
      }),
    );
    this.previewVoxel.visible = false;
    this.scene.add(this.previewVoxel);

    // Add Preview Sphere
    this.previewSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        wireframe: true,
      }),
    );
    this.previewSphere.visible = false;
    this.scene.add(this.previewSphere);

    // Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.dirLight.position.set(50, 80, 30);
    this.scene.add(this.dirLight);

    // Floor
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 1,
    });
    this.floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      planeMat,
    );
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.y = CONFIG.FLOOR_Y;
    this.scene.add(this.floorMesh);

    this.animate = this.animate.bind(this);
    this.animate();

    // Interaction listener
    this.renderer.domElement.addEventListener(
      "pointerdown",
      this.onPointerDown.bind(this),
    );
    this.renderer.domElement.addEventListener(
      "pointermove",
      this.onPointerMove.bind(this),
    );
  }

  private gridSnapping: boolean = true;

  public toggleGridSnapping() {
    this.gridSnapping = !this.gridSnapping;
  }

  public resetCamera() {
    this.camera.position.set(30, 30, 60);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  public zoomToFit() {
    if (this.voxels.length === 0) return;
    const box = new THREE.Box3();
    this.voxels.forEach((v) => {
      box.expandByPoint(new THREE.Vector3(v.x, v.y, v.z));
    });
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const dist = Math.abs(maxDim / Math.sin(fov / 2));

    this.controls.target.copy(center);
    this.camera.position
      .copy(center)
      .add(new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(dist));
    this.controls.update();
  }

  public toggleCameraProjection() {
    const position = this.camera.position.clone();
    const target = this.controls.target.clone();

    if (!this.isOrthographic) {
      const aspect = window.innerWidth / window.innerHeight;
      const dist = position.distanceTo(target);
      const frustumSize =
        dist *
        Math.tan(
          (((this.camera as THREE.PerspectiveCamera).fov / 2) * Math.PI) / 180,
        ) *
        2;

      this.camera = new THREE.OrthographicCamera(
        (frustumSize * aspect) / -2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        1000,
      );
    } else {
      this.camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
      );
    }

    this.isOrthographic = !this.isOrthographic;
    this.camera.position.copy(position);
    this.camera.lookAt(target);

    // Update controls with new camera
    const damping = this.controls.enableDamping;
    const rotate = this.controls.autoRotate;
    this.controls.dispose();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = damping;
    this.controls.autoRotate = rotate;
    this.controls.target.copy(target);
    this.controls.update();
  }

  private onPointerMove(event: PointerEvent) {
    if (this.state !== AppState.STABLE) {
      this.highlightBox.visible = false;
      this.previewVoxel.visible = false;
      this.previewSphere.visible = false;
      return;
    }

    // Update color for preview
    (this.previewVoxel.material as THREE.MeshBasicMaterial).color.setHex(
      this.currentColor,
    );

    // Adjust previewSphere scale and color
    const isSphereActive =
      this.brushSize > 1 || this.currentTool === BrushTool.SCULPT;
    if (isSphereActive) {
      const radius =
        this.currentTool === BrushTool.SCULPT
          ? this.sculptSettings.size
          : this.brushSize;
      this.previewSphere.scale.set(radius, radius, radius);
      let sphereColor =
        this.currentTool === BrushTool.REMOVE
          ? 0xff0000
          : this.currentTool === BrushTool.PAINT
            ? 0xffff00
            : this.currentColor;
      (this.previewSphere.material as THREE.MeshBasicMaterial).color.setHex(
        sphereColor,
      );
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshArray = Array.from(this.meshGroups.values());
    const instIntersects = this.raycaster.intersectObjects(meshArray);

    if (instIntersects.length > 0) {
      const intersect = instIntersects[0];
      const instanceId = intersect.instanceId;
      if (instanceId === undefined) return;

      const mesh = intersect.object as THREE.InstancedMesh;
      const matrix = new THREE.Matrix4();
      mesh.getMatrixAt(instanceId, matrix);
      const pos = new THREE.Vector3().setFromMatrixPosition(matrix);

      const materialTypeStr = Array.from(this.meshGroups.entries()).find(
        ([k, v]) => v === mesh,
      )?.[0];
      if (this.onHoverChange) {
        this.onHoverChange(
          materialTypeStr
            ? {
                x: Math.round(pos.x),
                y: Math.round(pos.y),
                z: Math.round(pos.z),
                material: materialTypeStr,
              }
            : null,
        );
      }

      if (this.currentTool === BrushTool.ADD && intersect.face) {
        const normal = intersect.face.normal.clone();
        normal.transformDirection(mesh.matrixWorld);
        const newPos = pos.clone().add(normal);

        if (!this.gridSnapping) {
          newPos.copy(pos.clone().add(normal.multiplyScalar(0.5)));
        }

        if (isSphereActive) {
          this.previewSphere.visible = true;
          this.previewSphere.position.copy(pos);
          this.highlightBox.visible = false;
          this.previewVoxel.visible = false;
        } else {
          this.previewSphere.visible = false;
          this.highlightBox.visible = true;
          this.highlightBox.position.copy(pos);
          this.previewVoxel.visible = true;
          this.previewVoxel.position.copy(newPos);
        }
      } else if (
        this.currentTool === BrushTool.REMOVE ||
        this.currentTool === BrushTool.PAINT ||
        this.currentTool === BrushTool.SCULPT
      ) {
        if (isSphereActive) {
          this.previewSphere.visible = true;
          this.previewSphere.position.copy(pos);
          this.highlightBox.visible = false;
          this.previewVoxel.visible = false;
        } else {
          this.previewSphere.visible = false;
          this.highlightBox.visible = true;
          this.highlightBox.position.copy(pos);
          this.previewVoxel.visible = false;
          // Match Outline color to tool (Red for remove, Yellow for paint)
          (this.highlightBox.material as THREE.LineBasicMaterial).color.setHex(
            this.currentTool === BrushTool.REMOVE ? 0xff0000 : 0xffff00,
          );
        }
      } else {
        this.highlightBox.visible = false;
        this.previewVoxel.visible = false;
        this.previewSphere.visible = false;
      }
    } else {
      if (this.onHoverChange) {
        this.onHoverChange(null);
      }
      this.highlightBox.visible = false;

      // Handle floor intersection
      if (
        this.currentTool === BrushTool.ADD ||
        this.currentTool === BrushTool.SCULPT
      ) {
        const intersectsPlane = this.raycaster.intersectObject(
          this.scene.children.find(
            (c) =>
              c.type === "Mesh" &&
              (c as THREE.Mesh).geometry.type === "PlaneGeometry",
          )!,
        );
        if (intersectsPlane.length > 0) {
          const pt = intersectsPlane[0].point;
          const x = this.gridSnapping ? Math.round(pt.x) : pt.x;
          const z = this.gridSnapping ? Math.round(pt.z) : pt.z;
          const y = this.gridSnapping ? Math.round(pt.y) + 0.5 : pt.y + 0.5;

          if (isSphereActive) {
            this.previewSphere.visible = true;
            this.previewSphere.position.set(x, y, z);
            this.previewVoxel.visible = false;
          } else {
            this.previewSphere.visible = false;
            this.previewVoxel.visible = true;
            this.previewVoxel.position.set(x, y, z);
          }
        } else {
          this.previewVoxel.visible = false;
          this.previewSphere.visible = false;
        }
      } else {
        this.previewVoxel.visible = false;
        this.previewSphere.visible = false;
      }
    }
  }
  private fireProjectile(event: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const geom = new THREE.SphereGeometry(1.5, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.4,
      metalness: 0.8,
    });
    const mesh = new THREE.Mesh(geom, mat);

    // Spawn a bit ahead of camera
    mesh.position
      .copy(this.camera.position)
      .add(this.raycaster.ray.direction.clone().multiplyScalar(5));
    this.scene.add(mesh);

    const velocity = this.raycaster.ray.direction.clone().multiplyScalar(4.0); // Speed

    this.projectiles.push({ mesh, velocity, mass: 20 });
    // sound: shoot (removed)
  }

  private onPointerDown(event: PointerEvent) {
    if (this.state !== AppState.STABLE) {
      if (this.state === AppState.DISMANTLING && event.button === 0) {
        this.fireProjectile(event);
      }
      return;
    }
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

      const voxelIndex = this.voxels.findIndex(
        (v) =>
          Math.abs(v.x - pos.x) < 0.1 &&
          Math.abs(v.y - pos.y) < 0.1 &&
          Math.abs(v.z - pos.z) < 0.1,
      );

      if (voxelIndex === -1) return;

      if (this.currentTool === BrushTool.REMOVE) {
        // Remove voxel
        this.voxels.splice(voxelIndex, 1);
        this.createVoxels(this.getData()); // Recreate meshes
        this.onInteraction("Removed Voxel");
        // sound: remove (removed)
      } else if (this.currentTool === BrushTool.PAINT) {
        // Paint voxel
        this.voxels[voxelIndex].color = new THREE.Color(this.currentColor);
        this.voxels[voxelIndex].material = this.currentMaterial;
        this.createVoxels(this.getData());
        this.onInteraction("Painted Voxel");
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
            id:
              this.voxels.length > 0
                ? Math.max(...this.voxels.map((v) => v.id)) + 1
                : 0,
            x: newPos.x,
            y: newPos.y,
            z: newPos.z,
            color: new THREE.Color(this.currentColor),
            material: this.currentMaterial,
            vx: 0,
            vy: 0,
            vz: 0,
            rx: 0,
            ry: 0,
            rz: 0,
            rvx: 0,
            rvy: 0,
            rvz: 0,
          });

          this.createVoxels(this.getData());
          this.onInteraction("Added Voxel");
          // sound: place (removed)
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
          this.voxels.forEach((v) => {
            const dist = Math.sqrt(
              (v.x - targetPos.x) ** 2 +
                (v.y - targetPos.y) ** 2 +
                (v.z - targetPos.z) ** 2,
            );
            if (dist < radius) {
              const falloff = Math.pow(1 - dist / radius, 2);
              v.x += normal.x * sculptStrength * direction * falloff;
              v.y += normal.y * sculptStrength * direction * falloff;
              v.z += normal.z * sculptStrength * direction * falloff;
            }
          });

          this.createVoxels(this.getData());
          this.onInteraction("Sculpted Region");
        }
      }
    } else {
      // If clicked on plane and tool is ADD
      if (this.currentTool === BrushTool.ADD) {
        if (this.voxels.length >= this.MAX_VOXELS) return;
        const intersectsPlane = this.raycaster.intersectObject(
          this.scene.children.find((c) => c.type === "Mesh")!,
        ); // Floor
        if (intersectsPlane.length > 0) {
          const intersect = intersectsPlane[0];
          const pt = intersect.point;
          // Snap to grid
          const x = this.gridSnapping ? Math.round(pt.x) : pt.x;
          const z = this.gridSnapping ? Math.round(pt.z) : pt.z;
          const y = this.gridSnapping ? Math.round(pt.y) + 0.5 : pt.y + 0.5;

          this.voxels.push({
            id:
              this.voxels.length > 0
                ? Math.max(...this.voxels.map((v) => v.id)) + 1
                : 0,
            x: x,
            y: y,
            z: z,
            color: new THREE.Color(this.currentColor),
            material: this.currentMaterial,
            vx: 0,
            vy: 0,
            vz: 0,
            rx: 0,
            ry: 0,
            rz: 0,
            rvx: 0,
            rvy: 0,
            rvz: 0,
          });
          this.createVoxels(this.getData());
          this.onInteraction("Added Floor Voxel");
          // sound: place (removed)
        }
      }
    }
  }

  public getData(): VoxelData[] {
    return this.voxels.map((v) => ({
      x: v.x,
      y: v.y,
      z: v.z,
      color: v.color.getHex(),
      material: v.material,
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
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    this.meshGroups.clear();

    this.voxels = data.map((v, i) => {
      const c = new THREE.Color(v.color);
      // Slight color variation for realism
      c.offsetHSL(0, 0, Math.random() * 0.1 - 0.05);
      return {
        id: i,
        x: v.x,
        y: v.y,
        z: v.z,
        color: c,
        material: v.material || MaterialType.SOLID,
        vx: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        rvx: 0,
        rvy: 0,
        rvz: 0,
      };
    });

    // Group by material
    const groups: Map<MaterialType, SimulationVoxel[]> = new Map();
    this.voxels.forEach((v) => {
      if (!groups.has(v.material)) groups.set(v.material, []);
      groups.get(v.material)!.push(v);
    });

    const geometry = new THREE.BoxGeometry(
      CONFIG.VOXEL_SIZE - 0.05,
      CONFIG.VOXEL_SIZE - 0.05,
      CONFIG.VOXEL_SIZE - 0.05,
    );

    groups.forEach((voxels, materialType) => {
      let material: THREE.Material;
      const config =
        this.materialConfig[materialType] ||
        this.materialConfig[MaterialType.SOLID];

      switch (materialType) {
        case MaterialType.GLASS:
        case MaterialType.PLASTIC:
        case MaterialType.FABRIC:
          material = new THREE.MeshPhysicalMaterial({
            ...config,
            side: THREE.DoubleSide,
          });
          break;
        default:
          material = new THREE.MeshStandardMaterial(config);
      }

      const mesh = new THREE.InstancedMesh(geometry, material, voxels.length);

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
      [MaterialType.WOOD]: 0,
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

    this.meshGroups.forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }

  public dismantle() {
    if (this.state !== AppState.STABLE) return;
    this.state = AppState.DISMANTLING;
    this.onStateChange(this.state);

    this.voxels.forEach((v) => {
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
    // Redmean perceptual formula for color distance
    const rmean = (c1.r * 255 + c2.r * 255) / 2;
    const r = c1.r * 255 - c2.r * 255;
    const g = c1.g * 255 - c2.g * 255;
    const b = c1.b * 255 - c2.b * 255;
    return Math.sqrt(
      ((512 + rmean) * r * r) / 256 + 4 * g * g + ((767 - rmean) * b * b) / 256,
    );
  }

  public rebuild(targetModel: VoxelData[]) {
    if (this.state === AppState.REBUILDING) return;

    const available = this.voxels.map((v, i) => ({
      index: i,
      color: v.color,
      taken: false,
    }));
    const mappings: RebuildTarget[] = new Array(this.voxels.length).fill(null);
    const unmatchedTargets: VoxelData[] = [];

    // Phase 1: Prioritize exact color matches
    targetModel.forEach((target) => {
      let exactMatchIdx = -1;
      const targetColorObj = new THREE.Color(target.color);
      for (let i = 0; i < available.length; i++) {
        if (!available[i].taken && available[i].color.equals(targetColorObj)) {
          exactMatchIdx = i;
          break;
        }
      }

      if (exactMatchIdx !== -1) {
        available[exactMatchIdx].taken = true;
        const h = Math.max(0, (target.y - CONFIG.FLOOR_Y) / 15);
        mappings[available[exactMatchIdx].index] = {
          x: target.x,
          y: target.y,
          z: target.z,
          delay: h * 800,
          colorTransitionDelay: -1,
        };
      } else {
        unmatchedTargets.push(target);
      }
    });

    // Phase 2: Sophisticated fallback using perceptual distance formula
    unmatchedTargets.forEach((target) => {
      let bestDist = Infinity;
      let bestIdx = -1;

      for (let i = 0; i < available.length; i++) {
        if (available[i].taken) continue;
        // Sophisticated color distance
        const d = this.getColorDist(available[i].color, target.color);

        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }

      if (bestIdx !== -1) {
        available[bestIdx].taken = true;
        const h = Math.max(0, (target.y - CONFIG.FLOOR_Y) / 15);
        mappings[available[bestIdx].index] = {
          x: target.x,
          y: target.y,
          z: target.z,
          delay: h * 800,
          colorTransitionDelay: h * 800 + 400, // Trigger color transition midway
          targetColor: target.color,
        };
      }
    });

    // Leftover voxels become rubble
    for (let i = 0; i < this.voxels.length; i++) {
      if (!mappings[i]) {
        mappings[i] = {
          x: this.voxels[i].x,
          y: this.voxels[i].y,
          z: this.voxels[i].z,
          isRubble: true,
          delay: 0,
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
    const showGizmos =
      this.state === AppState.DISMANTLING || this.physicsGizmosVisible;
    this.gravityGizmo.visible = showGizmos;
    this.bounceGizmo.visible = showGizmos;
    this.frictionGizmo.visible = showGizmos;

    if (showGizmos) {
      this.gravityGizmo.setLength(
        Math.max(0.1, Math.abs(this.physicsConfig.gravity) * 0.4),
        2,
        1.5,
      );
      this.bounceGizmo.setLength(
        Math.max(0.1, this.physicsConfig.bounce * 6),
        2,
        1.5,
      );
      this.frictionGizmo.setLength(
        Math.max(0.1, this.physicsConfig.friction * 6),
        2,
        1.5,
      );
    }

    if (this.state === AppState.DISMANTLING) {
      // Projectile physics
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.mesh.position.add(p.velocity);
        p.velocity.y += this.physicsConfig.gravity * 0.01;

        // Floor bounce
        if (p.mesh.position.y < CONFIG.FLOOR_Y + 1.5) {
          p.mesh.position.y = CONFIG.FLOOR_Y + 1.5;
          p.velocity.y *= -0.5;
          p.velocity.x *= 0.8;
          p.velocity.z *= 0.8;
          if (p.velocity.lengthSq() < 0.1) {
            this.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            (p.mesh.material as THREE.Material).dispose();
            this.projectiles.splice(i, 1);
            continue;
          }
        }

        // Voxel collisions
        this.voxels.forEach((v) => {
          const distSq =
            (v.x - p.mesh.position.x) ** 2 +
            (v.y - p.mesh.position.y) ** 2 +
            (v.z - p.mesh.position.z) ** 2;
          if (distSq < 4.0) {
            // Collision Radius ~ 2.0
            // Apply force
            const forceDir = new THREE.Vector3(
              v.x - p.mesh.position.x,
              v.y - p.mesh.position.y,
              v.z - p.mesh.position.z,
            ).normalize();
            const forceMag = (p.velocity.length() * p.mass) / 2; // Transfer some momentum
            v.vx += forceDir.x * forceMag;
            v.vy += forceDir.y * forceMag;
            v.vz += forceDir.z * forceMag;
            v.rvx = (Math.random() - 0.5) * forceMag;
            v.rvy = (Math.random() - 0.5) * forceMag;
            v.rvz = (Math.random() - 0.5) * forceMag;

            // Slow down projectile
            p.velocity.multiplyScalar(0.9);

            // sound: crash (removed)
          }
        });
      }

      // Voxel-to-voxel collisions
      const numVoxels = this.voxels.length;
      const voxelRad = (CONFIG.VOXEL_SIZE / 2) * 0.9; // slight reduction for stability
      const collisionDistSq = (voxelRad * 2) ** 2;
      for (let i = 0; i < numVoxels; i++) {
        const v1 = this.voxels[i];
        // Only run collisions if they are reasonably close to the floor or moving, to save perf
        if (v1.y > CONFIG.FLOOR_Y + 10 && Math.abs(v1.vy) < 0.1) continue;
        for (let j = i + 1; j < numVoxels; j++) {
          const v2 = this.voxels[j];
          const dx = v2.x - v1.x;
          const dy = v2.y - v1.y;
          const dz = v2.z - v1.z;
          // Quick bounding box check first
          if (
            Math.abs(dx) > voxelRad * 2 ||
            Math.abs(dy) > voxelRad * 2 ||
            Math.abs(dz) > voxelRad * 2
          )
            continue;

          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < collisionDistSq && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;
            const nz = dz / dist;

            // Separate them
            const overlap = voxelRad * 2 - dist;
            const sepPx = nx * overlap * 0.5;
            const sepPy = ny * overlap * 0.5;
            const sepPz = nz * overlap * 0.5;

            v1.x -= sepPx;
            v1.y -= sepPy;
            v1.z -= sepPz;
            v2.x += sepPx;
            v2.y += sepPy;
            v2.z += sepPz;

            // Velocity reflection (simple elastic collision)
            const rvx = v2.vx - v1.vx;
            const rvy = v2.vy - v1.vy;
            const rvz = v2.vz - v1.vz;

            const velAlongNormal = rvx * nx + rvy * ny + rvz * nz;
            if (velAlongNormal > 0) continue; // Moving apart

            const e = this.physicsConfig.bounce * 0.5; // less bouncy for voxels
            const jForce = -(1 + e) * velAlongNormal;
            const impulseMag = jForce / 2;

            const ix = nx * impulseMag;
            const iy = ny * impulseMag;
            const iz = nz * impulseMag;

            v1.vx -= ix;
            v1.vy -= iy;
            v1.vz -= iz;
            v2.vx += ix;
            v2.vy += iy;
            v2.vz += iz;
          }
        }
      }

      this.voxels.forEach((v) => {
        v.vy += this.physicsConfig.gravity * 0.01; // Gravity
        v.x += v.vx;
        v.y += v.vy;
        v.z += v.vz;
        v.rx += v.rvx;
        v.ry += v.rvy;
        v.rz += v.rvz;

        // Floor bounce
        if (v.y < CONFIG.FLOOR_Y + 0.5) {
          if (v.vy < -0.2) {
            // sound: crash (removed)
          }
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
        v.x +=
          (t.x - v.x) * Math.min(speed + (elapsed - t.delay) * 0.0001, 0.4);
        v.y +=
          (t.y - v.y) * Math.min(speed + (elapsed - t.delay) * 0.0001, 0.4);
        v.z +=
          (t.z - v.z) * Math.min(speed + (elapsed - t.delay) * 0.0001, 0.4);
        // Rotate back to zero faster
        v.rx += (0 - v.rx) * 0.2;
        v.ry += (0 - v.ry) * 0.2;
        v.rz += (0 - v.rz) * 0.2;

        if (
          t.colorTransitionDelay !== undefined &&
          elapsed > t.colorTransitionDelay &&
          t.targetColor !== undefined
        ) {
          const targetColor = new THREE.Color(t.targetColor);
          v.color.lerp(targetColor, 0.15);
        }

        // Check if reached
        const posDistSq =
          (t.x - v.x) ** 2 + (t.y - v.y) ** 2 + (t.z - v.z) ** 2;
        const colorDistSq =
          t.targetColor !== undefined
            ? (v.color.r - new THREE.Color(t.targetColor).r) ** 2 +
              (v.color.g - new THREE.Color(t.targetColor).g) ** 2 +
              (v.color.b - new THREE.Color(t.targetColor).b) ** 2
            : 0;

        if (posDistSq > 0.01 || colorDistSq > 0.001) {
          allDone = false;
        } else {
          // Snap to grid
          v.x = t.x;
          v.y = t.y;
          v.z = t.z;
          v.rx = 0;
          v.ry = 0;
          v.rz = 0;
          if (t.targetColor !== undefined) v.color.setHex(t.targetColor);
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
    this.stats.update();
    this.controls.update();

    // audio listener updates removed (silent)

    this.updatePhysics();

    // Optimize: only draw if moving
    if (this.state !== AppState.STABLE || this.controls.autoRotate) {
      this.draw();
    }

    this.renderer.render(this.scene, this.camera);
  }

  public handleResize() {
    if (this.camera && this.renderer) {
      const aspect = window.innerWidth / window.innerHeight;
      if (this.camera instanceof THREE.PerspectiveCamera) {
        this.camera.aspect = aspect;
      } else if (this.camera instanceof THREE.OrthographicCamera) {
        const frustumSize = this.camera.top - this.camera.bottom;
        this.camera.left = (-frustumSize * aspect) / 2;
        this.camera.right = (frustumSize * aspect) / 2;
      }
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
      c: "#" + v.color.getHexString(),
      m: v.material,
    }));
    return JSON.stringify(data, null, 2);
  }

  public getUniqueColors(): string[] {
    const colors = new Set<string>();
    this.voxels.forEach((v) => {
      colors.add("#" + v.color.getHexString());
    });
    return Array.from(colors);
  }

  public setEnvironment(env: "day" | "night" | "sunset") {
    switch (env) {
      case "day":
        this.scene.background = new THREE.Color(0xf1f5f9);
        this.scene.fog = new THREE.Fog(0xf1f5f9, 50, 150);
        this.ambientLight.color.setHex(0xffffff);
        this.ambientLight.intensity = 0.7;
        this.dirLight.color.setHex(0xffffff);
        this.dirLight.intensity = 1.5;
        this.dirLight.position.set(50, 80, 30);
        (this.floorMesh.material as THREE.MeshStandardMaterial).color.setHex(
          0xe2e8f0,
        );
        break;
      case "night":
        this.scene.background = new THREE.Color(0x0f172a);
        this.scene.fog = new THREE.Fog(0x0f172a, 30, 100);
        this.ambientLight.color.setHex(0x1e293b);
        this.ambientLight.intensity = 0.4;
        this.dirLight.color.setHex(0x2d3748);
        this.dirLight.intensity = 0.8;
        this.dirLight.position.set(-50, 40, -30);
        (this.floorMesh.material as THREE.MeshStandardMaterial).color.setHex(
          0x1e293b,
        );
        break;
      case "sunset":
        this.scene.background = new THREE.Color(0xffedd5);
        this.scene.fog = new THREE.Fog(0xffedd5, 40, 120);
        this.ambientLight.color.setHex(0xffedd5);
        this.ambientLight.intensity = 0.6;
        this.dirLight.color.setHex(0xf97316);
        this.dirLight.intensity = 1.6;
        this.dirLight.position.set(100, 20, 50); // Low angle
        (this.floorMesh.material as THREE.MeshStandardMaterial).color.setHex(
          0xffedd5,
        );
        break;
    }
  }

  public exportGLTF() {
    const exportScene = new THREE.Scene();
    const geom = new THREE.BoxGeometry(
      CONFIG.VOXEL_SIZE,
      CONFIG.VOXEL_SIZE,
      CONFIG.VOXEL_SIZE,
    );

    this.voxels.forEach((v) => {
      const mat = new THREE.MeshStandardMaterial({
        color: v.color,
        roughness: this.materialConfig[v.material]?.roughness ?? 0.8,
        metalness: this.materialConfig[v.material]?.metalness ?? 0.1,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(v.x, v.y, v.z);
      mesh.rotation.set(v.rx, v.ry, v.rz);
      exportScene.add(mesh);
    });

    const exporter = new GLTFExporter();
    exporter.parse(
      exportScene,
      (gltf) => {
        const output = JSON.stringify(gltf, null, 2);
        const blob = new Blob([output], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.style.display = "none";
        link.href = url;
        link.download = "voxel-model.gltf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      (error) => {
        console.error("An error happened during GLTF export:", error);
      },
      { binary: false },
    );
  }

  public exportVOX() {
    // MagicaVoxel VOX file format (simple .vox)
    // Minimal VOX format: header + main chunk with voxels
    const voxels = this.voxels;

    // Build VOX data
    let voxelData = new Uint8Array(4 * voxels.length); // 4 bytes per voxel (x, y, z, colorIndex)
    let colorData = new Map<number, number>();
    let colorIndex = 1;

    voxels.forEach((v, idx) => {
      const hexColor = v.color.getHexString().toUpperCase();
      if (!colorData.has(v.color.getHex())) {
        colorData.set(v.color.getHex(), colorIndex);
        colorIndex++;
      }
      const paletteIndex = colorData.get(v.color.getHex()) || 1;

      // Clamp to VOX range (0-255)
      voxelData[idx * 4] = Math.min(255, Math.max(0, Math.round(v.x + 128)));
      voxelData[idx * 4 + 1] = Math.min(255, Math.max(0, Math.round(v.y)));
      voxelData[idx * 4 + 2] = Math.min(
        255,
        Math.max(0, Math.round(v.z + 128)),
      );
      voxelData[idx * 4 + 3] = paletteIndex;
    });

    // Minimal VOX format (binary)
    // VOX 150 header + SIZE chunk + XYZI chunk
    const header = new TextEncoder().encode("VOX ");
    const version = new Uint8Array(4);
    version[0] = 150;

    // Main chunk
    const mainData = new Uint8Array(voxelData.length + 28); // SIZE (12) + XYZI (12) + data
    let offset = 0;

    // SIZE chunk: 3 uint32 for dimensions
    const sizeName = new TextEncoder().encode("SIZE");
    const sizePayload = new Uint8Array(12);
    const sizeView = new DataView(sizePayload.buffer);
    sizeView.setUint32(0, 256, true);
    sizeView.setUint32(4, 256, true);
    sizeView.setUint32(8, 256, true);

    // XYZI chunk: count + voxels
    const xyzaName = new TextEncoder().encode("XYZI");
    const xyzaPayload = new Uint8Array(4 + voxelData.length);
    const xyzaView = new DataView(xyzaPayload.buffer);
    xyzaView.setUint32(0, voxels.length, true);
    xyzaPayload.set(voxelData, 4);

    // Create simple JSON-based .vox-like format for easier handling
    const voxFormat = {
      version: 150,
      models: [
        {
          size: { x: 256, y: 256, z: 256 },
          voxels: voxels.map((v) => ({
            x: Math.min(255, Math.max(0, Math.round(v.x + 128))),
            y: Math.min(255, Math.max(0, Math.round(v.y))),
            z: Math.min(255, Math.max(0, Math.round(v.z + 128))),
            color: v.color.getHex(),
          })),
        },
      ],
    };

    const output = JSON.stringify(voxFormat, null, 2);
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.download = "voxel-model.vox";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public exportSTL() {
    // STL (Stereolithography) format for 3D printing
    // Binary STL format
    const voxels = this.voxels;
    const verticesData: number[] = [];
    const facesData: number[] = [];

    // Generate mesh for each voxel (cube)
    voxels.forEach((v) => {
      const x = v.x;
      const y = v.y;
      const z = v.z;
      const size = 0.5; // Half-size for voxel

      // Define 8 vertices of a cube
      const vertices = [
        [x - size, y - size, z - size],
        [x + size, y - size, z - size],
        [x + size, y + size, z - size],
        [x - size, y + size, z - size],
        [x - size, y - size, z + size],
        [x + size, y - size, z + size],
        [x + size, y + size, z + size],
        [x - size, y + size, z + size],
      ];

      // Add vertices
      const vertexIndices = verticesData.length / 3;
      vertices.forEach((vertex) => {
        verticesData.push(...vertex);
      });

      // Define 12 triangles (2 per face, 6 faces)
      const faces = [
        [0, 1, 2],
        [0, 2, 3], // front
        [4, 6, 5],
        [4, 7, 6], // back
        [0, 4, 5],
        [0, 5, 1], // bottom
        [2, 6, 7],
        [2, 7, 3], // top
        [0, 3, 7],
        [0, 7, 4], // left
        [1, 5, 6],
        [1, 6, 2], // right
      ];

      faces.forEach((face) => {
        facesData.push(
          vertexIndices + face[0],
          vertexIndices + face[1],
          vertexIndices + face[2],
        );
      });
    });

    // Generate STL binary data
    const triangles = facesData.length / 3;
    const arrayBuffer = new ArrayBuffer(80 + 4 + triangles * 50); // header + triangle count + triangles
    const view = new DataView(arrayBuffer);

    // Header (80 bytes)
    const headerStr = "VoxelModelSTL" + " ".repeat(67);
    new TextEncoder().encodeInto(headerStr, new Uint8Array(arrayBuffer, 0, 80));

    // Triangle count
    view.setUint32(80, triangles, true);

    // Write triangles
    let offset = 84;
    for (let i = 0; i < triangles; i++) {
      const v0Idx = facesData[i * 3] * 3;
      const v1Idx = facesData[i * 3 + 1] * 3;
      const v2Idx = facesData[i * 3 + 2] * 3;

      const v0 = [
        verticesData[v0Idx],
        verticesData[v0Idx + 1],
        verticesData[v0Idx + 2],
      ];
      const v1 = [
        verticesData[v1Idx],
        verticesData[v1Idx + 1],
        verticesData[v1Idx + 2],
      ];
      const v2 = [
        verticesData[v2Idx],
        verticesData[v2Idx + 1],
        verticesData[v2Idx + 2],
      ];

      // Calculate normal
      const e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
      const e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
      const normal = [
        e1[1] * e2[2] - e1[2] * e2[1],
        e1[2] * e2[0] - e1[0] * e2[2],
        e1[0] * e2[1] - e1[1] * e2[0],
      ];

      const length = Math.sqrt(
        normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2],
      );
      const normalizedNormal = [
        normal[0] / length,
        normal[1] / length,
        normal[2] / length,
      ];

      // Write normal
      view.setFloat32(offset, normalizedNormal[0], true);
      offset += 4;
      view.setFloat32(offset, normalizedNormal[1], true);
      offset += 4;
      view.setFloat32(offset, normalizedNormal[2], true);
      offset += 4;

      // Write vertices
      [v0, v1, v2].forEach((v) => {
        view.setFloat32(offset, v[0], true);
        offset += 4;
        view.setFloat32(offset, v[1], true);
        offset += 4;
        view.setFloat32(offset, v[2], true);
        offset += 4;
      });

      // Attribute byte count
      view.setUint16(offset, 0, true);
      offset += 2;
    }

    const blob = new Blob([arrayBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.download = "voxel-model.stl";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public cleanup() {
    cancelAnimationFrame(this.animationId);
    if (this.stats && this.stats.dom && this.stats.dom.parentNode) {
      this.stats.dom.parentNode.removeChild(this.stats.dom);
    }
    this.renderer.domElement.removeEventListener(
      "pointerdown",
      this.onPointerDown.bind(this),
    );
    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }
}
