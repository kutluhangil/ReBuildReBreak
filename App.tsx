/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useEffect, useRef, useState } from 'react';
import { VoxelEngine } from './services/VoxelEngine';
import { UIOverlay } from './components/UIOverlay';
import { JsonModal } from './components/JsonModal';
import { PromptModal } from './components/PromptModal';
import { BuildEditModal } from './components/BuildEditModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Generators } from './utils/voxelGenerators';
import { AppState, VoxelData, SavedModel, HistoryState, BrushTool, MaterialType } from './types';
import { GoogleGenAI, Type } from "@google/genai";

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VoxelEngine | null>(null);
  
  const [appState, setAppState] = useState<AppState>(AppState.STABLE);
  const [voxelCount, setVoxelCount] = useState<number>(0);
  
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonModalMode, setJsonModalMode] = useState<'view' | 'import'>('view');
  
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptMode, setPromptMode] = useState<'create' | 'morph'>('create');
  
  const [showWelcome, setShowWelcome] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [jsonData, setJsonData] = useState('');
  const [isAutoRotate, setIsAutoRotate] = useState(true);

  // --- State for Custom Models ---
  const [currentBaseModel, setCurrentBaseModel] = useState<string>('Eagle');
  const [customBuilds, setCustomBuilds] = useState<SavedModel[]>([]);
  const [customRebuilds, setCustomRebuilds] = useState<SavedModel[]>([]);
  
  // --- State for Brush/Materials ---
  const [currentTool, setCurrentTool] = useState<BrushTool>(BrushTool.ADD);
  const [currentColor, setCurrentColor] = useState<string>('#FF3366');
  const [currentMaterial, setCurrentMaterial] = useState<MaterialType>(MaterialType.SOLID);
  const [gridSnapping, setGridSnapping] = useState<boolean>(true);
  
  // --- State for Sculpting ---
  const [sculptSettings, setSculptSettings] = useState({ size: 1.5, strength: 0.2 });

  // --- State for Material Config ---
  const [materialConfig, setMaterialConfig] = useState({
      [MaterialType.GLASS]: { roughness: 0.1, metalness: 0.1, transmission: 0.9, thickness: 0.5, transparent: true, opacity: 1.0 },
      [MaterialType.METAL]: { roughness: 0.2, metalness: 0.9 },
      [MaterialType.WOOD]: { roughness: 0.9, metalness: 0.0 },
      [MaterialType.STONE]: { roughness: 1.0, metalness: 0.0 },
      [MaterialType.PLASTIC]: { roughness: 0.4, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.1 },
      [MaterialType.FABRIC]: { roughness: 1.0, metalness: 0.0, sheen: 1.0, sheenRoughness: 0.5, sheenColor: '#ffffff' },
      [MaterialType.SOLID]: { roughness: 0.8, metalness: 0.1 }
  });
  
  // --- State for Physics ---
  const [physicsConfig, setPhysicsConfig] = useState({
      gravity: -14.0,
      bounce: 0.6,
      friction: 0.85,
      explosionForce: 1.5
  });
  
  // --- State for History ---
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // --- State for Edit Modal ---
  const [editingBuild, setEditingBuild] = useState<SavedModel | null>(null);

  const handleSaveBuild = (id: string, newName: string, newFolder?: string) => {
      setCustomBuilds(prev => prev.map(b => b.id === id ? { ...b, name: newName, folder: newFolder } : b));
      setCustomRebuilds(prev => prev.map(b => b.id === id ? { ...b, name: newName, folder: newFolder } : b));
  };
  
  const handleDeleteBuild = (id: string) => {
      setCustomBuilds(prev => prev.filter(b => b.id !== id));
      setCustomRebuilds(prev => prev.filter(b => b.id !== id));
      setEditingBuild(null);
  };

  // Load from local storage
  useEffect(() => {
     try {
         const savedBuilds = localStorage.getItem('voxel_architect_builds');
         if (savedBuilds) setCustomBuilds(JSON.parse(savedBuilds));
         const savedRebuilds = localStorage.getItem('voxel_architect_rebuilds');
         if (savedRebuilds) setCustomRebuilds(JSON.parse(savedRebuilds));
     } catch (e) {
         console.error('Failed to load saves', e);
     }
  }, []);

  // Save to local storage
  useEffect(() => {
     localStorage.setItem('voxel_architect_builds', JSON.stringify(customBuilds));
  }, [customBuilds]);

  useEffect(() => {
     localStorage.setItem('voxel_architect_rebuilds', JSON.stringify(customRebuilds));
  }, [customRebuilds]);

  const pushToHistory = (data: VoxelData[]) => {
      // Create new history state, discarding anything after current index if we undo'd
      const newHistory = [...history.slice(0, historyIndex + 1), { voxels: [...data] }];
      // Keep last 20 actions to prevent memory bloat
      if (newHistory.length > 20) {
          newHistory.shift();
      }
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  };

  const initHistory = (data: VoxelData[]) => {
      setHistory([{voxels: [...data]}]);
      setHistoryIndex(0);
  }

  const handleInteraction = () => {
      if (engineRef.current) {
          pushToHistory(engineRef.current.getData());
      }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Engine
    const engine = new VoxelEngine(
      containerRef.current,
      (newState) => setAppState(newState),
      (count) => setVoxelCount(count),
      () => handleInteraction()
    );

    engineRef.current = engine;
    
    // Sync state
    engine.currentTool = currentTool;
    engine.currentColor = parseInt(currentColor.replace('#', ''), 16);
    engine.currentMaterial = currentMaterial;

    // Initial Model Load
    const initialModel = Generators.Eagle();
    engine.loadInitialModel(initialModel);
    initHistory(initialModel);

    // Resize Listener
    const handleResize = () => engine.handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.cleanup();
    };
  }, []);
  
  // Sync changed tools
  useEffect(() => {
      if (engineRef.current) {
          engineRef.current.currentTool = currentTool;
          engineRef.current.currentColor = parseInt(currentColor.replace('#', ''), 16);
          engineRef.current.currentMaterial = currentMaterial;
      }
  }, [currentTool, currentColor, currentMaterial]);

  // Sync Sculpting
  useEffect(() => {
      if (engineRef.current) {
          engineRef.current.sculptSettings = sculptSettings;
      }
  }, [sculptSettings]);

  // Sync Materials
  useEffect(() => {
      if (engineRef.current) {
          engineRef.current.materialConfig = materialConfig;
          // Refresh materials if we want to see it live
          engineRef.current.createVoxels(engineRef.current.getData());
      }
  }, [materialConfig]);

  // Sync grid snapping
  useEffect(() => {
      if (engineRef.current) {
          if ((engineRef.current as any).gridSnapping !== undefined && (engineRef.current as any).gridSnapping !== gridSnapping) {
              engineRef.current.toggleGridSnapping();
          }
      }
  }, [gridSnapping]);

  // Sync physics
  useEffect(() => {
    if (engineRef.current) {
        engineRef.current.physicsConfig = physicsConfig;
    }
  }, [physicsConfig]);

  const handleUndo = () => {
      if (historyIndex > 0 && engineRef.current) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          engineRef.current.loadInitialModel(history[newIndex].voxels);
      }
  }

  const handleRedo = () => {
      if (historyIndex < history.length - 1 && engineRef.current) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          engineRef.current.loadInitialModel(history[newIndex].voxels);
      }
  }

  const handleDismantle = () => {
    engineRef.current?.dismantle();
  };

  const handleNewScene = (type: 'Eagle') => {
    const generator = Generators[type];
    if (generator && engineRef.current) {
      const model = generator();
      engineRef.current.loadInitialModel(model);
      initHistory(model);
      setCurrentBaseModel('Eagle');
    }
  };

  const handleSelectCustomBuild = (model: SavedModel) => {
      if (engineRef.current) {
          engineRef.current.loadInitialModel(model.data);
          initHistory(model.data);
          setCurrentBaseModel(model.name);
      }
  };

  const handleRebuild = (type: 'Eagle' | 'Cat' | 'Rabbit' | 'Twins') => {
    const generator = Generators[type];
    if (generator && engineRef.current) {
      const targetModel = generator();
      engineRef.current.rebuild(targetModel);
      // Let rebuild happen, then push to history when stable? Actually rebuild overrides all.
      // So let's push instantly
      pushToHistory(targetModel);
    }
  };

  const handleSelectCustomRebuild = (model: SavedModel) => {
      if (engineRef.current) {
          engineRef.current.rebuild(model.data);
          pushToHistory(model.data);
      }
  };

  const handleShowJson = () => {
    if (engineRef.current) {
      setJsonData(engineRef.current.getJsonData());
      setJsonModalMode('view');
      setIsJsonModalOpen(true);
    }
  };

  const handleImportClick = () => {
      setJsonModalMode('import');
      setIsJsonModalOpen(true);
  };

  const handleJsonImport = (jsonStr: string) => {
      try {
          const rawData = JSON.parse(jsonStr);
          if (!Array.isArray(rawData)) throw new Error("JSON must be an array");

          const voxelData: VoxelData[] = rawData.map((v: any) => {
              let colorVal = v.c || v.color;
              let colorInt = 0xCCCCCC;

              if (typeof colorVal === 'string') {
                  if (colorVal.startsWith('#')) colorVal = colorVal.substring(1);
                  colorInt = parseInt(colorVal, 16);
              } else if (typeof colorVal === 'number') {
                  colorInt = colorVal;
              }

              return {
                  x: Number(v.x) || 0,
                  y: Number(v.y) || 0,
                  z: Number(v.z) || 0,
                  color: isNaN(colorInt) ? 0xCCCCCC : colorInt,
                  material: v.m || MaterialType.SOLID
              };
          });
          
          if (engineRef.current) {
              engineRef.current.loadInitialModel(voxelData);
              initHistory(voxelData);
              setCurrentBaseModel('Imported Build');
          }
      } catch (e) {
          console.error("Failed to import JSON", e);
          alert("Failed to import JSON. Please ensure the format is correct.");
      }
  };

  const openPrompt = (mode: 'create' | 'morph') => {
      setPromptMode(mode);
      setIsPromptModalOpen(true);
  }
  
  const handleToggleRotation = () => {
      const newState = !isAutoRotate;
      setIsAutoRotate(newState);
      if (engineRef.current) {
          engineRef.current.setAutoRotate(newState);
      }
  }

  const handlePromptSubmit = async (prompt: string, folder?: string) => {
    if (!process.env.API_KEY) {
        throw new Error("API Key not found");
    }

    setIsGenerating(true);
    // Close modal immediately so we can show the main loading indicator
    setIsPromptModalOpen(false);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-3-pro-preview';
        
        let systemContext = "";
        if (promptMode === 'morph' && engineRef.current) {
            const availableColors = engineRef.current.getUniqueColors().join(', ');
            systemContext = `
                CONTEXT: You are re-assembling an existing pile of lego-like voxels.
                The current pile consists of these colors: [${availableColors}].
                TRY TO USE THESE COLORS if they fit the requested shape.
                If the requested shape absolutely requires different colors, you may use them, but prefer the existing palette to create a "rebuilding" effect.
                The model should be roughly the same volume as the previous one.
            `;
        } else {
            systemContext = `
                CONTEXT: You are creating a brand new voxel art scene from scratch.
                Be creative with colors.
            `;
        }

        const response = await ai.models.generateContent({
            model,
            contents: `
                    ${systemContext}
                    
                    Task: Generate a 3D voxel art model of: "${prompt}".
                    
                    Strict Rules:
                    1. Use approximately 150 to 600 voxels.
                    2. The model must be centered at x=0, z=0.
                    3. The bottom of the model must be at y=0 or slightly higher.
                    4. Ensure the structure is physically plausible (connected).
                    5. Coordinates should be integers.
                    
                    Return ONLY a JSON array of objects.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            x: { type: Type.INTEGER },
                            y: { type: Type.INTEGER },
                            z: { type: Type.INTEGER },
                            color: { type: Type.STRING, description: "Hex color code e.g. #FF5500" }
                        },
                        required: ["x", "y", "z", "color"]
                    }
                }
            }
        });

        if (response.text) {
            const rawData = JSON.parse(response.text);
            
            // Validate and transform to VoxelData
            const voxelData: VoxelData[] = rawData.map((v: any) => {
                let colorStr = v.color;
                if (colorStr.startsWith('#')) colorStr = colorStr.substring(1);
                const colorInt = parseInt(colorStr, 16);
                
                return {
                    x: v.x,
                    y: v.y,
                    z: v.z,
                    color: isNaN(colorInt) ? 0xCCCCCC : colorInt,
                    material: v.m || MaterialType.SOLID
                };
            });

            if (engineRef.current) {
                if (promptMode === 'create') {
                    engineRef.current.loadInitialModel(voxelData);
                    initHistory(voxelData);
                    setCustomBuilds(prev => [...prev, { id: crypto.randomUUID(), name: prompt, data: voxelData, folder }]);
                    setCurrentBaseModel(prompt);
                } else {
                    engineRef.current.rebuild(voxelData);
                    pushToHistory(voxelData);
                    // Store baseModel to scope this rebuild to the current scene
                    setCustomRebuilds(prev => [...prev, { 
                        id: crypto.randomUUID(),
                        name: prompt, 
                        data: voxelData,
                        baseModel: currentBaseModel,
                        folder
                    }]);
                }
            }
        }
    } catch (err) {
        console.error("Generation failed", err);
        alert("Oops! Something went wrong generating the model.");
    } finally {
        setIsGenerating(false);
    }
  };

  // Filter rebuilds to only show those relevant to the current base model
  const relevantRebuilds = customRebuilds.filter(
      r => r.baseModel === currentBaseModel
  );

  return (
    <div className="relative w-full h-screen bg-[#f0f2f5] overflow-hidden">
      {/* 3D Container */}
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      {/* UI Overlay */}
      <UIOverlay 
        voxelCount={voxelCount}
        appState={appState}
        currentBaseModel={currentBaseModel}
        customBuilds={customBuilds}
        customRebuilds={relevantRebuilds} 
        isAutoRotate={isAutoRotate}
        isInfoVisible={showWelcome}
        isGenerating={isGenerating}
        
        currentTool={currentTool}
        currentColor={currentColor}
        currentMaterial={currentMaterial}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        gridSnapping={gridSnapping}
        physicsConfig={physicsConfig}
        sculptSettings={sculptSettings}
        materialConfig={materialConfig}
        
        onToolChange={setCurrentTool}
        onColorChange={setCurrentColor}
        onMaterialChange={setCurrentMaterial}
        onGridSnapToggle={() => setGridSnapping(g => !g)}
        onPhysicsConfigChange={setPhysicsConfig}
        onSculptSettingsChange={setSculptSettings}
        onMaterialConfigChange={setMaterialConfig}
        onUndo={handleUndo}
        onRedo={handleRedo}
        
        onDismantle={handleDismantle}
        onRebuild={handleRebuild}
        onNewScene={handleNewScene}
        onSelectCustomBuild={handleSelectCustomBuild}
        onSelectCustomRebuild={handleSelectCustomRebuild}
        onEditBuild={setEditingBuild}
        onPromptCreate={() => openPrompt('create')}
        onPromptMorph={() => openPrompt('morph')}
        onShowJson={handleShowJson}
        onImportJson={handleImportClick}
        onToggleRotation={handleToggleRotation}
        onToggleInfo={() => setShowWelcome(!showWelcome)}
      />

      {/* Modals & Screens */}
      
      <BuildEditModal 
        isOpen={editingBuild !== null}
        build={editingBuild}
        onClose={() => setEditingBuild(null)}
        onSave={handleSaveBuild}
        onDelete={handleDeleteBuild}
      />

      <WelcomeScreen visible={showWelcome} onDismiss={() => setShowWelcome(false)} />

      <JsonModal 
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        data={jsonData}
        isImport={jsonModalMode === 'import'}
        onImport={handleJsonImport}
      />

      <PromptModal
        isOpen={isPromptModalOpen}
        mode={promptMode}
        onClose={() => setIsPromptModalOpen(false)}
        onSubmit={handlePromptSubmit}
      />
    </div>
  );
};

export default App;
