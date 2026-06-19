import React, { useState, useEffect, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { QueueEntry } from '@/types/game';
import { useGameStore } from '@/store/useGameStore';
import styles from './index.module.scss';

const DEADLINE_SECONDS = 300;

const nowPlusSeconds = (sec: number) => {
  const t = new Date();
  t.setSeconds(t.getSeconds() + sec);
  return t;
};

const QueuePage: React.FC = () => {
  const store = useGameStore();
  const { confirmQueue, cancelQueue, getSortedQueues } = store;

  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useDidShow(() => {
    tick((v) => v + 1);
  });

  const sortedQueues = getSortedQueues();

  const confirmingList = useMemo(() => sortedQueues.filter((q) => q.status === 'confirming'), [sortedQueues]);
  const pendingList = useMemo(() => sortedQueues.filter((q) => q.status === 'pending'), [sortedQueues]);
  const confirmedList = useMemo(() => sortedQueues.filter((q) => q.status === 'confirmed'), [sortedQueues]);
  const othersList = useMemo(() => sortedQueues.filter((q) => q.status === 'expired' || q.status === 'cancelled'), [sortedQueues]);

  const countdownOf = (q: QueueEntry): number => {
    if (q.status !== 'confirming') return 0;
    const deadline = q.confirmDeadline
      ? new Date(q.confirmDeadline.replace(/\//g, '-'))
      : nowPlusSeconds(DEADLINE_SECONDS);
    return Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000));
  };

  const formatCD = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleCardClick = (q: QueueEntry) => {
    Taro.navigateTo({ url: `/pages/confirm/index?id=${q.id}` });
  };

  const handleConfirm = (q: QueueEntry) => {
    if (q.status !== 'confirming') return;
    if (countdownOf(q) <= 0) {
      Taro.showToast({ title: '已超时', icon: 'none' });
      return;
    }
    confirmQueue(q.id);
    Taro.showToast({ title: '已确认上车！', icon: 'success' });
  };

  const handleCancel = (q: QueueEntry) => {
    if (q.status !== 'confirming' && q.status !== 'pending') return;
    Taro.showModal({
      title: '确认放弃？',
      content: '放弃后需要重新排队哦',
      success: (res) => {
        if (res.confirm) {
          cancelQueue(q.id);
          Taro.showToast({ title: '已放弃', icon: 'none' });
        }
      }
    });
  };

  const renderCard = (q: QueueEntry) => {
    const isUrgent = q.status === 'confirming';
    const cd = countdownOf(q);

    const statusMap: Record<string, { text: string; cls: string }> = {
      pending: { text: '排队中', cls: styles.statusPending },
      confirming: { text: cd <= 60 ? '⚠️ 急待确认' : '待确认', cls: styles.statusConfirming },
      confirmed: { text: '已确认', cls: styles.statusConfirmed },
      expired: { text: '已过期', cls: styles.statusExpired },
      cancelled: { text: '已放弃', cls: styles.statusCancelled }
    };
    const st = statusMap[q.status] || statusMap.pending;

    return (
      <View
        key={q.id}
        className={classnames(styles.card, isUrgent && cd > 0 && styles.cardUrgent)}
        onClick={() => handleCardClick(q)}
      >
        {isUrgent && cd > 0 && (
          <View className={styles.urgentTimerRow}>
            <Text className={styles.urgentLabel}>
              {cd <= 60 ? '⚠️ 即将过期！请立即确认' : '⏱ 请在倒计时内确认'}
            </Text>
            <Text className={styles.urgentCountdown}>{formatCD(cd)}</Text>
          </View>
        )}

        <View className={styles.header}>
          <View className={styles.titleRow}>
            <Text className={styles.scriptName}>{q.game.scriptName}</Text>
            <Text className={classnames(styles.statusBadge, st.cls)}>{st.text}</Text>
          </View>
          <Text className={styles.storeInfo}>{q.game.storeName} · {q.game.storeArea}</Text>
        </View>

        <View className={styles.body}>
          <View className={styles.infoRow}>
            <Text className={styles.label}>预计开本</Text>
            <Text className={styles.value}>{q.game.expectedStartTime}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.label}>缺口角色</Text>
            <Text className={styles.value}>{q.game.missingRoles.join('、')}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.label}>我的称呼</Text>
            <Text className={styles.value}>
              {q.nickname}{q.bringFriend ? `（+${q.friendCount}友）` : ''}
            </Text>
          </View>
          {q.status === 'pending' && (
            <View className={styles.infoRow}>
              <Text className={styles.label}>等待人数</Text>
              <Text className={styles.value}>{q.game.totalPlayers - q.game.currentPlayers}个缺口</Text>
            </View>
          )}
        </View>

        {isUrgent && cd > 0 && (
          <View className={styles.actionRow}>
            <View
              className={styles.cancelBtn}
              onClick={(e) => { e.stopPropagation(); handleCancel(q); }}
            >
              <Text className={styles.cancelBtnText}>放弃</Text>
            </View>
            <View
              className={styles.confirmBtn}
              onClick={(e) => { e.stopPropagation(); handleConfirm(q); }}
            >
              <Text className={styles.confirmBtnText}>确认上车</Text>
            </View>
          </View>
        )}

        {q.status === 'pending' && (
          <View className={styles.actionRow}>
            <View
              className={styles.cancelBtn}
              onClick={(e) => { e.stopPropagation(); handleCancel(q); }}
            >
              <Text className={styles.cancelBtnText}>取消排队</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className={styles.page}>
      <Text className={styles.pageTitle}>候补通知中心</Text>
      <Text className={styles.pageSubtitle}>按紧急程度排序，别错过上车机会</Text>

      {confirmingList.length > 0 && (
        <View
          className={styles.noticeBanner}
          onClick={() => handleCardClick(confirmingList[0])}
        >
          <Text className={styles.noticeBadge}>🔔 待确认 · {confirmingList.length}条</Text>
          <Text className={styles.noticeTitle}>
            {confirmingList[0].game.scriptName}
          </Text>
          <Text className={styles.noticeDesc}>
            人数已凑齐，还剩 {formatCD(countdownOf(confirmingList[0]))} 过期，点击处理
          </Text>
          <Text className={styles.noticeArrow}>›</Text>
        </View>
      )}

      {confirmingList.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHead}>
            <Text className={styles.sectionLabel}>
              <View className={classnames(styles.sectionDot, styles.dotRed)} />
              待确认（紧急）
            </Text>
            <Text className={styles.sectionCount}>{confirmingList.length}条</Text>
          </View>
          {confirmingList.map(renderCard)}
        </View>
      )}

      {pendingList.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHead}>
            <Text className={styles.sectionLabel}>
              <View className={classnames(styles.sectionDot, styles.dotBlue)} />
              排队中
            </Text>
            <Text className={styles.sectionCount}>{pendingList.length}条</Text>
          </View>
          {pendingList.map(renderCard)}
        </View>
      )}

      {confirmedList.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHead}>
            <Text className={styles.sectionLabel}>
              <View className={classnames(styles.sectionDot, styles.dotGreen)} />
              已确认（待赴约）
            </Text>
            <Text className={styles.sectionCount}>{confirmedList.length}条</Text>
          </View>
          {confirmedList.map(renderCard)}
        </View>
      )}

      {othersList.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHead}>
            <Text className={styles.sectionLabel}>
              <View className={classnames(styles.sectionDot, styles.dotGrey)} />
              历史记录
            </Text>
            <Text className={styles.sectionCount}>{othersList.length}条</Text>
          </View>
          {othersList.map(renderCard)}
        </View>
      )}

      {sortedQueues.length === 0 && (
        <View className={styles.emptyState}>
          <Text className={styles.emptyEmoji}>🎲</Text>
          <Text className={styles.emptyText}>暂无候补记录</Text>
          <Text className={styles.emptySub}>去「找局」找个合适的欢乐本试试～</Text>
        </View>
      )}
    </View>
  );
};

export default QueuePage;
