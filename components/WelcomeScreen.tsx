/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useEffect, useState } from 'react';
import {
  ArrowRight, Sparkles, Github, Linkedin,
  Bird, Cat, Rabbit, Bot, Home, Trees, Users, Wand2,
  Plus, Eraser, Paintbrush, Fingerprint, Sticker,
  Box, Zap, Layers, Save,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/translations';

interface WelcomeScreenProps {
  visible: boolean;
  onDismiss: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ visible, onDismiss }) => {
  const [contentIn, setContentIn] = useState(false);
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    if (visible) {
      const id = window.requestAnimationFrame(() => setContentIn(true));
      return () => window.cancelAnimationFrame(id);
    }
    setContentIn(false);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] w-full h-full overflow-y-auto bg-[#fff7ec] text-slate-800"
      style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}
    >
      {/* Soft pastel blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-gradient-to-br from-rose-200/60 to-amber-200/40 blur-3xl" />
        <div className="absolute top-[20%] right-[-15%] w-[45%] h-[45%] rounded-full bg-gradient-to-tr from-sky-200/50 to-purple-200/40 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-emerald-200/50 to-yellow-200/40 blur-3xl" />
      </div>
      {/* Tiny dot grid */}
      <div className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(rgba(15,23,42,0.12) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className={`
          relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-10
          transition-all duration-700 ease-out
          ${contentIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <VoxelMark />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-extrabold text-slate-900 tracking-tight">ReBuild·ReBreak</span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-bold">Voxel Toy Box</span>
            </div>
          </div>

          <LangToggle lang={lang} onChange={setLang} />
        </header>

        {/* Hero */}
        <section className="mt-10 md:mt-14 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 relative">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border-2 border-slate-900/5 shadow-sm">
              <Sparkles size={13} className="text-amber-500" strokeWidth={2.5} />
              <span className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-slate-600">{t.welcome.badge}</span>
            </span>

            <h1 className="mt-6 text-[14vw] md:text-[5.6rem] lg:text-[6.5rem] leading-[0.92] tracking-tight font-black text-slate-900">
              <span className="block">{t.welcome.title1}</span>
              <span className="block">
                <span
                  className="italic font-medium"
                  style={{
                    fontFamily: "'Instrument Serif', 'Times New Roman', serif",
                    background: 'linear-gradient(120deg, #f43f5e 0%, #f59e0b 60%, #ec4899 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {t.welcome.title2}
                </span>
              </span>
              <span className="block">
                <span
                  className="italic font-medium"
                  style={{
                    fontFamily: "'Instrument Serif', 'Times New Roman', serif",
                    background: 'linear-gradient(120deg, #6366f1 0%, #06b6d4 50%, #10b981 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {t.welcome.title3}
                </span>
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base md:text-lg text-slate-600 leading-relaxed font-medium">
              {t.welcome.tagline}
            </p>

            <div className="mt-9 flex items-center gap-4 flex-wrap">
              <button
                onClick={onDismiss}
                className="group relative inline-flex items-center gap-3 pl-7 pr-3 py-3 rounded-2xl bg-slate-900 text-white font-extrabold text-base tracking-tight border-b-[6px] border-slate-950 shadow-[0_8px_0_0_rgba(15,23,42,0.18)] hover:bg-slate-800 active:translate-y-[3px] active:border-b-[3px] active:shadow-[0_4px_0_0_rgba(15,23,42,0.18)] transition-all"
              >
                <span>{t.welcome.cta}</span>
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-400 text-slate-900 transition-transform group-hover:translate-x-1">
                  <ArrowRight size={18} strokeWidth={3} />
                </span>
              </button>
              <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">
                {t.welcome.ctaHint}
              </span>
            </div>
          </div>

          {/* Floating voxel stack */}
          <div className="lg:col-span-5 relative h-[340px] md:h-[420px] flex items-center justify-center">
            <VoxelDiorama />
          </div>
        </section>

        {/* Features */}
        <section className="mt-20 md:mt-24">
          <SectionHeader number="01" title={t.welcome.featuresHeading} />
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            <FeatureCard
              tone="rose"
              icon={<Fingerprint size={22} strokeWidth={2.5} />}
              title={t.welcome.features.sculpt.title}
              desc={t.welcome.features.sculpt.desc}
            />
            <FeatureCard
              tone="purple"
              icon={<Wand2 size={22} strokeWidth={2.5} />}
              title={t.welcome.features.ai.title}
              desc={t.welcome.features.ai.desc}
              shimmer
            />
            <FeatureCard
              tone="amber"
              icon={<Zap size={22} strokeWidth={2.5} />}
              title={t.welcome.features.physics.title}
              desc={t.welcome.features.physics.desc}
            />
            <FeatureCard
              tone="sky"
              icon={<Layers size={22} strokeWidth={2.5} />}
              title={t.welcome.features.materials.title}
              desc={t.welcome.features.materials.desc}
            />
            <FeatureCard
              tone="emerald"
              icon={<Box size={22} strokeWidth={2.5} />}
              title={t.welcome.features.models.title}
              desc={t.welcome.features.models.desc}
            />
            <FeatureCard
              tone="slate"
              icon={<Save size={22} strokeWidth={2.5} />}
              title={t.welcome.features.save.title}
              desc={t.welcome.features.save.desc}
            />
          </div>
        </section>

        {/* Models showcase */}
        <section className="mt-16 md:mt-20">
          <SectionHeader number="02" title={t.welcome.modelsHeading} />
          <div className="mt-6 flex flex-wrap gap-3">
            <ModelChip tone="rose" icon={<Bird size={18} strokeWidth={2.5} />} label={t.welcome.modelsItems.eagle} />
            <ModelChip tone="amber" icon={<Cat size={18} strokeWidth={2.5} />} label={t.welcome.modelsItems.cat} />
            <ModelChip tone="pink" icon={<Rabbit size={18} strokeWidth={2.5} />} label={t.welcome.modelsItems.rabbit} />
            <ModelChip tone="sky" icon={<Bot size={18} strokeWidth={2.5} />} label={t.welcome.modelsItems.robot} />
            <ModelChip tone="orange" icon={<Home size={18} strokeWidth={2.5} />} label={t.welcome.modelsItems.house} />
            <ModelChip tone="emerald" icon={<Trees size={18} strokeWidth={2.5} />} label={t.welcome.modelsItems.terrain} />
            <ModelChip tone="purple" icon={<Users size={18} strokeWidth={2.5} />} label={t.welcome.modelsItems.twins} />
            <ModelChip tone="indigo" icon={<Wand2 size={18} strokeWidth={2.5} />} label={t.welcome.modelsItems.ai} highlight />
          </div>
        </section>

        {/* Tools + Materials side-by-side */}
        <section className="mt-16 md:mt-20 grid md:grid-cols-2 gap-6">
          <div>
            <SectionHeader number="03" title={t.welcome.toolsHeading} small />
            <div className="mt-5 flex flex-wrap gap-2">
              <ToolPill icon={<Plus size={15} strokeWidth={3} />} label={t.welcome.tools.add} />
              <ToolPill icon={<Eraser size={15} strokeWidth={3} />} label={t.welcome.tools.remove} />
              <ToolPill icon={<Paintbrush size={15} strokeWidth={3} />} label={t.welcome.tools.paint} />
              <ToolPill icon={<Fingerprint size={15} strokeWidth={3} />} label={t.welcome.tools.sculpt} />
              <ToolPill icon={<Sticker size={15} strokeWidth={3} />} label={t.welcome.tools.decal} />
            </div>
          </div>
          <div>
            <SectionHeader number="04" title={t.welcome.materialsHeading} small />
            <div className="mt-5 flex flex-wrap gap-2">
              <MaterialChip swatch={<div className="w-3.5 h-3.5 rounded bg-slate-500" />} label={t.welcome.materials.solid} />
              <MaterialChip swatch={<div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600" />} label={t.welcome.materials.metal} />
              <MaterialChip swatch={<div className="w-3.5 h-3.5 rounded bg-amber-700" />} label={t.welcome.materials.wood} />
              <MaterialChip swatch={<div className="w-3.5 h-3.5 rounded bg-sky-200/60 border border-sky-300" />} label={t.welcome.materials.glass} />
              <MaterialChip swatch={<div className="w-3.5 h-3.5 rounded bg-stone-500" />} label={t.welcome.materials.stone} />
              <MaterialChip swatch={<div className="w-3.5 h-3.5 rounded bg-pink-400" />} label={t.welcome.materials.plastic} />
              <MaterialChip swatch={<div className="w-3.5 h-3.5 rounded bg-indigo-400" />} label={t.welcome.materials.fabric} />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 md:mt-24 mb-6 pt-8 border-t-2 border-dashed border-slate-900/10 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-slate-400">
              {t.welcome.designedBy}
            </span>
            <a
              href="https://github.com/kutluhangil"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl text-slate-900 hover:text-rose-500 transition-colors"
              style={{ fontFamily: "'Instrument Serif', 'Times New Roman', serif", fontStyle: 'italic', fontWeight: 500 }}
            >
              kutluhangil
            </a>
            <span className="h-4 w-px bg-slate-300" />
            <SocialLink href="https://github.com/kutluhangil" label="GitHub">
              <Github size={15} strokeWidth={2.25} />
            </SocialLink>
            <SocialLink href="https://www.linkedin.com/in/kutluhangil/" label="LinkedIn">
              <Linkedin size={15} strokeWidth={2.25} />
            </SocialLink>
          </div>
          <div className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-slate-400">
            {t.welcome.footerNote}
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes voxel-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes voxel-spin {
          from { transform: rotateX(-25deg) rotateY(0deg); }
          to { transform: rotateX(-25deg) rotateY(360deg); }
        }
        @keyframes shimmer-card {
          0%, 100% { transform: translateX(-100%); }
          60%, 100% { transform: translateX(120%); }
        }
        .voxel-3d-stage { perspective: 1000px; }
        .voxel-3d-spin { transform-style: preserve-3d; animation: voxel-spin 18s linear infinite; }
        .voxel-3d-face { position: absolute; width: 100%; height: 100%; }
      `}</style>
    </div>
  );
};

/* ================== Pieces ================== */

const SectionHeader: React.FC<{ number: string; title: string; small?: boolean }> = ({ number, title, small }) => (
  <div className="flex items-baseline gap-3">
    <span className="font-mono text-[11px] tracking-[0.18em] text-slate-400 font-bold">{number}</span>
    <h2 className={`${small ? 'text-lg' : 'text-2xl md:text-3xl'} font-black tracking-tight text-slate-900`}>{title}</h2>
    <span className="flex-1 h-px bg-slate-900/10" />
  </div>
);

type Tone = 'rose' | 'sky' | 'amber' | 'emerald' | 'purple' | 'slate' | 'pink' | 'orange' | 'indigo';

const TONE_BG: Record<Tone, string> = {
  rose:    'bg-rose-50 border-rose-200',
  sky:     'bg-sky-50 border-sky-200',
  amber:   'bg-amber-50 border-amber-200',
  emerald: 'bg-emerald-50 border-emerald-200',
  purple:  'bg-purple-50 border-purple-200',
  slate:   'bg-slate-50 border-slate-200',
  pink:    'bg-pink-50 border-pink-200',
  orange:  'bg-orange-50 border-orange-200',
  indigo:  'bg-indigo-50 border-indigo-200',
};
const TONE_ICON: Record<Tone, string> = {
  rose:    'bg-rose-500 text-white shadow-rose-300',
  sky:     'bg-sky-500 text-white shadow-sky-300',
  amber:   'bg-amber-400 text-slate-900 shadow-amber-300',
  emerald: 'bg-emerald-500 text-white shadow-emerald-300',
  purple:  'bg-purple-500 text-white shadow-purple-300',
  slate:   'bg-slate-800 text-white shadow-slate-400',
  pink:    'bg-pink-500 text-white shadow-pink-300',
  orange:  'bg-orange-500 text-white shadow-orange-300',
  indigo:  'bg-indigo-500 text-white shadow-indigo-300',
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string; tone: Tone; shimmer?: boolean }> = ({ icon, title, desc, tone, shimmer }) => (
  <div className={`relative overflow-hidden p-5 md:p-6 rounded-3xl border-2 ${TONE_BG[tone]} bg-white/70 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300 group`}>
    {shimmer && (
      <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:animate-[shimmer-card_1.4s_ease-out] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    )}
    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg ${TONE_ICON[tone]} mb-4`}>
      {icon}
    </div>
    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{title}</h3>
    <p className="mt-1.5 text-sm text-slate-600 leading-relaxed font-medium">{desc}</p>
  </div>
);

const ModelChip: React.FC<{ icon: React.ReactNode; label: string; tone: Tone; highlight?: boolean }> = ({ icon, label, tone, highlight }) => (
  <div
    className={`
      inline-flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-2xl border-2 bg-white shadow-[0_3px_0_0_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_rgba(15,23,42,0.1)] transition-all
      ${highlight ? 'border-slate-900 ring-2 ring-amber-200' : 'border-slate-900/10'}
    `}
  >
    <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${TONE_ICON[tone]}`}>{icon}</span>
    <span className="text-sm font-extrabold text-slate-800 tracking-tight">{label}</span>
  </div>
);

const ToolPill: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border-2 border-slate-900/10 shadow-[0_2px_0_0_rgba(15,23,42,0.06)] text-sm font-bold text-slate-700">
    <span className="text-slate-500">{icon}</span>
    {label}
  </div>
);

const MaterialChip: React.FC<{ swatch: React.ReactNode; label: string }> = ({ swatch, label }) => (
  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border-2 border-slate-900/10 shadow-[0_2px_0_0_rgba(15,23,42,0.06)] text-sm font-bold text-slate-700">
    {swatch}
    {label}
  </div>
);

const VoxelMark: React.FC = () => (
  <div className="relative w-9 h-9 voxel-3d-stage">
    <div className="absolute inset-0 voxel-3d-spin" style={{ animationDuration: '12s' }}>
      <Cube size={36} colors={{ top: '#fbbf24', front: '#f43f5e', right: '#6366f1' }} />
    </div>
  </div>
);

const SocialLink: React.FC<{ href: string; label: string; children: React.ReactNode }> = ({ href, label, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white border-2 border-slate-900/10 text-slate-600 hover:text-white hover:bg-slate-900 hover:border-slate-900 shadow-[0_2px_0_0_rgba(15,23,42,0.08)] transition-colors"
  >
    {children}
  </a>
);

const LangToggle: React.FC<{ lang: Language; onChange: (l: Language) => void }> = ({ lang, onChange }) => (
  <div className="relative inline-flex items-center p-1 rounded-2xl border-2 border-slate-900/10 bg-white shadow-[0_3px_0_0_rgba(15,23,42,0.08)]">
    <span
      className={`
        absolute top-1 bottom-1 w-[46px] rounded-xl bg-slate-900 transition-transform duration-300 ease-out
        ${lang === 'en' ? 'translate-x-0' : 'translate-x-[46px]'}
      `}
    />
    {(['en', 'tr'] as const).map((l) => (
      <button
        key={l}
        onClick={() => onChange(l)}
        className={`
          relative z-10 w-[46px] py-1.5 text-xs font-extrabold tracking-widest uppercase transition-colors
          ${lang === l ? 'text-amber-300' : 'text-slate-500 hover:text-slate-800'}
        `}
        aria-pressed={lang === l}
      >
        {l}
      </button>
    ))}
  </div>
);

/* ============== Voxel diorama (CSS 3D) ============== */

const Cube: React.FC<{ size: number; colors: { top: string; front: string; right: string } }> = ({ size, colors }) => {
  const half = size / 2;
  const faceStyle: React.CSSProperties = { width: size, height: size, position: 'absolute', borderRadius: 4 };
  return (
    <div className="relative" style={{ width: size, height: size, transformStyle: 'preserve-3d' }}>
      <div style={{ ...faceStyle, background: colors.front, transform: `translateZ(${half}px)`, boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.08)' }} />
      <div style={{ ...faceStyle, background: colors.right, transform: `rotateY(90deg) translateZ(${half}px)`, boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.12)' }} />
      <div style={{ ...faceStyle, background: colors.top, transform: `rotateX(90deg) translateZ(${half}px)`, boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.06)' }} />
    </div>
  );
};

const VoxelDiorama: React.FC = () => {
  const blocks = [
    { x: -90, y: 60, z: 0,  size: 70, dur: 5,  delay: 0,    colors: { top: '#fda4af', front: '#f43f5e', right: '#be123c' } },
    { x: 0,   y: -10, z: 40, size: 90, dur: 6,  delay: 0.4,  colors: { top: '#fde68a', front: '#f59e0b', right: '#b45309' } },
    { x: 95,  y: 50, z: 20, size: 64, dur: 5.2, delay: 0.8,  colors: { top: '#bae6fd', front: '#0ea5e9', right: '#0369a1' } },
    { x: -60, y: -90, z: -20, size: 56, dur: 4.6, delay: 0.2, colors: { top: '#bbf7d0', front: '#10b981', right: '#047857' } },
    { x: 70,  y: -90, z: 0,  size: 50, dur: 5.6, delay: 0.6, colors: { top: '#ddd6fe', front: '#8b5cf6', right: '#5b21b6' } },
    { x: -20, y: 130, z: -10, size: 44, dur: 4.2, delay: 0.9, colors: { top: '#fbcfe8', front: '#ec4899', right: '#9d174d' } },
  ];
  return (
    <div className="relative w-full h-full voxel-3d-stage">
      <div className="absolute inset-0 flex items-center justify-center">
        {/* soft floor disc */}
        <div className="absolute bottom-12 w-72 h-12 bg-slate-900/10 rounded-full blur-2xl" />
        {blocks.map((b, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              transform: `translate(${b.x}px, ${b.y}px)`,
              animation: `voxel-float ${b.dur}s ease-in-out ${b.delay}s infinite`,
            }}
          >
            <div
              className="voxel-3d-spin"
              style={{
                animationDuration: `${b.dur * 4}s`,
                animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
              }}
            >
              <Cube size={b.size} colors={b.colors} />
            </div>
          </div>
        ))}
        {/* center hero block */}
        <div
          className="relative voxel-3d-spin"
          style={{ animationDuration: '14s' }}
        >
          <Cube size={120} colors={{ top: '#fef3c7', front: '#f97316', right: '#c2410c' }} />
        </div>
      </div>
    </div>
  );
};
