import { Platform } from "react-native";

/**
 * Shared metrics + Ionicons **filled** names for native-stack nav bar buttons.
 * Keeps catalog add / settings / back visually consistent.
 */
export const HEADER_TOOLBAR_HIT_PX = 44;
export const HEADER_TOOLBAR_ICON_PX = 24;

/**
 * Extra horizontal inset for custom header actions on Android only. Native stack already
 * applies toolbar content insets — keep this small so icons don’t float too far inset.
 */
export const HEADER_TOOLBAR_EDGE_INSET_ANDROID =
  Platform.OS === "android" ? 6 : 0;

export const HEADER_TOOLBAR_ICON = {
  add: "add-circle",
  settings: "settings",
  back: "chevron-back",
} as const;
