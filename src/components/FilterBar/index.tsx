import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { AREA_OPTIONS, TIME_OPTIONS, PRICE_OPTIONS, PREFERENCE_OPTIONS, PreferenceKey } from '@/types/game';
import styles from './index.module.scss';

interface FilterBarProps {
  area: string;
  arriveTime: string;
  priceRange: string;
  acceptBeginner: boolean;
  maxVacancy: number;
  preferences: PreferenceKey[];
  onAreaChange: (area: string) => void;
  onTimeChange: (time: string) => void;
  onPriceChange: (price: string) => void;
  onBeginnerChange: (val: boolean) => void;
  onMaxVacancyChange: (val: number) => void;
  onPreferenceToggle: (key: PreferenceKey) => void;
}

const SOON_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: '不限' },
  { value: 1, label: '缺1人' },
  { value: 2, label: '缺2人内' },
  { value: 3, label: '缺3人内' }
];

const FilterBar: React.FC<FilterBarProps> = ({
  area,
  arriveTime,
  priceRange,
  acceptBeginner,
  maxVacancy,
  preferences,
  onAreaChange,
  onTimeChange,
  onPriceChange,
  onBeginnerChange,
  onMaxVacancyChange,
  onPreferenceToggle
}) => {
  return (
    <View className={styles.wrapper}>
      <View className={styles.filterRow}>
        <View className={styles.pillWrap}>
          <ScrollView scrollX className={styles.scrollView}>
            <View className={styles.pillRow}>
              {AREA_OPTIONS.map((opt) => (
                <Text
                  key={opt}
                  className={classnames(styles.pill, area === opt && styles.pillActive)}
                  onClick={() => onAreaChange(opt)}
                >
                  {opt}
                </Text>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      <View className={styles.filterRow}>
        <ScrollView scrollX className={styles.scrollView}>
          <View className={styles.pillRow}>
            {TIME_OPTIONS.map((opt) => (
              <Text
                key={opt}
                className={classnames(styles.pill, arriveTime === opt && styles.pillActive)}
                onClick={() => onTimeChange(opt)}
              >
                {opt}
              </Text>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className={styles.filterRow}>
        <ScrollView scrollX className={styles.scrollView}>
          <View className={styles.pillRow}>
            {PRICE_OPTIONS.map((opt) => (
              <Text
                key={opt}
                className={classnames(styles.pill, priceRange === opt && styles.pillActive)}
                onClick={() => onPriceChange(opt)}
              >
                {opt}
              </Text>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className={styles.filterRow}>
        <View className={styles.pillRow}>
          <Text
            className={classnames(styles.pill, acceptBeginner && styles.pillActive)}
            onClick={() => onBeginnerChange(!acceptBeginner)}
          >
            新手友好
          </Text>
          {SOON_OPTIONS.map((opt) => (
            <Text
              key={opt.value}
              className={classnames(styles.pill, styles.soonPill, maxVacancy === opt.value && styles.pillActive)}
              onClick={() => onMaxVacancyChange(opt.value)}
            >
              {opt.label}
            </Text>
          ))}
        </View>
      </View>

      <View className={styles.preferenceSection}>
        <Text className={styles.sectionTitle}>偏好筛选</Text>
        <View className={styles.pillRow}>
          {PREFERENCE_OPTIONS.map((opt) => (
            <Text
              key={opt.key}
              className={classnames(styles.prefPill, preferences.includes(opt.key) && styles.prefPillActive)}
              onClick={() => onPreferenceToggle(opt.key)}
            >
              {opt.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

export default FilterBar;
