import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, spacing, type, useTheme } from '@/ui/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

/** Small uppercase overline used as a step/section label, optionally with a leading icon. */
export function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: IoniconName }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionRow}>
      {icon ? <Ionicons name={icon} size={15} color={colors.textMuted} style={{ marginRight: 6 }} /> : null}
      <Text style={[type.overline, { color: colors.textMuted }]}>{children}</Text>
    </View>
  );
}

/** Primary action with an optional leading vector icon. */
export function PrimaryButton({
  label,
  onPress,
  icon,
  tone = 'accent',
  disabled,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  icon?: IoniconName;
  tone?: 'accent' | 'surface' | 'danger';
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const bg = tone === 'accent' ? colors.accent : tone === 'danger' ? colors.danger : colors.surfaceAlt;
  const fg = tone === 'surface' ? colors.text : '#15202B';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg },
        disabled && { opacity: 0.4 },
        pressed && !disabled && { opacity: 0.85 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={19} color={fg} style={{ marginRight: 8 }} /> : null}
      <Text numberOfLines={1} style={[type.label, { color: fg, flexShrink: 1, textAlign: 'center' }]}>{label}</Text>
    </Pressable>
  );
}

/** Compact circular/rounded icon-only button for row actions (map, call, delete). */
export function IconButton({
  icon,
  onPress,
  label,
  tone = 'surface',
}: {
  icon: IoniconName;
  onPress: () => void;
  label: string;
  tone?: 'accent' | 'surface' | 'danger';
}) {
  const { colors } = useTheme();
  const fg = tone === 'accent' ? colors.accent : tone === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconBtn,
        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Ionicons name={icon} size={17} color={fg} style={{ marginRight: 6 }} />
      <Text style={[type.caption, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  btn: {
    flexDirection: 'row',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
});
