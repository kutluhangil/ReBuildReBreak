import React, { useState, useEffect, useRef } from 'react';
import { AppState, SavedModel, MaterialType, BrushTool, PhysicsConfig, SculptSettings, MaterialConfigMap } from '../types';
import { Box, Bird, Cat, Rabbit, Users, Code2, Wand2, Hammer, FolderOpen, ChevronUp, FileJson, History as HistoryIcon, Play, Pause, Info, Wrench, Loader2, Undo2, Redo2, Paintbrush, Eraser, Plus, Fingerprint, Grid, FolderPlus, Settings, SlidersHorizontal, Palette, PenLine, Settings2, Trash2, Home, Bot, Trees, Download, Sun, Moon, Sunrise, Camera, Maximize, View } from 'lucide-react';
import { MaterialPreview } from './MaterialPreview';
import { CustomColorPicker } from './CustomColorPicker';

interface UIOverlayProps {
  voxelCount: number;
  appState: AppState;
  currentBaseModel: string;
  customBuilds: SavedModel[];
  customRebuilds: SavedModel[];
  hoveredVoxel?: { x: number, y: number, z: number, material: string } | null;
  isAutoRotate: boolean;
  isInfoVisible: boolean;
  isGenerating: boolean;
  
  currentTool: BrushTool;
  currentColor: string;
  currentMaterial: MaterialType;
  canUndo: boolean;
  canRedo: boolean;
  gridSnapping: boolean;
  physicsConfig: PhysicsConfig;
  sculptSettings: SculptSettings;
  materialConfig: MaterialConfigMap;
  environment: 'day' | 'night' | 'sunset';
  
  onDismantle: () => void;
  onRebuild: (type: string) => void;
  onNewScene: (type: string) => void;
  onSelectCustomBuild: (model: SavedModel) => void;
  onSelectCustomRebuild: (model: SavedModel) => void;
  onEditBuild: (model: SavedModel) => void;
  onPromptCreate: () => void;
  onPromptMorph: () => void;
  onShowJson: () => void;
  onImportJson: () => void;
  onSaveBuild: (name: string, folder?: string) => void;
  onExportGLTF: () => void;
  onResetCamera: () => void;
  onZoomToFit: () => void;
  onToggleCameraProjection: () => void;
  onToggleRotation: () => void;
  onToggleInfo: () => void;
  
  onToolChange: (tool: BrushTool) => void;
  onColorChange: (color: string) => void;
  onMaterialChange: (material: MaterialType) => void;
  onGridSnapToggle: () => void;
  onPhysicsConfigChange: (config: PhysicsConfig) => void;
  onEnvironmentChange: (env: 'day' | 'night' | 'sunset') => void;
  onPhysicsPanelToggle?: (isOpen: boolean) => void;
  onClear: () => void;
  onSculptSettingsChange: (settings: SculptSettings) => void;
  onMaterialConfigChange: (config: MaterialConfigMap) => void;
  onUndo: () => void;
  onRedo: () => void;
}

const LOADING_MESSAGES = [
    "Crafting voxels...",
    "Designing structure...",
    "Calculating physics...",
    "Mixing colors...",
    "Assembling geometry...",
    "Applying polish..."
];

export const UIOverlay: React.FC<UIOverlayProps> = ({
  voxelCount,
  appState,
  currentBaseModel,
  customBuilds,
  customRebuilds,
  hoveredVoxel,
  isAutoRotate,
  isInfoVisible,
  isGenerating,
  
  currentTool,
  currentColor,
  currentMaterial,
  canUndo,
  canRedo,
  gridSnapping,
  physicsConfig,
  sculptSettings,
  materialConfig,
  environment,
  
  onDismantle,
  onRebuild,
  onNewScene,
  onSelectCustomBuild,
  onSelectCustomRebuild,
  onEditBuild,
  onPromptCreate,
  onPromptMorph,
  onShowJson,
  onImportJson,
  onSaveBuild,
  onExportGLTF,
  onResetCamera,
  onZoomToFit,
  onToggleCameraProjection,
  onToggleRotation,
  onToggleInfo,
  
  onToolChange,
  onColorChange,
  onMaterialChange,
  onUndo,
  onRedo,
  onGridSnapToggle,
  onPhysicsConfigChange,
  onEnvironmentChange,
  onPhysicsPanelToggle,
  onClear,
  onSculptSettingsChange,
  onMaterialConfigChange
}) => {
  const isStable = appState === AppState.STABLE;
  const isDismantling = appState === AppState.DISMANTLING;
  const isRebuilding = appState === AppState.REBUILDING;
  
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [showPhysicsPanel, setShowPhysicsPanel] = useState(false);
  const [showPalettePanel, setShowPalettePanel] = useState(false);
  const [showMaterialPanel, setShowMaterialPanel] = useState(false);

  useEffect(() => {
    if (onPhysicsPanelToggle) {
        onPhysicsPanelToggle(showPhysicsPanel);
    }
  }, [showPhysicsPanel, onPhysicsPanelToggle]);

  // Advanced Palette State
  const [palettes, setPalettes] = useState<ColorPalette[]>([
      { id: 'default', name: 'Default Builder', colors: ['#FF3366', '#33CC99', '#3399FF', '#9933FF', '#8B4513', '#CCCCCC', '#222222', '#FFFFFF'] },
      { id: 'neon', name: 'Cyberpunk', colors: ['#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#00ff00', '#0000ff', '#0f0f0f'] },
      { id: 'pastel', name: 'Pastel Dream', colors: ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff'] }
  ]);
  const [activePaletteId, setActivePaletteId] = useState('default');
  const activePalette = palettes.find(p => p.id === activePaletteId) || palettes[0];

  useEffect(() => {
    if (isGenerating) {
        const interval = setInterval(() => {
            setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 2000);
        return () => clearInterval(interval);
    } else {
        setLoadingMsgIndex(0);
    }
  }, [isGenerating]);
  
  const isEagle = currentBaseModel === 'Eagle';

  const PRESET_COLORS = [
      '#FF3366', '#FF9933', '#FFD700', '#33CC66', 
      '#3399FF', '#9933FF', '#8B4513', '#CCCCCC', '#222222'
  ];

  // Group builds by folder
  const buildsByFolder = customBuilds.reduce((acc, build) => {
      const folder = build.folder || 'Uncategorized';
      if (!acc[folder]) acc[folder] = [];
      acc[folder].push(build);
      return acc;
  }, {} as Record<string, SavedModel[]>);

  const rebuildsByFolder = customRebuilds.reduce((acc, build) => {
      const folder = build.folder || 'Uncategorized';
      if (!acc[folder]) acc[folder] = [];
      acc[folder].push(build);
      return acc;
  }, {} as Record<string, SavedModel[]>);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none z-10 overflow-hidden">
      
      {/* Top Bar (Stats & Tools) */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        
        {/* Left Controls */}
        <div className="pointer-events-auto flex flex-col gap-2">
            <DropdownMenu 
                icon={<FolderOpen size={20} />}
                label="Builds"
                color="indigo"
            >
                <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">NEW BUILDS</div>
                <DropdownItem onClick={() => onNewScene('Eagle')} icon={<Bird size={16}/>} label="Eagle" />
                <DropdownItem onClick={() => onNewScene('Cat')} icon={<Cat size={16}/>} label="Cat" />
                <DropdownItem onClick={() => onNewScene('Terrain')} icon={<Trees size={16}/>} label="Terrain" />
                <DropdownItem onClick={() => onNewScene('Rabbit')} icon={<Rabbit size={16}/>} label="Rabbit" />
                <DropdownItem onClick={() => onNewScene('Twins')} icon={<Users size={16}/>} label="Twins" />
                <DropdownItem onClick={() => onNewScene('Robot')} icon={<Bot size={16}/>} label="Robot" />
                <DropdownItem onClick={() => onNewScene('House')} icon={<Home size={16}/>} label="House" />
                <DropdownItem onClick={onPromptCreate} icon={<Wand2 size={16}/>} label="AI Generated" highlight />
                <div className="h-px bg-slate-100 my-1" />
                
                {Object.entries(buildsByFolder).map(([folder, builds]) => (
                    <div key={folder} className="mb-2">
                        <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <FolderPlus size={12} /> {folder}
                        </div>
                        {builds.map((model, idx) => (
                            <DropdownItem 
                                key={`build-${model.id}-${idx}`} 
                                onClick={() => onSelectCustomBuild(model)} 
                                onEdit={(e) => { e.stopPropagation(); onEditBuild(model); }}
                                icon={<HistoryIcon size={16}/>} 
                                label={model.name} 
                                truncate
                            />
                        ))}
                    </div>
                ))}

                {customBuilds.length > 0 && <div className="h-px bg-slate-100 my-1" />}

                <DropdownItem onClick={() => onSaveBuild('Custom Build')} icon={<Plus size={16}/>} label="Save Current Scene" highlight />
                <div className="h-px bg-slate-100 my-1" />

                <DropdownItem onClick={onImportJson} icon={<FileJson size={16}/>} label="Import JSON" />
                <DropdownItem onClick={onExportGLTF} icon={<Download size={16}/>} label="Export GLTF" />
            </DropdownMenu>

            <div className="flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl border border-slate-200 text-slate-500 font-bold w-fit mt-2">
                <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                    <Box size={16} strokeWidth={3} />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-[10px] uppercase tracking-wider opacity-60">Voxels</span>
                    <span className="text-lg text-slate-800 font-extrabold font-mono">{voxelCount}</span>
                </div>
            </div>
            
            {/* History Controls */}
             <div className="flex gap-2 mt-2">
                 <button 
                     onClick={onUndo} 
                     disabled={!canUndo}
                     className="p-2 bg-white/90 backdrop-blur-sm border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed shadow transition-colors"
                 ><Undo2 size={20}/></button>
                  <button 
                     onClick={onRedo} 
                     disabled={!canRedo}
                     className="p-2 bg-white/90 backdrop-blur-sm border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed shadow transition-colors"
                 ><Redo2 size={20}/></button>
             </div>
        </div>

        {/* Right Utilities */}
        <div className="pointer-events-auto flex gap-2">
            <TactileButton
                onClick={onResetCamera}
                color="slate"
                icon={<Camera size={18} strokeWidth={2.5} />}
                label="Reset"
                compact
            />
            <TactileButton
                onClick={onZoomToFit}
                color="slate"
                icon={<Maximize size={18} strokeWidth={2.5} />}
                label="Fit"
                compact
            />
            <TactileButton
                onClick={onToggleCameraProjection}
                color="slate"
                icon={<View size={18} strokeWidth={2.5} />}
                label="Proj"
                compact
            />
            
            <TactileButton
                onClick={() => {
                    if (environment === 'day') onEnvironmentChange('sunset');
                    else if (environment === 'sunset') onEnvironmentChange('night');
                    else onEnvironmentChange('day');
                }}
                color={environment === 'day' ? 'sky' : environment === 'sunset' ? 'orange' : 'indigo'}
                icon={environment === 'day' ? <Sun size={18} strokeWidth={2.5} /> : environment === 'sunset' ? <Sunrise size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
                label={environment.charAt(0).toUpperCase() + environment.slice(1)}
                compact
            />
            <TactileButton
                onClick={() => { setShowMaterialPanel(!showMaterialPanel); setShowPhysicsPanel(false); setShowPalettePanel(false); }}
                color={showMaterialPanel ? 'purple' : 'slate'}
                icon={<Settings2 size={18} strokeWidth={2.5} />}
                label="Properties"
                compact
            />
            <TactileButton
                onClick={() => { setShowPhysicsPanel(!showPhysicsPanel); setShowMaterialPanel(false); setShowPalettePanel(false); }}
                color={showPhysicsPanel ? 'rose' : 'slate'}
                icon={<SlidersHorizontal size={18} strokeWidth={2.5} />}
                label="Physics"
                compact
            />
            <TactileButton
                onClick={() => { setShowPalettePanel(!showPalettePanel); setShowPhysicsPanel(false); setShowMaterialPanel(false); }}
                color={showPalettePanel ? 'amber' : 'slate'}
                icon={<Palette size={18} strokeWidth={2.5} />}
                label="Palettes"
                compact
            />
            <TactileButton
                onClick={onToggleInfo}
                color={isInfoVisible ? 'indigo' : 'slate'}
                icon={<Info size={18} strokeWidth={2.5} />}
                label="Info"
                compact
            />
            <TactileButton
                onClick={onToggleRotation}
                color={isAutoRotate ? 'sky' : 'slate'}
                icon={isAutoRotate ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                label={isAutoRotate ? "Pause Cam" : "Play Cam"}
                compact
            />
            <TactileButton
                onClick={onGridSnapToggle}
                color={gridSnapping ? 'emerald' : 'slate'}
                icon={<Grid size={18} strokeWidth={2.5} />}
                label="Snap"
                compact
            />
            <TactileButton
                onClick={onShowJson}
                color="slate"
                icon={<Code2 size={18} strokeWidth={2.5} />}
                label="Share"
            />
        </div>
      </div>

      {/* Editor Sidebar (Left) */}
      {isStable && (
        <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-auto flex flex-col gap-4">
            
            {/* Brush Tools */}
            <div className="bg-white/90 backdrop-blur p-2 rounded-2xl shadow-xl flex flex-col gap-2 border-2 border-slate-200">
                <ToolButton icon={<Plus size={20} />} active={currentTool===BrushTool.ADD} onClick={() => onToolChange(BrushTool.ADD)} tooltip="Add Voxel" />
                <ToolButton icon={<Eraser size={20} />} active={currentTool===BrushTool.REMOVE} onClick={() => onToolChange(BrushTool.REMOVE)} tooltip="Remove Voxel" />
                <ToolButton icon={<Paintbrush size={20} />} active={currentTool===BrushTool.PAINT} onClick={() => onToolChange(BrushTool.PAINT)} tooltip="Paint Voxel" />
                <ToolButton icon={<Fingerprint size={20} />} active={currentTool===BrushTool.SCULPT} onClick={() => onToolChange(BrushTool.SCULPT)} tooltip="Sculpt Voxel" />
            </div>

            {/* Sculpt Settings */}
            {currentTool === BrushTool.SCULPT && (
                 <div className="bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl flex flex-col gap-4 border-2 border-slate-200 w-40 mt-2">
                     <div className="flex flex-col gap-1 group relative">
                         <div className="flex justify-between text-xs font-bold text-slate-500 uppercase cursor-help" title="Controls the radius of the sculpting brush. A larger size affects more blocks at once.">
                           <span>Size</span>
                           <span>{sculptSettings.size}</span>
                         </div>
                         <input type="range" min="1" max="5" step="0.5" value={sculptSettings.size} onChange={(e) => onSculptSettingsChange({...sculptSettings, size: parseFloat(e.target.value)})} className="accent-sky-500" />
                     </div>
                     <div className="flex flex-col gap-1 group relative">
                         <div className="flex justify-between text-xs font-bold text-slate-500 uppercase cursor-help" title="Controls the intensity of the sculpt effect. Higher strength builds or digs faster.">
                           <span>Strength</span>
                           <span>{sculptSettings.strength}</span>
                         </div>
                         <input type="range" min="0.1" max="1" step="0.1" value={sculptSettings.strength} onChange={(e) => onSculptSettingsChange({...sculptSettings, strength: parseFloat(e.target.value)})} className="accent-sky-500" />
                     </div>
                 </div>
            )}

            {/* Materials */}
            {currentTool !== BrushTool.REMOVE && currentTool !== BrushTool.SCULPT && (
                <div className="bg-white/90 backdrop-blur p-2 rounded-2xl shadow-xl flex flex-col gap-2 border-2 border-slate-200 mt-2 max-h-56 overflow-y-auto w-36">
                    <MaterialButton type={MaterialType.SOLID} active={currentMaterial===MaterialType.SOLID} onClick={() => onMaterialChange(MaterialType.SOLID)} label="Solid" />
                    <MaterialButton type={MaterialType.METAL} active={currentMaterial===MaterialType.METAL} onClick={() => onMaterialChange(MaterialType.METAL)} label="Metal" />
                    <MaterialButton type={MaterialType.WOOD} active={currentMaterial===MaterialType.WOOD} onClick={() => onMaterialChange(MaterialType.WOOD)} label="Wood" />
                    <MaterialButton type={MaterialType.GLASS} active={currentMaterial===MaterialType.GLASS} onClick={() => onMaterialChange(MaterialType.GLASS)} label="Glass" />
                    <MaterialButton type={MaterialType.STONE} active={currentMaterial===MaterialType.STONE} onClick={() => onMaterialChange(MaterialType.STONE)} label="Stone" />
                    <MaterialButton type={MaterialType.PLASTIC} active={currentMaterial===MaterialType.PLASTIC} onClick={() => onMaterialChange(MaterialType.PLASTIC)} label="Plastic" />
                    <MaterialButton type={MaterialType.FABRIC} active={currentMaterial===MaterialType.FABRIC} onClick={() => onMaterialChange(MaterialType.FABRIC)} label="Fabric" />
                </div>
            )}
            
            {/* Palette */}
            {currentTool !== BrushTool.REMOVE && (
                <div className="bg-white/90 backdrop-blur p-3 rounded-2xl shadow-xl flex flex-col gap-2 border-2 border-slate-200 w-32 mt-2">
                    <div className="grid grid-cols-4 gap-1.5 w-full">
                        {activePalette.colors.map(c => (
                            <button 
                                key={c}
                                onClick={() => onColorChange(c)}
                                title={c}
                                className={`w-full aspect-square rounded-full border-2 transition-transform ${currentColor.toLowerCase() === c.toLowerCase() ? 'border-sky-500 scale-125 shadow-md z-10' : 'border-slate-300 hover:scale-110'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col gap-2">
                        <CustomColorPicker color={currentColor} onChange={onColorChange} />
                        <button
                            onClick={() => {
                                const upperColor = currentColor.toUpperCase();
                                if (!activePalette.colors.includes(upperColor)) {
                                    setPalettes(prev => prev.map(p => p.id === activePaletteId ? { ...p, colors: [...p.colors, upperColor] } : p))
                                }
                            }}
                            title="Save current color to palette"
                            className="w-full bg-slate-50 hover:bg-indigo-50 text-indigo-600 border border-indigo-100 hover:border-indigo-300 text-xs font-bold rounded py-1.5 transition-colors"
                        >
                            + Save Color
                        </button>
                    </div>
                </div>
            )}
            
            {/* Hover Info Panel */}
            {hoveredVoxel && (currentTool === BrushTool.PAINT || currentTool === BrushTool.SCULPT || currentTool === BrushTool.REMOVE) && (
                <div className="bg-white/95 backdrop-blur p-3 rounded-2xl shadow-xl flex flex-col gap-1 border-2 border-slate-200 mt-2 text-xs font-mono text-slate-700 w-32">
                   <div className="font-bold text-slate-400 uppercase tracking-wider mb-1 border-b border-slate-100 pb-1">Voxel Info</div>
                   <div className="flex justify-between"><span className="text-slate-400">X:</span> {hoveredVoxel.x}</div>
                   <div className="flex justify-between"><span className="text-slate-400">Y:</span> {hoveredVoxel.y}</div>
                   <div className="flex justify-between"><span className="text-slate-400">Z:</span> {hoveredVoxel.z}</div>
                   <div className="mt-1 pt-1 border-t border-slate-100 font-bold capitalize text-indigo-500 truncate" title={hoveredVoxel.material}>{hoveredVoxel.material}</div>
                </div>
            )}
        </div>
      )}

      {/* Physics Panel */}
      {showPhysicsPanel && (
          <div className="absolute top-20 right-4 w-64 bg-white/95 backdrop-blur-md border-2 border-slate-200 p-4 rounded-3xl shadow-2xl pointer-events-auto">
              <div className="flex items-center justify-between mb-4 text-slate-800">
                  <div className="flex items-center gap-2">
                      <SlidersHorizontal size={20} strokeWidth={2.5}/>
                      <h3 className="font-bold">Physics Engine</h3>
                  </div>
                  <button 
                      onClick={() => onPhysicsConfigChange({ gravity: -14.0, bounce: 0.6, friction: 0.85, explosionForce: 1.5 })}
                      className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg hover:bg-slate-200 uppercase tracking-widest transition-colors"
                  >
                      Varsayılan
                  </button>
              </div>
              <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase"><span>Gravity</span><span>{physicsConfig.gravity.toFixed(1)}</span></div>
                      <input type="range" min="-30" max="0" step="0.5" value={physicsConfig.gravity} onChange={(e) => onPhysicsConfigChange({...physicsConfig, gravity: parseFloat(e.target.value)})} className="accent-rose-500" />
                  </div>
                  <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase"><span>Bounce</span><span>{physicsConfig.bounce.toFixed(2)}</span></div>
                      <input type="range" min="0" max="1" step="0.05" value={physicsConfig.bounce} onChange={(e) => onPhysicsConfigChange({...physicsConfig, bounce: parseFloat(e.target.value)})} className="accent-rose-500" />
                  </div>
                  <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase"><span>Friction</span><span>{physicsConfig.friction.toFixed(2)}</span></div>
                      <input type="range" min="0" max="1" step="0.01" value={physicsConfig.friction} onChange={(e) => onPhysicsConfigChange({...physicsConfig, friction: parseFloat(e.target.value)})} className="accent-rose-500" />
                  </div>
                  <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase"><span>Explosion</span><span>{physicsConfig.explosionForce.toFixed(1)}</span></div>
                      <input type="range" min="0" max="5" step="0.1" value={physicsConfig.explosionForce} onChange={(e) => onPhysicsConfigChange({...physicsConfig, explosionForce: parseFloat(e.target.value)})} className="accent-rose-500" />
                  </div>
              </div>
          </div>
      )}

      {/* Palette Editor Panel */}
      {showPalettePanel && (
          <div className="absolute top-20 right-4 w-64 bg-white/95 backdrop-blur-md border-2 border-slate-200 p-4 rounded-3xl shadow-2xl pointer-events-auto">
              <div className="flex items-center gap-2 mb-4 text-slate-800">
                  <Palette size={20} strokeWidth={2.5}/>
                  <h3 className="font-bold">Palette Selector</h3>
              </div>
              <div className="flex flex-col gap-2">
                  {palettes.map(p => (
                      <button 
                          key={p.id}
                          onClick={() => setActivePaletteId(p.id)}
                          className={`flex items-center justify-between p-2 rounded-xl border-2 text-left transition-colors ${activePaletteId === p.id ? 'border-amber-400 bg-amber-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                      >
                          <span className="text-sm font-bold text-slate-700">{p.name}</span>
                          <div className="flex gap-1">
                              {p.colors.slice(0, 3).map((c, i) => (
                                  <div key={i} className="w-3 h-3 rounded-full border border-black/10" style={{backgroundColor: c}}/>
                              ))}
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      )}

      {/* Material Config Panel */}
      {showMaterialPanel && (
          <div className="absolute top-20 right-4 w-72 bg-white/95 backdrop-blur-md border-2 border-slate-200 p-4 rounded-3xl shadow-2xl pointer-events-auto flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-800">
                  <Settings2 size={20} strokeWidth={2.5}/>
                  <h3 className="font-bold">Material Properties</h3>
              </div>
              
              <div className="flex justify-center py-2">
                  <MaterialPreview color={currentColor} materialType={currentMaterial} materialConfig={materialConfig} />
              </div>

              <div className="text-center">
                  <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">{currentMaterial}</span>
              </div>
              
              {(() => {
                  const presets: {label: string, config: any}[] = [];
                  if (currentMaterial === MaterialType.METAL) {
                      presets.push({label: 'Brushed', config: { roughness: 0.4, metalness: 0.9 }});
                      presets.push({label: 'Polished', config: { roughness: 0.1, metalness: 1.0 }});
                      presets.push({label: 'Rusty', config: { roughness: 0.8, metalness: 0.6 }});
                  } else if (currentMaterial === MaterialType.GLASS) {
                      presets.push({label: 'Clear', config: { roughness: 0.05, metalness: 0.1, transmission: 0.95 }});
                      presets.push({label: 'Frosted', config: { roughness: 0.4, metalness: 0.1, transmission: 0.8 }});
                      presets.push({label: 'Tinted', config: { roughness: 0.1, metalness: 0.3, transmission: 0.6 }});
                  } else if (currentMaterial === MaterialType.STONE) {
                      presets.push({label: 'Rough Concrete', config: { roughness: 0.95, metalness: 0.05 }});
                      presets.push({label: 'Polished Marble', config: { roughness: 0.1, metalness: 0.1 }});
                  } else if (currentMaterial === MaterialType.PLASTIC) {
                      presets.push({label: 'Shiny', config: { roughness: 0.2, metalness: 0.0, clearcoat: 1.0 }});
                      presets.push({label: 'Matte', config: { roughness: 0.7, metalness: 0.0, clearcoat: 0.1 }});
                  } else if (currentMaterial === MaterialType.WOOD) {
                      presets.push({label: 'Varnished', config: { roughness: 0.3, metalness: 0.0 }});
                      presets.push({label: 'Raw', config: { roughness: 0.85, metalness: 0.0 }});
                  }
                  
                  if (presets.length === 0) return null;
                  
                  return (
                       <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                           {presets.map(p => (
                               <button 
                                  key={p.label}
                                  className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-purple-100 hover:text-purple-600 px-2 py-1 rounded transition-colors"
                                  onClick={() => onMaterialConfigChange({...materialConfig, [currentMaterial]: { ...materialConfig[currentMaterial], ...p.config }})}
                               >
                                   {p.label}
                               </button>
                           ))}
                       </div>
                  );
              })()}

              <div className="flex flex-col gap-2 mt-2">
                  <details className="group border border-slate-200 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden bg-slate-50">
                      <summary className="flex items-center justify-between cursor-pointer p-3 font-bold text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                          <span title="Base surface parameters that affect how light scatters">Core Properties</span>
                          <span className="transition group-open:rotate-180"><ChevronUp size={16} /></span>
                      </summary>
                      <div className="p-3 pt-1 flex flex-col gap-4 bg-white border-t border-slate-100">
                          <div className="flex flex-col gap-1" title="Roughness determines how scattered light gets when bouncing off the surface. 0 means perfectly smooth like a mirror, 1 means completely rough like chalk.">
                              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase"><span>Roughness</span><span>{(materialConfig[currentMaterial]?.roughness ?? 0.8).toFixed(2)}</span></div>
                              <input type="range" min="0" max="1" step="0.05" value={materialConfig[currentMaterial]?.roughness ?? 0.8} onChange={(e) => onMaterialConfigChange({...materialConfig, [currentMaterial]: { ...materialConfig[currentMaterial], roughness: parseFloat(e.target.value) }})} className="accent-purple-500" />
                          </div>
                          <div className="flex flex-col gap-1" title="Metalness makes a material look more like a metal rather than a dielectric material like plastic or wood.">
                              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase"><span>Metalness</span><span>{(materialConfig[currentMaterial]?.metalness ?? 0.1).toFixed(2)}</span></div>
                              <input type="range" min="0" max="1" step="0.05" value={materialConfig[currentMaterial]?.metalness ?? 0.1} onChange={(e) => onMaterialConfigChange({...materialConfig, [currentMaterial]: { ...materialConfig[currentMaterial], metalness: parseFloat(e.target.value) }})} className="accent-purple-500" />
                          </div>
                      </div>
                  </details>

                  {(currentMaterial === MaterialType.GLASS || currentMaterial === MaterialType.PLASTIC || currentMaterial === MaterialType.FABRIC) && (
                      <details className="group border border-slate-200 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden bg-slate-50">
                          <summary className="flex items-center justify-between cursor-pointer p-3 font-bold text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                              <span title="Advanced parameters specific to this material type">Advanced Properties</span>
                              <span className="transition group-open:rotate-180"><ChevronUp size={16} /></span>
                          </summary>
                          <div className="p-3 pt-1 flex flex-col gap-4 bg-white border-t border-slate-100">
                              {currentMaterial === MaterialType.GLASS && (
                                  <div className="flex flex-col gap-1" title="Transmission controls how much light passes through the surface, giving the effect of glass.">
                                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase"><span>Transmission</span><span>{(materialConfig[currentMaterial]?.transmission ?? 0.9).toFixed(2)}</span></div>
                                      <input type="range" min="0" max="1" step="0.05" value={materialConfig[currentMaterial]?.transmission ?? 0.9} onChange={(e) => onMaterialConfigChange({...materialConfig, [currentMaterial]: { ...materialConfig[currentMaterial], transmission: parseFloat(e.target.value) }})} className="accent-purple-500" />
                                  </div>
                              )}
                              {currentMaterial === MaterialType.PLASTIC && (
                                  <div className="flex flex-col gap-1" title="Clearcoat adds a transparent reflective layer on top of the base material, similar to car paint.">
                                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase"><span>Clearcoat</span><span>{(materialConfig[currentMaterial]?.clearcoat ?? 1.0).toFixed(2)}</span></div>
                                      <input type="range" min="0" max="1" step="0.05" value={materialConfig[currentMaterial]?.clearcoat ?? 1.0} onChange={(e) => onMaterialConfigChange({...materialConfig, [currentMaterial]: { ...materialConfig[currentMaterial], clearcoat: parseFloat(e.target.value) }})} className="accent-purple-500" />
                                  </div>
                              )}
                              {currentMaterial === MaterialType.FABRIC && (
                                  <div className="flex flex-col gap-1" title="Sheen adds a soft reflection at grazing angles, characteristic of cloth and velvet materials.">
                                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase"><span>Sheen</span><span>{(materialConfig[currentMaterial]?.sheen ?? 1.0).toFixed(2)}</span></div>
                                      <input type="range" min="0" max="1" step="0.05" value={materialConfig[currentMaterial]?.sheen ?? 1.0} onChange={(e) => onMaterialConfigChange({...materialConfig, [currentMaterial]: { ...materialConfig[currentMaterial], sheen: parseFloat(e.target.value) }})} className="accent-purple-500" />
                                  </div>
                              )}
                          </div>
                      </details>
                  )}
              </div>
          </div>
      )}

      {/* Loading Indicator */}
      {isGenerating && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-300">
              <div className="bg-white/90 backdrop-blur-md border-2 border-indigo-100 px-8 py-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 min-w-[280px]">
                  <div className="relative">
                      <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-20"></div>
                      <Loader2 size={48} className="text-indigo-500 animate-spin" />
                  </div>
                  <div className="text-center">
                      <h3 className="text-lg font-extrabold text-slate-800">Gemini is Building...</h3>
                      <p className="text-slate-500 font-bold text-sm transition-all duration-300">
                          {LOADING_MESSAGES[loadingMsgIndex]}
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* Bottom Control Center */}
      <div className="absolute bottom-8 left-0 w-full flex justify-center items-end pointer-events-none">
        <div className="pointer-events-auto transition-all duration-500 ease-in-out transform">
            {/* STATE 1: STABLE -> DISMANTLE */}
            {isStable && (
                 <div className="flex gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
                     <BigActionButton 
                        onClick={onDismantle} 
                        icon={<Hammer size={32} strokeWidth={2.5} />} 
                        label="BREAK" 
                        color="rose" 
                     />
                     <TactileButton
                        onClick={onClear}
                        color="slate"
                        icon={<Trash2 size={24} strokeWidth={2.5} />}
                        label="CLEAR"
                     />
                 </div>
            )}

            {/* STATE 2: DISMANTLED -> REBUILD */}
            {isDismantling && !isGenerating && (
                <div className="flex items-end gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
                     <DropdownMenu 
                        icon={<Wrench size={24} />}
                        label="Rebuild"
                        color="emerald"
                        direction="up"
                        big
                     >
                        <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">REBUILD</div>
                        
                        <DropdownItem onClick={() => onRebuild('Eagle')} icon={<Bird size={18}/>} label="Eagle" />
                        <DropdownItem onClick={() => onRebuild('Cat')} icon={<Cat size={18}/>} label="Cat" />
                        <DropdownItem onClick={() => onRebuild('Rabbit')} icon={<Rabbit size={18}/>} label="Rabbit" />
                        <DropdownItem onClick={() => onRebuild('Twins')} icon={<Users size={18}/>} label="Eagles x2" />
                        <DropdownItem onClick={() => onRebuild('Tree')} icon={<Trees size={18}/>} label="Tree" />
                        <DropdownItem onClick={() => onRebuild('House')} icon={<Home size={18}/>} label="House" />
                        <DropdownItem onClick={() => onRebuild('Robot')} icon={<Bot size={18}/>} label="Robot" />
                        <div className="h-px bg-slate-100 my-1" />

                        {Object.entries(rebuildsByFolder).map(([folder, builds]) => (
                            <div key={folder} className="mb-2">
                                <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <FolderPlus size={12} /> {folder}
                                </div>
                                {builds.map((model, idx) => (
                                    <DropdownItem 
                                        key={`rebuild-${model.id}-${idx}`} 
                                        onClick={() => onSelectCustomRebuild(model)} 
                                        onEdit={(e) => { e.stopPropagation(); onEditBuild(model); }}
                                        icon={<HistoryIcon size={18}/>} 
                                        label={model.name}
                                        truncate 
                                    />
                                ))}
                            </div>
                        ))}
                        
                        {customRebuilds.length > 0 && <div className="h-px bg-slate-100 my-1" />}

                        <DropdownItem onClick={onPromptMorph} icon={<Wand2 size={18}/>} label="New rebuild" highlight />
                     </DropdownMenu>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// --- Components ---

const ToolButton: React.FC<{icon: React.ReactNode, active: boolean, onClick: () => void, tooltip: string}> = ({icon, active, onClick, tooltip}) => {
    return (
        <button 
            title={tooltip}
            onClick={onClick}
            className={`p-3 rounded-xl transition-all ${active ? 'bg-sky-500 text-white shadow-md shadow-sky-500/40 scale-105' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}
        >
            {icon}
        </button>
    )
}

const MaterialButton: React.FC<{
    label: string, 
    active: boolean, 
    onClick: () => void,
    type: MaterialType
}> = ({label, active, onClick, type}) => {
    
    // Generate a small CSS preview depending on material type
    const getPreview = () => {
        switch(type) {
            case MaterialType.SOLID:
                return <div className="w-5 h-5 rounded-md bg-slate-500 shadow-sm border border-slate-600" />;
            case MaterialType.METAL:
                return <div className="w-5 h-5 rounded-md bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 shadow-sm border border-slate-400" />;
            case MaterialType.WOOD:
                return <div className="w-5 h-5 rounded-md bg-amber-700 shadow-sm border border-amber-900 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]" />;
            case MaterialType.GLASS:
                return <div className="w-5 h-5 rounded-md bg-sky-200/40 shadow-sm border-2 border-sky-300/50 backdrop-blur-sm" />;
            case MaterialType.STONE:
                return <div className="w-5 h-5 rounded-md bg-stone-500 shadow-sm border border-stone-600 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:4px_4px]" />;
            case MaterialType.PLASTIC:
                return <div className="w-5 h-5 rounded-md bg-pink-400 shadow-sm border border-pink-500 saturate-150" />;
            case MaterialType.FABRIC:
                return <div className="w-5 h-5 rounded-md bg-indigo-400 shadow-sm border border-indigo-500 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.2)_2px,rgba(255,255,255,0.2)_4px)]" />;
            default:
                return <div className="w-5 h-5 rounded-md bg-gray-500" />;
        }
    }

    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-xl transition-all ${active ? 'bg-slate-800 text-white shadow-md scale-105' : 'bg-transparent text-slate-600 hover:bg-slate-100'}`}
        >
            {getPreview()}
            {label}
        </button>
    )
}

interface TactileButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  color: 'slate' | 'rose' | 'sky' | 'emerald' | 'amber' | 'indigo' | 'purple';
  compact?: boolean;
}

const TactileButton: React.FC<TactileButtonProps> = ({ onClick, disabled, icon, label, color, compact }) => {
  const colorStyles = {
    slate:   'bg-slate-200 text-slate-600 shadow-slate-300 hover:bg-slate-300',
    rose:    'bg-rose-500 text-white shadow-rose-700 hover:bg-rose-600',
    sky:     'bg-sky-500 text-white shadow-sky-700 hover:bg-sky-600',
    emerald: 'bg-emerald-500 text-white shadow-emerald-700 hover:bg-emerald-600',
    amber:   'bg-amber-400 text-amber-900 shadow-amber-600 hover:bg-amber-500',
    indigo:  'bg-indigo-500 text-white shadow-indigo-700 hover:bg-indigo-600',
    purple:  'bg-purple-500 text-white shadow-purple-700 hover:bg-purple-600'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`
        group relative flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all duration-100
        border-b-[4px] active:border-b-0 active:translate-y-[4px]
        ${compact ? 'p-2.5' : 'px-4 py-3'}
        ${disabled 
          ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed shadow-none' 
          : `${colorStyles[color]} border-black/20 shadow-lg`}
      `}
    >
      {icon}
      {!compact && <span>{label}</span>}
    </button>
  );
};

const BigActionButton: React.FC<{onClick: () => void, icon: React.ReactNode, label: string, color: 'rose'}> = ({ onClick, icon, label, color }) => {
    return (
        <button 
            onClick={onClick}
            title={label}
            className="group relative flex flex-col items-center justify-center w-32 h-32 rounded-3xl bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-900/30 border-b-[8px] border-rose-800 active:border-b-0 active:translate-y-[8px] transition-all duration-150"
        >
            <div className="mb-2">{icon}</div>
            <div className="text-sm font-black tracking-wider">{label}</div>
        </button>
    )
}

interface DropdownProps {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
    color: 'indigo' | 'emerald';
    direction?: 'up' | 'down';
    big?: boolean;
}

const DropdownMenu: React.FC<DropdownProps> = ({ icon, label, children, color, direction = 'down', big }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const bgClass = color === 'indigo' ? 'bg-indigo-500 hover:bg-indigo-600 border-indigo-800' : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-800';

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 font-bold text-white shadow-lg rounded-2xl transition-all active:scale-95
                    ${bgClass}
                    ${big ? 'px-8 py-4 text-lg border-b-[6px] active:border-b-0 active:translate-y-[6px]' : 'px-4 py-3 text-sm border-b-[4px] active:border-b-0 active:translate-y-[4px]'}
                `}
            >
                {icon}
                {label}
                <ChevronUp size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${direction === 'down' ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`
                    absolute left-0 ${direction === 'up' ? 'bottom-full mb-3' : 'top-full mt-3'} 
                    w-56 max-h-[60vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border-2 border-slate-100 p-2 flex flex-col gap-1 animate-in fade-in zoom-in duration-200 z-50
                `}>
                    {children}
                </div>
            )}
        </div>
    )
}

const DropdownItem: React.FC<{ onClick: () => void, onEdit?: (e: React.MouseEvent) => void, icon: React.ReactNode, label: string, highlight?: boolean, truncate?: boolean }> = ({ onClick, onEdit, icon, label, highlight, truncate }) => {
    return (
        <div className="relative group">
            <button 
                onClick={onClick}
                className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors text-left
                    ${highlight 
                        ? 'bg-gradient-to-r from-sky-50 to-blue-50 text-sky-600 hover:from-sky-100 hover:to-blue-100' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                `}
            >
                <div className="shrink-0">{icon}</div>
                <span className={truncate ? "truncate w-[80%] block overflow-hidden text-ellipsis whitespace-nowrap" : "w-full block"}>{label}</span>
            </button>
            {onEdit && (
                <button
                    onClick={onEdit}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all bg-white shadow-sm"
                    title="Edit build"
                >
                    <PenLine size={14} />
                </button>
            )}
        </div>
    )
}
