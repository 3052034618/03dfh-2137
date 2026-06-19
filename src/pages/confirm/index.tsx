import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useGameStore } from '@/store/useGameStore';
import styles from './index.module.scss';

const COUNTDOWN_SECONDS = 300;

const ConfirmPage: React.FC = () => {
  const router = useRouter();
  const { getQueueById, confirmQueue, cancelQueue } = useGameStore();
  const [queueId, setQueueId] = useState('');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const id = router.params.id || '';
    setQueueId(id);
    console.info('[Confirm] Queue ID:', id);
  }, [router.params.id]);

  const queue = getQueueById(queueId);

  useEffect(() => {
    if (!queue || queue.status !== 'confirming') return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [queue?.status]);

  if (!queue) {
    return (
      <View className={styles.page}>
        <View className={styles.card}>
          <Text className={styles.infoValue}>未找到候补记录</Text>
        </View>
      </View>
    );
  }

  const game = queue.game;

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    confirmQueue(queueId);
    console.info('[Confirm] Confirmed:', queueId);
    Taro.showToast({ title: '上车成功！准时赴约哦', icon: 'success' });
  };

  const handleGiveUp = () => {
    Taro.showModal({
      title: '确认放弃？',
      content: '放弃后需要重新排队，确定吗？',
      success: (res) => {
        if (res.confirm) {
          cancelQueue(queueId);
          console.info('[Confirm] Cancelled:', queueId);
          Taro.showToast({ title: '已放弃', icon: 'none' });
        }
      }
    });
  };

  if (queue.status === 'confirmed') {
    return (
      <View className={styles.page}>
        <View className={styles.card}>
          <View className={styles.confirmedState}>
            <Text className={styles.confirmedIcon}>🎉</Text>
            <Text className={styles.confirmedTitle}>已确认上车！</Text>
            <Text className={styles.confirmedDesc}>请准时到店，别鸽车哦～</Text>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>局内信息</Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>剧本</Text>
            <Text className={styles.infoValue}>{game.scriptName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>门店</Text>
            <Text className={styles.infoValue}>{game.storeName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>开本时间</Text>
            <Text className={styles.infoValue}>{game.expectedStartTime}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>DM</Text>
            <Text className={styles.infoValue}>{game.dmName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>价位</Text>
            <Text className={styles.infoValue}>¥{game.pricePerPerson}/人</Text>
          </View>
        </View>
      </View>
    );
  }

  if (queue.status === 'expired' || queue.status === 'cancelled') {
    return (
      <View className={styles.page}>
        <View className={styles.card}>
          <View className={styles.expiredState}>
            <Text className={styles.expiredTitle}>{queue.status === 'expired' ? '已过期' : '已放弃'}</Text>
            <Text className={styles.expiredDesc}>下次早点确认哦～</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.countdownHero}>
        <Text className={styles.countdownLabel}>请在倒计时内确认上车</Text>
        <Text className={styles.countdownTime}>{formatCountdown(countdown)}</Text>
        <Text className={styles.countdownUnit}>超时将自动放弃</Text>
      </View>

      <View className={styles.warningBox}>
        <Text className={styles.warningText}>
          人数已凑齐！请在倒计时内确认，避免鸽车影响其他玩家体验。确认后请准时到店～
        </Text>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>车队信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>剧本</Text>
          <Text className={styles.infoValue}>{game.scriptName}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>门店</Text>
          <Text className={styles.infoValue}>{game.storeName} · {game.storeArea}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>开本时间</Text>
          <Text className={styles.infoValue}>{game.expectedStartTime}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>DM</Text>
          <Text className={styles.infoValue}>{game.dmName}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>缺口角色</Text>
          <Text className={styles.infoValue}>{game.missingRoles.join('、')}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>价位</Text>
          <Text className={styles.infoValue}>¥{game.pricePerPerson}/人</Text>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>我的信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>称呼</Text>
          <Text className={styles.infoValue}>{queue.nickname}</Text>
        </View>
        {queue.bringFriend && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>带朋友</Text>
            <Text className={styles.infoValue}>{queue.friendCount}位</Text>
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.giveUpBtn} onClick={handleGiveUp}>
          <Text className={styles.giveUpBtnText}>放弃</Text>
        </View>
        <View className={styles.confirmBtn} onClick={handleConfirm}>
          <Text className={styles.confirmBtnText}>确认上车</Text>
        </View>
      </View>
    </View>
  );
};

export default ConfirmPage;
