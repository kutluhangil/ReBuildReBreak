/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useEffect, useState } from 'react';
import { Play, Sparkles, Box, Wand2, Orbit } from 'lucide-react';

interface WelcomeScreenProps {
  visible: boolean;
  onDismiss: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ visible, onDismiss }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setTimeout(() => setMounted(true), 100);
    } else {
      setMounted(false);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`
        fixed inset-0 w-full h-full z-[100] flex items-center justify-center font-sans tracking-tight
        transition-all duration-700 ease-in-out backdrop-blur-2xl bg-white/60
        ${mounted ? 'opacity-100' : 'opacity-0'}
    `}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Abstract background blobs for a premium look */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-rose-300/30 to-purple-400/30 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-sky-300/30 to-indigo-400/30 blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <div className={`
          relative z-10 w-full max-w-5xl flex flex-col md:flex-row items-center gap-16 p-8 md:p-16
          transition-all duration-1000 delay-300 transform
          ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}
      `}>
          
          {/* Left Side: Content */}
          <div className="flex-1 flex flex-col items-start gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/5 border border-slate-900/10 mb-6">
                <Sparkles size={14} className="text-indigo-500" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Powered by Gemini AI</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter mb-6">
                ReBuild<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-600">ReBreak</span>
              </h1>
              <p className="text-xl md:text-2xl font-medium text-slate-600 leading-relaxed max-w-lg">
                The ultimate 3D voxel toy box. Sculpt, simulate physics, and use generative AI to morph your creations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="flex gap-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center border border-slate-100">
                  <Box className="text-rose-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Hyper-Sculpting</h3>
                  <p className="text-slate-500 text-sm font-medium mt-1">Carve, extrude, and paint voxels in real-time with responsive brush tools.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center border border-slate-100">
                  <Wand2 className="text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">AI Generation</h3>
                  <p className="text-slate-500 text-sm font-medium mt-1">Describe a structure and watch Gemini assemble it instantly from scratch.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center border border-slate-100">
                  <Orbit className="text-sky-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Live Physics</h3>
                  <p className="text-slate-500 text-sm font-medium mt-1">Tweak gravity and friction. Break your models into hundreds of simulated blocks.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={onDismiss}
              className="mt-4 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-indigo-600 transition-all hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1 active:translate-y-0 flex items-center gap-3 group"
            >
              Start Creating
              <Play fill="currentColor" size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Right Side: Demo Visual */}
          <div className="flex-1 w-full max-w-md aspect-square relative perspective-1000">
             <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-white rounded-full shadow-2xl border-4 border-white/50 overflow-hidden flex items-center justify-center">
                {/* CSS 3D Voxel Demo Box */}
                <div className="relative w-32 h-32 transform-style-3d animate-[spin-slow_12s_linear_infinite]">
                    {/* The core box */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-rose-500 opacity-90 shadow-[0_0_40px_rgba(79,70,229,0.5)] transform-style-3d rounded-xl">
                        {/* Smaller hovering bits to simulate voxels breaking/building */}
                        {[...Array(6)].map((_, i) => (
                           <div 
                             key={i} 
                             className="absolute w-8 h-8 bg-white/80 rounded-md backdrop-blur-sm border border-white/40 shadow-sm"
                             style={{
                               top: `${Math.random() * 100}%`,
                               left: `${Math.random() * 100}%`,
                               transform: `translateZ(${50 + Math.random() * 100}px) rotateX(${Math.random() * 360}deg) rotateY(${Math.random() * 360}deg)`,
                               animation: `float-slow ${3 + Math.random() * 3}s ease-in-out infinite alternate`
                             }}
                           />
                        ))}
                    </div>
                </div>
             </div>
          </div>

      </div>
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        @keyframes spin-slow {
          from { transform: rotateX(20deg) rotateY(0deg); }
          to { transform: rotateX(20deg) rotateY(360deg); }
        }
        @keyframes float-slow {
          from { transform: translateY(0px) translateZ(80px) rotate(0deg); }
          to { transform: translateY(-30px) translateZ(120px) rotate(45deg); }
        }
      `}</style>
    </div>
  );
};
