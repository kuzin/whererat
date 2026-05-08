import { useContext } from "react";

import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";

/**
 * Height of the bottom tab bar when this screen is inside a tab navigator.
 * Returns `0` for stack-only flows (e.g. root `app/index` / `app/submit`), where
 * {@link useBottomTabBarHeight} would throw.
 */
export function useOptionalBottomTabBarHeight(): number {
  return useContext(BottomTabBarHeightContext) ?? 0;
}
