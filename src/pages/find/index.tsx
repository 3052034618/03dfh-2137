import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useGameStore } from '@/store/useGameStore';
import { PreferenceKey } from '@/types/game';
import FilterBar from '@/components/FilterBar';
import GameCard from '@/components/GameCard';
import styles from './index.module.scss';

const FindPage: React.FC = () => {
  const { filter, setFilter, getFilteredGames } = useGameStore();
  const filteredGames = useMemo(() => getFilteredGames(), [filter, getFilteredGames]);

  const handleGameClick = (gameId: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${gameId}` });
  };

  const handlePreferenceToggle = (key: PreferenceKey) => {
    const newPrefs = filter.preferences.includes(key)
      ? filter.preferences.filter((p) => p !== key)
      : [...filter.preferences, key];
    setFilter({ preferences: newPrefs });
  };

  return (
    <View className={styles.page}>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>今晚有没有局？</Text>
        <Text className={styles.heroSubtitle}>选好条件，快速找到适合你的欢乐本车队</Text>
      </View>

      <View className={styles.filterSection}>
        <FilterBar
          area={filter.area}
          arriveTime={filter.arriveTime}
          priceRange={filter.priceRange}
          acceptBeginner={filter.acceptBeginner}
          preferences={filter.preferences}
          onAreaChange={(v) => setFilter({ area: v })}
          onTimeChange={(v) => setFilter({ arriveTime: v })}
          onPriceChange={(v) => setFilter({ priceRange: v })}
          onBeginnerChange={(v) => setFilter({ acceptBeginner: v })}
          onPreferenceToggle={handlePreferenceToggle}
        />
      </View>

      <View className={styles.gameSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>正在缺人</Text>
          <Text className={styles.resultCount}>{filteredGames.length}个车队</Text>
        </View>

        {filteredGames.length > 0 ? (
          filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onClick={(g) => handleGameClick(g.id)}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyText}>暂无符合条件的车队</Text>
            <Text className={styles.emptySub}>试试调整筛选条件？</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default FindPage;
