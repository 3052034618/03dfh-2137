import React, { useState, useEffect } from 'react';
import { View, Text, Input, Switch } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useGameStore } from '@/store/useGameStore';
import styles from './index.module.scss';

const JoinPage: React.FC = () => {
  const router = useRouter();
  const { getGameById, joinQueue } = useGameStore();
  const [gameId, setGameId] = useState('');
  const [nickname, setNickname] = useState('');
  const [contact, setContact] = useState('');
  const [bringFriend, setBringFriend] = useState(false);
  const [friendCount, setFriendCount] = useState(1);

  useEffect(() => {
    const id = router.params.id || '';
    setGameId(id);
    console.info('[Join] Join game:', id);
  }, [router.params.id]);

  const game = getGameById(gameId);

  const handleSubmit = () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入称呼', icon: 'none' });
      return;
    }
    if (!contact.trim()) {
      Taro.showToast({ title: '请输入联系方式', icon: 'none' });
      return;
    }

    const newQueue = joinQueue(gameId, nickname.trim(), contact.trim(), bringFriend, bringFriend ? friendCount : 0);
    console.info('[Join] Submitted:', nickname, contact, bringFriend ? `+${friendCount}友` : '');

    if (newQueue) {
      if (newQueue.status === 'confirming') {
        Taro.showToast({ title: '刚好补齐！请尽快确认', icon: 'none' });
        setTimeout(() => {
          Taro.redirectTo({ url: `/pages/confirm/index?id=${newQueue.id}` });
        }, 1000);
      } else {
        Taro.showToast({ title: '已加入候补队列！', icon: 'success' });
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/queue/index' });
        }, 1500);
      }
    }
  };

  if (!game) {
    return (
      <View className={styles.page}>
        <View className={styles.formCard}>
          <Text className={styles.tipsText}>未找到该车队信息</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.gamePreview}>
        <View className={styles.gamePreviewInfo}>
          <Text className={styles.gameName}>{game.scriptName}</Text>
          <Text className={styles.gameMeta}>{game.storeName} · {game.expectedStartTime}</Text>
        </View>
        <Text className={styles.gamePrice}>¥{game.pricePerPerson}/人</Text>
      </View>

      <View className={styles.tips}>
        <Text className={styles.tipsText}>
          提交后即进入候补队列，人数凑齐时需在倒计时内确认，超时视为放弃哦～
        </Text>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.formTitle}>填写意向卡</Text>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>称呼<Text className={styles.formRequired}>*</Text></Text>
          <Input
            className={styles.input}
            placeholder="大家怎么叫你"
            value={nickname}
            onInput={(e) => setNickname(e.detail.value)}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>联系方式<Text className={styles.formRequired}>*</Text></Text>
          <Input
            className={styles.input}
            placeholder="手机号或微信号"
            type="text"
            value={contact}
            onInput={(e) => setContact(e.detail.value)}
          />
        </View>

        <View className={styles.formItem}>
          <View className={styles.friendRow}>
            <Text className={styles.friendLabel}>是否带朋友</Text>
            <Switch
              className={styles.switch}
              checked={bringFriend}
              color="#FF6B35"
              onChange={(e) => setBringFriend(e.detail.value)}
            />
          </View>
          {bringFriend && (
            <View className={styles.friendCountRow}>
              <View
                className={styles.countBtn}
                onClick={() => setFriendCount(Math.max(1, friendCount - 1))}
              >
                <Text>-</Text>
              </View>
              <Text className={styles.countValue}>{friendCount}</Text>
              <View
                className={styles.countBtn}
                onClick={() => setFriendCount(Math.min(5, friendCount + 1))}
              >
                <Text>+</Text>
              </View>
              <Text className={styles.formLabel} style={{ marginBottom: 0 }}>位朋友</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.submitBtn} onClick={handleSubmit}>
          <Text className={styles.submitBtnText}>提交意向，加入候补</Text>
        </View>
      </View>
    </View>
  );
};

export default JoinPage;
