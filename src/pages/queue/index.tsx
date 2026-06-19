import React, { useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useGameStore } from '@/store/useGameStore';
import QueueCard from '@/components/QueueCard';
import styles from './index.module.scss';

type TabKey = 'all' | 'confirming' | 'pending' | 'done';

const TAB_LIST: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'confirming', label: '待确认' },
  { key: 'pending', label: '排队中' },
  { key: 'done', label: '已完成' }
];

const QueuePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const { queues, confirmQueue, cancelQueue } = useGameStore();

  const filteredQueues = useMemo(() => {
    switch (activeTab) {
      case 'confirming':
        return queues.filter((q) => q.status === 'confirming');
      case 'pending':
        return queues.filter((q) => q.status === 'pending');
      case 'done':
        return queues.filter((q) => q.status === 'confirmed' || q.status === 'expired' || q.status === 'cancelled');
      default:
        return queues;
    }
  }, [queues, activeTab]);

  const handleQueueClick = (queueId: string) => {
    Taro.navigateTo({ url: `/pages/confirm/index?id=${queueId}` });
  };

  const handleConfirm = (queueId: string) => {
    confirmQueue(queueId);
    Taro.showToast({ title: '已确认上车！', icon: 'success' });
  };

  const handleCancel = (queueId: string) => {
    Taro.showModal({
      title: '确认放弃？',
      content: '放弃后需要重新排队哦',
      success: (res) => {
        if (res.confirm) {
          cancelQueue(queueId);
          Taro.showToast({ title: '已放弃', icon: 'none' });
        }
      }
    });
  };

  return (
    <View className={styles.page}>
      <Text className={styles.pageTitle}>我的候补</Text>
      <Text className={styles.pageSubtitle}>人数凑齐后需要确认，别鸽车哦</Text>

      <View className={styles.tabs}>
        {TAB_LIST.map((tab) => (
          <Text
            key={tab.key}
            className={classnames(styles.tab, activeTab === tab.key && styles.tabActive)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Text>
        ))}
      </View>

      {filteredQueues.length > 0 ? (
        filteredQueues.map((queue) => (
          <QueueCard
            key={queue.id}
            queue={queue}
            onClick={(q) => handleQueueClick(q.id)}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        ))
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyText}>暂无候补记录</Text>
          <Text className={styles.emptySub}>去找局页面看看有没有合适的局</Text>
        </View>
      )}
    </View>
  );
};

export default QueuePage;
