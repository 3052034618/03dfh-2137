import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useGameStore } from '@/store/useGameStore';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const { queues } = useGameStore();
  const confirmedCount = queues.filter((q) => q.status === 'confirmed').length;
  const pendingCount = queues.filter((q) => q.status === 'pending' || q.status === 'confirming').length;

  const handleMenuClick = (type: string) => {
    switch (type) {
      case 'history':
        Taro.showToast({ title: '功能开发中', icon: 'none' });
        break;
      case 'feedback':
        Taro.showToast({ title: '功能开发中', icon: 'none' });
        break;
      case 'about':
        Taro.showToast({ title: '功能开发中', icon: 'none' });
        break;
      default:
        break;
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.profileHeader}>
        <View className={styles.avatar}>
          <Text className={styles.avatarText}>欢</Text>
        </View>
        <View className={styles.profileInfo}>
          <Text className={styles.userName}>欢乐散客</Text>
          <Text className={styles.userDesc}>下班就玩，临时起意</Text>
        </View>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{confirmedCount}</Text>
          <Text className={styles.statLabel}>已上车</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{pendingCount}</Text>
          <Text className={styles.statLabel}>排队中</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{queues.length}</Text>
          <Text className={styles.statLabel}>总参与</Text>
        </View>
      </View>

      <View className={styles.menuSection}>
        <View className={styles.menuCard}>
          <View className={styles.menuItem} onClick={() => handleMenuClick('history')}>
            <View className={styles.menuItemLeft}>
              <View className={styles.menuIcon} style={{ background: '#FFF0E8' }}>
                <Text style={{ color: '#FF6B35' }}>📋</Text>
              </View>
              <Text className={styles.menuLabel}>上本记录</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleMenuClick('feedback')}>
            <View className={styles.menuItemLeft}>
              <View className={styles.menuIcon} style={{ background: '#E3F2FD' }}>
                <Text style={{ color: '#1565C0' }}>💬</Text>
              </View>
              <Text className={styles.menuLabel}>意见反馈</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleMenuClick('about')}>
            <View className={styles.menuItemLeft}>
              <View className={styles.menuIcon} style={{ background: '#E8F5E9' }}>
                <Text style={{ color: '#2E7D32' }}>ℹ️</Text>
              </View>
              <Text className={styles.menuLabel}>关于我们</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default MinePage;
