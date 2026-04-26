import React, { useState, useEffect } from 'react';
import { SavedModel } from '../types';
import { Folder, PenLine, Trash2 } from 'lucide-react';

interface BuildEditModalProps {
  isOpen: boolean;
  build: SavedModel | null;
  onClose: () => void;
  onSave: (id: string, newName: string, newFolder?: string) => void;
  onDelete: (id: string) => void;
}

export const BuildEditModal: React.FC<BuildEditModalProps> = ({ 
  isOpen, 
  build, 
  onClose, 
  onSave, 
  onDelete 
}) => {
  const [name, setName] = useState('');
  const [folder, setFolder] = useState('');

  useEffect(() => {
      if (isOpen && build) {
          setName(build.name);
          setFolder(build.folder || '');
      }
  }, [isOpen, build]);

  if (!isOpen || !build) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-3xl shadow-2xl w-[400px] animate-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            <PenLine className="text-indigo-500" />
            Edit Build
        </h2>
        
        <div className="flex flex-col gap-4">
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Name</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 font-medium text-slate-700 focus:outline-none focus:border-indigo-400 mt-1"
                />
            </div>
            
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Folder</label>
                <div className="relative">
                    <Folder className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        value={folder} 
                        onChange={e => setFolder(e.target.value)}
                        placeholder="Uncategorized"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-2 font-medium text-slate-700 focus:outline-none focus:border-indigo-400 mt-1"
                    />
                </div>
            </div>
        </div>

        <div className="flex gap-2 mt-8">
          <button 
            onClick={() => onDelete(build.id)}
            className="px-4 border-2 border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-colors flex items-center justify-center"
          >
            <Trash2 size={18} />
          </button>
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
                onSave(build.id, name, folder.trim() || undefined);
                onClose();
            }}
            className="flex-1 px-4 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
