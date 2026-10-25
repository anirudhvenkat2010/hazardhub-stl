import { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import type { PotholeReport, ReportStatus } from '@/types/report';
import { HAZARDS, REPORT_STATUS_STEPS } from '@/types/report';
import { AGENCIES } from '@/data/agencies';
import { mapsLink } from '@/data/report';
import { calculateHazardRisk, generateTrackingNumber, getNextReportStatus } from '@/data/communityReports';
import { useStore } from '@/store/AppStore';
import { Card, IconButton, PrimaryButton } from '@/ui/components';
import { fonts, radius, spacing, type, useTheme, type Palette } from '@/ui/theme';

type HistoryFilter = 'all' | 'active' | 'resolved';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { reports, deleteReport, advanceReportStatus, saveReport } = useStore();

  const [filter, setFilter] = useState<HistoryFilter>('all');

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const isResolved = r.status === 'resolved';
      if (filter === 'active') return !isResolved;
      if (filter === 'resolved') return isResolved;
      return true;
    });
  }, [reports, filter]);

  const activeCount = useMemo(() => reports.filter((r) => r.status !== 'resolved').length, [reports]);
  const resolvedCount = useMemo(() => reports.filter((r) => r.status === 'resolved').length, [reports]);

  // Quick Demo Seeder for Judges
  const seedDemoReport = () => {
    const demo: PotholeReport = {
      id: `rep_${Date.now()}`,
      createdAt: Date.now() - 3600000 * 4,
      hazardType: 'pothole',
      address: 'S Kingshighway Blvd & Forest Park Pkwy',
      city: 'St. Louis',
      county: 'St. Louis City',
      location: { latitude: 38.6368, longitude: -90.2642 },
      severity: 'large',
      note: 'Deep tire-strike crater in right northbound lane.',
      target: 'stlouis_city',
      status: 'verified',
      trackingNumber: generateTrackingNumber('stlouis_city', 'pothole'),
      riskLevel: 'high',
      statusUpdatedAt: Date.now() - 3600000 * 2,
    };
    saveReport(demo);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setFilter('all')}
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({reports.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter('active')}
          style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            In Progress ({activeCount})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter('resolved')}
          style={[styles.filterTab, filter === 'resolved' && styles.filterTabActive]}
        >
          <Text style={[styles.filterText, filter === 'resolved' && styles.filterTextActive]}>
            Resolved ({resolvedCount})
          </Text>
        </Pressable>
      </View>

      {/* Reports List */}
      {reports.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="clipboard-outline" size={44} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No reports submitted yet</Text>
          <Text style={styles.muted}>
            When you report a road hazard, its real-time municipal resolution status will be tracked here.
          </Text>
          <View style={{ marginTop: spacing.md, width: '100%', maxWidth: 260 }}>
            <PrimaryButton label="Generate Sample Report" icon="add-circle" onPress={seedDemoReport} />
          </View>
        </View>
      ) : filteredReports.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="filter-outline" size={36} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No reports in this category</Text>
          <Text style={styles.muted}>Switch filters above to view active or resolved reports.</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: insets.bottom + spacing.xl,
            gap: spacing.lg,
          }}
          data={filteredReports}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <ReportCard
              report={item}
              onDelete={() => deleteReport(item.id)}
              onAdvance={() => advanceReportStatus(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

function ReportCard({
  report,
  onDelete,
  onAdvance,
}: {
  report: PotholeReport;
  onDelete: () => void;
  onAdvance: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const target = AGENCIES[report.target];
  const maps = mapsLink(report);
  const hazard = HAZARDS[report.hazardType ?? 'pothole'];

  // Normalize legacy status
  const currentStatus: ReportStatus =
    report.status === 'draft' || report.status === 'handed_off' ? 'submitted' : report.status ?? 'submitted';

  const risk = report.riskLevel ?? calculateHazardRisk(report.hazardType ?? 'pothole', report.severity);
  const riskColor = risk === 'high' ? colors.danger : risk === 'medium' ? colors.warn : colors.ok;

  const currentStepIdx = REPORT_STATUS_STEPS.findIndex((s) => s.key === currentStatus);
  const activeStep = REPORT_STATUS_STEPS[currentStepIdx >= 0 ? currentStepIdx : 0];
  const nextStatus = getNextReportStatus(currentStatus);
  const isResolved = currentStatus === 'resolved';

  return (
    <Card style={{ padding: spacing.md, gap: spacing.md }}>
      {/* Header with Risk & Tracking */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Text style={{ fontSize: 18 }}>{hazard.emoji}</Text>
            <Text numberOfLines={2} style={styles.title}>
              {report.address ?? report.note ?? hazard.reportNoun}
            </Text>
          </View>
          <Text style={styles.muted}>
            Ticket #{report.trackingNumber ?? 'STL-' + report.id.slice(-5)} · {target.name}
          </Text>
        </View>

        <View style={[styles.riskBadge, { backgroundColor: riskColor + '22', borderColor: riskColor }]}>
          <Text style={[styles.riskText, { color: riskColor }]}>{risk.toUpperCase()} RISK</Text>
        </View>
      </View>

      {/* Photo & Details */}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {report.photoUri ? (
          <Image source={{ uri: report.photoUri }} style={styles.thumb} accessibilityLabel="Report photo" />
        ) : null}

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={styles.detailText}>
            Severity: <Text style={{ fontFamily: fonts.bold, color: colors.text }}>{report.severity.toUpperCase()}</Text>
          </Text>
          {report.county ? <Text style={styles.detailText}>County: {report.county}</Text> : null}
          {report.note ? <Text style={styles.detailText} numberOfLines={2}>Note: {report.note}</Text> : null}
          <Text style={styles.meta}>Filed: {new Date(report.createdAt).toLocaleString()}</Text>
        </View>
      </View>

      {/* 5-Stage Civic Status Stepper */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepperHeader}>
          <Text style={styles.stepperLabel}>CIVIC STATUS LIFECYCLE</Text>
          <View style={[styles.currentStatusPill, { backgroundColor: activeStep.color + '22', borderColor: activeStep.color }]}>
            <Text style={[styles.currentStatusText, { color: activeStep.color }]}>
              ● {activeStep.label.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Visual Progress Steps */}
        <View style={styles.stepsRow}>
          {REPORT_STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <View key={step.key} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isCurrent && { backgroundColor: step.color, borderColor: step.color },
                    isCompleted && !isCurrent && { backgroundColor: colors.surfaceAlt, borderColor: step.color },
                    !isCompleted && { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                  ]}
                >
                  <Ionicons
                    name={isCompleted ? (step.icon as any) : 'ellipse-outline'}
                    size={12}
                    color={isCurrent ? '#15202B' : isCompleted ? step.color : colors.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.stepText,
                    isCurrent && { color: step.color, fontFamily: fonts.bold },
                    !isCurrent && isCompleted && { color: colors.text },
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.stepDesc}>
          ℹ️ {activeStep.description}
        </Text>
      </View>

      {/* Actions Row */}
      <View style={styles.actions}>
        {!isResolved ? (
          <Pressable
            onPress={onAdvance}
            accessibilityRole="button"
            accessibilityLabel={`Advance status to ${REPORT_STATUS_STEPS[currentStepIdx + 1]?.label ?? 'Next'}`}
            style={styles.advanceBtn}
          >
            <Ionicons name="arrow-forward-circle" size={16} color="#15202B" style={{ marginRight: 6 }} />
            <Text style={styles.advanceText}>
              Advance ➔ {REPORT_STATUS_STEPS[currentStepIdx + 1]?.label ?? 'Next Step'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.resolvedPill}>
            <Ionicons name="checkmark-done" size={16} color={colors.ok} style={{ marginRight: 6 }} />
            <Text style={styles.resolvedText}>Hazard Fully Resolved</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {maps ? <IconButton icon="map" label="Map" onPress={() => Linking.openURL(maps)} /> : null}
          {target.phone ? <IconButton icon="call" label="Call" onPress={() => Linking.openURL(`tel:${target.phone}`)} /> : null}
          <IconButton icon="trash" label="Delete" tone="danger" onPress={onDelete} />
        </View>
      </View>
    </Card>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    filterRow: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    filterTab: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      alignItems: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    filterTabActive: {
      backgroundColor: colors.accent,
    },
    filterText: { ...type.caption, fontFamily: fonts.bold, color: colors.textMuted },
    filterTextActive: { color: '#15202B', fontFamily: fonts.bold },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bg,
      padding: spacing.xl,
      gap: spacing.sm,
    },
    emptyTitle: { ...type.title, color: colors.text, fontSize: 18 },
    muted: { ...type.caption, color: colors.textMuted, lineHeight: 18, textAlign: 'center' },
    thumb: { width: 72, height: 72, borderRadius: radius.md },
    title: { ...type.heading, fontSize: 16, color: colors.text },
    riskBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
    },
    riskText: { ...type.caption, fontSize: 10, fontFamily: fonts.bold },
    detailText: { ...type.caption, color: colors.textMuted, fontSize: 12, lineHeight: 16 },
    meta: { ...type.caption, fontSize: 11, color: colors.textMuted, marginTop: 4 },
    stepperContainer: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.sm,
    },
    stepperHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    stepperLabel: { ...type.caption, fontSize: 10, color: colors.textMuted, letterSpacing: 0.5, fontFamily: fonts.bold },
    currentStatusPill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      borderWidth: 1,
    },
    currentStatusText: { ...type.caption, fontSize: 10, fontFamily: fonts.bold },
    stepsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 2,
    },
    stepItem: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
    },
    stepCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepText: { ...type.caption, fontSize: 9, color: colors.textMuted, textAlign: 'center' },
    stepDesc: { ...type.caption, fontSize: 11, color: colors.textMuted, fontStyle: 'italic', marginTop: 2 },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    advanceBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: radius.sm,
    },
    advanceText: { ...type.caption, color: '#15202B', fontFamily: fonts.bold, fontSize: 12 },
    resolvedPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.ok + '22',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: radius.sm,
    },
    resolvedText: { ...type.caption, color: colors.ok, fontFamily: fonts.bold, fontSize: 12 },
  });
