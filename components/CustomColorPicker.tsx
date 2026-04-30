import React, { useState, useEffect } from 'react';
import { Palette, X } from 'lucide-react';

interface CustomColorPickerProps {
    color: string;
    onChange: (color: string) => void;
}

export const CustomColorPicker: React.FC<CustomColorPickerProps> = ({ color, onChange }) => {
    const [recentColors, setRecentColors] = useState<string[]>(['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3']);
    const [hexInput, setHexInput] = useState(color);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setHexInput(color);
        // Add to recent colors if not exists
        if (!recentColors.includes(color.toUpperCase())) {
            const newRecents = [color.toUpperCase(), ...recentColors].slice(0, 10);
            setRecentColors(newRecents);
        }
    }, [color]);

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setHexInput(val);
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            onChange(val.toUpperCase());
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-lg p-1.5 hover:border-sky-400 transition-colors"
                title="Open Color Picker"
            >
                <div className="flex items-center gap-2">
                    <div 
                        className="w-5 h-5 rounded shadow-inner border border-black/10" 
                        style={{ backgroundColor: color }} 
                    />
                    <span className="text-xs font-mono font-bold text-slate-600">{color.toUpperCase()}</span>
                </div>
                <Palette size={14} className="text-slate-400" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-[105%] top-0 ml-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border-2 border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-left-4 duration-200">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-slate-700">Custom Color</h4>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={16} />
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                <span className="text-xs font-bold text-slate-400 select-none">HEX</span>
                                <input 
                                    type="text" 
                                    value={hexInput}
                                    onChange={handleHexChange}
                                    maxLength={7}
                                    className="w-full bg-transparent border-none text-sm font-mono font-bold text-slate-700 focus:outline-none uppercase"
                                />
                            </label>

                            <input 
                                type="color" 
                                value={color}
                                onChange={e => onChange(e.target.value.toUpperCase())}
                                className="w-full h-10 rounded-xl cursor-pointer"
                            />

                            <div>
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recent Colors</h5>
                                <div className="flex flex-wrap gap-2">
                                    {recentColors.map(rc => (
                                        <button
                                            key={rc}
                                            onClick={() => onChange(rc)}
                                            className={`w-6 h-6 rounded-md shadow-sm border border-black/10 hover:scale-110 transition-transform ${color.toUpperCase() === rc ? 'ring-2 ring-sky-500 ring-offset-1' : ''}`}
                                            title={rc}
                                            style={{ backgroundColor: rc }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
