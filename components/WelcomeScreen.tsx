/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Github, Linkedin } from 'lucide-react';
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

  const features = [
    { num: t.welcome.feature1Number, title: t.welcome.feature1Title, desc: t.welcome.feature1Desc },
    { num: t.welcome.feature2Number, title: t.welcome.feature2Title, desc: t.welcome.feature2Desc },
    { num: t.welcome.feature3Number, title: t.welcome.feature3Title, desc: t.welcome.feature3Desc },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] w-full h-full overflow-hidden text-[#f1ede4] bg-[#0b0b0c]"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Subtle film grain + vignette */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.04), transparent 60%), radial-gradient(80% 60% at 50% 100%, rgba(218,168,99,0.08), transparent 70%)' }}
      />
      {/* Hairline grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #f1ede4 1px, transparent 1px), linear-gradient(to bottom, #f1ede4 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Ornamental crosshair markers in corners */}
      <Crosshair className="top-6 left-6" />
      <Crosshair className="top-6 right-6" />
      <Crosshair className="bottom-6 left-6" />
      <Crosshair className="bottom-6 right-6" />

      <div className={`
          relative z-10 h-full w-full flex flex-col
          transition-all duration-1000 ease-out
          ${contentIn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        `}>

        {/* Top bar */}
        <header className="flex items-center justify-between px-8 md:px-14 pt-8 md:pt-10">
          <div className="flex items-center gap-3">
            <Mark />
            <span className="hidden sm:inline text-[11px] tracking-[0.3em] uppercase text-[#f1ede4]/60 font-medium">
              ReBuild · ReBreak
            </span>
          </div>

          <LangToggle lang={lang} onChange={setLang} />
        </header>

        {/* Main editorial layout */}
        <main className="flex-1 grid grid-cols-12 px-8 md:px-14 pt-12 md:pt-20 pb-10 gap-x-8 gap-y-12">
          {/* Eyebrow + index column */}
          <aside className="col-span-12 md:col-span-2 flex md:flex-col md:items-start items-center justify-between md:justify-start gap-4 md:gap-10 md:border-r md:border-[#f1ede4]/10 md:pr-6">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.32em] uppercase text-[#f1ede4]/55">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#daa863]" />
              {t.welcome.eyebrow}
            </div>
            <div className="hidden md:block text-[10px] tracking-[0.32em] uppercase text-[#f1ede4]/40 font-mono">
              {monoIndex(lang)}
            </div>
          </aside>

          {/* Title + tagline column */}
          <section className="col-span-12 md:col-span-7 flex flex-col">
            <h1
              className="leading-[0.88] tracking-[-0.02em] text-[#f1ede4]"
              style={{ fontFamily: "'Instrument Serif', 'Times New Roman', serif", fontWeight: 400 }}
            >
              <span className="block text-[18vw] md:text-[10.5rem] lg:text-[12.5rem]">
                {t.welcome.title1}
              </span>
              <span
                className="block text-[18vw] md:text-[10.5rem] lg:text-[12.5rem] italic"
                style={{
                  background: 'linear-gradient(90deg, #f1ede4 0%, #daa863 50%, #f1ede4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t.welcome.title2}
              </span>
            </h1>

            <p className="mt-10 max-w-xl text-[15px] md:text-[17px] leading-relaxed text-[#f1ede4]/70 font-light">
              {t.welcome.tagline}
            </p>

            <div className="mt-12 flex items-center gap-6 flex-wrap">
              <button
                onClick={onDismiss}
                className="group relative inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-[#f1ede4] text-[#0b0b0c] text-sm font-medium tracking-wide transition-all duration-300 hover:bg-[#daa863] hover:pr-3"
              >
                <span>{t.welcome.enter}</span>
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#0b0b0c] text-[#f1ede4] transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight size={16} strokeWidth={2} />
                </span>
              </button>

              <span className="text-[10px] tracking-[0.32em] uppercase text-[#f1ede4]/35 font-mono">
                {t.welcome.scrollHint} · ↵
              </span>
            </div>
          </section>

          {/* Features column */}
          <section className="col-span-12 md:col-span-3 flex flex-col gap-6 md:border-l md:border-[#f1ede4]/10 md:pl-6">
            {features.map((f) => (
              <article key={f.num} className="group flex flex-col gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[11px] text-[#daa863]/80 tracking-widest">{f.num}</span>
                  <span className="h-px flex-1 bg-[#f1ede4]/15" />
                </div>
                <h3
                  className="text-2xl md:text-[1.6rem] tracking-tight text-[#f1ede4]"
                  style={{ fontFamily: "'Instrument Serif', 'Times New Roman', serif", fontWeight: 400 }}
                >
                  {f.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-[#f1ede4]/55 font-light">{f.desc}</p>
              </article>
            ))}
          </section>
        </main>

        {/* Footer credit */}
        <footer className="px-8 md:px-14 pb-8 md:pb-10 flex items-end justify-between gap-6 flex-wrap">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] tracking-[0.32em] uppercase text-[#f1ede4]/35 font-mono">
              MMXXVI · Studio Edition
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] tracking-[0.18em] uppercase text-[#f1ede4]/50">
                {t.welcome.designedBy}
              </span>
              <span
                className="text-lg italic text-[#f1ede4]"
                style={{ fontFamily: "'Instrument Serif', 'Times New Roman', serif" }}
              >
                kutluhangil
              </span>
              <span className="h-3 w-px bg-[#f1ede4]/20" />
              <SocialLink href="https://github.com/kutluhangil" label="GitHub">
                <Github size={14} strokeWidth={1.75} />
              </SocialLink>
              <SocialLink href="https://www.linkedin.com/in/kutluhangil/" label="LinkedIn">
                <Linkedin size={14} strokeWidth={1.75} />
              </SocialLink>
            </div>
          </div>

          <div className="text-[10px] tracking-[0.32em] uppercase text-[#f1ede4]/30 font-mono text-right">
            <div>v.01</div>
            <div className="mt-1">Voxel · Physics · Gemini</div>
          </div>
        </footer>
      </div>
    </div>
  );
};

const Crosshair: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`pointer-events-none absolute w-3 h-3 ${className}`}>
    <span className="absolute top-1/2 left-0 right-0 h-px bg-[#f1ede4]/30" />
    <span className="absolute left-1/2 top-0 bottom-0 w-px bg-[#f1ede4]/30" />
  </div>
);

const Mark: React.FC = () => (
  <div className="relative w-7 h-7">
    <div className="absolute inset-0 border border-[#f1ede4]/40 rounded-[4px]" />
    <div className="absolute inset-[5px] bg-[#daa863]/90 rounded-[2px]" />
    <div className="absolute -bottom-px -right-px w-1.5 h-1.5 bg-[#f1ede4]" />
  </div>
);

const SocialLink: React.FC<{ href: string; label: string; children: React.ReactNode }> = ({ href, label, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-[#f1ede4]/20 text-[#f1ede4]/60 hover:text-[#0b0b0c] hover:bg-[#daa863] hover:border-[#daa863] transition-colors"
  >
    {children}
  </a>
);

const LangToggle: React.FC<{ lang: Language; onChange: (l: Language) => void }> = ({ lang, onChange }) => {
  return (
    <div className="relative inline-flex items-center p-1 rounded-full border border-[#f1ede4]/15 bg-[#f1ede4]/[0.03] backdrop-blur-sm">
      <span
        className={`
          absolute top-1 bottom-1 w-[42px] rounded-full bg-[#f1ede4] transition-transform duration-300 ease-out
          ${lang === 'en' ? 'translate-x-0' : 'translate-x-[42px]'}
        `}
      />
      {(['en', 'tr'] as const).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={`
            relative z-10 w-[42px] py-1.5 text-[11px] font-mono tracking-[0.18em] uppercase transition-colors
            ${lang === l ? 'text-[#0b0b0c]' : 'text-[#f1ede4]/60 hover:text-[#f1ede4]'}
          `}
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
};

const monoIndex = (lang: Language) => (lang === 'tr' ? 'INDEX / 01—03' : 'INDEX / 01—03');
