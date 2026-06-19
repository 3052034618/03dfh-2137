export interface Game {
  id: string;
  storeName: string;
  storeArea: string;
  scriptName: string;
  scriptType: string[];
  pricePerPerson: number;
  totalPlayers: number;
  currentPlayers: number;
  missingRoles: string[];
  expectedStartTime: string;
  dmName: string;
  dmTip: string;
  acceptBeginner: boolean;
  tags: string[];
  coverImage: string;
  description: string;
  difficulty: string;
  duration: string;
}

export interface QueueEntry {
  id: string;
  gameId: string;
  game: Game;
  status: 'pending' | 'confirming' | 'confirmed' | 'expired' | 'cancelled';
  nickname: string;
  contact: string;
  bringFriend: boolean;
  friendCount: number;
  createdAt: string;
  confirmDeadline: string;
}

export interface GameFilter {
  area: string;
  arriveTime: string;
  priceRange: string;
  acceptBeginner: boolean;
  preferences: string[];
}

export type PreferenceKey = 'camp' | 'rpg' | 'fun' | 'reasoning';

export interface PreferenceOption {
  key: PreferenceKey;
  label: string;
}

export const PREFERENCE_OPTIONS: PreferenceOption[] = [
  { key: 'camp', label: '阵营对抗' },
  { key: 'rpg', label: '跑团式机制' },
  { key: 'fun', label: '欢乐撕逼' },
  { key: 'reasoning', label: '轻推理占比' }
];

export const AREA_OPTIONS: string[] = [
  '全部商圈',
  '徐家汇',
  '静安寺',
  '人民广场',
  '中山公园',
  '五角场',
  '陆家嘴',
  '莘庄',
  '虹桥'
];

export const TIME_OPTIONS: string[] = [
  '不限时间',
  '18:00前',
  '18:00-19:00',
  '19:00-20:00',
  '20:00-21:00',
  '21:00后'
];

export const PRICE_OPTIONS: string[] = [
  '不限价位',
  '100元以内',
  '100-150元',
  '150-200元',
  '200元以上'
];
