import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (newRating: number) => void;
  color?: string;
  emptyColor?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 18,
  interactive = false,
  onRatingChange,
  color = '#F59E0B',
  emptyColor = '#CBD5E1',
}) => {
  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    const isFilled = i <= rating;
    const isHalf = !isFilled && i - 0.5 <= rating;

    const starIcon = (
      <Ionicons
        name={isFilled ? 'star' : isHalf ? 'star-half' : 'star-outline'}
        size={size}
        color={isFilled || isHalf ? color : emptyColor}
      />
    );

    if (interactive && onRatingChange) {
      stars.push(
        <TouchableOpacity
          key={i}
          activeOpacity={0.7}
          onPress={() => onRatingChange(i)}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          style={styles.starTouchable}
        >
          {starIcon}
        </TouchableOpacity>
      );
    } else {
      stars.push(
        <View key={i} style={styles.starWrapper}>
          {starIcon}
        </View>
      );
    }
  }

  return <View style={styles.container}>{stars}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starTouchable: {
    paddingHorizontal: 2,
  },
  starWrapper: {
    marginRight: 2,
  },
});
