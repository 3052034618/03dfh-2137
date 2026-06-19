import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useGameStore } from '@/store/useGameStore';
import styles from './index.module.scss';

const DetailPage: React.FC = () => {
  const router = useRouter();
  const { getGameById } = useGameStore();
  const [gameId, setGameId] = useState('');

  useEffect(() => {
    const id = router.params.id || '';
    setGameId(id);
    console.info('[Detail] Loading game:', id);
  }, [router.params.id]);

  const game = getGameById(gameId);

  if (!game) {
    return (
      <View className={styles.page}>
        <View className={styles.content}>
          <View className={styles.card}>
            <Text className={styles.descText}>未找到该车队信息</Text>
          </View>
        </View>
      </View>
    );
  }

  const vacancy = game.totalPlayers - game.currentPlayers;

  const handleJoin = () => {
    Taro.navigateTo({ url: `/pages/join/index?id=${game.id}` });
  };

  return (
    <View className={styles.page}>
      <View className={styles.hero}>
        <Text className={styles.scriptName}>{game.scriptName}</Text>
        <Text className={styles.storeInfo}>{game.storeName} · {game.storeArea}</Text>
        <View className={styles.tagRow}>
          {game.tags.map((tag) => (
            <Text key={tag} className={styles.heroTag}>{tag}</Text>
          ))}
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.card}>
          <Text className={styles.cardTitle}>基本信息</Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>难度</Text>
            <Text className={styles.infoValue}>{game.difficulty}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>时长</Text>
            <Text className={styles.infoValue}>{game.duration}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>人数</Text>
            <Text className={styles.infoValue}>{game.currentPlayers}/{game.totalPlayers}（缺{vacancy}人）</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>价位</Text>
            <Text className={classnames(styles.infoValue, styles.priceHighlight)}>¥{game.pricePerPerson}/人</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>预计开本</Text>
            <Text className={styles.infoValue}>{game.expectedStartTime}</Text>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>座位情况</Text>
          <View className={styles.slotsWrap}>
            {Array.from({ length: game.totalPlayers }).map((_, i) => (
              <Text
                key={i}
                className={classnames(styles.slot, i < game.currentPlayers ? styles.slotFilled : styles.slotEmpty)}
              >
                {i < game.currentPlayers ? '已' : '缺'}
              </Text>
            ))}
          </View>
          <View style={{ marginTop: '24rpx' }}>
            <Text className={styles.infoLabel}>缺口角色</Text>
            <Text className={styles.infoValue}>{game.missingRoles.join('、')}</Text>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>DM提示</Text>
          <View className={styles.dmTipBox}>
            <Text className={styles.dmName}>DM · {game.dmName}</Text>
            <Text className={styles.dmContent}>{game.dmTip}</Text>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>剧本简介</Text>
          <Text className={styles.descText}>{game.description}</Text>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View>
          <Text className={styles.bottomPrice}>¥{game.pricePerPerson}</Text>
          <Text className={styles.bottomPriceUnit}>/人</Text>
        </View>
        <View className={styles.joinBtn} onClick={handleJoin}>
          <Text className={styles.joinBtnText}>我想上车</Text>
        </View>
      </View>
    </View>
  );
};

export default DetailPage;
