import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useGameStore, getConfirmRemaining } from '@/store/useGameStore';
import { QueueEntry } from '@/types/game';
import styles from './index.module.scss';

const ConfirmPage: React.FC = () => {
  const router = useRouter();
  const store = useGameStore();
  const [queueId, setQueueId] = useState('');

  useEffect(() => {
    const id = router.params.id || '';
    setQueueId(id);
    console.info('[Confirm] Queue ID:', id);
    store.checkAndExpireOverdue();
  }, [router.params.id, store]);

  const queue = useLiveQueue(store, queueId);

  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      tick((v) => v + 1);
      store.checkAndExpireOverdue();
    }, 1000);
    return () => clearInterval(id);
  }, [store]);

  if (!queue) {
    return (
      <View className={styles.page}>
        <View className={styles.card}>
          <Text style={{ color: '#8E8EA0', textAlign: 'center' }}>未找到候补记录</Text>
        </View>
      </View>
    );
  }

  const countdown = getConfirmRemaining(queue);
  const game = queue.game;
  const companionCount = 1 + (queue.bringFriend ? queue.friendCount : 0);

  const effectiveStatus = queue.status === 'confirming' && countdown <= 0
    ? 'expired' as const
    : queue.status;

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    if (queue.status !== 'confirming' || countdown <= 0) {
      Taro.showToast({ title: '已超时，无法确认', icon: 'none' });
      return;
    }
    store.confirmQueue(queueId);
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
          store.cancelQueue(queueId);
          console.info('[Confirm] Cancelled:', queueId);
          Taro.showToast({ title: '已放弃', icon: 'none' });
        }
      }
    });
  };

  const handleArrive = () => {
    if (queue.status !== 'confirmed') {
      Taro.showToast({ title: '当前状态不可到店', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '确认到店？',
      content: '请在到达门店后点击，方便 DM 开本准备',
      confirmText: '我已到店',
      success: (res) => {
        if (res.confirm) {
          store.arriveQueue(queueId);
          console.info('[Confirm] Arrived:', queueId);
          Taro.showToast({ title: '签到成功！', icon: 'success' });
        }
      }
    });
  };

  if (effectiveStatus === 'arrived') {
    return (
      <View className={styles.page}>
        <View className={styles.card}>
          <View className={styles.arrivedState}>
            <Text className={styles.statusIcon}>✅</Text>
            <Text className={styles.arrivedTitle}>已到店</Text>
            <Text className={styles.statusDesc}>到店时间：{queue.arrivedAt}</Text>
          </View>
        </View>
        <AppointmentInfo game={game} companionCount={companionCount} />
      </View>
    );
  }

  if (effectiveStatus === 'confirmed') {
    return (
      <View className={styles.page}>
        <View className={styles.card}>
          <View className={styles.confirmedState}>
            <Text className={styles.statusIcon}>🎉</Text>
            <Text className={styles.confirmedTitle}>已确认上车！</Text>
            <Text className={styles.statusDesc}>请准时到店，别鸽车哦～</Text>
          </View>
        </View>
        <AppointmentInfo game={game} companionCount={companionCount} />
        <View className={styles.bottomBar}>
          <View className={styles.arriveBtn} onClick={handleArrive}>
            <Text className={styles.arriveBtnText}>我已到店，点我签到</Text>
          </View>
        </View>
      </View>
    );
  }

  if (effectiveStatus === 'expired' || effectiveStatus === 'cancelled') {
    return (
      <View className={styles.page}>
        <View className={styles.card}>
          <View className={styles.expiredState}>
            <Text className={styles.expiredIcon}>
              {effectiveStatus === 'expired' ? '⏰' : '💨'}
            </Text>
            <Text className={styles.expiredTitle}>
              {effectiveStatus === 'expired' ? '已过期' : '已放弃'}
            </Text>
            <Text className={styles.statusDesc}>
              {effectiveStatus === 'expired' ? '超时未确认，下次早点哦～' : '已放弃本次上车'}
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
            <Text className={styles.infoLabel}>门店地址</Text>
            <Text className={styles.infoValue}>{game.storeAddress}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>开本时间</Text>
            <Text className={styles.infoValue}>{game.expectedStartTime}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>DM</Text>
            <Text className={styles.infoValue}>{game.dmName}（{game.dmContact}）</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>缺口角色</Text>
            <Text className={styles.infoValue}>{game.missingRoles.join('、')}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (effectiveStatus === 'pending') {
    return (
      <View className={styles.page}>
        <View className={styles.card}>
          <View className={styles.confirmedState}>
            <Text className={styles.statusIcon}>📋</Text>
            <Text className={styles.confirmedTitle}>排队中</Text>
            <Text className={styles.statusDesc}>
              差 {game.totalPlayers - game.currentPlayers} 人凑齐，请耐心等待
            </Text>
          </View>
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
            <Text className={styles.giveUpBtnText}>取消排队</Text>
          </View>
        </View>
      </View>
    );
  }

  // confirming（有倒计时）
  const isUrgent = countdown <= 60;
  return (
    <View className={styles.page}>
      <View className={isUrgent ? styles.countdownHeroUrgent : styles.countdownHero}>
        <Text className={styles.countdownLabel}>
          {isUrgent ? '⚠️ 马上过期！请立即确认' : '请在倒计时内确认上车'}
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
        {queue.bringFriend && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>带朋友</Text>
            <Text className={styles.infoValue}>{queue.friendCount}位</Text>
          </View>
        )}
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>联系方式</Text>
          <Text className={styles.infoValue}>{queue.contact}</Text>
        </View>
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

function AppointmentInfo({ game, companionCount }: { game: QueueEntry['game']; companionCount: number }) {
  return (
    <View className={styles.card}>
      <Text className={styles.cardTitle}>赴约信息</Text>

      <View className={styles.appointmentItem}>
        <View className={styles.appointmentIcon}>📍</View>
        <View className={styles.appointmentBody}>
          <Text className={styles.appointmentLabel}>门店地址</Text>
          <Text className={styles.appointmentValue}>{game.storeName}</Text>
          <Text className={styles.appointmentSub}>{game.storeAddress}</Text>
        </View>
      </View>

      <View className={styles.appointmentItem}>
        <View className={styles.appointmentIcon}>⏰</View>
        <View className={styles.appointmentBody}>
          <Text className={styles.appointmentLabel}>预计开本</Text>
          <Text className={styles.appointmentValue}>{game.expectedStartTime}</Text>
          <Text className={styles.appointmentSub}>建议提前15分钟到店</Text>
        </View>
      </View>

      <View className={styles.appointmentItem}>
        <View className={styles.appointmentIcon}>🎭</View>
        <View className={styles.appointmentBody}>
          <Text className={styles.appointmentLabel}>DM</Text>
          <Text className={styles.appointmentValue}>{game.dmName}</Text>
          <Text className={styles.appointmentSub}>{game.dmContact}</Text>
        </View>
      </View>

      <View className={styles.appointmentItem}>
        <View className={styles.appointmentIcon}>👥</View>
        <View className={styles.appointmentBody}>
          <Text className={styles.appointmentLabel}>同行人数</Text>
          <Text className={styles.appointmentValue}>共 {companionCount} 人</Text>
          <Text className={styles.appointmentSub}>
            {companionCount === 1 ? '我一人' : `我 + ${companionCount - 1} 位朋友`}
          </Text>
        </View>
      </View>

      <View className={styles.appointmentItem}>
        <View className={styles.appointmentIcon}>💰</View>
        <View className={styles.appointmentBody}>
          <Text className={styles.appointmentLabel}>预估费用</Text>
          <Text className={styles.appointmentValue}>
            ¥{game.pricePerPerson * companionCount}
          </Text>
          <Text className={styles.appointmentSub}>
            人均 ¥{game.pricePerPerson} × {companionCount}人
          </Text>
        </View>
      </View>
    </View>
  );
}

function useLiveQueue(store: ReturnType<typeof useGameStore>, queueId: string) {
  const [queue, setQueue] = useState<QueueEntry | undefined>(
    store.getState().queues.find((q) => q.id === queueId)
  );

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const q = store.getState().queues.find((x) => x.id === queueId);
      setQueue(q);
    });
    return unsubscribe;
  }, [store, queueId]);

  return queue;
}

export default ConfirmPage;
