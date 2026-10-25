import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useStore } from '@/store/AppStore';
import { Card, SectionTitle } from '@/ui/components';
import { radius, spacing, type, useTheme, type Palette } from '@/ui/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { settings, updateSettings } = useStore();

  const themeOptions = [
    { value: 'dark', label: 'Dark', icon: 'moon' },
    { value: 'light', label: 'Light', icon: 'sunny' },
    { value: 'system', label: 'System', icon: 'phone-portrait' },
  ] as const;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg }}
    >
      <Card>
        <SectionTitle icon="color-palette">Appearance</SectionTitle>
        <View style={styles.row}>
          {themeOptions.map(({ value, label, icon }) => {
            const active = settings.theme === value;
            return (
              <Pressable
                key={value}
                onPress={() => updateSettings({ theme: value })}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${value} theme`}
                style={[styles.sel, active && styles.selActive]}
              >
                <Ionicons
                  name={icon}
                  size={16}
                  color={active ? colors.bg : colors.text}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.selText, active && styles.selTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <SectionTitle icon="information-circle">How reporting works</SectionTitle>
        <Text style={styles.body}>
          HazardHub does the hard part — a photo, your exact GPS spot, and the county — then opens
          the right agency with your report ready to send. Report potholes, downed trees, flooding,
          dead animals, signal or sign failures, debris, or any road hazard. None of them has a
          St. Louis reporting app or public API to submit through, so you tap the final send yourself.
        </Text>
        <Text style={[styles.body, { marginTop: spacing.sm }]}>
          Road ownership is split: the City of St. Louis, St. Louis County, and MoDOT (state
          highways) each handle their own roads. HazardHub makes its best guess and lets you switch
          if you know it's a highway.
        </Text>
        <Pressable
          onPress={() => Linking.openURL('tel:18882756636')}
          accessibilityRole="button"
          accessibilityLabel="Call MoDOT 1-888-ASK-MODOT"
          style={styles.linkRow}
        >
          <Ionicons name="call" size={17} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={styles.link}>MoDOT 1-888-ASK-MODOT</Text>
        </Pressable>
      </Card>

      <Card>
        <SectionTitle icon="sparkles">AI hazard suggestion</SectionTitle>
        <View style={styles.aiToggleRow}>
          <Text style={[styles.body, { flex: 1 }]}>Suggest a hazard type from the photo</Text>
          <Switch
            value={settings.aiEnabled}
            onValueChange={(v) => updateSettings({ aiEnabled: v })}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor={colors.surface}
            accessibilityLabel="Toggle AI hazard suggestion"
          />
        </View>
        <Text style={[styles.muted, { marginBottom: spacing.sm }]}>
          HazardHub includes a built-in on-device Computer Vision model that analyzes asphalt depression
          features, puddle reflections, and foliage signatures out-of-the-box.
        </Text>
        <Text style={[styles.muted, { marginBottom: spacing.sm }]}>
          Optional: provide a custom Teachable Machine model URL to override the built-in classifier:
        </Text>
        <TextInput
          value={settings.aiModelUrl}
          onChangeText={(t) => updateSettings({ aiModelUrl: t.trim() })}
          placeholder="Custom model URL (e.g. https://teachablemachine.withgoogle.com/models/…)"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Teachable Machine model URL"
          style={styles.input}
        />
      </Card>


      <Text style={styles.footer}>
        HazardHub STL · a community reporting assistant. Not affiliated with MoDOT or the City/County
        of St. Louis.
      </Text>
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
    sel: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    selText: { ...type.label, color: colors.text },
    selTextActive: { color: colors.bg },
    body: { ...type.body, fontSize: 15, color: colors.text, lineHeight: 22 },
    muted: { ...type.caption, color: colors.textMuted, lineHeight: 18 },
    linkRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
    link: { ...type.label, color: colors.accent },
    footer: { ...type.caption, fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
    aiToggleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    input: {
      ...type.body,
      fontSize: 14,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      padding: spacing.md,
      minHeight: 64,
    },
  });
