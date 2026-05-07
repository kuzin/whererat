import AsyncStorage from "@react-native-async-storage/async-storage";
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
  headerText: "#fef3c7",
  text: "#fef3c7",
  textMuted: "#a8a29e",
  accent: "#f59e0b",
  border: "#44403c",
  panel: "#0c0a09",
  panelMuted: "#1c1917",
  chipActive: "#422006",
  chipActiveOutline: "#f59e0b",
  dangerBg: "#431407",
  dangerText: "#fef3c7",
  retryOnAccent: "#292524",
  iconMuted: "#78716c",
  /** ≥4.5∶1 vs typical tab bar backdrop / panel reads for inactive 11 pt labels */
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
  headerText: "#1c1410",
  text: "#1c1410",
  textMuted: "#57534e",
  accent: "#f59e0b",
  border: "#a8a29e",
  panel: "#ffffff",
  panelMuted: "#fffdf8",
  chipActive: "#fef3c7",
  chipActiveOutline: "#b45309",
  dangerBg: "#fecaca",
  dangerText: "#450a0a",
  retryOnAccent: "#1c1410",
  iconMuted: "#57534e",
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
