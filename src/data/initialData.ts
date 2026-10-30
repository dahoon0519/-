import {
  LatteArtPhoto,
  CafeVisit,
  FoodPhoto,
  CoffeeSectionContent,
  FoodOverviewContent,
} from '../types';

// Default SVG representations for the 5 Swan latte art cups
// Allows crisp rendering immediately, while supporting user replacement via upload or URL
export const createSwanSvg = (variant: number) => {
  // Variations of elegant swan latte art cups
  const cupColors = ['#2C221E', '#3D2F28', '#251C17', '#34261E', '#2B1E19'];
  const cremaBase = cupColors[variant % cupColors.length];

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
    <rect width="800" height="800" fill="%23F4EFEA"/>
    <!-- Ceramic Saucer Shadow -->
    <ellipse cx="400" cy="415" rx="355" ry="345" fill="%23DDD7CD" opacity="0.6"/>
    <!-- Ceramic Saucer -->
    <circle cx="400" cy="400" r="340" fill="%23FBF9F6" stroke="%23E5DFC" stroke-width="2"/>
    <circle cx="400" cy="400" r="285" fill="%23F1EDE6"/>
    <!-- Cup Rim Shadow & Cup Body -->
    <circle cx="400" cy="400" r="260" fill="%23FAF7F2" stroke="%23DDD7CE" stroke-width="3"/>
    <!-- Coffee Crema Base -->
    <circle cx="400" cy="400" r="240" fill="${encodeURIComponent(cremaBase)}"/>
    <radialGradient id="cremaGlow${variant}" cx="45%" cy="40%" r="65%">
      <stop offset="0%" stop-color="%238E5A3C" stop-opacity="0.8"/>
      <stop offset="60%" stop-color="%23563421" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${encodeURIComponent(cremaBase)}"/>
    </radialGradient>
    <circle cx="400" cy="400" r="240" fill="url(%23cremaGlow${variant})"/>
    
    <!-- Microfoam Swan Artwork -->
    <g transform="translate(400, 410) scale(${0.88 + (variant % 3) * 0.04}) translate(-400, -410)">
      <!-- Rosette / Wing Feathers -->
      <path d="M 330 460 C 260 410, 240 330, 310 270 C 370 220, 440 230, 480 300 C 510 350, 470 420, 400 470 Z" 
            fill="%23FFFDF9" opacity="0.95"/>
      <!-- Feather rippling layers -->
      <path d="M 310 430 C 270 380, 270 320, 320 280 C 370 240, 420 260, 440 320 C 420 370, 380 410, 310 430 Z" 
            fill="%2375482F" opacity="0.18"/>
      <path d="M 335 410 C 295 370, 300 310, 345 285 C 385 260, 435 280, 425 340 Z" 
            fill="%23FFFDF9" opacity="0.92"/>
      
      <!-- Swan Body & Neck -->
      <path d="M 390 480 C 360 450, 340 390, 360 320 C 375 270, 395 210, 435 180 C 455 165, 470 175, 460 200 C 445 235, 415 280, 415 340 C 415 390, 430 430, 420 480 Z" 
            fill="%23FFFDF9"/>
      <!-- Swan Head and Beak -->
      <ellipse cx="445" cy="182" rx="18" ry="12" transform="rotate(-25 445 182)" fill="%23FFFDF9"/>
      <!-- Beak -->
      <path d="M 458 178 L 485 188 L 456 191 Z" fill="%23FFFDF9"/>
      <!-- Swan Eye dot in rich coffee brown -->
      <circle cx="448" cy="180" r="2.2" fill="%233D2214"/>
      <!-- Base ripples / heart base -->
      <ellipse cx="375" cy="490" rx="35" ry="14" fill="%23FFFDF9" opacity="0.9"/>
      <ellipse cx="365" cy="515" rx="22" ry="8" fill="%23FFFDF9" opacity="0.75"/>
    </g>
    <!-- Ceramic Cup Handle outline -->
    <path d="M 640 350 C 720 350, 720 450, 640 450" fill="none" stroke="%23DDD7CE" stroke-width="26" stroke-linecap="round"/>
    <path d="M 640 350 C 716 350, 716 450, 640 450" fill="none" stroke="%23FAF7F2" stroke-width="18" stroke-linecap="round"/>
  </svg>`;
};

export const initialLatteArtPhotos: LatteArtPhoto[] = [
  {
    id: 'latte-1',
    title: 'スワン (Swan)',
    description: 'スワン系のパターンを繰り返し練習し、羽の広がりと首のラインのバランスを整えた一杯。',
    type: 'Swan',
    imageUrl: createSwanSvg(0),
  },
  {
    id: 'latte-2',
    title: 'スワン バリエーション (Swan Variation)',
    description: 'ベースの対流を意識しながら、スワンの羽の重なりとコントラストを意識した練習記録。',
    type: 'Swan',
    imageUrl: createSwanSvg(1),
  },
  {
    id: 'latte-3',
    title: 'ウィング スワン (Wing Swan)',
    description: 'リーフの振り幅とミルクの滑らかなテクスチャーを重視し、輪郭を安定させる練習。',
    type: 'Wing Swan',
    imageUrl: createSwanSvg(2),
  },
  {
    id: 'latte-4',
    title: 'スワン パターン (Swan Pattern)',
    description: 'カップの縁に対する配置と、注ぎの終点の切れ味を意識したフリーポア。',
    type: 'Swan',
    imageUrl: createSwanSvg(3),
  },
  {
    id: 'latte-5',
    title: 'スワン 練習記録 (Swan Practice)',
    description: '日々の練習の中で完成度を記録した一杯。フォームのキメの細かさと艶を保ちながら注ぎました。',
    type: 'Swan',
    imageUrl: createSwanSvg(4),
  },
];

export const initialCafeVisits: CafeVisit[] = [
  {
    id: 'visit-1',
    name: 'FUGLEN TOKYO',
    location: '東京・代々木公園',
    coffee: 'ノルディックロースト / エチオピア ハンドドリップ',
    notes: '明るい果実味とクリーンな後味、店内の木を基調とした落ち着いたヴィンテージ空間。',
  },
  {
    id: 'visit-2',
    name: 'GLITCH COFFEE & ROASTERS',
    location: '東京・神保町',
    coffee: '浅煎りシングルオリジン / ゲイシャ種 テイスティング',
    notes: '豆の個性とオリジンのテロワールを丁寧に説明してくださるバリスタの真摯な接客に感銘を受けました。',
  },
  {
    id: 'visit-3',
    name: 'KOFFEE MAMEYA',
    location: '東京・表参道',
    coffee: 'カウンセリング抽出 / ホットフィルター',
    notes: '一人ひとりのお客様の好みを丁寧にヒアリングし、豆選びから抽出温度まで追求する姿勢。',
  },
];

export const initialFoodPhotos: FoodPhoto[] = [
  {
    id: 'food-1',
    title: '石窯ピッツァの焼成・管理 (Neapolitan / Artisanal Pizza)',
    description: 'GARB GREEN WALKにて、生地の発酵状態を見極め、高温オーブンで素早く焼き上げるピザパート。',
    category: 'Pizza',
  },
  {
    id: 'food-2',
    title: 'メインディッシュの調理・ポーション管理 (Meat & Main Course)',
    description: '火入れの加減と盛り付けのスピード、ソースとの調和を意識したメインディッシュの担当実務。',
    category: 'Main Dish',
    date: '2023 - 現在',
  },
  {
    id: 'food-3',
    title: '生パスタ調理 & ソース仕込み (Pasta & Base Sauce)',
    description: 'アルデンテの火加減と乳化のタイミング、日々のベースソースの仕込みと品質管理。',
    category: 'Pasta',
    date: '2023 - 現在',
  },
];

export const initialCoffeeContentJa: CoffeeSectionContent = {
  sectionTitle: 'コーヒー',
  sectionSubtitle: '過度な演出や架空のデータではなく、現場で実際に学び、現在も続けていることの記録です。',
  espresso: {
    title: 'エスプレッソ抽出 (Espresso Extraction)',
    tag: 'Blue Bottle Coffee 経験',
    body: 'Blue Bottle Coffee Koreaでの勤務を通じ、日々の業務の中でエスプレッソ抽出の実践を学びました。ドーシング量、豆の挽き目（メッシュ）、抽出時間、抽出量といった要素によって、カップの中で感じられる味わいのバランス（酸味・甘味・苦味・ボディ）がどのように変化するかを体感し、抽出結果をテイスティングしながら微調整する経験を重ねました。',
    points: [
      'ドーシング量と豆の挽き目（メッシュ）の調整',
      '抽出時間・抽出量と味わいの変化の把握',
      '抽出結果の確認と日々の味覚フィードバック',
    ],
    note: '※ 店舗の規定レシピや非公開数値を公開することは控え、現場で体得した抽出の本質的な理解を大切にしています。',
  },
  sensory: {
    title: 'センサリー / カップノート (Sensory & Cupping)',
    tag: '香味の観察と記録',
    body: 'Blue Bottle Coffeeでの勤務中、コーヒーの香りと味わいを細かく観察し、カップノートを記録するトレーニングを重ねました。単に飲むだけでなく、アロマ、フレーバー、酸味の質、甘さの余韻、ボディ感、アフターテイストなどの特徴を捉え、産地やプロセスごとの個性の違いを言葉にして記録する習慣を培いました。',
    points: [
      'アロマ・フレーバーの質感と解像度',
      '酸味の明るさと甘さのバランス評価',
      '産地・精製方法によるプロファイルの記録',
    ],
  },
  handDrip: {
    title: 'ハンドドリップ (Pour-Over Coffee)',
    tag: '日常の抽出と探求',
    body: '日常生活の中でもコーヒーを淹れ続けています。普段は自宅でハンドドリップにより一杯ずつ丁寧に抽出し、豆の焙煎度や産地によって変わる繊細な風味を楽しんでいます。',
    points: [
      '豆の特性に合わせた挽き目と湯温の選択',
      '注湯スピードと蒸らし時間のコントロール',
      '雑味を抑え、クリーンカップと甘味を引き出す抽出',
    ],
    photoNote: '※ 自宅でのハンドドリップ抽出写真や動画を追加・管理できます。',
  },
  cafeVisitsIntro: {
    title: '日本のコーヒーショップ巡り (Cafe Studies)',
    tag: '店舗探訪と学び',
    body: '日本各地を訪れる際、街のロースタリーや喫茶店、コーヒースタンドを巡り、抽出やサービス、店舗の空気を体験しています。',
  },
};

export const initialCoffeeContentKo: CoffeeSectionContent = {
  sectionTitle: '커피',
  sectionSubtitle: '과장된 연출이 아닌, 현장에서 직접 배우고 매일 꾸준히 이어가고 있는 실전 기록입니다.',
  espresso: {
    title: '에스프레소 추출 (Espresso Extraction)',
    tag: '블루보틀 커피 경험',
    body: '블루보틀 커피 코리아에서의 근무를 통해 매일 현장에서 에스프레소 추출의 실전을 배웠습니다. 도징량, 분쇄도(메쉬), 추출 시간, 추출량 등의 변수에 따라 컵에서 발현되는 밸런스(산미, 단맛, 쓴맛, 바디감)의 변화를 체득하고 지속적으로 캘리브레이션을 진행했습니다.',
    points: [
      '도징량과 원두 분쇄도(메쉬)의 정밀 조절',
      '추출 시간 및 추출량과 맛의 변화 관찰',
      '추출 결과 테이스팅 및 지속적인 미세 조정',
    ],
    note: '※ 매장의 비공개 레시피 수치를 유출하지 않고, 현장에서 몸으로 체득한 본질적 추출 원리를 중심으로 설명합니다.',
  },
  sensory: {
    title: '센서리 및 컵노트 (Sensory & Cupping)',
    tag: '향미 관찰과 기록',
    body: '블루보틀 커피 근무 중 커피의 향과 맛을 세밀하게 관찰하고 컵노트로 기록하는 트레이닝을 지속했습니다. 아로마, 플레이버, 산미의 질, 단맛의 여운, 바디감, 애프터테이스트 등을 분별하고 산지별 개성을 이해하는 감각을 길렀습니다.',
    points: [
      '아로마 및 플레이버 디테일 감별',
      '산미의 밝기와 단맛 밸런스 평가',
      '산지 및 가공방식별 프로파일 기록 습관',
    ],
  },
  handDrip: {
    title: '핸드드립 (Pour-Over Coffee)',
    tag: '일상의 추출과 연구',
    body: '일상 속에서도 지속적으로 커피를 내리고 있습니다. 집에서 핸드드립으로 정성껏 한 잔씩 추출하며, 배전도와 원산지에 따라 달라지는 섬세한 향미의 스펙트럼을 즐기고 연구합니다.',
    points: [
      '원두 특성에 맞춘 분쇄도와 수온 설정',
      '푸어링 속도와 뜸들이기 시간 제어',
      '잡미를 줄이고 클린컵과 단맛을 극대화하는 추출',
    ],
    photoNote: '※ 개인 핸드드립 추출 사진이나 브루잉 영상을 자유롭게 등록/변경할 수 있습니다.',
  },
  cafeVisitsIntro: {
    title: '일본 커피숍 탐방 및 스터디 (Cafe Studies)',
    tag: '공간과 서비스 체험',
    body: '일본 각지를 여행하며 다양한 로스터리, 킷사텐, 스페셜티 커피 스탠드를 방문하여 추출 방식과 접객 서비스, 매장의 고유한 무드를 경험하고 기록하고 있습니다.',
  },
};

export const initialCoffeeContentEn: CoffeeSectionContent = {
  sectionTitle: 'Coffee',
  sectionSubtitle: 'A grounded record of practical skills and daily craft learned in real service environments.',
  espresso: {
    title: 'Espresso Extraction',
    tag: 'Blue Bottle Coffee Experience',
    body: 'Acquired hands-on espresso extraction fundamentals through daily café floor operations at Blue Bottle Coffee Korea. Developed an intuitive understanding of how variables including dosing, grind mesh, extraction time, and yield shape cup balance (acidity, sweetness, bitterness, body), performing routine tasting and fine calibration.',
    points: [
      'Precision adjustment of dosing weight and particle size (mesh)',
      'Tracking sensory evolution across extraction time and yield ratios',
      'Continuous daily cup feedback and subtle recipe calibration',
    ],
    note: '* Proprietary café metrics are not disclosed; the focus remains on essential extraction principles mastered on the bar.',
  },
  sensory: {
    title: 'Sensory & Cupping',
    tag: 'Flavor Observation & Records',
    body: 'Trained extensively in sensory evaluation and cup note logging during my tenure at Blue Bottle Coffee. Beyond casual tasting, cultivated the discipline of discerning aroma, flavor texture, acidity quality, sweetness persistence, body, and finish, articulating regional and processing nuances into clear notes.',
    points: [
      'Discerning aroma and flavor clarity with fine resolution',
      'Evaluating bright acidity balanced against sustained sweetness',
      'Systematic logging of single-origin and processing profiles',
    ],
  },
  handDrip: {
    title: 'Pour-Over Coffee (Hand Drip)',
    tag: 'Daily Brewing & Exploration',
    body: 'Continuously brewing filter coffee in everyday life. Carefully preparing cups at home using hand drip techniques to explore the nuanced flavor expressions across diverse origins and roast levels.',
    points: [
      'Tailoring grind size and water temperature to bean characteristics',
      'Controlling pour flow rate and bloom duration',
      'Minimizing astringency to draw out clean sweetness and clarity',
    ],
    photoNote: '* Real pour-over extraction photos or brewing videos can be added and managed.',
  },
  cafeVisitsIntro: {
    title: 'Specialty Coffee Studies in Japan',
    tag: 'Café Exploration & Hospitality',
    body: 'Visiting neighborhood roasteries, traditional kissaten, and modern specialty coffee bars throughout Japan to experience brewing techniques, hospitality, and distinct café atmospheres.',
  },
};

export const initialFoodOverviewJa: FoodOverviewContent = {
  title: '料理 & キッチン',
  subtitle: '飲食店現場における調理・サービスの現役経験です。',
  roleBadge: '現在：イタリアンレストラン「GARB GREEN WALK」勤務',
  roleTitle: 'Main Dish & Pizza Section',
  roleDesc: '現在はGARB GREEN WALKにて、メインディッシュおよびピザパートを担当しています。オーダーに合わせた的確な調理、ピザ生地の扱いとオーブンでの焼き加減、盛り付けのスピードと美しさ、衛生管理など、料理の現場で必要な実践力を日々磨いています。',
  pastNote: '過去のBlue Bottle Coffee Koreaや各店においても、フードの仕込みや提供、デザート対応など、キッチンとフロアの両面で現場運営を支えてきました。',
};

export const initialFoodOverviewKo: FoodOverviewContent = {
  title: '요리 & 키친',
  subtitle: '외식업 현장에서 직접 담당하고 있는 조리 및 서비스 실무입니다.',
  roleBadge: '현재: 이탈리안 레스토랑 「GARB GREEN WALK」 근무',
  roleTitle: 'Main Dish & Pizza Section (메인 요리 & 피자)',
  roleDesc: '현재 GARB GREEN WALK에서 메인 요리와 피자 파트를 책임지고 있습니다. 주문에 맞춘 신속 정확한 조리, 도우 발효 상태 관리 및 고온 오븐 베이킹, 정갈하고 빠른 플레이팅, 철저한 위생 관리 등 프로 주방의 역량을 매일 쌓아가고 있습니다.',
  pastNote: '이전 블루보틀 코리아 및 다양한 레스토랑에서도 푸드 프랩, 브런치 제공, 디저트 등 주방과 홀을 아우르며 매장 운영을 이끌어왔습니다.',
};

export const initialFoodOverviewEn: FoodOverviewContent = {
  title: 'Food & Kitchen',
  subtitle: 'Hands-on culinary and kitchen service experience in professional hospitality environments.',
  roleBadge: 'Current: Italian Restaurant "GARB GREEN WALK"',
  roleTitle: 'Main Dish & Pizza Section',
  roleDesc: 'Currently in charge of main dishes and pizza sections at GARB GREEN WALK. Mastering precision cooking, dough handling, oven baking, plating speed and hygiene management.',
  pastNote: 'Across previous experiences including Blue Bottle Coffee Korea, supported kitchen prep, desserts, and front-of-house operations.',
};

