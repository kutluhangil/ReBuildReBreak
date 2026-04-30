export type Language = 'en' | 'tr';

export const translations = {
  en: {
    welcome: {
      eyebrow: 'A Generative Voxel Studio',
      title1: 'ReBuild',
      title2: 'ReBreak',
      tagline: 'Sculpt, simulate, and reassemble matter — one voxel at a time. A quiet studio for building things, then breaking them beautifully.',
      feature1Number: '01',
      feature1Title: 'Sculpt',
      feature1Desc: 'A precise brush. Add, carve, paint and shape voxels with deliberate, tactile control.',
      feature2Number: '02',
      feature2Title: 'Generate',
      feature2Desc: 'Describe an idea — Gemini composes it in three dimensions, ready to refine.',
      feature3Number: '03',
      feature3Title: 'Simulate',
      feature3Desc: 'Tune gravity, friction, force. Watch your work fall apart, then put it back together.',
      enter: 'Enter Studio',
      scrollHint: 'Begin',
      designedBy: 'Designed by',
    },
    common: {
      language: 'Language',
    },
  },
  tr: {
    welcome: {
      eyebrow: 'Üretken Voksel Stüdyosu',
      title1: 'ReBuild',
      title2: 'ReBreak',
      tagline: 'Maddeyi yontun, simüle edin ve yeniden birleştirin — voksel voksel. İnşa etmenin ve sonra zarifçe parçalamanın sakin stüdyosu.',
      feature1Number: '01',
      feature1Title: 'Yontma',
      feature1Desc: 'Hassas bir fırça. Vokselleri özenle ekleyin, oyun, boyayın ve şekillendirin.',
      feature2Number: '02',
      feature2Title: 'Üretim',
      feature2Desc: 'Bir fikir tanımlayın — Gemini onu üç boyutta kurar, siz inceltirsiniz.',
      feature3Number: '03',
      feature3Title: 'Simülasyon',
      feature3Desc: 'Yer çekimini, sürtünmeyi, kuvveti ayarlayın. Eserinizi parçalayın, sonra tekrar birleştirin.',
      enter: 'Stüdyoya Gir',
      scrollHint: 'Başla',
      designedBy: 'Tasarlayan',
    },
    common: {
      language: 'Dil',
    },
  },
} as const;

export type TranslationKeys = typeof translations.en;
