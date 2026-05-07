import { forwardRef, useCallback, useMemo, useState } from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  type TextInputProps,
} from "react-native";

import { useTheme } from "../lib/theme";

export type AppTextInputProps = Omit<TextInputProps, "editable"> & {
  disabled?: boolean;
  editable?: boolean;
};

/**
 * Themed `TextInput` with explicit **inactive**, **focused**, and **disabled** chrome.
 */
export const AppTextInput = forwardRef<TextInput, AppTextInputProps>(function AppTextInput(
  {
    disabled = false,
    editable = true,
    style,
    placeholderTextColor,
    onFocus,
    onBlur,
    accessibilityState: accessibilityStateProp,
    ...rest
  },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const isDisabled = disabled || editable === false;

  const handleFocus = useCallback<NonNullable<TextInputProps["onFocus"]>>(
    (e) => {
      setFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback<NonNullable<TextInputProps["onBlur"]>>(
    (e) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  const boxStyle = useMemo(() => {
    const borderColor = isDisabled
      ? colors.inputBorderDisabled
      : focused
        ? colors.inputBorderFocused
        : colors.inputBorder;
    return {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      borderRadius: 10,
      backgroundColor: isDisabled ? colors.inputBackgroundDisabled : colors.panel,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 12 : 10,
      fontSize: 16,
      color: isDisabled ? colors.textMuted : colors.text,
    } as const;
  }, [colors, focused, isDisabled]);

  return (
    <TextInput
      ref={ref}
      {...rest}
      editable={!isDisabled}
      placeholderTextColor={placeholderTextColor ?? colors.iconMuted}
      selectionColor={colors.accent}
      {...(Platform.OS === "android" ? { cursorColor: colors.accent } : {})}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={[boxStyle, style]}
      accessibilityState={{ disabled: isDisabled, ...accessibilityStateProp }}
    />
  );
});

AppTextInput.displayName = "AppTextInput";
