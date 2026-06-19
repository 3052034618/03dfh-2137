import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { QueueEntry } from '@/types/game';
import styles from './index.module.scss';

interface QueueCardProps {
  queue: QueueEntry;
  onClick: (queue: QueueEntry) => void;
  onConfirm: (queueId: string) => void;
  onCancel: (queueId: string) => void;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: '排队中', className: 'statusPending' },
  confirming: { label: '待确认', className: 'statusConfirming' },
  confirmed: { label: '已确认', className: 'statusConfirmed' },
  expired: { label: '已过期', className: 'statusExpired' },
  cancelled: { label: '已放弃', className: 'statusCancelled' }
};

const QueueCard: React.FC<QueueCardProps> = ({ queue, onClick, onConfirm, onCancel }) => {
  const statusInfo = STATUS_MAP[queue.status] || STATUS_MAP.pending;

  return (
    <View className={styles.card} onClick={() => onClick(queue)}>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <Text className={styles.scriptName}>{queue.game.scriptName}</Text>
          <Text className={classnames(styles.statusBadge, styles[statusInfo.className])}>
            {statusInfo.label}
          </Text>
        </View>
        <Text className={styles.storeInfo}>{queue.game.storeName} · {queue.game.storeArea}</Text>
      </View>

      <View className={styles.body}>
        <View className={styles.infoRow}>
          <Text className={styles.label}>预计开本</Text>
          <Text className={styles.value}>{queue.game.expectedStartTime}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.label}>缺口角色</Text>
          <Text className={styles.value}>{queue.game.missingRoles.join('、')}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.label}>我的称呼</Text>
          <Text className={styles.value}>{queue.nickname}{queue.bringFriend ? ` +${queue.friendCount}友` : ''}</Text>
        </View>
      </View>

      {queue.status === 'confirming' && (
        <View className={styles.actionRow}>
          <View
            className={styles.cancelBtn}
            onClick={(e) => {
              e.stopPropagation();
              onCancel(queue.id);
            }}
          >
            <Text className={styles.cancelBtnText}>放弃</Text>
          </View>
          <View
            className={styles.confirmBtn}
            onClick={(e) => {
              e.stopPropagation();
              onConfirm(queue.id);
            }}
          >
            <Text className={styles.confirmBtnText}>确认上车</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default QueueCard;
