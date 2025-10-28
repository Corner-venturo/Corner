export interface DeliveryOption {
  method: string;
  adult: number;
  child: number;
}

export interface RequirementSection {
  title: string;
  items: string[];
}

export const PASSPORT_DELIVERY_OPTIONS: DeliveryOption[] = [
  { method: '自取', adult: 1800, child: 1400 },
  { method: '郵政寄回', adult: 1900, child: 1500 },
  { method: '雙北快遞寄回', adult: 2000, child: 1600 },
];

export const PASSPORT_REQUIREMENTS: RequirementSection[] = [
  {
    title: '年滿18歲者申請護照（首次申請）',
    items: [
      '簡式護照資料表【人別確認專用】（請先至住家附近的戶政事務所辦理）',
      '相片2張（2吋大頭照，護照規格）',
      '身分證正本',
    ],
  },
  {
    title: '年滿18歲者申請護照（換發）',
    items: [
      '舊護照正本（效期未逾期才須提供，若已經過期則免）',
      '相片2張（2吋大頭照，護照規格）',
      '身分證正本',
    ],
  },
  {
    title: '滿14歲至未滿18歲者申請護照（首次申請）',
    items: [
      '簡式護照資料表【人別確認專用】（請先至住家附近的戶政事務所辦理）',
      '相片2張（2吋大頭照，護照規格）',
      '身分證正本',
      '法定代理人身分證（提供父／母其中一位身分證正本即可）',
    ],
  },
  {
    title: '滿14歲至未滿18歲者申請護照（換發）',
    items: [
      '相片2張（2吋大頭照，護照規格）',
      '身分證正本',
      '法定代理人身分證（提供父／母其中一位身分證正本即可）',
    ],
  },
  {
    title: '未滿14歲者申請護照（首次申請）',
    items: [
      '簡式護照資料表【人別確認專用】（請先至住家附近的戶政事務所辦理）',
      '相片2張（2吋大頭照，護照規格）',
      '戶口名簿正本或戶籍謄本正本（已領新式國民身分證者請改繳身分證）',
      '法定代理人身分證（提供父／母其中一位身分證正本即可）',
    ],
  },
  {
    title: '未滿14歲者申請護照（換發）',
    items: [
      '相片2張（2吋大頭照，護照規格）',
      '戶口名簿正本或戶籍謄本正本（已領新式國民身分證者請改繳身分證）',
      '法定代理人身分證（提供父／母其中一位身分證正本即可）',
    ],
  },
];

export const PASSPORT_NOTES: string[] = [
  '＊申請人應繳交最近6個月內所攝彩色正面、脫帽、五官清晰、白色背景的護照專用照片。',
  '＊因近期受理案件較多，正常護照代辦時程改為14個工作天（不含例假日）；急件為4個工作天（不含例假日），每件費用+900元。',
  '＊若護照遺失但效期未逾期，請先至警局備案，並提供相關證明文件，代辦時程需多加1個工作天。',
];

export const TAIWAN_COMPATRIOT_DELIVERY_OPTIONS: DeliveryOption[] = [
  { method: '自取', adult: 1800, child: 1800 },
  { method: '郵政寄回', adult: 1900, child: 1900 },
  { method: '雙北快遞寄回', adult: 2000, child: 2000 },
];

export const TAIWAN_COMPATRIOT_REQUIREMENTS: RequirementSection[] = [
  {
    title: '台胞證申辦所需資料',
    items: [
      '護照正本（效期需六個月以上護照正本）',
      '相片1張（2吋大頭照，護照規格）',
      '身分證影本【須為原比例清楚完整的影本，請勿翻拍】',
      '戶籍謄本正本（如有改名或個人身份資料更改者、未滿14歲未領身份證者，需附上3個月內戶籍謄本正本，記事不可省略或部分省略，需有完整詳細說明）',
    ],
  },
];

export const TAIWAN_COMPATRIOT_NOTES: string[] = [
  '＊申請人應繳交最近6個月內所攝彩色正面、脫帽、五官清晰、白色背景的護照專用照片。',
  '＊因近期受理案件較多，正常台胞證代辦時程改為9個工作天（不含例假日）；急件為6個工作天（不含例假日），每件費用+900元。',
  '＊若台胞證遺失但效期未逾期，請先至警局備案，並提供相關證明文件，另需支付罰金1,100元。',
];

export function formatCurrency(amount: number): string {
  return `NT$${amount.toLocaleString()}`;
}

export function buildVisaInfoText(): string {
  const sections = [
    {
      title: '護照',
      options: PASSPORT_DELIVERY_OPTIONS,
      requirements: PASSPORT_REQUIREMENTS,
      notes: PASSPORT_NOTES,
    },
    {
      title: '台胞證',
      options: TAIWAN_COMPATRIOT_DELIVERY_OPTIONS,
      requirements: TAIWAN_COMPATRIOT_REQUIREMENTS,
      notes: TAIWAN_COMPATRIOT_NOTES,
    },
  ];

  const lines: string[] = [];

  sections.forEach((section, sectionIndex) => {
    lines.push(section.title);
    lines.push('取貨方式／身份');
    section.options.forEach(option => {
      lines.push(`  ${option.method}：成人 ${formatCurrency(option.adult)}／兒童（未滿14歲） ${formatCurrency(option.child)}`);
    });
    lines.push('');

    section.requirements.forEach(requirement => {
      lines.push(`－${requirement.title}`);
      requirement.items.forEach((item, itemIndex) => {
        lines.push(`  ${itemIndex + 1}. ${item}`);
      });
      lines.push('');
    });

    section.notes.forEach(note => {
      lines.push(note);
    });

    if (sectionIndex < sections.length - 1) {
      lines.push('');
    }
  });

  return lines.join('\n');
}

export const VISA_INFO_TEXT = buildVisaInfoText();
