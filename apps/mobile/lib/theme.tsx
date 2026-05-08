import AsyncStorage from "@react-native-async-storage/async-storage";

import { mixTowardHex } from "./posterTone";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "@whererat/theme-mode";

export type ThemeMode = "light" | "dark";

export type ThemeColors = {
  mode: ThemeMode;
  background: string;
  headerBg: string;
  /** Circular fill behind nav bar icon buttons (light: darker shade of `headerBg`; dark: near-panel). */
  headerActionFill: string;
  /** Ionicons tint on those toolbar buttons — dark grey in light, accent in dark. */
  headerToolbarIcon: string;
  /** Android ripple tint on circular header actions. */
  headerActionRipple: string;
  /** Light-mode outline on circular header actions for edge contrast. */
  headerActionOutline: string;
  headerText: string;
  text: string;
  textMuted: string;
  accent: string;
  border: string;
  panel: string;
  panelMuted: string;
  chipActive: string;
  /**
   * Border on surfaces using `chipActive` (tab pill, catalog layout toggle).
   * Light mode: saturation kept but darkened vs `accent` so stroke + label meet WCAG AA on cream chips.
   */
  chipActiveOutline: string;
  dangerBg: string;
  dangerText: string;
  retryOnAccent: string;
  iconMuted: string;
  /** Text field outline — inactive / resting state. */
  inputBorder: string;
  /** Outline when the field is focused (keyboard-active). */
  inputBorderFocused: string;
  inputBorderDisabled: string;
  inputBackgroundDisabled: string;
  /** Elevated scroll surface used behind long forms/lists (submit/catalog). */
  formCanvas: string;
  /** Stronger line than `inputBorder` for section separators. */
  dividerStrong: string;
  /** Unfilled track color for % slider controls. */
  sliderTrackMax: string;
  /** Backdrop for modals/sheets/lightboxes. */
  overlayScrim: string;
  /** Higher-opacity scrim for spoiler overlays. */
  overlayScrimStrong: string;
  /** Text color on top of scrims / dark media. */
  onScrimText: string;
  /** Neutral placeholder stripe color for redacted content. */
  placeholderFill: string;
  /** ≥4.5∶1 vs typical tab bar backdrop / panel reads for inactive 11 pt labels */
  tabInactive: string;
  tabDivider: string;
  tabActiveFill: string;
  statusBarStyle: "light" | "dark";
  blurTint: "light" | "dark";
  blurOverlay: string;
  blurBaseAndroid: string;
};

const darkColors: ThemeColors = {
  mode: "dark",
  background: "#1c1917",
  headerBg: "#292524",
  headerActionFill: "#1c1917",
  headerToolbarIcon: "#f59e0b",
  headerActionRipple: "rgba(255,255,255,0.14)",
  headerActionOutline: "rgba(254,243,199,0.2)",
  headerText: "#fef3c7",
  text: "#fef3c7",
  textMuted: "#a8a29e",
  accent: "#f59e0b",
  border: "#44403c",
  panel: "#0c0a09",
  panelMuted: "#1c1917",
  chipActive: "#351603",
  chipActiveOutline: "#f59e0b",
  dangerBg: "#431407",
  dangerText: "#fef3c7",
  retryOnAccent: "#292524",
  iconMuted: "#78716c",
  inputBorder: "rgba(254,243,199,0.18)",
  /** Slightly deeper amber vs resting hairline so focus reads clearly at 2px stroke. */
  inputBorderFocused: "#fbbf24",
  inputBorderDisabled: "rgba(254,243,199,0.08)",
  inputBackgroundDisabled: "#292524",
  formCanvas: "#120f0d",
  dividerStrong: "rgba(254,243,199,0.35)",
  sliderTrackMax: "#57534e",
  overlayScrim: "rgba(0,0,0,0.55)",
  overlayScrimStrong: "rgba(0,0,0,0.62)",
  onScrimText: "#f5f5f4",
  placeholderFill: "#4a4a4a",
  tabInactive: "#a8a29e",
  tabDivider: "rgba(254,243,199,0.14)",
  tabActiveFill: "#ea580c",
  statusBarStyle: "light",
  blurTint: "dark",
  blurOverlay: "rgba(41,37,36,0.58)",
  blurBaseAndroid: "rgba(12,10,9,0.9)",
};

const lightColors: ThemeColors = {
  mode: "light",
  /** App canvas behind cards — warm cream aligned with web `--background`. */
  background: "#fff9f1",
  /** Nav / search stripe; close to masthead `--wr-header-bg` on web. */
  headerBg: "#fff8ed",
  headerActionFill: mixTowardHex("#fff8ed", "#1c1410", 0.13),
  headerToolbarIcon: "#44403c",
  headerActionRipple: "rgba(0,0,0,0.08)",
  headerActionOutline: "rgba(28,25,23,0.14)",
  headerText: "#1c1410",
  text: "#1c1410",
  textMuted: "#57534e",
  accent: "#f59e0b",
  border: "#a8a29e",
  panel: "#ffffff",
  panelMuted: "#fffdf8",
  chipActive: "#fde68a",
  chipActiveOutline: "#b45309",
  dangerBg: "#fecaca",
  dangerText: "#450a0a",
  retryOnAccent: "#1c1410",
  iconMuted: "#57534e",
  inputBorder: "rgba(28,25,23,0.22)",
  inputBorderFocused: "#ea580c",
  inputBorderDisabled: "rgba(28,25,23,0.12)",
  inputBackgroundDisabled: "#fafaf9",
  formCanvas: "#ebe5dc",
  dividerStrong: "rgba(28,25,23,0.35)",
  sliderTrackMax: "#a8a29e",
  overlayScrim: "rgba(0,0,0,0.55)",
  overlayScrimStrong: "rgba(0,0,0,0.58)",
  onScrimText: "#ffffff",
  placeholderFill: "#c9c4bf",
  tabInactive: "#57534e",
  tabDivider: "rgba(28,25,23,0.18)",
  tabActiveFill: "#fb923c",
  statusBarStyle: "dark",
  blurTint: "light",
  blurOverlay: "rgba(255,248,237,0.84)",
  blurBaseAndroid: "rgba(255,255,255,0.94)",
};

function palette(mode: ThemeMode): ThemeColors {
  return mode === "dark" ? darkColors : lightColors;
}

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setMode: (m: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!alive) return;
      if (raw === "light" || raw === "dark") setModeState(raw);
    });
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    void AsyncStorage.setItem(STORAGE_KEY, m);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      void AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const colors = useMemo(() => palette(mode), [mode]);

  const value = useMemo(
    () => ({ mode, colors, toggleTheme, setMode }),
    [mode, colors, toggleTheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
