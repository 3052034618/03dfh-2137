import { create } from 'zustand';
import { Game, QueueEntry, GameFilter } from '@/types/game';
import { MOCK_GAMES, MOCK_QUEUES } from '@/data/games';

export interface MatchReason {
  key: string;
  label: string;
  hit: boolean;
  text: string;
}

interface GameState {
  games: Game[];
  queues: QueueEntry[];
  filter: GameFilter;
  setFilter: (filter: Partial<GameFilter>) => void;
  resetFilter: () => void;
  getFilteredGames: () => Game[];
  getMatchReasons: (game: Game) => MatchReason[];
  getSortedQueues: () => QueueEntry[];
  joinQueue: (gameId: string, nickname: string, contact: string, bringFriend: boolean, friendCount: number) => QueueEntry | undefined;
  confirmQueue: (queueId: string) => void;
  cancelQueue: (queueId: string) => void;
  expireQueue: (queueId: string) => void;
  getQueueById: (queueId: string) => QueueEntry | undefined;
  getGameById: (gameId: string) => Game | undefined;
}

const defaultFilter: GameFilter = {
  area: '全部商圈',
  arriveTime: '不限时间',
  priceRange: '不限价位',
  acceptBeginner: false,
  preferences: []
};

const timeOptionToRange = (opt: string): [number, number] | null => {
  switch (opt) {
    case '18:00前': return [0, 1800];
    case '18:00-19:00': return [1800, 1900];
    case '19:00-20:00': return [1900, 2000];
    case '20:00-21:00': return [2000, 2100];
    case '21:00后': return [2100, 2359];
    default: return null;
  }
};

const startTimeToInt = (t: string): number => {
  const [h, m] = t.split(':');
  return parseInt(h, 10) * 100 + parseInt(m, 10);
};

export const useGameStore = create<GameState>((set, get) => ({
  games: MOCK_GAMES,
  queues: MOCK_QUEUES,
  filter: { ...defaultFilter },

  setFilter: (partial) =>
    set((state) => ({
      filter: { ...state.filter, ...partial }
    })),

  resetFilter: () => set({ filter: { ...defaultFilter } }),

  getFilteredGames: () => {
    const { games, filter } = get();
    return games.filter((game) => {
      if (filter.area !== '全部商圈' && game.storeArea !== filter.area) return false;

      const timeRange = timeOptionToRange(filter.arriveTime);
      if (timeRange) {
        const [lo, hi] = timeRange;
        const gt = startTimeToInt(game.expectedStartTime);
        if (gt < lo || gt > hi) return false;
      }

      if (filter.priceRange !== '不限价位') {
        if (filter.priceRange === '100元以内' && game.pricePerPerson >= 100) return false;
        if (filter.priceRange === '100-150元' && (game.pricePerPerson < 100 || game.pricePerPerson > 150)) return false;
        if (filter.priceRange === '150-200元' && (game.pricePerPerson < 150 || game.pricePerPerson > 200)) return false;
        if (filter.priceRange === '200元以上' && game.pricePerPerson < 200) return false;
      }

      if (filter.acceptBeginner && !game.acceptBeginner) return false;

      if (filter.preferences.length > 0) {
        const hasMatch = filter.preferences.some((pref) => game.scriptType.includes(pref));
        if (!hasMatch) return false;
      }

      return true;
    });
  },

  getMatchReasons: (game) => {
    const { filter } = get();
    const reasons: MatchReason[] = [];

    const areaHit = filter.area === '全部商圈' ? true : game.storeArea === filter.area;
    reasons.push({
      key: 'area',
      label: '商圈',
      hit: areaHit,
      text: areaHit
        ? (filter.area === '全部商圈' ? `默认推荐 · ${game.storeArea}` : `商圈匹配 · ${game.storeArea}`)
        : `商圈不匹配（${filter.area} vs ${game.storeArea}）`
    });

    const timeRange = timeOptionToRange(filter.arriveTime);
    let timeHit = true;
    let timeText = '时间不限';
    if (timeRange) {
      const [lo, hi] = timeRange;
      const gt = startTimeToInt(game.expectedStartTime);
      timeHit = gt >= lo && gt <= hi;
      timeText = timeHit
        ? `时间匹配 · ${game.expectedStartTime}在${filter.arriveTime}范围内`
        : `时间不匹配（${game.expectedStartTime}不在${filter.arriveTime}）`;
    }
    reasons.push({ key: 'time', label: '时间', hit: timeHit, text: timeText });

    let priceHit = true;
    let priceText = '价位不限';
    if (filter.priceRange !== '不限价位') {
      if (filter.priceRange === '100元以内') priceHit = game.pricePerPerson < 100;
      else if (filter.priceRange === '100-150元') priceHit = game.pricePerPerson >= 100 && game.pricePerPerson <= 150;
      else if (filter.priceRange === '150-200元') priceHit = game.pricePerPerson >= 150 && game.pricePerPerson <= 200;
      else if (filter.priceRange === '200元以上') priceHit = game.pricePerPerson >= 200;
      priceText = priceHit
        ? `价位匹配 · ¥${game.pricePerPerson}在${filter.priceRange}内`
        : `价位不匹配（¥${game.pricePerPerson}不在${filter.priceRange}）`;
    }
    reasons.push({ key: 'price', label: '价位', hit: priceHit, text: priceText });

    const beginnerHit = filter.acceptBeginner ? game.acceptBeginner : true;
    reasons.push({
      key: 'beginner',
      label: '新手',
      hit: beginnerHit,
      text: filter.acceptBeginner
        ? (beginnerHit ? '新手友好 · 支持新手入局' : '不支持新手')
        : '未开启新手筛选'
    });

    const prefHits = filter.preferences.filter((p) => game.scriptType.includes(p));
    const prefHit = filter.preferences.length === 0 ? true : prefHits.length > 0;
    reasons.push({
      key: 'preference',
      label: '偏好',
      hit: prefHit,
      text:
        filter.preferences.length === 0
          ? '未设置偏好（均推荐）'
          : prefHits.length > 0
            ? `偏好命中${prefHits.length}项 · ${prefHits.map((p) => {
                switch (p) {
                  case 'camp': return '阵营对抗';
                  case 'rpg': return '跑团机制';
                  case 'fun': return '欢乐撕逼';
                  case 'reasoning': return '轻推理';
                  default: return p;
                }
              }).join('、')}`
            : '无偏好命中'
    });

    return reasons;
  },

  getSortedQueues: () => {
    const { queues } = get();
    const order = ['confirming', 'pending', 'confirmed', 'expired', 'cancelled'];
    return [...queues].sort((a, b) => {
      const ai = order.indexOf(a.status);
      const bi = order.indexOf(b.status);
      if (ai !== bi) return ai - bi;
      return a.createdAt < b.createdAt ? 1 : -1;
    });
  },

  joinQueue: (gameId, nickname, contact, bringFriend, friendCount) => {
    const { games } = get();
    const game = games.find((g) => g.id === gameId);
    if (!game) {
      console.error('[Store] Game not found:', gameId);
      return undefined;
    }

    const joiningCount = 1 + (bringFriend ? friendCount : 0);
    const vacancy = game.totalPlayers - game.currentPlayers;
    const justFill = joiningCount >= vacancy;

    const now = new Date();
    const deadline = justFill
      ? new Date(now.getTime() + 5 * 60 * 1000).toLocaleString('zh-CN')
      : '';

    const newQueue: QueueEntry = {
      id: `q${Date.now()}`,
      gameId,
      game,
      status: justFill ? 'confirming' : 'pending',
      nickname,
      contact,
      bringFriend,
      friendCount,
      createdAt: now.toLocaleString('zh-CN'),
      confirmDeadline: deadline
    };

    console.info(
      '[Store] Join queue:',
      newQueue.id,
      'status:',
      newQueue.status,
      'joining:',
      joiningCount,
      'vacancy:',
      vacancy,
      'deadline:',
      deadline
    );
    set((state) => ({ queues: [newQueue, ...state.queues] }));
    return newQueue;
  },

  confirmQueue: (queueId) => {
    console.info('[Store] Confirm queue:', queueId);
    set((state) => ({
      queues: state.queues.map((q) =>
        q.id === queueId ? { ...q, status: 'confirmed' as const } : q
      )
    }));
  },

  cancelQueue: (queueId) => {
    console.info('[Store] Cancel queue:', queueId);
    set((state) => ({
      queues: state.queues.map((q) =>
        q.id === queueId ? { ...q, status: 'cancelled' as const } : q
      )
    }));
  },

  expireQueue: (queueId) => {
    console.info('[Store] Expire queue:', queueId);
    set((state) => ({
      queues: state.queues.map((q) =>
        q.id === queueId ? { ...q, status: 'expired' as const } : q
      )
    }));
  },

  getQueueById: (queueId) => {
    return get().queues.find((q) => q.id === queueId);
  },

  getGameById: (gameId) => {
    return get().games.find((g) => g.id === gameId);
  }
}));
