export type Language = 'en' | 'tr';

export const translations = {
  en: {
    welcome: {
      badge: 'A tiny voxel toy box',
      title1: 'Build it.',
      title2: 'Break it.',
      title3: 'Rebuild it.',
      tagline: 'Sculpt chunky 3D blocks, summon shapes with AI, then send the whole thing tumbling with real physics. Snack-sized, deeply tinkerable.',
      cta: 'Start playing',
      ctaHint: 'no signup · runs in your browser',
      featuresHeading: "What's inside",
      features: {
        sculpt: { title: 'Sculpt', desc: 'Add, erase, paint and carve voxels with five tactile brushes.' },
        ai: { title: 'AI Build', desc: 'Type "a tiny dragon" and watch Gemini compose it block by block.' },
        physics: { title: 'Physics', desc: 'Tune gravity, friction and explosions, then watch your tower fall.' },
        materials: { title: 'Materials', desc: 'Seven looks — glass that refracts, metal that shines, fabric that softens.' },
        models: { title: '8 Starters', desc: 'Begin from a friendly creature, a house, a forest or a robot.' },
        save: { title: 'Save & Share', desc: 'Save to your browser, export GLTF, import any voxel JSON.' },
      },
      modelsHeading: 'Pick a starter',
      modelsItems: { eagle: 'Eagle', cat: 'Cat', rabbit: 'Rabbit', robot: 'Robot', house: 'House', terrain: 'Terrain', twins: 'Twins', ai: 'Surprise me' },
      toolsHeading: 'Tools at hand',
      tools: { add: 'Add', remove: 'Erase', paint: 'Paint', sculpt: 'Sculpt', decal: 'Decal' },
      materialsHeading: 'Pick a material',
      materials: { solid: 'Solid', metal: 'Metal', wood: 'Wood', glass: 'Glass', stone: 'Stone', plastic: 'Plastic', fabric: 'Fabric' },
      footerNote: 'Made with three.js · React · Gemini',
      designedBy: 'Designed by',
    },
  },
  tr: {
    welcome: {
      badge: 'Minik bir voksel oyun kutusu',
      title1: 'İnşa et.',
      title2: 'Parçala.',
      title3: 'Yeniden kur.',
      tagline: 'Tombul 3B blokları yontun, AI ile şekiller çağırın ve hepsini gerçek fizikle yere serin. Atıştırmalık boyutta, derinden kurcalanabilir.',
      cta: 'Oynamaya başla',
      ctaHint: 'kayıt yok · tarayıcıda çalışır',
      featuresHeading: 'İçinde neler var',
      features: {
        sculpt: { title: 'Yontma', desc: 'Beş dokunsal fırçayla voksel ekle, sil, boya ve oy.' },
        ai: { title: 'AI İnşa', desc: '"Minik bir ejderha" yaz, Gemini blok blok kursun.' },
        physics: { title: 'Fizik', desc: 'Yer çekimi, sürtünme ve patlamayı ayarla, kuleyi yık.' },
        materials: { title: 'Malzemeler', desc: 'Yedi doku — kıran cam, parlak metal, yumuşak kumaş.' },
        models: { title: '8 Başlangıç', desc: 'Sevimli bir yaratık, ev, orman ya da robottan başla.' },
        save: { title: 'Kaydet & Paylaş', desc: 'Tarayıcıya kaydet, GLTF dışa aktar, JSON içe aktar.' },
      },
      modelsHeading: 'Bir başlangıç seç',
      modelsItems: { eagle: 'Kartal', cat: 'Kedi', rabbit: 'Tavşan', robot: 'Robot', house: 'Ev', terrain: 'Arazi', twins: 'İkizler', ai: 'Sürpriz' },
      toolsHeading: 'Elinin altındaki araçlar',
      tools: { add: 'Ekle', remove: 'Sil', paint: 'Boya', sculpt: 'Yont', decal: 'Çıkartma' },
      materialsHeading: 'Bir malzeme seç',
      materials: { solid: 'Düz', metal: 'Metal', wood: 'Ahşap', glass: 'Cam', stone: 'Taş', plastic: 'Plastik', fabric: 'Kumaş' },
      footerNote: 'three.js · React · Gemini ile yapıldı',
      designedBy: 'Tasarlayan',
    },
  },
} as const;

export type TranslationKeys = typeof translations.en;
