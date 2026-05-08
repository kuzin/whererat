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
import { Appearance } from "react-native";

const THEME_PREF_KEY = "@whererat/theme-preference";
/** Legacy key — migrated once to {@link THEME_PREF_KEY}. */
const LEGACY_THEME_MODE_KEY = "@whererat/theme-mode";

export type ThemeMode = "light" | "dark";

/** User-facing choice; resolved appearance uses {@link ThemeMode} when not system. */
export type ThemePreference = "light" | "dark" | "system";

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
  headerToolbarIcon: "#ea580c",
  headerActionRipple: "rgba(255,255,255,0.14)",
  headerActionOutline: "rgba(254,243,199,0.2)",
  headerText: "#fef3c7",
  text: "#fef3c7",
  textMuted: "#a8a29e",
  accent: "#ea580c",
  border: "#44403c",
  panel: "#0c0a09",
  panelMuted: "#1c1917",
  chipActive: "#351603",
  chipActiveOutline: "#ea580c",
  dangerBg: "#431407",
  dangerText: "#fef3c7",
  retryOnAccent: "#292524",
  iconMuted: "#78716c",
  inputBorder: "rgba(254,243,199,0.18)",
  /** Slightly deeper amber vs resting hairline so focus reads clearly at 2px stroke. */
  inputBorderFocused: "#f97316",
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
  accent: "#ea580c",
  border: "#a8a29e",
  panel: "#ffffff",
  panelMuted: "#fffdf8",
  chipActive: "#fde68a",
  chipActiveOutline: "#c2410c",
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
  tabActiveFill: "#f97316",
  statusBarStyle: "dark",
  blurTint: "light",
  blurOverlay: "rgba(255,248,237,0.84)",
  blurBaseAndroid: "rgba(255,255,255,0.94)",
};

function palette(mode: ThemeMode): ThemeColors {
  return mode === "dark" ? darkColors : lightColors;
}

function schemeToMode(scheme: string | null | undefined): ThemeMode {
  return scheme === "dark" ? "dark" : "light";
}

type ThemeContextValue = {
  /** Resolved light/dark used for colors and navigation chrome. */
  mode: ThemeMode;
  themePreference: ThemePreference;
  setThemePreference: (p: ThemePreference) => void;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const [systemMode, setSystemMode] = useState<ThemeMode>(() =>
    schemeToMode(Appearance.getColorScheme()),
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemMode(schemeToMode(colorScheme));
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const storedPref = await AsyncStorage.getItem(THEME_PREF_KEY);
      if (!alive) return;
      if (storedPref === "light" || storedPref === "dark" || storedPref === "system") {
        setThemePreferenceState(storedPref);
        return;
      }
      const legacy = await AsyncStorage.getItem(LEGACY_THEME_MODE_KEY);
      if (!alive) return;
      if (legacy === "light" || legacy === "dark") {
        setThemePreferenceState(legacy);
        await AsyncStorage.setItem(THEME_PREF_KEY, legacy);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const resolvedMode: ThemeMode = useMemo(
    () => (themePreference === "system" ? systemMode : themePreference),
    [themePreference, systemMode],
  );

  const setThemePreference = useCallback((p: ThemePreference) => {
    setThemePreferenceState(p);
    void AsyncStorage.setItem(THEME_PREF_KEY, p);
  }, []);

  const colors = useMemo(() => palette(resolvedMode), [resolvedMode]);

  const value = useMemo(
    () => ({
      mode: resolvedMode,
      themePreference,
      setThemePreference,
      colors,
    }),
    [resolvedMode, themePreference, setThemePreference, colors],
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
