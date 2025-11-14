import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  elevation?: number;
  borderRadius?: number;
  backgroundColor?: string;
  padding?: number;
  margin?: number;
  shadow?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  size = 'medium',
  elevation = 2,
  borderRadius = 12,
  backgroundColor,
  padding,
  margin = 0,
  shadow = true,
}) => {
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  const cardStyles: ViewStyle[] = [
    styles.card,
    styles[`${size}Card`],
    {
      borderRadius,
      backgroundColor: backgroundColor ?? surfaceColor,
      margin,
      borderColor,
      borderWidth: 1,
    },
    shadow && styles.shadow,
    shadow && { elevation },
    padding !== undefined && { padding },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  shadow: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },

  // Size variants
  smallCard: {
    padding: 12,
  },
  mediumCard: {
    padding: 16,
  },
  largeCard: {
    padding: 20,
  },
});

export default Card;
