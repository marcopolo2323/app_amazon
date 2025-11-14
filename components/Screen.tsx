import React from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  StatusBar,
  ViewStyle,
  TextStyle,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "../hooks/use-color-scheme";
import { useThemeColor } from "../hooks/use-theme-color";
import { ThemedText } from "./themed-text";

interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  scrollable?: boolean;
  safeArea?: boolean;
  backgroundColor?: string;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
  maxWidth?: number;
}

const Screen: React.FC<ScreenProps> = ({
  children,
  title,
  subtitle,
  scrollable = true,
  safeArea = true,
  backgroundColor,
  contentContainerStyle,
  style,
  maxWidth,
}) => {
  const Content = scrollable ? ScrollView : View;

  const themedBackground = useThemeColor({}, "background");
  const theme = useColorScheme() ?? "light";
  const barStyle = theme === "dark" ? "light-content" : "dark-content";

  const containerStyle: ViewStyle[] = [
    styles.container,
    { backgroundColor: backgroundColor ?? themedBackground },
    style,
  ];

  const contentStyle: ViewStyle[] = [
    styles.content,
    maxWidth ? { maxWidth, alignSelf: "center", width: "100%" } : {},
    contentContainerStyle,
  ];

  const scrollViewProps = scrollable
    ? {
        contentContainerStyle: contentStyle,
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: "handled" as const,
        keyboardDismissMode: Platform.OS === "ios" ? ("interactive" as const) : ("on-drag" as const),
        contentInsetAdjustmentBehavior: "automatic" as const,
      }
    : {};

  if (safeArea) {
    return (
      <SafeAreaView style={containerStyle} edges={["top", "bottom"]}>
        <StatusBar barStyle={barStyle} backgroundColor={backgroundColor ?? themedBackground} />
        <Content style={scrollable ? styles.scrollView : contentStyle} {...scrollViewProps}>
          {(title || subtitle) && (
            <View style={styles.header}>
              {title && <ThemedText style={styles.title}>{title}</ThemedText>}
              {subtitle && <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>}
            </View>
          )}
          {children}
        </Content>
      </SafeAreaView>
    );
  }

  return (
    <View style={containerStyle}>
      <StatusBar barStyle={barStyle} backgroundColor={backgroundColor ?? themedBackground} />
      <Content style={scrollable ? styles.scrollView : contentStyle} {...scrollViewProps}>
        {(title || subtitle) && (
          <View style={styles.header}>
            {title && <ThemedText style={styles.title}>{title}</ThemedText>}
            {subtitle && <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>}
          </View>
        )}
        {children}
      </Content>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
});

export default Screen;
