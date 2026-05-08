import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import type { Theme as NavigationTheme } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, StyleSheet, type ViewStyle } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  CatalogHeaderLogSightingLeading,
  CatalogHeaderSettingsTrailing,
} from "../components/CatalogHeaderTrailing";
import { HeaderThemeWordmark } from "../components/HeaderThemeWordmark";
import { stackMinimalHeaderLeft } from "../lib/stackMinimalHeaderLeft";
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
      /** Screen surfaces — keep distinct from `headerBg` so native header items don’t pick up header tint as card backgrounds. */
      card: chrome.background,
      text: chrome.text,
      border: chrome.border,
      notification: chrome.accent,
    },
  };
}

const headerTitleChrome = {
  headerTitle: () => <HeaderThemeWordmark />,
  headerTitleContainerStyle: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 0,
    maxWidth: "100%",
    pointerEvents: "box-none",
  } satisfies ViewStyle,
} as const;

function RootNavigator() {
  const { colors, mode } = useTheme();
  const router = useRouter();

  const navigationTheme = useMemo(() => buildNavigationTheme(mode, colors), [colors, mode]);

  const submitScreenOptions = useMemo(
    () => ({
      headerTitle: "Log a Sighting",
      headerTitleStyle: { fontWeight: "700" as const, color: colors.text },
      headerTitleAlign: "center" as const,
      headerTitleContainerStyle: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 0,
        maxWidth: "100%",
        pointerEvents: "box-none",
      } satisfies ViewStyle,
      /** Custom control — avoids UIKit’s glass-styled system back affordance on iOS 26+. */
      headerLeft: stackMinimalHeaderLeft(() => router.back()),
    }),
    [colors.text, router],
  );

  const stackScreenOptions = useMemo(
    () => ({
      /** Per-screen (native stack) — required when UIViewControllerBasedStatusBarAppearance is YES. */
      statusBarStyle: colors.statusBarStyle,
      headerStyle: { backgroundColor: colors.headerBg },
      headerTintColor: colors.headerText,
      headerTitleStyle: { fontWeight: "700" as const },
      headerShadowVisible: false,
      headerTitleAlign: "center" as const,
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
          <Stack.Screen
            name="index"
            options={{
              ...headerTitleChrome,
              headerLeft: () => <CatalogHeaderLogSightingLeading />,
              headerRight: () => <CatalogHeaderSettingsTrailing />,
            }}
          />
          <Stack.Screen name="submit" options={submitScreenOptions} />
          <Stack.Screen name="movie/[slug]" options={{ headerShown: false }} />
          <Stack.Screen name="info" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
