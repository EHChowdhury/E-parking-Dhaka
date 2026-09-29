import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BookingStatus } from '../../types';
import { APP_THEME } from '../../config/constants';

interface StatusTimelineProps {
  status: BookingStatus;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ status }) => {
  if (status === 'cancelled' || status === 'rejected' || status === 'expired') {
    return (
      <View style={styles.cancelledContainer}>
        <Ionicons name="close-circle-outline" size={24} color={APP_THEME.colors.danger} />
        <Text style={styles.cancelledText}>
          This booking is{' '}
          {status === 'cancelled' ? 'Cancelled' : status === 'rejected' ? 'Declined' : 'Expired'}
        </Text>
      </View>
    );
  }

  const steps = [
    { id: 'pending', label: 'Requested' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'active', label: 'Parked' },
    { id: 'completed', label: 'Completed' },
  ];

  const getStepIndex = (s: BookingStatus): number => {
    switch (s) {
      case 'pending':
        return 0;
      case 'confirmed':
        return 1;
      case 'active':
        return 2;
      case 'completed':
        return 3;
      default:
        return 0;
    }
  };

  const currentIdx = getStepIndex(status);

  return (
    <View style={styles.container}>
      {steps.map((step, idx) => {
        const isReached = idx <= currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <React.Fragment key={step.id}>
            <View style={styles.stepColumn}>
              <View
                style={[
                  styles.circle,
                  isReached && styles.circleReached,
                  isCurrent && styles.circleCurrent,
                ]}
              >
                {isReached && !isCurrent ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : (
                  <View
                    style={[
                      styles.dot,
                      isCurrent && styles.dotCurrent,
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isReached && styles.stepLabelReached,
                  isCurrent && styles.stepLabelCurrent,
                ]}
              >
                {step.label}
              </Text>
            </View>

            {idx < steps.length - 1 && (
              <View
                style={[
                  styles.connector,
                  idx < currentIdx && styles.connectorReached,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  stepColumn: {
    alignItems: 'center',
    width: 65,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  circleReached: {
    backgroundColor: APP_THEME.colors.primary,
    borderColor: APP_THEME.colors.primary,
  },
  circleCurrent: {
    borderColor: APP_THEME.colors.primary,
    borderWidth: 2.5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotCurrent: {
    backgroundColor: APP_THEME.colors.primary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepLabel: {
    fontSize: 11,
    color: APP_THEME.colors.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
  stepLabelReached: {
    color: APP_THEME.colors.text,
  },
  stepLabelCurrent: {
    color: APP_THEME.colors.primary,
    fontWeight: '700',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 2,
    marginBottom: 20,
  },
  connectorReached: {
    backgroundColor: APP_THEME.colors.primary,
  },
  cancelledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_THEME.colors.dangerLight,
    padding: 12,
    borderRadius: APP_THEME.borderRadius.md,
    gap: 8,
  },
  cancelledText: {
    color: APP_THEME.colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});
