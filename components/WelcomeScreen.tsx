/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useEffect, useState } from 'react';
import { Play, Sparkles, Box, Wand2, Orbit, Bird, Cat, Rabbit, Hammer, Trees, Bot, Home } from 'lucide-react';

interface WelcomeScreenProps {
  visible: boolean;
  onDismiss: () => void;
}

const cardContent = [
    { icon: <Bird size={24} className="text-emerald-500" />, title: "Eagle", color: "bg-emerald-100" },
    { icon: <Cat size={24} className="text-amber-500" />, title: "Cat", color: "bg-amber-100" },
    { icon: <Trees size={24} className="text-emerald-500" />, title: "Terrain", color: "bg-emerald-100" },
    { icon: <Rabbit size={24} className="text-rose-500" />, title: "Rabbit", color: "bg-rose-100" },
    { icon: <Wand2 size={24} className="text-purple-500" />, title: "AI Gen", color: "bg-purple-100" },
    { icon: <Bot size={24} className="text-sky-500" />, title: "Robot", color: "bg-sky-100" },
    { icon: <Hammer size={24} className="text-slate-500" />, title: "Tools", color: "bg-slate-100" },
    { icon: <Home size={24} className="text-orange-500" />, title: "House", color: "bg-orange-100" }
];

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
              className="relative mt-4 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-indigo-600 transition-all duration-300 hover:shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] hover:-translate-y-1 active:translate-y-0 flex items-center gap-3 group overflow-hidden border border-slate-800 hover:border-indigo-400"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="relative z-10">Start Creating</span>
              <Play fill="currentColor" size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Right Side: Demo Visual */}
          <div className="flex-1 w-full max-w-md aspect-square relative perspective-[1200px] flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-slate-200/50 rounded-[3rem] shadow-2xl border-4 border-white/60 overflow-hidden flex items-center justify-center">
                
                {/* Central glowing core */}
                <div className="absolute w-28 h-28 bg-gradient-to-br from-indigo-500 to-rose-500 rounded-3xl shadow-[0_0_80px_rgba(79,70,229,0.5)] animate-pulse border border-white/20 flex items-center justify-center transform-style-3d" style={{ animationDuration: '4s' }}>
                   <div className="w-16 h-16 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30 animate-[spin-slow_8s_linear_infinite]" />
                </div>

                {/* Orbiting Cards */}
                <div className="relative w-full h-full transform-style-3d animate-[spin-slow_24s_linear_infinite]">
                    {cardContent.map((card, i) => {
                        return (
                           <div 
                             key={i} 
                             className="absolute top-1/2 left-1/2 transform-style-3d"
                             style={{
                               transform: `rotateY(${i * 45}deg) translateZ(160px) rotateX(15deg)`,
                             }}
                           >
                             <div 
                               className="w-24 h-32 bg-white/80 rounded-2xl backdrop-blur-xl border-2 border-white/80 shadow-2xl flex flex-col items-center p-3 gap-2 -ml-12 -mt-16"
                               style={{
                                 animation: `float-card ${3 + i%2}s ease-in-out infinite alternate`,
                                 animationDelay: `${i * 0.4}s`,
                               }}
                             >
                                <div className={`w-full flex-1 rounded-xl ${card.color} shadow-inner flex flex-col items-center justify-center border border-white/50`}>
                                    {card.icon}
                                </div>
                                <div className="w-full flex flex-col gap-1.5 mt-1 items-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{card.title}</span>
                                    <div className="flex gap-1">
                                      <div className="h-1 w-6 bg-slate-200 rounded-full" />
                                      <div className="h-1 w-3 bg-slate-200 rounded-full" />
                                    </div>
                                </div>
                             </div>
                           </div>
                        )
                    })}
                </div>
             </div>
          </div>
      </div>
      <style>{`
        .perspective-\\[1200px\\] { perspective: 1200px; }
        .transform-style-3d { transform-style: preserve-3d; }
        @keyframes spin-slow {
          from { transform: rotateX(-15deg) rotateY(0deg); }
          to { transform: rotateX(-15deg) rotateY(360deg); }
        }
        @keyframes float-card {
          from { transform: translateY(-10px) rotateZ(-3deg); }
          to { transform: translateY(10px) rotateZ(3deg); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
