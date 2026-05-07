import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import type { Theme as NavigationTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, StyleSheet } from "react-native";

import { HeaderThemeWordmark } from "../components/HeaderThemeWordmark";
import { ThemeProvider, useTheme, type ThemeColors } from "../lib/theme";

function buildNavigationTheme(mode: "light" | "dark", chrome: ThemeColors): NavigationTheme {
  const base = mode === "dark" ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: mode === "dark",
    colors: {
      ...base.colors,
      primary: chrome.accent,
      background: chrome.background,
      card: chrome.headerBg,
      text: chrome.text,
      border: chrome.border,
      notification: chrome.accent,
    },
  };
}

function RootNavigator() {
  const { colors, mode } = useTheme();

  const navigationTheme = useMemo(() => buildNavigationTheme(mode, colors), [colors, mode]);

  const stackScreenOptions = useMemo(
    () => ({
      /** Per-screen (native stack) — required when UIViewControllerBasedStatusBarAppearance is YES. */
      statusBarStyle: colors.statusBarStyle,
      headerStyle: { backgroundColor: colors.headerBg },
      /** Native back chevron tint (no custom `headerLeft` — avoids iOS bar-button glass behind a JS view). */
      headerTintColor: colors.accent,
      headerTitleStyle: { fontWeight: "700" as const },
      headerShadowVisible: false,
      headerTitleAlign: "center" as const,
      headerTitle: () => <HeaderThemeWordmark />,
      headerBackButtonDisplayMode: "minimal" as const,
      contentStyle: { backgroundColor: colors.background },
      /** Solid chrome; avoids iOS material/blur washing out custom headerStyle colors. */
      ...(Platform.OS === "ios" ? { headerBlurEffect: "none" as const } : {}),
    }),
    [colors],
  );

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.background }]}>
        <Stack screenOptions={stackScreenOptions}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="info" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
