import React, { useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import { Game } from '@/types/game';
import { useGameStore, MatchReason } from '@/store/useGameStore';
import styles from './index.module.scss';

interface GameCardProps {
  game: Game;
  onClick: (game: Game) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  const vacancy = game.totalPlayers - game.currentPlayers;
  const getMatchReasons = useGameStore((s) => s.getMatchReasons);
  const filter = useGameStore((s) => s.filter);
  const reasons = useMemo(() => getMatchReasons(game), [game, getMatchReasons, filter]);
  const hitReasons = reasons.filter((r) => r.hit);

  const displayReasons = useMemo(() => {
    if (filter.maxVacancy > 0) {
      const soon = hitReasons.find((r) => r.key === 'soon');
      const rest = hitReasons.filter((r) => r.key !== 'soon');
      return soon ? [soon, ...rest] : hitReasons;
    }
    return hitReasons;
  }, [hitReasons, filter.maxVacancy]);

  return (
    <View className={styles.card} onClick={() => onClick(game)}>
      <View className={styles.header}>
        <Image className={styles.cover} src={game.coverImage} mode="aspectFill" />
        <View className={styles.info}>
          <Text className={styles.scriptName}>{game.scriptName}</Text>
          <Text className={styles.storeName}>{game.storeName} · {game.storeArea}</Text>
          <View className={styles.tagRow}>
            {game.tags.map((tag) => (
              <Text key={tag} className={styles.tag}>{tag}</Text>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.matchBox}>
        <Text className={styles.matchTitle}>匹配说明</Text>
        <View className={styles.matchList}>
          {displayReasons.slice(0, 3).map((r) => (
            <View key={r.key} className={styles.matchItem}>
              <View className={styles.matchDot} />
              <Text className={styles.matchText}>{r.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.body}>
        <View className={styles.row}>
          <Text className={styles.label}>人数</Text>
          <Text className={styles.value}>
            {game.currentPlayers}/{game.totalPlayers}
            <Text className={styles.vacancy}> 缺{vacancy}人</Text>
          </Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>缺口角色</Text>
          <Text className={styles.value}>{game.missingRoles.join('、')}</Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>预计开本</Text>
          <Text className={styles.value}>{game.expectedStartTime}</Text>
        </View>
      </View>

      {game.dmTip && (
        <View className={styles.dmTip}>
          <Text className={styles.dmLabel}>DM·{game.dmName}</Text>
          <Text className={styles.dmText}>{game.dmTip}</Text>
        </View>
      )}

      <View className={styles.footer}>
        <Text className={styles.price}>¥{game.pricePerPerson}/人</Text>
        <View className={styles.joinBtn}>
          <Text className={styles.joinBtnText}>我想上车</Text>
        </View>
      </View>
    </View>
  );
};

export default GameCard;
