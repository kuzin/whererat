import { useLocale } from "@react-navigation/native";
import { Assets } from "@react-navigation/elements";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import type { StyleProp, ViewStyle } from "react-native";
import {
  Image,
  type ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";

/** Mirrors `@react-navigation/elements` `Assets` order — entry 0 is the stack back PNG. */
const NAV_BACK_GLYPH = Assets[0] as ImageSourcePropType;

/** Tight circular control on iOS; hitSlop (below) restores ~44pt target without widening layout. */
const IOS_OUTER = 30;
/** Bar icon PNG; small translate in dp (~1–2 px on typical density) to sit visually centered in the circle. */
const IOS_GLYPH_NUDGE = { x: 1, y: 0 } as const;
const ANDROID_OUTER = 40;

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
  const tint = incoming.tintColor ?? "#000";

  const isIos = Platform.OS === "ios";
  const outer = isIos ? IOS_OUTER : ANDROID_OUTER;
  const glyph = Math.round(isIos ? outer * 0.53 : outer * 0.5);

  return (
    <Pressable
      accessibilityLabel={extras?.accessibilityLabel ?? "Go back"}
      accessibilityRole="button"
      testID={extras?.testID}
      hitSlop={isIos ? { top: 12, bottom: 12, left: 12, right: 12 } : undefined}
      android_ripple={androidRipple}
      onPress={delegatedOnPress}
      style={({ pressed }) => [
        isIos ? layout.shadowReset : layout.shadowResetAndroid,
        {
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          ...(isIos ? { borderCurve: "continuous" as const } : {}),
        },
        extras?.style,
        isIos && pressed ? layout.pressedIos : null,
      ]}
    >
      <Image
        accessible={false}
        source={NAV_BACK_GLYPH}
        resizeMode="contain"
        style={{
          width: glyph,
          height: glyph,
          tintColor: tint,
          transform: [
            ...(direction === "rtl" ? ([{ scaleX: -1 }] as const) : []),
            ...(isIos
              ? ([
                  { translateX: IOS_GLYPH_NUDGE.x * (direction === "rtl" ? -1 : 1) },
                  { translateY: IOS_GLYPH_NUDGE.y },
                ] as const)
              : []),
          ],
        }}
      />
    </Pressable>
  );
}

const androidRipple = {
  borderless: true,
  foreground: Platform.OS === "android" && Platform.Version >= 23,
  radius: ANDROID_OUTER / 2 + 8,
};

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
    marginVertical: 4,
    marginHorizontal: Platform.OS === "android" ? 4 : 0,
    alignSelf: "center",
  },
  pressedIos: { opacity: 0.42 },
});

/** Same RN back control everywhere — compact circle on iOS + centered PNG. */
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
