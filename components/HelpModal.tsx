import React from "react";
import { X, Keyboard, Mouse, HelpCircle } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: "Brush Tools",
      items: [
        { key: "1", description: "Add Voxel" },
        { key: "2", description: "Remove Voxel" },
        { key: "3", description: "Paint Voxel" },
        { key: "4", description: "Sculpt" },
      ],
    },
    {
      category: "Editing",
      items: [
        { key: "Ctrl+Z", description: "Undo" },
        { key: "Ctrl+Y", description: "Redo" },
        { key: "Ctrl+S", description: "Save Build" },
        { key: "Ctrl+E", description: "Export GLTF" },
      ],
    },
    {
      category: "View",
      items: [
        { key: "F1", description: "Toggle Help (this menu)" },
        { key: "Esc", description: "Close Modals" },
      ],
    },
    {
      category: "Mouse",
      items: [
        { key: "Left Click", description: "Place/Modify Voxel" },
        { key: "Right Click + Drag", description: "Rotate View" },
        { key: "Scroll", description: "Zoom" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <HelpCircle size={24} />
            <h2 className="text-2xl font-bold">Keyboard Shortcuts & Help</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {shortcuts.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                {section.category === "Brush Tools" && (
                  <Keyboard size={18} className="text-indigo-600" />
                )}
                {section.category === "Editing" && (
                  <Keyboard size={18} className="text-purple-600" />
                )}
                {section.category === "View" && (
                  <HelpCircle size={18} className="text-blue-600" />
                )}
                {section.category === "Mouse" && (
                  <Mouse size={18} className="text-emerald-600" />
                )}
                {section.category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <kbd className="px-2 py-1 bg-slate-200 border border-slate-300 rounded text-sm font-mono font-semibold text-slate-700 whitespace-nowrap">
                      {item.key}
                    </kbd>
                    <span className="text-slate-700 text-sm">
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Tips Section */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-2">💡 Tips:</h4>
            <ul className="text-sm text-blue-900 space-y-1">
              <li>
                • Hold down the mouse button to continuously place/remove voxels
              </li>
              <li>• Use the Brush Size slider for larger area editing</li>
              <li>• Enable Symmetry to mirror edits across axes</li>
              <li>
                • Recent saves appear in the dropdown menu for quick access
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 rounded-b-2xl border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
