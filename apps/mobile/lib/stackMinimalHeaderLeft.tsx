import { Ionicons } from "@expo/vector-icons";
import { useLocale } from "@react-navigation/native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import type { StyleProp, ViewStyle } from "react-native";
import { Platform, Pressable, StyleSheet } from "react-native";

import {
  HEADER_TOOLBAR_HIT_PX,
  HEADER_TOOLBAR_ICON,
  HEADER_TOOLBAR_ICON_PX,
} from "./headerToolbarChrome";
import { useTheme } from "./theme";

type HeaderExtras = {
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

type IncomingNativeHeaderLeft = Omit<
  Parameters<NonNullable<NativeStackNavigationOptions["headerLeft"]>>[0],
  "canGoBack"
>;

function RoundMinimalHeaderBack({
  incoming,
  delegatedOnPress,
  extras,
}: {
  incoming: IncomingNativeHeaderLeft;
  delegatedOnPress: () => void;
  extras?: HeaderExtras;
}) {
  const { direction } = useLocale();
  const { colors } = useTheme();
  /** Respect `headerTintColor` whenever the stack passes it (e.g. movie hero over poster). */
  const tintFromStack =
    typeof incoming.tintColor === "string" && incoming.tintColor.length > 0
      ? incoming.tintColor
      : undefined;
  const tint = tintFromStack ?? colors.headerToolbarIcon;

  const isIos = Platform.OS === "ios";
  const outer = HEADER_TOOLBAR_HIT_PX;

  return (
    <Pressable
      accessibilityLabel={extras?.accessibilityLabel ?? "Go back"}
      accessibilityRole="button"
      testID={extras?.testID}
      hitSlop={isIos ? { top: 12, bottom: 12, left: 12, right: 12 } : undefined}
      android_ripple={
        Platform.OS === "android"
          ? {
              color:
                colors.headerActionRipple,
              borderless: true,
              foreground: Platform.Version >= 23,
            }
          : undefined
      }
      onPress={delegatedOnPress}
      style={({ pressed }) => [
        isIos ? layout.shadowReset : layout.shadowResetAndroid,
        {
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          backgroundColor: colors.headerActionFill,
          ...(colors.mode === "light"
            ? {
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.headerActionOutline,
              }
            : {}),
          ...(isIos ? { borderCurve: "continuous" as const } : {}),
        },
        extras?.style,
        isIos && pressed ? layout.pressedIos : null,
      ]}
    >
      <Ionicons
        name={HEADER_TOOLBAR_ICON.back}
        size={HEADER_TOOLBAR_ICON_PX}
        color={tint}
        style={direction === "rtl" ? { transform: [{ scaleX: -1 }] } : undefined}
      />
    </Pressable>
  );
}

const layout = StyleSheet.create({
  shadowReset: {
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    marginHorizontal: 0,
    marginVertical: 0,
    alignSelf: "center",
  },
  shadowResetAndroid: {
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    marginVertical: 0,
    marginHorizontal: 0,
    alignSelf: "center",
  },
  pressedIos: { opacity: 0.42 },
});

/** Same RN back control everywhere — filled chevron, same hit size as other toolbar icons. */
export function stackMinimalHeaderLeft(
  onPress: () => void,
  extras?: HeaderExtras,
): NonNullable<NativeStackNavigationOptions["headerLeft"]> {
  return (props) => {
    const { canGoBack: _c, ...incoming } = props;
    return (
      <RoundMinimalHeaderBack
        incoming={incoming}
        delegatedOnPress={onPress}
        extras={extras}
      />
    );
  };
}
