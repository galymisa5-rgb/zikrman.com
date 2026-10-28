// Образы в полный рост для карусели «Примерьте образ» на главной (public/images/runway/).
// Модель вырезана из фото товара без фона (rembg isnet). Порядок — порядок в карусели:
// сначала футболки, потом костюмы, в конце камис и ихрам; внутри — от светлых к тёмным.
// Ряд закольцован: за последним образом снова идёт первый.

export interface RunwayLook { slug: string; src: string; w: number; h: number }

export const runwayLooks: RunwayLook[] = [
  { slug: 'futbolka-zikr-belyy', src: '/images/runway/futbolka-zikr-belyy.webp', w: 310, h: 1017 },
  { slug: 'futbolka-zikr-belaya', src: '/images/runway/futbolka-zikr-belaya.webp', w: 307, h: 979 },
  { slug: 'futbolka-zikr-bezhevaya', src: '/images/runway/futbolka-zikr-bezhevaya.webp', w: 358, h: 1047 },
  { slug: 'futbolka-s-kalligrafiey-akvamarinovyy', src: '/images/runway/futbolka-s-kalligrafiey-akvamarinovyy.webp', w: 350, h: 1088 },
  { slug: 'futbolka-s-kalligrafiey-seryy', src: '/images/runway/futbolka-s-kalligrafiey-seryy.webp', w: 428, h: 1059 },
  { slug: 'futbolka-zikr-korichnevaya', src: '/images/runway/futbolka-zikr-korichnevaya.webp', w: 376, h: 1089 },
  { slug: 'futbolka-zikr-temnyy-purpurno-siniy', src: '/images/runway/futbolka-zikr-temnyy-purpurno-siniy.webp', w: 341, h: 1057 },
  { slug: 'futbolka-zikr-zelenaya', src: '/images/runway/futbolka-zikr-zelenaya.webp', w: 320, h: 960 },
  { slug: 'futbolka-s-kalligrafiey-chernyy-s-belym-tekstom', src: '/images/runway/futbolka-s-kalligrafiey-chernyy-s-belym-tekstom.webp', w: 346, h: 1064 },
  { slug: 'futbolka-zikr-chernaya', src: '/images/runway/futbolka-zikr-chernaya.webp', w: 276, h: 1022 },
  { slug: 'futbolka-zikr-chernyy', src: '/images/runway/futbolka-zikr-chernyy.webp', w: 335, h: 1102 },
  { slug: 'kostyum-new-belyy-verh-chernyy-niz', src: '/images/runway/kostyum-new-belyy-verh-chernyy-niz.webp', w: 353, h: 1123 },
  { slug: 'prime-sport', src: '/images/runway/prime-sport.webp', w: 351, h: 1054 },
  { slug: 'prime-sport-grey', src: '/images/runway/prime-sport-grey.webp', w: 363, h: 1116 },
  { slug: 'casual-grey', src: '/images/runway/casual-grey.webp', w: 309, h: 1104 },
  { slug: 'kostyum-bez-vorotnika-new-seryy', src: '/images/runway/kostyum-bez-vorotnika-new-seryy.webp', w: 365, h: 1151 },
  { slug: 'kostyum-bez-vorotnika-new-korichnevyy', src: '/images/runway/kostyum-bez-vorotnika-new-korichnevyy.webp', w: 376, h: 1114 },
  { slug: 'elite-sport', src: '/images/runway/elite-sport.webp', w: 335, h: 1056 },
  { slug: 'kostyum-new-temno-siniy', src: '/images/runway/kostyum-new-temno-siniy.webp', w: 346, h: 1123 },
  { slug: 'premium-casual', src: '/images/runway/premium-casual.webp', w: 352, h: 1092 },
  { slug: 'premium-sport', src: '/images/runway/premium-sport.webp', w: 361, h: 1091 },
  { slug: 'kostyum-bez-vorotnika-new-chernyy', src: '/images/runway/kostyum-bez-vorotnika-new-chernyy.webp', w: 342, h: 1077 },
  { slug: 'kostyum-new-chernyy', src: '/images/runway/kostyum-new-chernyy.webp', w: 373, h: 1090 },
  { slug: 'muslinovyy-ihram-zikr', src: '/images/runway/muslinovyy-ihram-zikr.webp', w: 304, h: 1022 },
  { slug: 'kamis', src: '/images/runway/kamis.webp', w: 369, h: 1017 },
]
