import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  showPasswordToggle?: boolean;
  required?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  showPasswordToggle = false,
  required = false,
  secureTextEntry,
  value,
  onChangeText,
  placeholder,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPasswordInput = secureTextEntry || showPasswordToggle;
  const shouldShowPassword = isPasswordInput && !isPasswordVisible;

  const handlePasswordToggle = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const finalRightIcon = isPasswordInput
    ? (isPasswordVisible ? 'eye-off-outline' : 'eye-outline')
    : rightIcon;

  const handleRightIconPress = isPasswordInput
    ? handlePasswordToggle
    : onRightIconPress;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={error ? '#EF4444' : isFocused ? '#2563EB' : '#9CA3AF'}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (finalRightIcon || handleRightIconPress) && styles.inputWithRightIcon,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={shouldShowPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          // Evitar que TextInput multiline capture el scroll en Android
          {...(props.multiline ? { scrollEnabled: false } : {})}
          {...props}
        />

        {(finalRightIcon || handleRightIconPress) && (
          <TouchableOpacity
            onPress={handleRightIconPress}
            style={styles.rightIcon}
            disabled={!handleRightIconPress}
          >
            <Ionicons
              name={finalRightIcon || 'chevron-forward-outline'}
              size={20}
              color={error ? '#EF4444' : isFocused ? '#2563EB' : '#9CA3AF'}
            />
          </TouchableOpacity>
        )}
      </View>

      {(error || helperText) && (
        <View style={styles.messageContainer}>
          <Text style={[styles.message, error ? styles.errorMessage : styles.helperMessage]}>
            {error || helperText}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  required: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIcon: {
    marginLeft: 12,
  },
  rightIcon: {
    marginRight: 12,
    padding: 4,
  },
  messageContainer: {
    marginTop: 8,
  },
  message: {
    fontSize: 14,
  },
  errorMessage: {
    color: '#EF4444',
  },
  helperMessage: {
    color: '#6B7280',
  },
});

export default Input;
