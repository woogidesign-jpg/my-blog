// SLATE 쇼핑몰 순수 데이터 (DOM·localStorage 참조 없음)
// 상품 스와치 색(hex)은 UI 토큰 규칙의 예외입니다: 상품 데이터이므로 여기에 두고 JS가 --sw로 넣습니다.

export const CATEGORIES = ['아우터', '상의', '하의', '원피스', '가방', '신발', '액세서리', '라이프'];
export const CHIPS = ['전체', '아우터', '상의', '하의', '액세서리'];
export const IMAGE_COUNT = 5;
export const QTY_MIN = 1;
export const QTY_MAX = 10;
export const CART_LINE_MAX = 99;
export const HOME_LIMIT = 4;

export const BANNER_TEXT = '데모 쇼핑몰 · 실제 주문과 결제는 되지 않아요';
export const HERO_TEXT = '부드러운 울과 차분한 톤으로 완성한 가을 컬렉션을 만나 보세요.';
export const SHIPPING_TEXT = '5만 원 이상 무료배송 · 1~2일 내 출고';

const CLOTH_COLS = ['사이즈', '총장', '어깨', '가슴', '소매'];
const PANTS_COLS = ['사이즈', '총장', '허리', '엉덩이', '밑단'];

export const PRODUCTS = [
  {
    id: 1,
    cat: '아우터',
    name: '울 블렌드 싱글 코트',
    price: 189000,
    isNew: true,
    colors: [
      { name: '차콜', hex: '#3A3A3A' },
      { name: '카멜', hex: '#B08560' },
      { name: '오트밀', hex: '#D9D0C1' }
    ],
    sizes: [
      { label: 'S', soldOut: false },
      { label: 'M', soldOut: false },
      { label: 'L', soldOut: false },
      { label: 'XL', soldOut: true }
    ],
    modelInfo: '모델 178cm · M 착용',
    desc: '울 블렌드 원단으로 만든 싱글 브레스트 코트입니다. 어깨선을 살짝 내려 니트 위에도 여유 있게 걸칠 수 있어요.',
    reviews: 128,
    specs: [
      { term: '소재', desc: '울 70%, 폴리에스터 30%' },
      { term: '안감', desc: '폴리에스터 100%' },
      { term: '두께감', desc: '두꺼움' },
      { term: '세탁 방법', desc: '드라이클리닝' },
      { term: '제조국', desc: '대한민국' }
    ],
    sizeGuide: {
      cols: CLOTH_COLS,
      rows: [
        ['S', '108', '47', '58', '61'],
        ['M', '110', '49', '61', '62'],
        ['L', '112', '51', '64', '63'],
        ['XL', '114', '53', '67', '64']
      ]
    }
  },
  {
    id: 2,
    cat: '상의',
    name: '캐시미어 터치 크루넥 니트',
    price: 69000,
    isNew: true,
    colors: [
      { name: '아이보리', hex: '#EDE6D8' },
      { name: '그레이', hex: '#9A9A9A' },
      { name: '네이비', hex: '#2B3346' }
    ],
    sizes: [
      { label: 'S', soldOut: false },
      { label: 'M', soldOut: false },
      { label: 'L', soldOut: false },
      { label: 'XL', soldOut: false }
    ],
    modelInfo: '모델 176cm · L 착용',
    desc: '캐시미어처럼 부드러운 촉감의 원사로 짠 크루넥 니트입니다. 단독으로도, 코트 안에 겹쳐 입기에도 좋아요.',
    reviews: 86,
    specs: [
      { term: '소재', desc: '아크릴 60%, 울 30%, 캐시미어 10%' },
      { term: '안감', desc: '없음' },
      { term: '두께감', desc: '보통' },
      { term: '세탁 방법', desc: '울 코스 손세탁' },
      { term: '제조국', desc: '대한민국' }
    ],
    sizeGuide: {
      cols: CLOTH_COLS,
      rows: [
        ['S', '64', '46', '52', '58'],
        ['M', '66', '48', '55', '59'],
        ['L', '68', '50', '58', '60'],
        ['XL', '70', '52', '61', '61']
      ]
    }
  },
  {
    id: 3,
    cat: '하의',
    name: '와이드 울 슬랙스',
    price: 79000,
    isNew: true,
    colors: [
      { name: '차콜', hex: '#3A3A3A' },
      { name: '베이지', hex: '#CBB9A0' }
    ],
    sizes: [
      { label: 'S', soldOut: false },
      { label: 'M', soldOut: false },
      { label: 'L', soldOut: false },
      { label: 'XL', soldOut: false }
    ],
    modelInfo: '모델 180cm · M 착용',
    desc: '울 혼방 원단에 앞주름을 넣은 와이드 슬랙스입니다. 허리 뒤 밴딩으로 편하게 입을 수 있어요.',
    reviews: 54,
    specs: [
      { term: '소재', desc: '폴리에스터 65%, 울 35%' },
      { term: '안감', desc: '폴리에스터 100% (무릎까지)' },
      { term: '두께감', desc: '보통' },
      { term: '세탁 방법', desc: '드라이클리닝' },
      { term: '제조국', desc: '대한민국' }
    ],
    sizeGuide: {
      cols: PANTS_COLS,
      rows: [
        ['S', '102', '36', '50', '26'],
        ['M', '104', '38', '52', '27'],
        ['L', '106', '40', '54', '28'],
        ['XL', '108', '42', '56', '29']
      ]
    }
  },
  {
    id: 4,
    cat: '액세서리',
    name: '레더 미니 숄더백',
    price: 129000,
    isNew: true,
    colors: [
      { name: '블랙', hex: '#1E1E1E' },
      { name: '탠', hex: '#9C6B43' }
    ],
    sizes: [
      { label: 'FREE', soldOut: false }
    ],
    modelInfo: '어깨끈 길이 조절 가능',
    desc: '소가죽으로 만든 미니 숄더백입니다. 휴대폰과 지갑이 들어가는 크기이고, 끈을 줄이면 토트처럼 들 수 있어요.',
    reviews: 41,
    specs: [
      { term: '소재', desc: '소가죽 100%' },
      { term: '안감', desc: '면 100%' },
      { term: '두께감', desc: '보통' },
      { term: '세탁 방법', desc: '마른 천으로 닦기' },
      { term: '제조국', desc: '대한민국' }
    ],
    sizeGuide: {
      cols: ['사이즈', '가로', '세로', '폭', '끈 길이'],
      rows: [
        ['FREE', '22', '15', '7', '110~125']
      ]
    }
  },
  {
    id: 5,
    cat: '아우터',
    name: '오버핏 트렌치 코트',
    price: 219000,
    isNew: true,
    colors: [
      { name: '베이지', hex: '#C8B28E' },
      { name: '카키', hex: '#6B6A4F' }
    ],
    sizes: [
      { label: 'S', soldOut: false },
      { label: 'M', soldOut: false },
      { label: 'L', soldOut: true },
      { label: 'XL', soldOut: false }
    ],
    modelInfo: '모델 182cm · L 착용',
    desc: '탄탄한 면 개버딘으로 만든 오버핏 트렌치 코트입니다. 허리 벨트로 실루엣을 바꿔 가며 입을 수 있어요.',
    reviews: 73,
    specs: [
      { term: '소재', desc: '면 100%' },
      { term: '안감', desc: '폴리에스터 100%' },
      { term: '두께감', desc: '보통' },
      { term: '세탁 방법', desc: '드라이클리닝' },
      { term: '제조국', desc: '베트남' }
    ],
    sizeGuide: {
      cols: CLOTH_COLS,
      rows: [
        ['S', '112', '50', '62', '60'],
        ['M', '114', '52', '65', '61'],
        ['L', '116', '54', '68', '62'],
        ['XL', '118', '56', '71', '63']
      ]
    }
  },
  {
    id: 6,
    cat: '상의',
    name: '코튼 옥스퍼드 셔츠',
    price: 49000,
    isNew: true,
    colors: [
      { name: '화이트', hex: '#F5F5F2' },
      { name: '스카이블루', hex: '#A9C4DE' }
    ],
    sizes: [
      { label: 'S', soldOut: false },
      { label: 'M', soldOut: false },
      { label: 'L', soldOut: false },
      { label: 'XL', soldOut: false }
    ],
    modelInfo: '모델 178cm · M 착용',
    desc: '도톰한 옥스퍼드 면으로 만든 기본 셔츠입니다. 버튼다운 칼라라서 니트 안에 받쳐 입어도 깔끔해요.',
    reviews: 112,
    specs: [
      { term: '소재', desc: '면 100%' },
      { term: '안감', desc: '없음' },
      { term: '두께감', desc: '얇음' },
      { term: '세탁 방법', desc: '30℃ 이하 물세탁' },
      { term: '제조국', desc: '베트남' }
    ],
    sizeGuide: {
      cols: CLOTH_COLS,
      rows: [
        ['S', '72', '45', '53', '60'],
        ['M', '74', '47', '56', '61'],
        ['L', '76', '49', '59', '62'],
        ['XL', '78', '51', '62', '63']
      ]
    }
  },
  {
    id: 7,
    cat: '하의',
    name: '세미 부츠컷 데님',
    price: 69000,
    isNew: true,
    colors: [
      { name: '인디고', hex: '#2F3E5C' },
      { name: '라이트블루', hex: '#8FA7C4' }
    ],
    sizes: [
      { label: 'S', soldOut: true },
      { label: 'M', soldOut: false },
      { label: 'L', soldOut: false },
      { label: 'XL', soldOut: false }
    ],
    modelInfo: '모델 168cm · M 착용',
    desc: '무릎 아래로 살짝 퍼지는 세미 부츠컷 데님입니다. 신축성 있는 원단이라 앉을 때도 편해요.',
    reviews: 67,
    specs: [
      { term: '소재', desc: '면 98%, 폴리우레탄 2%' },
      { term: '안감', desc: '없음' },
      { term: '두께감', desc: '보통' },
      { term: '세탁 방법', desc: '뒤집어서 단독 물세탁' },
      { term: '제조국', desc: '중국' }
    ],
    sizeGuide: {
      cols: PANTS_COLS,
      rows: [
        ['S', '100', '33', '45', '24'],
        ['M', '102', '35', '47', '25'],
        ['L', '104', '37', '49', '26'],
        ['XL', '106', '39', '51', '27']
      ]
    }
  },
  {
    id: 8,
    cat: '액세서리',
    name: '울 캐시미어 머플러',
    price: 59000,
    isNew: true,
    colors: [
      { name: '차콜', hex: '#3A3A3A' },
      { name: '카멜', hex: '#B08560' },
      { name: '오트밀', hex: '#D9D0C1' }
    ],
    sizes: [
      { label: 'FREE', soldOut: false }
    ],
    modelInfo: '양끝 술 장식 포함 길이',
    desc: '울과 캐시미어를 섞어 가볍고 따뜻한 머플러입니다. 코트 위에 한 번 둘러 묶기 좋은 길이예요.',
    reviews: 39,
    specs: [
      { term: '소재', desc: '울 90%, 캐시미어 10%' },
      { term: '안감', desc: '없음' },
      { term: '두께감', desc: '보통' },
      { term: '세탁 방법', desc: '드라이클리닝' },
      { term: '제조국', desc: '이탈리아' }
    ],
    sizeGuide: {
      cols: ['사이즈', '가로', '세로'],
      rows: [
        ['FREE', '180', '30']
      ]
    }
  }
];
