import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useGameStore } from '@/store/useGameStore';
import styles from './index.module.scss';

const CONFIRM_DURATION_SECONDS = 300;

const nowPlusSeconds = (sec: number) => {
  const t = new Date();
  t.setSeconds(t.getSeconds() + sec);
  return t;
};

const ConfirmPage: React.FC = () => {
  const router = useRouter();
  const queueStore = useGameStore();
  const { getQueueById, confirmQueue, cancelQueue, expireQueue } = queueStore;
  const [queueId, setQueueId] = useState('');

  useEffect(() => {
    const id = router.params.id || '';
    setQueueId(id);
    console.info('[Confirm] Queue ID:', id);
  }, [router.params.id]);

  // 每次队列变化时从 store 中取最新引用
  const queueRef = useQueueLive(queueStore, queueId);
  const queue = queueRef.current;

  // 倒计时真实计算：基于确认截止时间，和系统时间对比，不会因为页面切换而重置
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const countdown = useMemo(() => {
    if (!queue || queue.status !== 'confirming') return 0;
    const deadline = queue.confirmDeadline
      ? new Date(queue.confirmDeadline.replace(/\//g, '-'))
      : nowPlusSeconds(CONFIRM_DURATION_SECONDS);
    const remain = Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000));
    return remain;
  }, [queue, queue?.confirmDeadline, queue?.status, queueId]);

  // 倒计时归零时自动置为已过期（只触发一次）
  const expiredRef = useRef(false);
  useEffect(() => {
    if (!queue || queue.status !== 'confirming' || expiredRef.current) return;
    if (countdown <= 0) {
      expiredRef.current = true;
      expireQueue(queue.id);
      console.warn('[Confirm] Time expired, auto expire queue:', queue.id);
      Taro.showToast({ title: '已超时，自动放弃', icon: 'none' });
    }
  }, [countdown, queue, expireQueue]);

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
    if (queue.status !== 'confirming') {
      Taro.showToast({ title: '该记录已无法操作', icon: 'none' });
      return;
    }
    confirmQueue(queueId);
    console.info('[Confirm] Confirmed:', queueId);
    Taro.showToast({ title: '上车成功！准时赴约哦', icon: 'success' });
  };

  const handleGiveUp = () => {
    if (queue.status !== 'confirming') {
      Taro.showToast({ title: '该记录已无法操作', icon: 'none' });
      return;
    }
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
            <Text className={styles.expiredIcon}>
              {queue.status === 'expired' ? '⏰' : '💨'}
            </Text>
            <Text className={styles.expiredTitle}>
              {queue.status === 'expired' ? '已过期' : '已放弃'}
            </Text>
            <Text className={styles.expiredDesc}>
              {queue.status === 'expired' ? '超时未确认，下次早点哦～' : '已放弃本次上车'}
            </Text>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>原车队信息</Text>
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
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={countdown <= 60 ? styles.countdownHeroUrgent : styles.countdownHero}>
        <Text className={styles.countdownLabel}>
          {countdown <= 60 ? '⚠️ 马上过期！请立即确认' : '请在倒计时内确认上车'}
        </Text>
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
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>联系方式</Text>
          <Text className={styles.infoValue}>{queue.contact}</Text>
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

function useQueueLive(store: ReturnType<typeof useGameStore>, queueId: string) {
  const ref = useRef(store.getQueueById(queueId));
  ref.current = store.getQueueById(queueId);
  // 强制订阅 store 变化
  const subscribeFn = store.getState;
  void subscribeFn;
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      // store 变化时更新 ref
      const q = store.getState().queues.find((x) => x.id === queueId);
      if (q) ref.current = q;
    });
    return unsubscribe;
  }, [store, queueId]);
  return ref;
}

export default ConfirmPage;
