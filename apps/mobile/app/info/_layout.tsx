import { Stack } from "expo-router";
import { useMemo } from "react";
import { Platform } from "react-native";

import { InfoStackCloseButton } from "../../components/InfoStackCloseButton";
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
      headerRight: () => <InfoStackCloseButton />,
      ...(Platform.OS === "ios" ? { headerBlurEffect: "none" as const } : {}),
    }),
    [colors],
  );

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="menu" options={{ title: "Settings" }} />
      <Stack.Screen name="about" options={{ title: "About WhereRat" }} />
      <Stack.Screen name="guidelines" options={{ title: "Guidelines" }} />
      <Stack.Screen name="privacy" options={{ title: "Privacy" }} />
    </Stack>
  );
}

