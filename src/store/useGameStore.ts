import { create } from 'zustand';
import { Game, QueueEntry, GameFilter } from '@/types/game';
import { MOCK_GAMES, MOCK_QUEUES } from '@/data/games';

interface GameState {
  games: Game[];
  queues: QueueEntry[];
  filter: GameFilter;
  setFilter: (filter: Partial<GameFilter>) => void;
  resetFilter: () => void;
  getFilteredGames: () => Game[];
  joinQueue: (gameId: string, nickname: string, contact: string, bringFriend: boolean, friendCount: number) => void;
  confirmQueue: (queueId: string) => void;
  cancelQueue: (queueId: string) => void;
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

  joinQueue: (gameId, nickname, contact, bringFriend, friendCount) => {
    const { games } = get();
    const game = games.find((g) => g.id === gameId);
    if (!game) {
      console.error('[Store] Game not found:', gameId);
      return;
    }

    const newQueue: QueueEntry = {
      id: `q${Date.now()}`,
      gameId,
      game,
      status: 'pending',
      nickname,
      contact,
      bringFriend,
      friendCount,
      createdAt: new Date().toLocaleString('zh-CN'),
      confirmDeadline: ''
    };

    console.info('[Store] Join queue:', newQueue.id, 'for game:', gameId);
    set((state) => ({ queues: [newQueue, ...state.queues] }));
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

  getQueueById: (queueId) => {
    return get().queues.find((q) => q.id === queueId);
  },

  getGameById: (gameId) => {
    return get().games.find((g) => g.id === gameId);
  }
}));
