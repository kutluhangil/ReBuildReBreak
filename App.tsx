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
import { SaveBuildModal } from './components/SaveBuildModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Generators } from './utils/voxelGenerators';
import { AppState, VoxelData, SavedModel, HistoryState, BrushTool, MaterialType } from './types';
import { GoogleGenAI, Type } from "@google/genai";
import { audioService } from './services/AudioService';

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
  const [hoveredVoxel, setHoveredVoxel] = useState<{x: number, y: number, z: number, material: string} | null>(null);

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
  const [isSavingScene, setIsSavingScene] = useState(false);

  const handleSaveScene = (name: string, folder?: string) => {
      if (!engineRef.current) return;
      
      const newModel: SavedModel = {
          id: Date.now().toString(),
          name,
          folder,
          voxels: engineRef.current.getData()
      };
      
      setCustomBuilds(prev => [...prev, newModel]);
      showToast(`Saved "${name}" successfully`);
  };

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

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 2000);
  };

  const pushToHistory = (data: VoxelData[], actionName?: string) => {
      const newHistory = [...history.slice(0, historyIndex + 1), { voxels: [...data], actionName }];
      if (newHistory.length > 20) {
          newHistory.shift();
      }
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  };

  const initHistory = (data: VoxelData[]) => {
      setHistory([{voxels: [...data], actionName: 'Initial Load'}]);
      setHistoryIndex(0);
  }

  const handleInteraction = (actionName?: string) => {
      if (engineRef.current) {
          pushToHistory(engineRef.current.getData(), actionName);
      }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Engine
    const engine = new VoxelEngine(
      containerRef.current,
      (newState) => setAppState(newState),
      (count) => setVoxelCount(count),
      (actionName) => handleInteraction(actionName)
    );
    engine.onHoverChange = (info) => setHoveredVoxel(info);

    engineRef.current = engine;
    
    // Sync state
    engine.currentTool = currentTool;
    engine.currentColor = parseInt(currentColor.replace('#', ''), 16);
    engine.currentMaterial = currentMaterial;

    // Initial Model Load
    const initialModel = Generators.Eagle();
    engine.loadInitialModel(initialModel);
    initHistory(initialModel);

    // Audio init listener
    const handleFirstInteraction = () => {
        audioService.init();
        window.removeEventListener('pointerdown', handleFirstInteraction);
    };
    window.addEventListener('pointerdown', handleFirstInteraction);

    // Resize Listener
    const handleResize = () => engine.handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handleFirstInteraction);
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

  // --- State for Environment ---
  const [environment, setEnvironment] = useState<'day' | 'night' | 'sunset'>('day');

  // Sync physics
  useEffect(() => {
    if (engineRef.current) {
        engineRef.current.physicsConfig = physicsConfig;
    }
  }, [physicsConfig]);

  // Sync environment
  useEffect(() => {
    if (engineRef.current) {
        engineRef.current.setEnvironment(environment);
    }
  }, [environment]);

  const handleUndo = () => {
      if (historyIndex > 0 && engineRef.current) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          engineRef.current.loadInitialModel(history[newIndex].voxels);
          showToast(`Undo: ${history[historyIndex].actionName || 'Action reverted'}`);
      }
  }

  const handleRedo = () => {
      if (historyIndex < history.length - 1 && engineRef.current) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          engineRef.current.loadInitialModel(history[newIndex].voxels);
          showToast(`Redo: ${history[newIndex].actionName || 'Action reapplied'}`);
      }
  }

  const handleClear = () => {
     if (window.confirm('Are you sure you want to delete all voxels from the scene? This cannot be undone.')) {
         if (engineRef.current) {
             engineRef.current.loadInitialModel([]);
             initHistory([]);
             showToast('Scene cleared');
         }
     }
  };

  const handleDismantle = () => {
    engineRef.current?.dismantle();
  };

  const handleNewScene = (type: string) => {
    const generator = (Generators as any)[type];
    if (generator && engineRef.current) {
      const model = generator();
      engineRef.current.loadInitialModel(model);
      initHistory(model);
      setCurrentBaseModel(type);
    }
  };

  const handleSelectCustomBuild = (model: SavedModel) => {
      if (engineRef.current) {
          engineRef.current.loadInitialModel(model.data);
          initHistory(model.data);
          setCurrentBaseModel(model.name);
      }
  };

  const handleRebuild = (type: string) => {
    const generator = (Generators as any)[type];
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

  const handlePromptSubmit = async (prompt: string, folder?: string, imageBase64?: string, seed?: number) => {
    if (!process.env.API_KEY) {
        throw new Error("API Key not found");
    }

    setIsGenerating(true);
    // Close modal immediately so we can show the main loading indicator
    setIsPromptModalOpen(false);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-2.5-pro'; // Vision requires at least 2.5-pro / 2.0-pro (3-pro might not exist or be different? I'll use gemini-2.5-pro or gemini-2.0-pro for multimodal) Wait, AI studio uses models/gemini-pro-latest. Let's use gemini-2.5-pro. Wait, actually `gemini-2.5-pro` is correct.
        
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
                Use a wider range of colors to make the scene vibrant and interesting. 
                Aim to create organic, less uniform shapes. Avoid creating perfectly symmetrical, rigid structures if possible. Incorporate natural variation to make the model lively.
                Consider incorporating multiple distinct shapes or levels of detail within the model.
            `;
        }

        const promptText = `
                ${systemContext}
                
                Task: Generate a 3D voxel art model of: "${prompt || "what is in the image"}".
                
                Strict Rules:
                1. Use approximately 150 to 600 voxels.
                2. The model must be centered at x=0, z=0.
                3. The bottom of the model must be at y=0 or slightly higher.
                4. Ensure the structure is physically plausible (connected).
                5. Coordinates should be integers.
                
                Return ONLY a JSON array of objects.`;

        const contents: any[] = [{ text: promptText }];
        if (imageBase64) {
            const base64Data = imageBase64.split(',')[1];
            const mimeType = imageBase64.split(';')[0].split(':')[1];
            contents.unshift({
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: contents,
            config: {
                responseMimeType: "application/json",
                // Pass optional seed if provided
                ...(seed !== undefined && { seed }),
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
        environment={environment}
        
        onToolChange={setCurrentTool}
        onColorChange={setCurrentColor}
        onMaterialChange={setCurrentMaterial}
        hoveredVoxel={hoveredVoxel}
        onGridSnapToggle={() => setGridSnapping(g => !g)}
        onPhysicsConfigChange={setPhysicsConfig}
        onEnvironmentChange={setEnvironment}
        onSculptSettingsChange={setSculptSettings}
        onMaterialConfigChange={setMaterialConfig}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onPhysicsPanelToggle={(isOpen) => {
            if (engineRef.current) {
                engineRef.current.physicsGizmosVisible = isOpen;
            }
        }}
        
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
        onSaveBuild={() => setIsSavingScene(true)}
        onExportGLTF={() => {
            if (engineRef.current) {
                engineRef.current.exportGLTF();
            }
        }}
        onResetCamera={() => engineRef.current?.resetCamera()}
        onZoomToFit={() => engineRef.current?.zoomToFit()}
        onToggleCameraProjection={() => engineRef.current?.toggleCameraProjection()}
        onToggleRotation={handleToggleRotation}
        onToggleInfo={() => setShowWelcome(!showWelcome)}
      />

      {/* Modals & Screens */}
      
      <SaveBuildModal 
        isOpen={isSavingScene}
        onClose={() => setIsSavingScene(false)}
        onSave={handleSaveScene}
      />

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

      {/* Undo/Redo Toast feedback */}
      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-slate-800 text-white font-bold rounded-full shadow-2xl transition-all duration-300 pointer-events-none ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {toastMessage}
      </div>
    </div>
  );
};

export default App;
