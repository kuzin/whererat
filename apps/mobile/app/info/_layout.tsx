import { Stack, router } from "expo-router";
import { useMemo } from "react";
import { Platform } from "react-native";

import { stackMinimalHeaderLeft } from "../../lib/stackMinimalHeaderLeft";
import { useTheme } from "../../lib/theme";

export default function InfoLayout() {
  const { colors } = useTheme();

  const screenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.headerBg },
      headerTintColor: colors.accent,
      headerTitleStyle: { fontWeight: "800" as const, color: colors.text },
      /** Separator under the bar — scroll content reads clearer on solid `headerBg`. */
      headerShadowVisible: true,
      contentStyle: { backgroundColor: colors.background },
      headerBackButtonDisplayMode: "minimal" as const,
      ...(Platform.OS === "ios" ? { headerBlurEffect: "none" as const } : {}),
    }),
    [colors],
  );

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="menu"
        options={{
          title: "Settings",
          headerLeft: stackMinimalHeaderLeft(() => router.replace("/(tabs)"), {
            accessibilityLabel: "Back to catalog",
          }),
        }}
      />
      <Stack.Screen
        name="about"
        options={({ navigation }) => ({
          title: "About WhereRat",
          headerLeft: stackMinimalHeaderLeft(() => navigation.goBack()),
        })}
      />
      <Stack.Screen
        name="guidelines"
        options={({ navigation }) => ({
          title: "Guidelines",
          headerLeft: stackMinimalHeaderLeft(() => navigation.goBack()),
        })}
      />
      <Stack.Screen
        name="privacy"
        options={({ navigation }) => ({
          title: "Privacy policy",
          headerLeft: stackMinimalHeaderLeft(() => navigation.goBack()),
        })}
      />
    </Stack>
  );
}
