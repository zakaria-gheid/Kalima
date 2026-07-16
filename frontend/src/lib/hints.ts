import type { HintLanguage } from '@/domain/settings';

/**
 * Describer hints, generated per category and stored on every word row
 * (words.hint_en / words.hint_ar). They coach the describer on HOW to
 * describe this kind of word without giving the answer away.
 */
const HINTS: Record<string, { en: string; ar: string }> = {
  Home: {
    en: 'Something in the house. Describe the room it is in, its size, and what you use it for.',
    ar: 'شيء في البيت. صف الغرفة التي يوجد فيها وحجمه وفيمَ يُستخدم.',
  },
  Kitchen: {
    en: 'Used for cooking or eating. Describe how you use it in the kitchen.',
    ar: 'يُستخدم للطبخ أو الأكل. صف كيف تستعمله في المطبخ.',
  },
  Food: {
    en: 'You can eat or drink it. Describe its taste, color, and when people have it.',
    ar: 'يؤكل أو يشرب. صف طعمه ولونه ومتى نتناوله.',
  },
  Animals: {
    en: 'A living creature. Describe its size, where it lives, and its sound or movement.',
    ar: 'كائن حي. صف حجمه وأين يعيش وصوته أو حركته.',
  },
  Nature: {
    en: 'Found outdoors in nature. Describe where you see it and what it looks like.',
    ar: 'موجود في الطبيعة. صف أين تراه وكيف يبدو.',
  },
  'Human Body': {
    en: 'A part of the body. Point near it and describe what it does.',
    ar: 'جزء من الجسم. أشر بالقرب منه وصف وظيفته.',
  },
  Family: {
    en: 'About people and family life. Describe who this person is or when this happens.',
    ar: 'عن الناس والعائلة. صف من يكون هذا الشخص أو متى يحدث هذا.',
  },
  Clothing: {
    en: 'Something you wear. Describe where on the body and in which season.',
    ar: 'شيء يُلبس. صف أين يوضع على الجسم وفي أي فصل.',
  },
  Transportation: {
    en: 'About travel and vehicles. Describe how it moves and where you find it.',
    ar: 'عن السفر والمركبات. صف كيف يتحرك وأين تجده.',
  },
  Jobs: {
    en: 'A job or worker. Describe what this person does and where they work.',
    ar: 'مهنة أو عامل. صف ماذا يفعل هذا الشخص وأين يعمل.',
  },
  Sports: {
    en: 'About sport and games. Describe how it is played or done.',
    ar: 'عن الرياضة والألعاب. صف كيف يُلعب أو يُمارس.',
  },
  Science: {
    en: 'About science. Describe what it is used for, in a lab or in nature.',
    ar: 'عن العلوم. صف فيمَ يُستخدم في المختبر أو في الطبيعة.',
  },
  Technology: {
    en: 'A device or tech thing. Describe how people use it every day.',
    ar: 'جهاز أو شيء تقني. صف كيف يستعمله الناس يوميا.',
  },
  Geography: {
    en: 'A place or land feature. Describe where it is on a map and what it looks like.',
    ar: 'مكان أو تضاريس. صف موقعه على الخريطة وشكله.',
  },
  Space: {
    en: 'About the sky and space. Describe when and where you can see it.',
    ar: 'عن السماء والفضاء. صف متى وأين يمكن رؤيته.',
  },
  Music: {
    en: 'About music and sound. Describe how it sounds or how it is played.',
    ar: 'عن الموسيقى والصوت. صف كيف يبدو صوته أو كيف يُعزف.',
  },
  History: {
    en: 'From old times. Describe who used it and in which era.',
    ar: 'من الزمن القديم. صف من كان يستخدمه وفي أي عصر.',
  },
  Religion: {
    en: 'About faith and worship. Describe when or where people do or see it.',
    ar: 'عن الدين والعبادة. صف متى أو أين يفعله الناس أو يرونه.',
  },
  City: {
    en: 'A place in town. Describe what people do there.',
    ar: 'مكان في المدينة. صف ماذا يفعل الناس فيه.',
  },
  Office: {
    en: 'About work and office life. Describe when you use it at work.',
    ar: 'عن العمل والمكتب. صف متى تستخدمه في العمل.',
  },
  School: {
    en: 'About school and learning. Describe when you see or use it in class.',
    ar: 'عن المدرسة والتعلم. صف متى تراه أو تستخدمه في الصف.',
  },
};

const FALLBACK = {
  en: 'Describe what it looks like, where you find it, and what it is used for.',
  ar: 'صف شكله وأين يوجد وفيمَ يُستخدم.',
};

export function hintForCategory(category: string, language: HintLanguage): string {
  return (HINTS[category] ?? FALLBACK)[language];
}
