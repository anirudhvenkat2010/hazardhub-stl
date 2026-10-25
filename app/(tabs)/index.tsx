import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import type { Agency, HazardType, PotholeReport, Severity } from '@/types/report';
import { HAZARDS } from '@/types/report';
import { AGENCIES, routeAgency } from '@/data/agencies';
import { resolveCurrentLocation } from '@/data/location';
import { composeReportText, formLink, mailtoLink, mapsLink, telLink } from '@/data/report';
import { classifyPhoto, type Prediction } from '@/data/classifier';
import { calculateHazardRisk, generateTrackingNumber } from '@/data/communityReports';
import { useStore } from '@/store/AppStore';
import { Card, PrimaryButton, SectionTitle } from '@/ui/components';
import { fonts, radius, spacing, type, useTheme, type Palette } from '@/ui/theme';

const SEVERITIES: { value: Severity; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const HAZARD_ORDER: HazardType[] = [
  // maintenance hazards
  'pothole', 'tree', 'flooding', 'dead_animal', 'signal', 'sign', 'debris', 'sidewalk', 'storm',
  // incidents (more time-sensitive)
  'accident', 'disabled_vehicle', 'road_closure', 'power_line',
  'other',
];

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { saveReport, settings } = useStore();

  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [hazardType, setHazardType] = useState<HazardType>('pothole');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiTop, setAiTop] = useState<Prediction | null>(null);
  const [aiPredictions, setAiPredictions] = useState<Prediction[]>([]);
  const [aiLatency, setAiLatency] = useState<number | null>(null);
  const [aiEngine, setAiEngine] = useState<string | null>(null);
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const [loc, setLoc] = useState<PotholeReport['location']>(null);
  const [address, setAddress] = useState<string | undefined>();
  const [city, setCity] = useState<string | undefined>();
  const [county, setCounty] = useState<string | undefined>();
  const [severity, setSeverity] = useState<Severity>('medium');
  const [note, setNote] = useState('');
  const [locating, setLocating] = useState(false);
  const [locMsg, setLocMsg] = useState<string | null>(null);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const [agencyOverride, setAgencyOverride] = useState<Agency | null>(null);

  const routedAgency: Agency = agencyOverride ?? routeAgency(county, city);
  const target = AGENCIES[routedAgency];

  // Run on-device Computer Vision classifier when a photo is captured.
  useEffect(() => {
    if (!photoUri || !settings.aiEnabled) {
      setAiTop(null);
      setAiPredictions([]);
      setAiMsg(null);
      return;
    }
    let cancelled = false;
    setAiBusy(true);
    setAiTop(null);
    setAiPredictions([]);
    setAiMsg(null);
    classifyPhoto(photoUri, settings.aiModelUrl)
      .then((res) => {
        if (cancelled) return;
        if (!res.ok || res.predictions.length === 0) {
          setAiMsg('Couldn’t run vision classification — pick the hazard type manually.');
          return;
        }
        setAiPredictions(res.predictions);
        setAiLatency(res.latencyMs ?? null);
        setAiEngine(res.source ?? 'built_in_vision');
        const top = res.predictions[0];
        if (top && top.hazardType) {
          setAiTop(top);
        }
      })
      .catch(() => {
        if (!cancelled) setAiMsg('Vision inference paused — choose hazard type manually.');
      })
      .finally(() => !cancelled && setAiBusy(false));
    return () => {
      cancelled = true;
    };
  }, [photoUri, settings.aiEnabled, settings.aiModelUrl]);

  const takePhoto = async () => {
    setPhotoMsg(null);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setPhotoMsg(
          perm.canAskAgain === false
            ? 'Camera permission is off — enable it in Settings, or use “Choose” instead.'
            : 'Camera permission denied — you can still report without a photo, or use “Choose”.',
        );
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.5,
      });
      if (!res.canceled && res.assets[0]) setPhotoUri(res.assets[0].uri);
    } catch (e) {
      setPhotoMsg(
        `Couldn’t open the camera (${e instanceof Error ? e.message : 'unknown error'}). Try “Choose” to pick a photo instead.`,
      );
    }
  };

  const pickPhoto = async () => {
    setPhotoMsg(null);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.5,
      });
      if (!res.canceled && res.assets[0]) setPhotoUri(res.assets[0].uri);
    } catch (e) {
      setPhotoMsg(`Couldn’t open your photos (${e instanceof Error ? e.message : 'unknown error'}).`);
    }
  };

  const getLocation = async () => {
    setLocating(true);
    setLocMsg(null);
    const r = await resolveCurrentLocation();
    setLocating(false);
    if (!r.ok) {
      setLocMsg(
        r.reason === 'denied'
          ? 'Location permission denied — enable it, or type the nearest intersection in Details.'
          : 'Couldn\u2019t get a location fix — type the nearest intersection in Details.',
      );
      return;
    }
    setLoc(r.value.point);
    setAddress(r.value.address);
    setCity(r.value.city);
    setCounty(r.value.county);
    if (!r.value.county && !r.value.address) {
      setLocMsg('Got your coordinates, but couldn\u2019t resolve the street — add a landmark in Details.');
    }
  };

  const buildReport = (): PotholeReport => {
    const risk = calculateHazardRisk(hazardType, severity);
    const tracking = generateTrackingNumber(routedAgency, hazardType);
    return {
      id: `rep_${Date.now()}`,
      createdAt: Date.now(),
      hazardType,
      photoUri,
      location: loc,
      address,
      city,
      county,
      severity,
      note: note.trim() || undefined,
      target: routedAgency,
      status: 'submitted',
      trackingNumber: tracking,
      riskLevel: risk,
      statusUpdatedAt: Date.now(),
    };
  };

  const handOff = async (kind: 'form' | 'call' | 'email' | 'maps') => {
    const r = buildReport();
    saveReport(r);
    let url: string | undefined;
    if (kind === 'form') url = formLink(r);
    else if (kind === 'call') url = telLink(r);
    else if (kind === 'email') url = mailtoLink(r);
    else url = mapsLink(r);
    if (url) {
      try {
        await Linking.openURL(url);
      } catch {
        setLocMsg('Couldn\u2019t open that — your report is saved under History.');
      }
    }
  };

  const canReport = !!loc || !!note.trim();

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg }}
    >
      {/* 1. Hazard type */}
      <Card>
        <SectionTitle icon="alert-circle">1 · What are you reporting?</SectionTitle>
        <View style={styles.rowButtons}>
          {HAZARD_ORDER.map((h) => {
            const meta = HAZARDS[h];
            const active = hazardType === h;
            return (
              <Pressable
                key={h}
                onPress={() => setHazardType(h)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Hazard type ${meta.label}`}
                style={[styles.hazard, active && styles.sevActive]}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.sevText, active && styles.sevTextActive]}
                >
                  {meta.emoji} {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {HAZARDS[hazardType].routeHint ? (
          <View
            style={[
              styles.hint,
              HAZARDS[hazardType].urgent && { backgroundColor: colors.danger + '22', borderColor: colors.danger },
            ]}
          >
            <Ionicons
              name={HAZARDS[hazardType].urgent ? 'warning' : 'information-circle'}
              size={18}
              color={HAZARDS[hazardType].urgent ? colors.danger : colors.textMuted}
              style={{ marginRight: 8, marginTop: 1 }}
            />
            <Text style={[styles.hintText, HAZARDS[hazardType].urgent && { color: colors.danger }]}>
              {HAZARDS[hazardType].routeHint}
            </Text>
          </View>
        ) : null}
        {HAZARDS[hazardType].urgent ? (
          <View style={{ marginTop: spacing.sm }}>
            <PrimaryButton label="Call 911" icon="call" tone="danger" onPress={() => Linking.openURL('tel:911')} />
          </View>
        ) : null}
      </Card>

      {/* 2. Photo */}
      <Card>
        <SectionTitle icon="camera">2 · Photo (optional)</SectionTitle>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} accessibilityLabel={`${HAZARDS[hazardType].label} photo`} />
        ) : (
          <View style={[styles.photoPlaceholder, { borderColor: colors.border }]}>
            <Text style={styles.muted}>No photo yet</Text>
          </View>
        )}
        <View style={styles.rowButtons}>
          <View style={{ flex: 1 }}>
            <PrimaryButton label="Take photo" icon="camera" onPress={takePhoto} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton label="Choose" icon="images" tone="surface" onPress={pickPhoto} />
          </View>
        </View>
        {photoMsg ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.muted, { color: colors.warn, marginTop: spacing.sm }]}
          >
            {photoMsg}
          </Text>
        ) : null}
        {photoUri && aiBusy ? (
          <View style={[styles.aiRow, { marginTop: spacing.md }]}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.muted}>Analyzing photo with on-device computer vision…</Text>
          </View>
        ) : null}

        {photoUri && !aiBusy && aiPredictions.length > 0 ? (
          <View style={styles.aiContainer}>
            <View style={styles.aiHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sparkles" size={16} color={colors.accent} />
                <Text style={styles.aiHeading}>AI Vision Classification</Text>
              </View>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>
                  {aiLatency ? `${aiLatency}ms · ` : ''}On-Device
                </Text>
              </View>
            </View>

            <Text style={styles.aiSub}>
              Computer vision detected the following hazard probabilities:
            </Text>

            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              {aiPredictions.map((pred, idx) => {
                const hType = pred.hazardType ?? 'other';
                const meta = HAZARDS[hType];
                const isSelected = hazardType === hType;
                const pct = Math.round(pred.confidence * 100);

                return (
                  <Pressable
                    key={`${pred.label}-${idx}`}
                    onPress={() => pred.hazardType && setHazardType(pred.hazardType)}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${meta.label} (${pct}%)`}
                    style={[
                      styles.aiPredRow,
                      isSelected && styles.aiPredRowActive,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={[styles.aiPredLabel, isSelected && { color: colors.text, fontFamily: fonts.bold }]}>
                          {meta.emoji} {meta.label}
                        </Text>
                        <Text style={[styles.aiPredPct, isSelected && { color: colors.accent, fontFamily: fonts.bold }]}>
                          {pct}%
                        </Text>
                      </View>

                      {/* Visual Confidence Bar */}
                      <View style={styles.aiBarTrack}>
                        <View
                          style={[
                            styles.aiBarFill,
                            {
                              width: `${Math.max(6, pct)}%`,
                              backgroundColor: isSelected ? colors.accent : idx === 0 ? colors.warn : colors.textMuted,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    <View style={{ marginLeft: spacing.md, justifyContent: 'center' }}>
                      {isSelected ? (
                        <View style={styles.aiSelectedPill}>
                          <Ionicons name="checkmark" size={13} color={colors.ok} style={{ marginRight: 2 }} />
                          <Text style={[type.caption, { color: colors.ok, fontSize: 12 }]}>Active</Text>
                        </View>
                      ) : (
                        <View style={styles.aiUseBtn}>
                          <Text style={[type.caption, { color: colors.bg, fontFamily: fonts.bold, fontSize: 12 }]}>Use</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {photoUri && !aiBusy && aiMsg ? (
          <Text style={[styles.muted, { color: colors.textMuted, marginTop: spacing.sm }]}>{aiMsg}</Text>
        ) : null}
      </Card>

      {/* 3. Location */}
      <Card>
        <SectionTitle icon="location">3 · Location</SectionTitle>
        {loc ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="location" size={18} color={colors.accent} />
              <Text style={styles.body}>
                {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
              </Text>
            </View>
            {address ? <Text style={styles.muted}>{address}</Text> : null}
            <Text style={styles.muted}>
              {county ? `County: ${county}` : 'County not resolved'}
              {city ? `  ·  ${city}` : ''}
            </Text>
          </>
        ) : (
          <Text style={styles.muted}>Tap to pin exactly where the hazard is.</Text>
        )}
        <View style={{ marginTop: spacing.md }}>
          {locating ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.muted}>Getting your location…</Text>
            </View>
          ) : (
            <PrimaryButton
              label={loc ? 'Update location' : 'Use my location'}
              icon="navigate"
              onPress={getLocation}
            />
          )}
        </View>
        {locMsg ? <Text style={[styles.muted, { color: colors.warn, marginTop: spacing.sm }]}>{locMsg}</Text> : null}
      </Card>

      {/* 4. Severity */}
      <Card>
        <SectionTitle icon="speedometer">4 · How bad is it?</SectionTitle>
        <View style={styles.rowButtons}>
          {SEVERITIES.map((s) => (
            <Pressable
              key={s.value}
              onPress={() => setSeverity(s.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: severity === s.value }}
              accessibilityLabel={`Severity ${s.label}`}
              style={[styles.sev, severity === s.value && styles.sevActive]}
            >
              <Text numberOfLines={1} style={[styles.sevText, severity === s.value && styles.sevTextActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* 5. Details */}
      <Card>
        <SectionTitle icon="create">5 · Details (optional)</SectionTitle>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={HAZARDS[hazardType].detailHint}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={`Details about the ${HAZARDS[hazardType].label}`}
          style={styles.input}
          multiline
        />
      </Card>

      {/* 6. Who to report to */}
      <Card>
        <SectionTitle icon="git-branch">6 · Report to</SectionTitle>
        <Text style={styles.body}>{target.name}</Text>
        <Text style={styles.muted}>{target.covers}</Text>
        <Text style={[styles.muted, { marginTop: spacing.xs }]}>
          On a highway (I-44/64/70/270, a US/MO route)? Use MoDOT instead:
        </Text>
        <View style={styles.rowButtons}>
          {(['stlouis_city', 'stlouis_county', 'modot'] as Agency[]).map((a) => (
            <Pressable
              key={a}
              onPress={() => setAgencyOverride(a)}
              accessibilityRole="button"
              accessibilityState={{ selected: routedAgency === a }}
              style={[styles.sev, routedAgency === a && styles.sevActive]}
            >
              <Text numberOfLines={1} style={[styles.sevText, routedAgency === a && styles.sevTextActive]}>
                {a === 'modot' ? 'MoDOT' : a === 'stlouis_city' ? 'City' : 'County'}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* 7. Send */}
      <Card>
        <SectionTitle icon="send">7 · Send your report</SectionTitle>
        <Text style={[styles.muted, { marginBottom: spacing.sm }]}>
          HazardHub prepares the full report. Pick how to send it — it opens the agency with your
          details ready (attach the photo when prompted).
        </Text>
        <View style={{ gap: spacing.sm }}>
          {target.formUrl ? (
            <PrimaryButton
              label="Open the report form"
              icon="document-text"
              onPress={() => handOff('form')}
              disabled={!canReport}
            />
          ) : null}
          <PrimaryButton
            label={`Call ${target.phoneDisplay ?? 'the agency'}`}
            icon="call"
            tone="surface"
            onPress={() => handOff('call')}
            disabled={!canReport}
          />
          <PrimaryButton
            label="Open the spot in Maps"
            icon="map"
            tone="surface"
            onPress={() => handOff('maps')}
            disabled={!loc}
          />
        </View>
        {!canReport ? (
          <Text style={[styles.muted, { color: colors.warn, marginTop: spacing.sm }]}>
            Add a location or details first.
          </Text>
        ) : null}
      </Card>
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    body: { ...type.body, color: colors.text },
    muted: { ...type.caption, color: colors.textMuted, lineHeight: 18 },
    center: { alignItems: 'center', gap: spacing.sm },
    photo: { width: '100%', height: 200, borderRadius: radius.md, marginBottom: spacing.md },
    photoPlaceholder: {
      width: '100%',
      height: 120,
      borderRadius: radius.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    rowButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
    sev: {
      flexGrow: 1,
      minWidth: 88,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sevActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    hazard: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    sevText: { ...type.label, color: colors.text, textAlign: 'center' },
    sevTextActive: { color: colors.bg },
    hint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    hintText: { ...type.caption, flex: 1, color: colors.textMuted, lineHeight: 18 },
    aiRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    aiContainer: {
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accent + '12',
    },
    aiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    aiHeading: { ...type.label, color: colors.text },
    aiBadge: {
      backgroundColor: colors.accent + '25',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 999,
    },
    aiBadgeText: { ...type.caption, fontSize: 11, color: colors.accent, fontFamily: fonts.bold },
    aiSub: { ...type.caption, color: colors.textMuted, marginTop: 4, marginBottom: 2 },
    aiPredRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.sm + 2,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    aiPredRowActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent + '15',
    },
    aiPredLabel: { ...type.caption, fontSize: 14, color: colors.text },
    aiPredPct: { ...type.caption, fontSize: 14, color: colors.textMuted },
    aiBarTrack: {
      height: 5,
      borderRadius: 999,
      backgroundColor: colors.border + '55',
      overflow: 'hidden',
    },
    aiBarFill: {
      height: '100%',
      borderRadius: 999,
    },
    aiSelectedPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.ok + '22',
      borderColor: colors.ok,
      borderWidth: 1,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: radius.sm,
    },
    aiUseBtn: {
      backgroundColor: colors.accent,
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: radius.sm,
    },
    input: {
      ...type.body,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      padding: spacing.md,
      minHeight: 70,
      textAlignVertical: 'top',
    },
  });
