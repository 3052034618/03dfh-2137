import React, { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { QueueEntry } from '@/types/game';
import { useGameStore, getConfirmRemaining } from '@/store/useGameStore';
import styles from './index.module.scss';

const QueuePage: React.FC = () => {
  const store = useGameStore();

  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useDidShow(() => {
    tick((v) => v + 1);
    const expiredCount = store.checkAndExpireOverdue();
    if (expiredCount > 0) {
      Taro.showToast({ title: `${expiredCount}条候补已过期`, icon: 'none' });
    }
  });

  const sortedQueues = store.getSortedQueues();
  const activeFirst = store.getFirstActiveConfirming();
  const activeCount = store.getActiveConfirmingCount();

  const pendingList = sortedQueues.filter((q) => q.status === 'pending');
  const confirmedList = sortedQueues.filter((q) => q.status === 'confirmed');
  const arrivedList = sortedQueues.filter((q) => q.status === 'arrived');
  const othersList = sortedQueues.filter(
    (q) => q.status === 'expired' || q.status === 'cancelled'
  );

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
    if (getConfirmRemaining(q) <= 0) {
      Taro.showToast({ title: '已超时', icon: 'none' });
      return;
    }
    store.confirmQueue(q.id);
    Taro.showToast({ title: '已确认上车！', icon: 'success' });
  };

  const handleCancel = (q: QueueEntry) => {
    if (q.status !== 'confirming' && q.status !== 'pending') return;
    Taro.showModal({
      title: '确认放弃？',
      content: '放弃后需要重新排队哦',
      success: (res) => {
        if (res.confirm) {
          store.cancelQueue(q.id);
          Taro.showToast({ title: '已放弃', icon: 'none' });
        }
      }
    });
  };

  const renderCard = (q: QueueEntry) => {
    const isConfirming = q.status === 'confirming';
    const cd = getConfirmRemaining(q);
    const isUrgent = isConfirming && cd > 0 && cd <= 60;

    const statusMap: Record<string, { text: string; cls: string }> = {
      pending: { text: '排队中', cls: styles.statusPending },
      confirming: { text: cd <= 0 ? '已过期' : '待确认', cls: cd <= 0 ? styles.statusExpired : styles.statusConfirming },
      confirmed: { text: '待赴约', cls: styles.statusConfirmed },
      arrived: { text: '已到店', cls: styles.statusArrived },
      expired: { text: '已过期', cls: styles.statusExpired },
      cancelled: { text: '已放弃', cls: styles.statusCancelled }
    };
    const st = statusMap[q.status] || statusMap.pending;

    return (
      <View
        key={q.id}
        className={classnames(styles.card, isUrgent && styles.cardUrgent)}
        onClick={() => handleCardClick(q)}
      >
        {isConfirming && cd > 0 && (
          <View className={styles.urgentTimerRow}>
            <Text className={styles.urgentLabel}>
              {isUrgent ? '⚠️ 即将过期！请立即确认' : '⏱ 请在倒计时内确认'}
            </Text>
            <Text className={classnames(styles.urgentCountdown, isUrgent && styles.urgentCountdownDanger)}>
              {formatCD(cd)}
            </Text>
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
              <Text className={styles.label}>缺口中</Text>
              <Text className={styles.value}>
                差 {q.game.totalPlayers - q.game.currentPlayers} 人凑齐
              </Text>
            </View>
          )}
          {q.status === 'arrived' && q.arrivedAt && (
            <View className={styles.infoRow}>
              <Text className={styles.label}>到店时间</Text>
              <Text className={styles.value}>{q.arrivedAt}</Text>
            </View>
          )}
        </View>

        {isConfirming && cd > 0 && (
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

        {q.status === 'confirmed' && (
          <View className={styles.actionRow}>
            <View
              className={styles.arriveBtn}
              onClick={(e) => {
                e.stopPropagation();
                Taro.navigateTo({ url: `/pages/confirm/index?id=${q.id}` });
              }}
            >
              <Text className={styles.arriveBtnText}>查看赴约信息</Text>
            </View>
          </View>
        )}

        {q.status === 'arrived' && (
          <View className={styles.actionRow}>
            <View
              className={styles.detailBtn}
              onClick={(e) => {
                e.stopPropagation();
                Taro.navigateTo({ url: `/pages/confirm/index?id=${q.id}` });
              }}
            >
              <Text className={styles.detailBtnText}>查看详情</Text>
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

      {activeFirst && activeCount > 0 && (
        <View
          className={styles.noticeBanner}
          onClick={() => handleCardClick(activeFirst)}
        >
          <Text className={styles.noticeBadge}>
            🔔 待确认 · {activeCount}条
          </Text>
          <Text className={styles.noticeTitle}>{activeFirst.game.scriptName}</Text>
          <Text className={styles.noticeDesc}>
            还剩 {formatCD(getConfirmRemaining(activeFirst))} 过期，点击处理
          </Text>
          <Text className={styles.noticeArrow}>›</Text>
        </View>
      )}

      {/* 待确认列表 */}
      {sortedQueues.filter((q) => q.status === 'confirming' && getConfirmRemaining(q) > 0).length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHead}>
            <Text className={styles.sectionLabel}>
              <View className={classnames(styles.sectionDot, styles.dotRed)} />
              待确认（紧急）
            </Text>
            <Text className={styles.sectionCount}>
              {sortedQueues.filter((q) => q.status === 'confirming' && getConfirmRemaining(q) > 0).length}条
            </Text>
          </View>
          {sortedQueues
            .filter((q) => q.status === 'confirming' && getConfirmRemaining(q) > 0)
            .map(renderCard)}
        </View>
      )}

      {/* 排队中 */}
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

      {/* 已确认 - 待赴约 */}
      {confirmedList.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHead}>
            <Text className={styles.sectionLabel}>
              <View className={classnames(styles.sectionDot, styles.dotGreen)} />
              待赴约
            </Text>
            <Text className={styles.sectionCount}>{confirmedList.length}条</Text>
          </View>
          {confirmedList.map(renderCard)}
        </View>
      )}

      {/* 已到店 */}
      {arrivedList.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHead}>
            <Text className={styles.sectionLabel}>
              <View className={classnames(styles.sectionDot, styles.dotPurple)} />
              已到店
            </Text>
            <Text className={styles.sectionCount}>{arrivedList.length}条</Text>
          </View>
          {arrivedList.map(renderCard)}
        </View>
      )}

      {/* 历史记录 */}
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
