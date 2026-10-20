import { SiteContent, SiteCategoryItem } from '../types';
import {
  initialLatteArtPhotos,
  initialCafeVisits,
  initialFoodPhotos,
} from './initialData';

export const defaultCategories: SiteCategoryItem[] = [
  {
    id: 'cat-home',
    targetId: 'home',
    label: {
      ja: 'ホーム',
      ko: '홈',
      en: 'Home',
    },
    enabled: true,
    order: 1,
  },
  {
    id: 'cat-about',
    targetId: 'about',
    label: {
      ja: '私について',
      ko: '나에 대해서',
      en: 'About',
    },
    enabled: true,
    order: 2,
  },
  {
    id: 'cat-coffee',
    targetId: 'coffee',
    label: {
      ja: 'コーヒー',
      ko: '커피',
      en: 'Coffee',
    },
    enabled: true,
    order: 3,
  },
  {
    id: 'cat-latte-art',
    targetId: 'latte-art',
    label: {
      ja: 'ラテアート',
      ko: '라테아트',
      en: 'Latte Art',
    },
    enabled: true,
    order: 4,
  },
  {
    id: 'cat-food',
    targetId: 'food',
    label: {
      ja: '料理',
      ko: '요리',
      en: 'Food',
    },
    enabled: true,
    order: 5,
  },
  {
    id: 'cat-experience',
    targetId: 'experience',
    label: {
      ja: '経験',
      ko: '경력',
      en: 'Experience',
    },
    enabled: true,
    order: 6,
  },
  {
    id: 'cat-values',
    targetId: 'values',
    label: {
      ja: '大切にしていること',
      ko: '소중히 여기는 것',
      en: 'Values',
    },
    enabled: true,
    order: 7,
  },
  {
    id: 'cat-contact',
    targetId: 'contact',
    label: {
      ja: 'お問い合わせ (CONTACT)',
      ko: '연락처 (CONTACT)',
      en: 'Contact',
    },
    enabled: true,
    order: 8,
  },
];

export const defaultSiteContent: SiteContent = {
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  categories: defaultCategories,
  hero: {
    name: 'HAN DAHOON',
    title: {
      ja: 'バリスタ / 飲食',
      ko: '바리스타 / 외식',
      en: 'Barista & Food Specialist',
    },
    keywords: {
      ja: ['コーヒー', 'ラテアート', '料理', 'サービス'],
      ko: ['커피', '라떼아트', '요리', '서비스'],
      en: ['Coffee', 'Latte Art', 'Food', 'Hospitality'],
    },
    subtext: {
      ja: '実際に経験したことと、手元にある記録を大切にまとめたポートフォリオです。',
      ko: '실제로 경험한 것과 실제로 가지고 있는 기록만 담백하게 담은 포트폴리오입니다.',
      en: 'A dedicated portfolio grounded in authentic coffee, culinary, and hospitality experiences.',
    },
    viewWork: {
      ja: '記録を見る',
      ko: '기록 보기',
      en: 'View Records',
    },
    contactMe: {
      ja: 'お問い合わせ',
      ko: '문의하기',
      en: 'Contact Me',
    },
  },
  about: {
    title: {
      ja: '私について',
      ko: '나에 대해서',
      en: 'About Me',
    },
    intro1_heading: {
      ja: '初めは、コーヒーが好きな一人の客でした',
      ko: '처음에는 커피를 좋아하는 고객이었습니다.',
      en: 'It started as a coffee enthusiast visiting Blue Bottle.',
    },
    intro1_body: {
      ja: 'ブルーボトルコーヒー（Blue Bottle Coffee）に客として訪れた際、コーヒーの美味しさだけでなく、店内の落ち着いた空気感やスタッフの丁寧なサービスに惹かれました。その体験がきっかけとなり、「自分もコーヒーについて深く学びたい」と強く思い、のちにブルーボトルコーヒージャパン（Blue Bottle Coffee Korea）で働くことになりました。',
      ko: 'Blue Bottle Coffee를 고객으로 방문하면서 커피뿐만 아니라 매장의 차분한 분위기와 직원들의 진심 어린 서비스에 관심을 가지게 되었습니다. 그 경험을 계기로 커피를 더 공부해 보고 싶다는 생각을 하게 되었고, 이후 실제로 Blue Bottle Coffee Korea에서 일하게 되었습니다.',
      en: 'When visiting Blue Bottle Coffee as a guest, I was captivated not only by the delicious brew, but by the serene ambiance and genuinely mindful service. That inspiring experience fueled my desire to deeply learn specialty coffee, eventually leading me to work at Blue Bottle Coffee Korea.',
    },
    intro2_heading: {
      ja: 'コーヒーを淹れる人になりました',
      ko: '커피를 만드는 사람이 되었습니다.',
      en: 'Becoming a coffee craftsperson.',
    },
    intro2_body: {
      ja: 'Blue Bottle Coffee Koreaでは、バリスタとしてのコーヒー抽出やラテアートの練習はもちろん、料理やサービス業務全般に携わりました。お客様に一杯のドリンクや食事をお届けし、店舗を仲間とともに日々運営していく過程を経験しました。コーヒーを自らの手で淹れてお客様に手渡す時間はとても楽しく、より良い一杯を目指して学び、考える日々に大きなやりがいを感じていました。',
      ko: 'Blue Bottle Coffee Korea에서 바리스타를 비롯해 음식과 서비스 업무를 두루 경험했습니다. 커피를 추출하고 라떼아트를 연습하는 것뿐만 아니라 손님에게 음료와 음식을 정성껏 제공하고, 매장을 함께 운영하는 과정도 경험했습니다. 커피를 직접 만들고 손님에게 전달하는 과정이 즐거웠고, 더 좋은 결과를 만들기 위해 배우고 생각하는 과정에도 큰 흥미를 느꼈습니다.',
      en: 'At Blue Bottle Coffee Korea, I dedicated myself to espresso extraction, latte art practice, food preparation, and floor hospitality. Crafting drinks by hand and delivering sincere care with each cup made every working day deeply fulfilling.',
    },
    intro3_heading: {
      ja: '日本でも、コーヒーを愛し続けています',
      ko: '일본에서도 커피를 계속 좋아하고 있습니다.',
      en: 'Continuing passion for coffee in Japan.',
    },
    intro3_body: {
      ja: '日本での生活のなかでも、コーヒーへの関心は変わらず続いています。普段から自宅でハンドドリップで丁寧に豆を挽いて淹れたり、手網や小型器具での焙煎を試してみたり、新しい街を訪れるたびに気になるコーヒーショップを探して足を運んだりしています。コーヒーは特別なものというよりも、日々の暮らしの中に自然と寄り添ってくれる存在であり、そのあたたかさが好きです。',
      ko: '일본에서 생활하면서도 커피에 대한 관심은 계속되고 있습니다. 평소에도 핸드드립으로 커피를 내려 마시고, 집에서 로스팅을 시도하기도 하며, 새로운 지역에 가면 커피숍을 찾아보기도 합니다. 커피가 특별한 것만이 아니라 일상 속에서 자연스럽게 함께할 수 있다는 점을 좋아합니다.',
      en: 'Living in Japan, my devotion to coffee continues seamlessly. I brew single-origin beans daily with hand-drip pourover, experiment with small-batch home roasting, and explore independent specialty roasters across different neighborhoods.',
    },
    intro4_heading: {
      ja: '現在も、料理とサービスの現場に立っています',
      ko: '현재도 음식과 서비스 현장에서 일하고 있습니다.',
      en: 'Currently active on the culinary and hospitality frontline.',
    },
    intro4_body: {
      ja: '現在はイタリアンレストラン「GARB GREEN WALK」にて、メインディッシュおよびピザのパートを担当し、厨房・店舗業務に励んでいます。コーヒーだけでなく料理と接客の現場で実践的な経験を重ねながら、コーヒーへの情熱も持ち続けています。',
      ko: '현재는 이탈리안 레스토랑「GARB GREEN WALK」에서 메인 디쉬와 피자 파트를 담당하며 주방 및 매장 업무에 성실히 임하고 있습니다. 커피뿐만 아니라 음식과 서비스 현장에서 실전 경험을 꾸준히 쌓으며, 커피에 대한 열정도 변함없이 이어가고 있습니다.',
      en: 'Currently working at Italian restaurant GARB GREEN WALK handling main dishes, artisanal pizza baking, and kitchen operations. I combine culinary precision with warm customer service while nurturing my coffee craft.',
    },
    closing: {
      ja: '好きなことを学び続けながら、少しずつより良い人間になりたいと思っています。',
      ko: '좋아하는 일을 계속 배우면서, 조금씩 더 나은 사람이 되고 싶습니다.',
      en: 'Continually learning what I love and striving each day to become a better professional and person.',
    },
  },
  coffee: {
    title: {
      ja: 'コーヒー',
      ko: '커피',
      en: 'Coffee',
    },
    subtitle: {
      ja: '過度な演出や架空のデータではなく、現場で実際に学び、現在も続けていることの記録です。',
      ko: '과도한 연출이나 가상의 데이터가 아닌, 현장에서 배우고 체득한 실제 경험입니다.',
      en: 'Authentic records gained directly on the floor and practiced in daily life.',
    },
    espresso: {
      ja: {
        title: '01 エスプレッソ (Espresso Extraction)',
        tag: 'Blue Bottle Coffee 経験',
        body: 'Blue Bottle Coffee Koreaでの勤務を通じ、日々の業務の中でエスプレッソ抽出の実践を学びました。ドーシング量、豆の挽き目（メッシュ）、抽出時間、抽出量といった要素によって、カップの中で感じられる味わいのバランス（酸味・甘味・苦味・ボディ）がどのように変化するかを体感し、抽出結果をテイスティングしながら微調整する経験を重ねました。',
        points: [
          'グラインド粒度と抽出秒数の相関関係の把握',
          'チャネリングを防ぐディストリビューションと水平タンピング',
          '天候や湿度に応じたメッシュダイヤルの微調整',
          'スチームミルクとの調和（温度とフォーム密度の管理）',
        ],
        note: '※ 店舗の規定レシピや非公開数値を公開することは控え、現場で体得した抽出の本質的な理解を大切にしています。',
      },
      ko: {
        title: '01 에스프레소 (Espresso Extraction)',
        tag: 'Blue Bottle Coffee 근무 경험',
        body: 'Blue Bottle Coffee Korea에서 근무하며 에스프레소 추출을 실제 업무를 통해 배웠습니다. 도징량과 원두의 분쇄도, 추출 시간과 추출량에 따라 컵에서 느껴지는 맛의 균형이 달라질 수 있다는 것을 배우고, 추출 결과를 확인하면서 미세하게 조정하는 경험을 쌓았습니다.',
        points: [
          '분쇄도(메쉬)와 추출 시간의 상관관계 이해',
          '채널링을 방지하는 정밀 디스트리뷰션 및 수평 탬핑',
          '날씨·습도 변화에 따른 그라인더 영점 조절',
          '스팀 밀크와의 조화 (온도 및 폼 밀도 관리)',
        ],
        note: '※ 매장 내부의 비공개 레시피 숫자는 표시하지 않으며, 추출의 본질에 대한 정확한 이해를 중시합니다.',
      },
      en: {
        title: '01 Espresso Extraction',
        tag: 'Blue Bottle Experience',
        body: 'Learned dialed-in espresso parameters through daily practice at Blue Bottle Coffee Korea: dosing precision, grind size calibration, yield ratios, and sensory balance across acidity, sweetness, and tactile finish.',
        points: [
          'Correlation of grind micron size to flow rate & yield',
          'Even distribution & flat tamping to prevent channeling',
          'Dial adjustments responding to humidity & temperature shifts',
          'Harmonious milk steaming & micro-foam texture',
        ],
        note: '* Proprietary recipes are protected; emphasis is placed on fundamental understanding of extraction physics.',
      },
    },
    sensory: {
      ja: {
        title: '02 センサリー / 官能評価 (Sensory & Cup Notes)',
        tag: '香味の観察と記録',
        body: 'Blue Bottle Coffeeでの勤務中、コーヒーの香りと味わいを細かく観察し、カップノートを記録するトレーニングを重ねました。単に飲むだけでなく、アロマ、フレーバー、酸味の質、甘さの余韻、ボディ感、アフターテイストなどの特徴を捉え、産地やプロセスごとの個性の違いを言葉にして記録する習慣を培いました。',
        points: [
          'ドライアロマ、クラスト、ブレイク時の香気特性の識別',
          '明瞭なアシディティ（柑橘系・ベリー系・ストーンフルーツ）の判別',
          'ウォッシュド vs ナチュラルプロセスの発酵・質感の違いの把握',
          'クリーンカップと後味（アフターテイスト）の持続性の評価',
        ],
      },
      ko: {
        title: '02 센서리 / 컵노트 (Sensory & Cup Notes)',
        tag: '향미 관찰과 기록',
        body: 'Blue Bottle Coffee에서 근무하면서 커피의 향과 맛을 세심하게 관찰하고, 컵노트를 작성하는 훈련을 경험했습니다. 커피를 단순히 마시는 것이 아니라 아로마, 플레이버, 산미, 단맛, 바디감, 애프터테이스트 등의 특징을 직접 느끼고 차이를 기록하면서 센서리에 대한 관심을 키워왔습니다.',
        points: [
          '건조 분쇄향(Aroma) 및 브레이크 향기 특성 구분',
          '산미의 밝기와 성격(시트러스, 베리류, 핵과류) 구별',
          '워시드와 내추럴 가공 방식에 따른 바디 및 단맛의 차이 파악',
          '클린컵 및 긴 여운(Aftertaste)의 질적 평가',
        ],
      },
      en: {
        title: '02 Sensory & Cup Notes',
        tag: 'Tasting Practice',
        body: 'Trained to observe aromatics, acidity structure, sweetness finish, body, and clean-cup attributes through structured cupping and daily calibration at Blue Bottle Coffee Korea.',
        points: [
          'Dry fragrance and crust break aroma identification',
          'Distinguishing citrus, berry, and stone-fruit acidity',
          'Process comparison: Washed vs Natural profiles',
          'Evaluating aftertaste persistence and overall clarity',
        ],
      },
    },
    handDrip: {
      ja: {
        title: '03 ハンドドリップ (Hand Drip / Pourover)',
        tag: '日常の抽出',
        body: '日常生活の中でもコーヒーを淹れ続けています。普段は自宅でハンドドリップにより一杯ずつ丁寧に抽出し、豆の焙煎度や産地によって変わる繊細な風味を楽しんでいます。',
        points: [
          '豆の新鮮度と焙煎度合いに応じた蒸らし時間と湯温（88°C〜93°C）の最適化',
          'V60、Kalita Wave、Origamiなどドリッパー形状ごとの流速コントロール',
          '微粉の発生を抑えるグラインダー調整と湯落ちの均一性維持',
          '一口目から冷めるまでの温度変化によるフレーバーの移り変わりの観察',
        ],
        photoNote: '※ 実際のハンドドリップ抽出写真や動画を追加・管理できます。',
      },
      ko: {
        title: '03 핸드드립 (Hand Drip / Pourover)',
        tag: '일상의 추출',
        body: '일상에서도 커피를 계속 경험하고 있습니다. 평소에는 핸드드립으로 커피를 내려 마시며 원두에 따라 달라지는 섬세한 맛을 즐기고 있습니다.',
        points: [
          '원두 신선도 및 로스팅 포인트에 맞춘 뜸들이기 및 추출수 온도(88°C~93°C) 조절',
          '하리오 V60, 칼리타 웨이브 등 드리퍼 형태에 맞춘 추출 유속 제어',
          '미분을 고려한 균일한 물줄기 공급 및 과다 추출 방지',
          '첫 모금부터 식어갈 때까지의 온도별 향미 변화 관찰',
        ],
        photoNote: '※ 실제 핸드드립 추출 사진이나 동영상을 업로드하여 관리할 수 있습니다.',
      },
      en: {
        title: '03 Hand Drip / Pourover',
        tag: 'Daily Brew Practice',
        body: 'Brewing single cup pourovers daily at home, adjusting water temperature (88-93°C), pour rate, and dripper geometry for clean clarity.',
        points: [
          'Bloom time and water temperature optimized for roast level',
          'Flow rate control tailored for conical and flat-bottom drippers',
          'Uniform turbulence preventing channeling or astringency',
          'Flavor progression tracking across cooling temperatures',
        ],
        photoNote: '* Real hand drip photos and brew videos can be uploaded and managed.',
      },
    },
    roasting: {
      ja: {
        title: 'ホームロースティング',
        tag: '豆の変化を観察する試み',
        body: '専門の焙煎士を名乗るものではありませんが、自宅でも少量の生豆の焙煎を試みながら、火の通り方や焙煎度合いによって生豆がどのように変化し、味わいにどう表れるのかを少しずつ肌で経験しています。',
      },
      ko: {
        title: '홈 로스팅',
        tag: '원두 변화 관찰',
        body: '전문 로스터처럼 보이기 위한 것이 아니라, 집에서도 직접 로스팅을 시도하면서 원두가 열과 시간에 따라 어떻게 변화하는지 조금씩 경험하고 있습니다.',
      },
      en: {
        title: 'Home Roasting',
        tag: 'Observing Bean Chemistry',
        body: 'Experimenting with small-batch green coffee roasting at home to observe physical changes during Maillard, First Crack, and development stages.',
      },
    },
    cafeVisits: {
      ja: {
        title: '04 日本のコーヒーショップ巡り (Cafe Visits & Studies)',
        tag: '訪問記録',
        body: '日本各地を訪れる際、街のロースタリーや喫茶店、コーヒースタンドを巡り、抽出やサービス、店舗の空気を体験しています。',
        emptyNote: '訪問した店舗の記録を追加できます。',
        addBtn: '訪問記録を追加',
      },
      ko: {
        title: '04 일본 커피숍 탐방 (Cafe Visits & Studies)',
        tag: '방문 기록',
        body: '일본 여러 지역을 다니며 로스터리와 카페를 방문하고, 현지의 커피와 서비스 분위기를 경험하고 있습니다.',
        emptyNote: '방문한 매장의 실제 기록을 추가할 수 있습니다.',
        addBtn: '방문 기록 추가',
      },
      en: {
        title: '04 Japan Specialty Cafe Visits & Studies',
        tag: 'Exploration Records',
        body: 'Visiting leading specialty roasteries, traditional kissaten, and third-wave cafes across Tokyo and Kansai to study craft and hospitality.',
        emptyNote: 'Add records of coffee shops visited.',
        addBtn: 'Add Visit Record',
      },
    },
  },
  latteArt: {
    title: {
      ja: 'ラテアート',
      ko: '라테아트',
      en: 'Latte Art',
    },
    subtitle: {
      ja: '実際に自分で練習し、形を整えてきたラテアートの記録です。',
      ko: '실제로 꾸준히 연습해온 라테아트의 결과물입니다.',
      en: 'Authentic free-pour practice and progress records.',
    },
    body: {
      ja: 'ラテアートの練習を重ねる中で、さまざまなフリーポアのパターンを試してきました。その中でも特にスワン（Swan）系のパターンを集中的に反復練習し、ミルクの対流と注ぎの角度、羽の広がりや首のラインなど、少しずつ輪郭を磨いてきました。完成した結果を写真や動画に残しながら、現在も技術向上に向けて練習を続けています。',
      ko: '라테아트를 연습하면서 여러 패턴을 시도해 왔습니다. 그중에서도 Swan(스완) 계열의 패턴을 반복해서 연습하며 조금씩 형태를 다듬어 왔습니다. 스팀 밀크의 질감과 유량, 각도를 조절하며 완성된 결과를 기록해 두고 있으며, 지금도 더 나은 완성도를 위해 연습을 이어가고 있습니다.',
      en: 'Dedicated repetitive practice focused on Swan free-pour patterns: controlling jug angle, milk flow velocity, wing definition, and graceful neck lines. Continuously logging photo and video practice.',
    },
    note: {
      ja: '※ 写真をクリックすると拡大してディテールをご覧いただけます。動画付きの記録も再生可能です。',
      ko: '※ 사진을 클릭하면 크게 확대하여 보실 수 있습니다. 동영상이 포함된 기록은 바로 재생됩니다.',
      en: '* Click photos or videos to enlarge and view high-resolution playback.',
    },
    manageBtn: {
      ja: '写真・動画の追加・編集',
      ko: '사진·동영상 추가 및 관리',
      en: 'Manage Media',
    },
  },
  food: {
    title: {
      ja: '料理 & キッチン',
      ko: '요리 & 키친',
      en: 'Food & Kitchen',
    },
    subtitle: {
      ja: '飲食店現場における調理・サービスの現役経験です。',
      ko: '현재 음식점 현장에서 쌓아가고 있는 조리 및 서비스 경험입니다.',
      en: 'Active restaurant kitchen culinary and hospitality experience.',
    },
    currentRole: {
      ja: '現在：イタリアンレストラン「GARB GREEN WALK」勤務',
      ko: '현재: 이탈리안 레스토랑「GARB GREEN WALK」근무',
      en: 'Current Role: Italian Restaurant GARB GREEN WALK',
    },
    currentDesc: {
      ja: '現在はGARB GREEN WALKにて、メインディッシュおよびピザパートを担当しています。オーダーに合わせた的確な調理、ピザ生地の扱いとオーブンでの焼き加減、盛り付けのスピードと美しさ、衛生管理など、料理の現場で必要な実践力を日々磨いています。',
      ko: '현재 GARB GREEN WALK에서 메인 디쉬와 피자 파트를 담당하며 근무하고 있습니다. 도우 관리와 오븐 베이킹, 메인 요리 조리와 플레이팅, 주방 위생 관리 등 음식점 현장에서 필요한 실전 역량을 탄탄히 다지고 있습니다.',
      en: 'Working the line handling main dishes and artisanal pizza ovens, managing dough fermentation, high-temperature baking, line coordination, and hygiene.',
    },
    pastNote: {
      ja: '過去のBlue Bottle Coffee Koreaや各店においても、フードの仕込みや提供、デザート対応など、キッチンとフロアの両面で現場運営を支えてきました。',
      ko: '과거 Blue Bottle Coffee Korea 및 각 매장에서도 음식 준비, 디저트 서빙 등 주방과 홀 전반의 운영을 경험했습니다.',
      en: 'Previous frontline experience at Blue Bottle Coffee Korea and dining brands managing food prep, pastry service, purchasing, and floor flow.',
    },
    foodPhotoNote: {
      ja: '※ 実際の調理や盛り付け写真・動画を追加できます。カテゴリ別絞り込み表示も可能です。',
      ko: '※ 실제 조리 및 플레이팅 사진과 영상을 자유롭게 등록하고 카테고리별로 모아볼 수 있습니다.',
      en: '* Upload culinary preparations, plating dishes, and filter by category.',
    },
  },
  experience: {
    title: {
      ja: '経験',
      ko: '경력',
      en: 'Experience',
    },
    subtitle: {
      ja: '役職の誇張ではなく、現場で実際に担ってきた具体的な業務内容を記しています。',
      ko: '과장된 직책보다는 실제로 현장에서 어떤 업무를 해왔는지를 솔직하게 담았습니다.',
      en: 'Honest accounts of operational duties performed directly on the floor.',
    },
    rolesLabel: {
      ja: '実際の担当実務：',
      ko: '실제 담당 업무:',
      en: 'Hands-on Responsibilities:',
    },
    roles: {
      ja: [
        {
          id: 'role-garb-green-walk',
          period: '現在',
          company: 'GARB GREEN WALK',
          role: 'Restaurant Staff',
          part: 'Main Dish / Pizza',
          description:
            '現在、飲食店の現場にてメインディッシュおよびピザのパートを担当し勤務しています。生地の管理、オーブンでの焼成、メイン料理の調理とスピード感のある提供、食材の仕込みを行っています。',
          highlights: [
            'メインディッシュ調理',
            'ピザ生地管理・成形・焼成',
            'キッチン衛生管理',
            '仕込み・ポーション管理',
          ],
        },
        {
          id: 'role-blue-bottle-coffee-korea',
          period: '過去の経験',
          company: 'Blue Bottle Coffee Korea',
          role: 'Barista / Cook / Floor Staff',
          part: 'Coffee / Food / Service',
          description:
            'ブルーボトルコーヒー韓国店舗にて、コーヒー抽出からフード調理、フロア接客まで幅広く従事しました。高品質な一杯を届けるための技術と、心地よい空間づくりの両立を学びました。',
          highlights: [
            'エスプレッソ抽出調整',
            'ラテアート技術習得',
            'ドリップコーヒー抽出',
            'お客様へのサービス・接客',
            'フードの仕込み・調理',
            'ドリンクおよびデザートの提供',
            '衛生管理・品質管理の徹底',
            '在庫管理・資材発注',
            'コーヒー豆の特性説明・販売',
          ],
        },
        {
          id: 'role-modow',
          period: '過去の経験',
          company: 'MODOW',
          role: 'Cook',
          part: 'Kitchen & Purchasing',
          description:
            '韓国料理のおかずおよび料理全般の調理、デザートの仕込み、厨房の在庫管理および仕入れ・購買業務を担当しました。',
          highlights: [
            '韓国料理・おかず調理',
            'デザート仕込み',
            '在庫管理・購買業務',
            '衛生管理',
          ],
        },
        {
          id: 'role-jackson-pizza',
          period: '過去の経験',
          company: 'JACKSON PIZZA',
          role: 'Pizza Maker & Kitchen',
          part: 'Dough / Baking / Store Opening',
          description:
            'ピザ生地のミキシングから成形、トッピング、高温オーブンでの焼き上げまでを担当。新規店舗の立ち上げ（オープン）も経験し、繁忙期の仕込みと購買を担いました。',
          highlights: [
            'ピザ生地仕込み・発酵管理',
            '生地の成形・ハンドトス',
            'オーブン焼成',
            '新規店舗オープン実務',
            '在庫および発注業務',
          ],
        },
        {
          id: 'role-pizza-express',
          period: '過去の経験',
          company: 'PIZZA EXPRESS',
          role: 'Kitchen / Hall / Cashier',
          part: 'All-round Operation',
          description:
            '厨房での調理からホールでの接客案内、レジカウンターでの会計、食材・備品の購買業務まで、店舗運営全般をマルチに担当しました。',
          highlights: [
            '調理補助・仕込み',
            'ホール接客・配膳',
            'レジ会計・売上確認',
            '仕入れ・納品確認',
          ],
        },
      ],
      ko: [
        {
          id: 'role-garb-green-walk',
          period: '현재',
          company: 'GARB GREEN WALK',
          role: 'Restaurant Staff',
          part: 'Main Dish / Pizza',
          description:
            '현재 음식점 현장에서 메인 디쉬와 피자 파트를 담당하며 근무하고 있습니다. 도우 관리와 오븐 베이킹, 메인 요리 조리와 신속한 서빙, 식자재 전처리를 수행합니다.',
          highlights: [
            '메인 디쉬 조리',
            '피자 도우 관리 및 성형·굽기',
            '주방 위생 및 식자재 관리',
            '플레이팅 및 서비스 협업',
          ],
        },
        {
          id: 'role-blue-bottle-coffee-korea',
          period: '이전 경력',
          company: 'Blue Bottle Coffee Korea',
          role: 'Barista / Cook / Floor Staff',
          part: 'Coffee / Food / Service',
          description:
            '블루보틀 커피 코리아에서 바리스타와 조리, 홀 서비스를 두루 수행했습니다. 최고 품질의 한 잔을 위한 정밀 추출과 세심한 호스피탈리티를 배웠습니다.',
          highlights: [
            '에스프레소 추출',
            '라떼아트',
            '드립커피',
            '고객 서비스',
            '음식 준비',
            '음료 및 디저트 서비스',
            '위생 및 품질 관리',
            '재고 관리',
            '고객 응대',
            '원두 판매',
          ],
        },
        {
          id: 'role-modow',
          period: '이전 경력',
          company: 'MODOW',
          role: 'Cook',
          part: 'Kitchen & Purchasing',
          description:
            '한식 반찬 및 음식 전반, 디저트 조리, 재고 관리 및 구매 업무를 담당했습니다.',
          highlights: ['한식 반찬 및 음식', '디저트', '재고 및 구매 업무', '위생 관리'],
        },
        {
          id: 'role-jackson-pizza',
          period: '이전 경력',
          company: 'JACKSON PIZZA',
          role: 'Pizza Maker & Kitchen',
          part: 'Dough / Baking / Store Opening',
          description:
            '피자 도우 믹싱 및 성형, 굽기, 신규 매장 오픈 참여 및 구매·재고 관리를 수행했습니다.',
          highlights: ['피자 도우', '성형', '굽기', '매장 오픈 경험', '재고 및 구매'],
        },
        {
          id: 'role-pizza-express',
          period: '이전 경력',
          company: 'PIZZA EXPRESS',
          role: 'Kitchen / Hall / Cashier',
          part: 'All-round Operation',
          description:
            '주방 조리, 홀 서빙 및 응대, 계산(캐셔), 구매 업무 등 다방면의 매장 운영을 맡았습니다.',
          highlights: ['조리', '홀', '계산', '구매 업무'],
        },
      ],
      en: [
        {
          id: 'role-garb-green-walk',
          period: 'Present',
          company: 'GARB GREEN WALK',
          role: 'Restaurant Staff',
          part: 'Main Dish / Pizza',
          description:
            'Responsible for main dishes and artisanal pizza section, oven baking, line service, and kitchen sanitation.',
          highlights: [
            'Main dish cookery',
            'Pizza dough handling & oven baking',
            'Hygiene & sanitation compliance',
            'Mise-en-place & portion control',
          ],
        },
        {
          id: 'role-blue-bottle-coffee-korea',
          period: 'Past Experience',
          company: 'Blue Bottle Coffee Korea',
          role: 'Barista / Cook / Floor Staff',
          part: 'Coffee / Food / Service',
          description:
            'Full spectrum hospitality: espresso dialing, latte art, pour over, food preparation, and floor operations.',
          highlights: [
            'Espresso calibration',
            'Latte art practice',
            'Pour over brewing',
            'Guest hospitality',
            'Food & dessert prep',
            'Quality & sanitation',
            'Inventory & supply ordering',
            'Bean retail sales',
          ],
        },
        {
          id: 'role-modow',
          period: 'Past Experience',
          company: 'MODOW',
          role: 'Cook',
          part: 'Kitchen & Purchasing',
          description:
            'Korean culinary preparation, side dishes, dessert mise-en-place, and inventory purchasing.',
          highlights: ['Culinary prep', 'Desserts', 'Purchasing & inventory', 'Hygiene'],
        },
        {
          id: 'role-jackson-pizza',
          period: 'Past Experience',
          company: 'JACKSON PIZZA',
          role: 'Pizza Maker & Kitchen',
          part: 'Dough / Baking / Store Opening',
          description:
            'Hand-tossed dough mixing, high-temp baking, new store launch operations, and supply management.',
          highlights: [
            'Dough fermentation',
            'Hand stretching & baking',
            'Store opening',
            'Stock ordering',
          ],
        },
        {
          id: 'role-pizza-express',
          period: 'Past Experience',
          company: 'PIZZA EXPRESS',
          role: 'Kitchen / Hall / Cashier',
          part: 'All-round Operation',
          description:
            'Multi-disciplinary operations across food prep, table service, POS cashiering, and inventory replenishment.',
          highlights: ['Cooking assist', 'Floor service', 'POS cashier', 'Purchasing'],
        },
      ],
    },
  },
  values: {
    title: {
      ja: '大切にしていること',
      ko: '내가 중요하게 생각하는 것',
      en: 'Values & Mindset',
    },
    subtitle: {
      ja: '技術の優劣を誇るのではなく、仕事に向き合う上で大切に守っている姿勢です。',
      ko: '스킬 점수나 화려한 미사여구보다, 일을 대하는 올바른 태도를 지키고자 합니다.',
      en: 'Core values guiding my dedication to work and collaboration.',
    },
    items: {
      ja: [
        {
          id: 'val-learning',
          title: '学ぶこと',
          description:
            '新しいことを学ぶのが好きです。分からないことがあればそのままにせず、まずは現場で自ら手を動かし、実践を通して理解を深めることを大切にしています。',
        },
        {
          id: 'val-continuous-improvement',
          title: '少しずつ改善すること',
          description:
            '一度の結果に慢心せず、「次はどうすればもっと滑らかに抽出できるか」「どうすればお客様がさらに心地よく過ごせるか」を考え、小さな改善を積み重ねます。',
        },
        {
          id: 'val-good-experience',
          title: 'お客様に良い体験を届けること',
          description:
            'コーヒーや料理は単に作って終わりではなく、お客様の手元に届き、味わっていただいた瞬間に初めて完成する一つの体験だと考えています。',
        },
        {
          id: 'val-teamwork',
          title: '一緒に働くこと',
          description:
            '自分一人だけがうまくできることよりも、チームの仲間とお互いに教え合い、助け合いながら、店全体として最高の結果を生み出すことを大切にしています。',
        },
      ],
      ko: [
        {
          id: 'val-learning',
          title: '배우는 것',
          description:
            '새로운 것을 배우는 것을 좋아합니다. 모르는 것을 그냥 지나치기보다 현장에서 직접 경험하면서 배우려고 합니다.',
        },
        {
          id: 'val-continuous-improvement',
          title: '조금씩 개선하는 것',
          description:
            '한 번의 결과에 만족하기보다 다음에는 무엇을 더 좋게 만들 수 있을지 생각하고 조금씩 다듬어 나갑니다.',
        },
        {
          id: 'val-good-experience',
          title: '손님에게 좋은 경험을 전달하는 것',
          description:
            '커피나 음식은 단순히 만드는 것으로 끝나는 것이 아니라, 손님에게 전달되었을 때 비로소 하나의 완성된 경험이 된다고 믿습니다.',
        },
        {
          id: 'val-teamwork',
          title: '함께 일하는 것',
          description:
            '혼자 잘하는 것보다 함께 일하는 사람들과 서로 배우고 도우면서 매장 전체로서 좋은 결과를 만드는 것을 중요하게 여깁니다.',
        },
      ],
      en: [
        {
          id: 'val-learning',
          title: 'Continuous Learning',
          description:
            'Always curious to learn. When encountering challenges, I embrace them hands-on on the floor to build real understanding.',
        },
        {
          id: 'val-continuous-improvement',
          title: 'Incremental Refinement',
          description:
            'Never resting on single outcomes; constantly considering how to make extraction cleaner or customer moments warmer.',
        },
        {
          id: 'val-good-experience',
          title: 'Delivering Complete Experiences',
          description:
            'Coffee and dining are not finished until they reach the guest and create a comforting, memorable moment.',
        },
        {
          id: 'val-teamwork',
          title: 'Team Harmony & Collaboration',
          description:
            'Valuing team synergy, mutual teaching, and supporting colleagues over individual prominence.',
        },
      ],
    },
    closing: {
      ja: 'まだ学びたいことがたくさんあります。新しい環境でも謙虚に学び、経験しながら、少しずつ成長していきたいと考えています。',
      ko: '아직 배우고 싶은 것이 많습니다. 새로운 환경에서도 배우고 경험하면서 조금씩 성장해 나가고 싶습니다.',
      en: 'With so much still to discover, I look forward to learning humbly and growing steadily in every new opportunity.',
    },
  },
  contact: {
    title: {
      ja: 'お問い合わせ (CONTACT)',
      ko: '연락처 (CONTACT)',
      en: 'Contact & Inquiries',
    },
    subtitle: {
      ja: '面談や採用に関するご連絡を心よりお待ちしております。',
      ko: '함께 일할 기회나 면접 문의를 주시면 성실히 답변드리겠습니다.',
      en: 'Looking forward to interview opportunities and employment inquiries.',
    },
    name: 'HAN DAHOON',
    titleText: {
      ja: 'バリスタ / 飲食',
      ko: '바리스타 / 외식',
      en: 'Barista / Food Specialist',
    },
    skillsText: {
      ja: 'コーヒー · ラテアート · 料理 · サービス',
      ko: '커피 · 라떼아트 · 요리 · 서비스',
      en: 'Coffee · Latte Art · Food · Service',
    },
    emailLabel: {
      ja: '受信メールアドレス',
      ko: '수신 이메일 주소',
      en: 'Contact Email',
    },
    emailValue: 'dhgh159030@gmail.com',
    copyEmail: {
      ja: 'メールアドレスをコピー',
      ko: '이메일 주소 복사',
      en: 'Copy Email',
    },
    copied: {
      ja: 'コピーしました',
      ko: '복사되었습니다',
      en: 'Copied!',
    },
    locationLabel: {
      ja: '希望勤務地',
      ko: '희망 근무지',
      en: 'Preferred Location',
    },
    locationValue: {
      ja: '日本国内（東京 / 近郊 / 関西等、柔軟に対応可能です）',
      ko: '일본 내 카페 및 레스토랑 (도쿄 및 주요 지역)',
      en: 'Japan (Tokyo, Greater Tokyo, Kansai region)',
    },
    instagramLabel: {
      ja: 'Instagram',
      ko: 'Instagram',
      en: 'Instagram',
    },
    instagramPlaceholder: '@dahoon_coffee_food (準備中)',
    portfolioLabel: {
      ja: 'ポートフォリオ',
      ko: '포트폴리오',
      en: 'Portfolio',
    },
    note: {
      ja: '日本のカフェ・コーヒー業界での新しい挑戦に向けて、真面目に誠意を持って働きます。どうぞよろしくお願いいたします。',
      ko: '좋아하는 일을 더 잘하기 위해 꾸준히 배우고 성장하는 사람이 되겠습니다.',
      en: 'Dedicated to working with integrity, honesty, and care.',
    },
    formTitle: {
      ja: 'ダイレクトお問い合わせフォーム (Direct Contact)',
      ko: '다이렉트 문의 보내기 (Direct Contact)',
      en: 'Send Direct Inquiry',
    },
    formSubtitle: {
      ja: 'フォームを送信すると、管理者に登録されたメールアドレスに直接連絡が届きます。',
      ko: '작성하신 문의는 관리자에 연동된 이메일로 즉시 연결되어 전송됩니다.',
      en: 'Messages will be forwarded directly to the connected administrator email.',
    },
    nameField: {
      ja: 'お名前',
      ko: '이름',
      en: 'Your Name',
    },
    namePlaceholder: {
      ja: '例: 田中 太郎 / 採用ご担当者様',
      ko: '예: 홍길동 / 채용 담당자님',
      en: 'e.g. John Doe / Hiring Manager',
    },
    phoneField: {
      ja: 'お電話番号',
      ko: '핸드폰번호',
      en: 'Phone Number',
    },
    phonePlaceholder: {
      ja: '例: 090-1234-5678',
      ko: '예: 010-1234-5678',
      en: 'e.g. +81 90-1234-5678',
    },
    emailField: {
      ja: 'ご返信先メールアドレス',
      ko: '이메일주소',
      en: 'Your Email Address',
    },
    emailPlaceholder: {
      ja: '例: contact@example.com',
      ko: '예: example@domain.com',
      en: 'e.g. contact@example.com',
    },
    messageField: {
      ja: 'お問い合わせ内容',
      ko: '문의 내용',
      en: 'Message / Inquiry',
    },
    messagePlaceholder: {
      ja: '面談の日程や業務内容、ご質問などをご自由にご記入ください。',
      ko: '면접 일정, 포지션 제안, 문의사항 등을 편하게 남겨주세요.',
      en: 'Please share details about interview schedules, opportunities, or questions.',
    },
    sendButton: {
      ja: 'お問い合わせを送信する',
      ko: '문의 내용 전송하기',
      en: 'Send Message',
    },
    sendingButton: {
      ja: '送信中...',
      ko: '전송 중...',
      en: 'Sending...',
    },
    sentSuccess: {
      ja: 'お問い合わせを受け付けました。ご入力いただいたメールクライアントまたは直接メールにてご返信いたします。',
      ko: '문의가 성공적으로 접수/전송되었습니다. 등록된 관리자 이메일로 바로 확인 후 연락드리겠습니다.',
      en: 'Inquiry submitted successfully! A notification has been routed to the administrator.',
    },
    directMailButton: {
      ja: 'メールアプリで開いて送信',
      ko: '메일 앱으로 열어 전송',
      en: 'Open in Email Client',
    },
    statements: {
      ja: [
        'コーヒーが好きで始まり、実際にコーヒーを淹れる現場を経験しました。',
        'その歩みの中で、料理とサービスの現場での実践力も培ってきました。',
        '今も厨房の現場で学びながら、日々の暮らしの中でもコーヒーと向き合い続けています。',
        'まだ学ぶべきことは多くありますが、好きな仕事をより深めるため、誠実に学び成長し続けます。',
      ],
      ko: [
        '커피를 좋아해서 시작했고, 실제로 커피를 만드는 일을 경험했습니다.',
        '그 과정에서 음식과 서비스 현장의 경험도 함께 쌓았습니다.',
        '지금도 현장에서 일하며 배우고 있고, 일상에서도 커피를 계속 경험하고 있습니다.',
        '아직 배워야 할 것이 많지만, 좋아하는 일을 더 잘하기 위해 꾸준히 배우고 성장하고 싶습니다.',
      ],
      en: [
        'Starting from a genuine love for coffee, I learned through hands-on barista practice.',
        'Along the way, I also built real culinary and hospitality skills on the floor.',
        'Currently working in the kitchen and continuing my coffee journey daily.',
        'With much still to learn, I am dedicated to growing steadily in what I love.',
      ],
    },
  },
  footer: {
    text: {
      ja: 'HAN DAHOON — Barista & Food Portfolio',
      ko: 'HAN DAHOON — 바리스타 & 외식 포트폴리오',
      en: 'HAN DAHOON — Barista & Food Portfolio',
    },
    quote: {
      ja: '好きなことを学び続けながら、少しずつより良い人間になりたいと思っています。',
      ko: '좋아하는 일을 계속 배우면서, 조금씩 더 나은 사람이 되고 싶습니다.',
      en: 'Continually learning what I love and striving each day to become a better person.',
    },
  },
  lattePhotos: initialLatteArtPhotos,
  cafeVisits: initialCafeVisits,
  foodPhotos: initialFoodPhotos,
  handDripPhotoUrl: null,
  heroPhoto: {
    imageUrl: initialLatteArtPhotos[0].imageUrl,
    title: initialLatteArtPhotos[0].title,
    type: initialLatteArtPhotos[0].type || 'Swan Free Pour',
    description: initialLatteArtPhotos[0].description,
  },
};
