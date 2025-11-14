import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  fullWidth = true,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles: ViewStyle[] = [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabledButton,
    style,
  ];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    isDisabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading && (
        <ActivityIndicator
          color={variant === 'primary' ? '#ffffff' : '#2563EB'}
          size="small"
          style={styles.loader}
        />
      )}
      <Text style={textStyles}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },

  // Variants
  primaryButton: {
    backgroundColor: '#2563EB',
  },
  secondaryButton: {
    backgroundColor: '#E5E7EB',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },

  // Sizes
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  mediumButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  largeButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 52,
  },

  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },

  // Text variants
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#374151',
  },
  outlineText: {
    color: '#2563EB',
  },
  ghostText: {
    color: '#2563EB',
  },

  // Text sizes
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  // Disabled states
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },

  // Loader
  loader: {
    marginRight: 8,
  },
});

export default Button;
