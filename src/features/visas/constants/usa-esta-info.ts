// 美國 ESTA 簽證相關常數

export interface EstaDeliveryOption {
  method: string
  fee: number
}

export interface EstaRequirementSection {
  title: string
  items: string[]
}

// ESTA 申請費用
export const ESTA_DELIVERY_OPTIONS: EstaDeliveryOption[] = [
  { method: '電子申請（ESTA）', fee: 2000 }, // 含代辦費
]

// ESTA 申請所需資料
export const ESTA_REQUIREMENTS: EstaRequirementSection[] = [
  {
    title: '基本資料',
    items: [
      '護照正本（效期需為兩年以上，ESTA 有效期通常為兩年）',
      '如護照不足兩年效期，ESTA 效期到護照到期日為止',
      '出生城市、出生國家',
      '中英文連絡地址',
      '連絡電話號碼',
    ],
  },
  {
    title: '國籍與身分資訊',
    items: [
      '是否為其他國家公民或國民（現在/曾經）',
      '是否有任何其他姓名或別名',
      '是否曾持有其他國家護照或身分證',
    ],
  },
  {
    title: '社群媒體資訊（選填）',
    items: [
      'Facebook、Google+、Twitter、YouTube、Instagram、QQ 等平台資訊',
      '社群媒體英文識別碼（用戶名稱）',
    ],
  },
  {
    title: '父母資訊',
    items: [
      '父親中英文姓名',
      '母親中英文姓名',
      '（包含親生父母、養父母、繼父母或監護人）',
    ],
  },
  {
    title: '就業資訊',
    items: [
      '職稱（中英文）',
      '公司或學校名字（中英文）',
      '公司或學校地址（中英文）',
      '公司或學校電話',
      '如無工作：待業、學齡前兒童、家庭主婦、退休等',
    ],
  },
  {
    title: '旅遊資訊',
    items: [
      '是否因為過境到另一個國家',
      '美國聯絡人或飯店資訊（英文名字、地址、電話）',
      '在美期間地址、城市、州別',
    ],
  },
  {
    title: '緊急聯絡人資訊',
    items: [
      '緊急聯絡人中英文姓名',
      '電話號碼（含國碼）',
      '電子郵件地址',
      '（如無緊急連絡人請填「無」）',
    ],
  },
]

// ESTA 符合資格問題（9 大問題）
export const ESTA_ELIGIBILITY_QUESTIONS = [
  {
    id: 'q1',
    question: '是否患有身體或心理障礙；或是為濫用藥物或上癮人士；或現在是否有以下任何疾病？',
    diseases: [
      '軟性下疳',
      '淋病',
      '淋病肉芽腫',
      '痲瘋病（具傳染性）',
      '性病淋巴肉芽腫',
      '梅毒（具傳染性）',
      '活動性肺結核',
    ],
  },
  {
    id: 'q2',
    question: '是否曾經因導致嚴重損害財物、或對他人或政府當局造成嚴重傷害而被逮捕或定罪過？',
  },
  {
    id: 'q3',
    question: '是否曾經違反任何關於持有、使用或銷售非法藥品之法律規定？',
  },
  {
    id: 'q4',
    question: '是否尋求涉及或曾經涉及恐怖、間諜、破壞或種族滅絕活動？',
  },
  {
    id: 'q5',
    question: '是否曾經犯過詐欺或不實代表自己或他人以取得、或協助他人取得簽證或入美？',
  },
  {
    id: 'q6',
    question: '目前是否在美尋求就業機會或您是否之前在美未經美國政府事前許可在美工作？',
  },
  {
    id: 'q7',
    question:
      '是否曾經以現有或以前的護照申請美國簽證遭拒簽過，或你是否曾經被拒絕入境美國或於美國入境關口撤銷入境之申請？',
    note: '（曾經申請美國簽證被拒絕，或在美國入境口岸被拒絕進入美國或取消進入美國的申請者，此次申請 ESTA 或者入境海關時，被拒絕的可能性仍很大。）',
  },
  {
    id: 'q8',
    question: '是否曾經在美滯留時間超過美國政府給您之入境許可時間？',
  },
  {
    id: 'q9',
    question:
      '是否於 2011 年 3 月 1 日或之後曾前往或身處伊朗、伊拉克、利比亞、北韓、索馬利亞、蘇丹、敘利亞、葉門或古巴的旅客？',
    countries: [
      '伊朗',
      '伊拉克',
      '利比亞',
      '北韓',
      '索馬利亞',
      '蘇丹',
      '敘利亞',
      '葉門',
      '古巴',
    ],
    purposeOptions: [
      '以觀光客身分前往（渡假）',
      '個人旅遊或探親（包括緊急事件）',
      '商務／公務目的',
      '履行 Visa Waiver Program 國家之政府全職員工官方職責',
      '以記者身份進行工作',
      '代表人道主義或國際非政府組織參與人道救援',
      '履行代表國際組織或地區性（多邊或政府間）組織之官方職責',
      '履行代表地方政府或 VWP 國政府機關之官方職責',
      '於學術機構就學',
      '參加專業交流或會議',
      '參與文化交流計畫',
      '其他',
    ],
  },
]

// ESTA 重要注意事項
export const ESTA_NOTES: string[] = [
  '＊ESTA 的有效期通常為兩年或到護照到期日為止（取較短者）',
  '＊申請 ESTA 需提供完整且正確的資料，任何錯誤可能導致拒絕入境',
  '＊曾經被拒簽或拒絕入境者，申請 ESTA 被拒絕的可能性較大',
  '＊ESTA 核准不代表一定能入境美國，最終決定權在入境海關',
  '＊社群媒體資訊為選填，但提供完整資訊有助於加速審核',
  '＊曾前往伊朗、伊拉克等特定國家者，需提供詳細旅遊目的說明',
]

// 取得其他國籍的方式
export const CITIZENSHIP_ACQUISITION_METHODS = [
  '經出生',
  '經父母',
  '歸化',
  '其他',
]

// 就業狀態選項
export const EMPLOYMENT_STATUS_OPTIONS = [
  '待業',
  '學齡前兒童',
  '家庭主婦',
  '退休',
]

// 社群媒體平台列表
export const SOCIAL_MEDIA_PLATFORMS = [
  'Facebook',
  'Google+',
  'Twitter',
  'YouTube',
  'Instagram',
  'QQ',
  'LinkedIn',
  'WeChat',
  'Line',
]

// 美國州別列表（簡化版，主要常用州）
export const US_STATES = [
  'Alabama (AL)',
  'Alaska (AK)',
  'Arizona (AZ)',
  'Arkansas (AR)',
  'California (CA)',
  'Colorado (CO)',
  'Connecticut (CT)',
  'Delaware (DE)',
  'Florida (FL)',
  'Georgia (GA)',
  'Hawaii (HI)',
  'Idaho (ID)',
  'Illinois (IL)',
  'Indiana (IN)',
  'Iowa (IA)',
  'Kansas (KS)',
  'Kentucky (KY)',
  'Louisiana (LA)',
  'Maine (ME)',
  'Maryland (MD)',
  'Massachusetts (MA)',
  'Michigan (MI)',
  'Minnesota (MN)',
  'Mississippi (MS)',
  'Missouri (MO)',
  'Montana (MT)',
  'Nebraska (NE)',
  'Nevada (NV)',
  'New Hampshire (NH)',
  'New Jersey (NJ)',
  'New Mexico (NM)',
  'New York (NY)',
  'North Carolina (NC)',
  'North Dakota (ND)',
  'Ohio (OH)',
  'Oklahoma (OK)',
  'Oregon (OR)',
  'Pennsylvania (PA)',
  'Rhode Island (RI)',
  'South Carolina (SC)',
  'South Dakota (SD)',
  'Tennessee (TN)',
  'Texas (TX)',
  'Utah (UT)',
  'Vermont (VT)',
  'Virginia (VA)',
  'Washington (WA)',
  'West Virginia (WV)',
  'Wisconsin (WI)',
  'Wyoming (WY)',
]

export function formatCurrency(amount: number): string {
  return `NT$${amount.toLocaleString()}`
}
