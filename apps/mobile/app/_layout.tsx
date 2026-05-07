import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";

import { HeaderThemeWordmark } from "../components/HeaderThemeWordmark";
import { ThemeProvider, useTheme } from "../lib/theme";

function RootNavigator() {
  const { colors } = useTheme();

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBarStyle} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.headerBg },
          /** Native back chevron tint (no custom `headerLeft` — avoids iOS bar-button glass behind a JS view). */
          headerTintColor: colors.accent,
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          headerTitleAlign: "center" as const,
          headerTitle: () => <HeaderThemeWordmark />,
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
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
