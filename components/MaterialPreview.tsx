import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MaterialType, MaterialConfigMap } from '../types';

interface MaterialPreviewProps {
  color: string;
  materialType: MaterialType;
  materialConfig: MaterialConfigMap;
}

export const MaterialPreview: React.FC<MaterialPreviewProps> = ({ color, materialType, materialConfig }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(80, 80);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4;
    cameraRef.current = camera;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(2, 5, 3);
    scene.add(dirLight);

    const geometry = new THREE.SphereGeometry(1.2, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.01;
        meshRef.current.rotation.x += 0.005;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  // Update material and color on change
  useEffect(() => {
    if (!meshRef.current) return;
    
    // Dispose old material
    if (Array.isArray(meshRef.current.material)) {
        meshRef.current.material.forEach(m => m.dispose());
    } else {
        meshRef.current.material.dispose();
    }

    const config = materialConfig[materialType] || materialConfig[MaterialType.SOLID];
    let newMaterial: THREE.Material;

    switch (materialType) {
        case MaterialType.GLASS:
        case MaterialType.PLASTIC:
        case MaterialType.FABRIC:
            newMaterial = new THREE.MeshPhysicalMaterial({ ...config, color, side: THREE.DoubleSide });
            break;
        default:
            newMaterial = new THREE.MeshStandardMaterial({ ...config, color });
    }

    meshRef.current.material = newMaterial;
  }, [color, materialType, materialConfig]);

  return (
    <div 
        ref={containerRef} 
        className="w-20 h-20 bg-slate-100 rounded-full border-4 border-slate-200 shadow-inner overflow-hidden" 
        title="Material Preview"
    />
  );
};
