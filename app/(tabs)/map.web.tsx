import { useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import type { GeoPoint, ReportStatus, RiskLevel } from '@/types/report';
import { HAZARDS } from '@/types/report';
import { useStore } from '@/store/AppStore';
import {
  COMMUNITY_HAZARDS,
  HAZARD_HOTSPOTS,
  SAMPLE_ROUTES,
  calculateHazardRisk,
} from '@/data/communityReports';

import { fonts, radius, spacing, type, useTheme, type Palette } from '@/ui/theme';

type MapMode = 'community' | 'personal';
type RiskFilter = 'all' | 'high' | 'medium' | 'low';
type StatusFilter = 'all' | 'open' | 'resolved';

interface UnifiedPin {
  id: string;
  title: string;
  hazardType: string;
  emoji: string;
  location: GeoPoint;
  riskLevel: RiskLevel;
  status: ReportStatus;
  address?: string;
  agency?: string;
  trackingNumber?: string;
  isHotspot?: boolean;
  timeAgo?: string;
}

export default function MapScreenWeb() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { reports } = useStore();

  const [mode, setMode] = useState<MapMode>('community');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showHotspots, setShowHotspots] = useState(true);
  const [selectedPinId, setSelectedPinId] = useState<string | null>('comm_1');
  const [showRouteAlert, setShowRouteAlert] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState('route_school');

  const selectedRoute = useMemo(() => {
    return SAMPLE_ROUTES.find((r) => r.id === selectedRouteId) ?? SAMPLE_ROUTES[0];
  }, [selectedRouteId]);

  // Convert personal reports to unified format
  const personalPins: UnifiedPin[] = useMemo(() => {
    return reports
      .filter((r) => r.location)
      .map((r) => {
        const hType = r.hazardType ?? 'pothole';
        const meta = HAZARDS[hType];
        const risk = r.riskLevel ?? calculateHazardRisk(hType, r.severity);
        return {
          id: r.id,
          title: meta.reportNoun,
          hazardType: hType,
          emoji: meta.emoji,
          location: r.location!,
          riskLevel: risk,
          status: r.status ?? 'submitted',
          address: r.address ?? r.note,
          agency: r.target,
          trackingNumber: r.trackingNumber ?? 'REP-' + r.id.slice(-5),
          timeAgo: new Date(r.createdAt).toLocaleDateString(),
        };
      });
  }, [reports]);

  // Convert community hazards to unified format
  const communityPins: UnifiedPin[] = useMemo(() => {
    return COMMUNITY_HAZARDS.map((c) => {
      const meta = HAZARDS[c.hazardType];
      return {
        id: c.id,
        title: c.title,
        hazardType: c.hazardType,
        emoji: meta.emoji,
        location: c.location,
        riskLevel: c.riskLevel,
        status: c.status,
        address: c.address,
        agency: c.agency,
        trackingNumber: c.trackingNumber,
        timeAgo: c.reportedAgo,
      };
    });
  }, []);

  // Filtered active pins
  const activePins = useMemo(() => {
    const source = mode === 'community' ? communityPins : personalPins;
    return source.filter((pin) => {
      if (riskFilter !== 'all' && pin.riskLevel !== riskFilter) return false;
      if (statusFilter === 'open' && pin.status === 'resolved') return false;
      if (statusFilter === 'resolved' && pin.status !== 'resolved') return false;
      return true;
    });
  }, [mode, communityPins, personalPins, riskFilter, statusFilter]);

  const selectedPin = useMemo(() => {
    return activePins.find((p) => p.id === selectedPinId) ?? activePins[0] ?? null;
  }, [activePins, selectedPinId]);

  return (
    <View style={styles.root}>
      {/* Top Header & Controls */}
      <View style={styles.header}>
        {/* Mode Switcher */}
        <View style={styles.modeSwitcher}>
          <Pressable
            onPress={() => setMode('community')}
            accessibilityRole="button"
            accessibilityLabel="Live Community Hazard Map"
            style={[styles.modeTab, mode === 'community' && styles.modeTabActive]}
          >
            <Ionicons
              name="globe-outline"
              size={15}
              color={mode === 'community' ? colors.bg : colors.text}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.modeText, mode === 'community' && styles.modeTextActive]}>
              Live Community Feed ({communityPins.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMode('personal')}
            accessibilityRole="button"
            accessibilityLabel="My Reports"
            style={[styles.modeTab, mode === 'personal' && styles.modeTabActive]}
          >
            <Ionicons
              name="person-outline"
              size={15}
              color={mode === 'personal' ? colors.bg : colors.text}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.modeText, mode === 'personal' && styles.modeTextActive]}>
              My Reports ({personalPins.length})
            </Text>
          </Pressable>
        </View>

        {/* Filter Chips ScrollView */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <Pressable
            onPress={() => setRiskFilter(riskFilter === 'high' ? 'all' : 'high')}
            style={[styles.chip, riskFilter === 'high' && { backgroundColor: colors.danger, borderColor: colors.danger }]}
          >
            <Text style={[styles.chipText, riskFilter === 'high' && { color: '#FFF' }]}>🔴 High Risk</Text>
          </Pressable>

          <Pressable
            onPress={() => setRiskFilter(riskFilter === 'medium' ? 'all' : 'medium')}
            style={[styles.chip, riskFilter === 'medium' && { backgroundColor: colors.warn, borderColor: colors.warn }]}
          >
            <Text style={[styles.chipText, riskFilter === 'medium' && { color: '#000' }]}>🟡 Med Risk</Text>
          </Pressable>

          <Pressable
            onPress={() => setRiskFilter(riskFilter === 'low' ? 'all' : 'low')}
            style={[styles.chip, riskFilter === 'low' && { backgroundColor: colors.ok, borderColor: colors.ok }]}
          >
            <Text style={[styles.chipText, riskFilter === 'low' && { color: '#FFF' }]}>🟢 Low Risk</Text>
          </Pressable>

          <Pressable
            onPress={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')}
            style={[styles.chip, statusFilter === 'open' && styles.chipActive]}
          >
            <Text style={[styles.chipText, statusFilter === 'open' && styles.chipTextActive]}>⚠️ Open</Text>
          </Pressable>

          <Pressable
            onPress={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
            style={[styles.chip, statusFilter === 'resolved' && styles.chipActive]}
          >
            <Text style={[styles.chipText, statusFilter === 'resolved' && styles.chipTextActive]}>✅ Resolved</Text>
          </Pressable>

          {mode === 'community' ? (
            <Pressable
              onPress={() => setShowHotspots(!showHotspots)}
              style={[styles.chip, showHotspots && { backgroundColor: '#FF4D4D', borderColor: '#FF4D4D' }]}
            >
              <Text style={[styles.chipText, showHotspots && { color: '#FFF' }]}>🔥 Hotspots</Text>
            </Pressable>
          ) : null}

          {/* Route Safety Alert Toggle */}
          <Pressable
            onPress={() => setShowRouteAlert(!showRouteAlert)}
            style={[
              styles.chip,
              showRouteAlert && { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
          >
            <Text style={[styles.chipText, showRouteAlert && { color: colors.bg }]}>🚗 Route Alert</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg }}
      >
        {/* Smart Route Safety Alert Card */}
        {showRouteAlert && selectedRoute ? (
          <View style={styles.routeAlertCard}>
            <View style={styles.routeHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="shield-checkmark" size={17} color={colors.accent} />
                <Text style={styles.routeHeaderTitle}>Smart Route Safety Alert</Text>
              </View>
              <Pressable
                onPress={() => setShowRouteAlert(false)}
                accessibilityRole="button"
                accessibilityLabel="Close route alert"
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Route Selector Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, marginVertical: 6 }}>
              {SAMPLE_ROUTES.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => setSelectedRouteId(r.id)}
                  style={[
                    styles.routeTab,
                    selectedRouteId === r.id && { backgroundColor: colors.accent, borderColor: colors.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.routeTabText,
                      selectedRouteId === r.id && { color: colors.bg, fontFamily: fonts.bold },
                    ]}
                  >
                    {r.routeName}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.routeEndpoints}>
              Commute: <Text style={{ color: colors.text, fontFamily: fonts.bold }}>{selectedRoute.origin}</Text> ➔{' '}
              <Text style={{ color: colors.text, fontFamily: fonts.bold }}>{selectedRoute.destination}</Text> ({selectedRoute.distanceMiles} mi)
            </Text>

            {/* Hazards Ahead on Route */}
            <View style={styles.routeHazardsList}>
              {selectedRoute.hazardsAhead.map((item, idx) => (
                <View key={idx} style={styles.routeHazardItem}>
                  <Ionicons
                    name={item.hazard.hazardType === 'dead_animal' ? 'warning' : 'alert-circle'}
                    size={16}
                    color={colors.danger}
                    style={{ marginTop: 2, marginRight: 6 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routeHazardText}>
                      🚨 <Text style={{ fontFamily: fonts.bold }}>{item.hazard.title}</Text> ({item.distanceMilesAhead} mi ahead)
                    </Text>
                    <Text style={styles.routeHazardSub}>
                      {item.warningText} · {item.hazard.address}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Detour Recommendation */}
            <View style={styles.detourBox}>
              <Ionicons name="checkmark-circle" size={15} color={colors.ok} style={{ marginRight: 6 }} />
              <Text style={styles.detourText}>
                Detour: <Text style={{ color: colors.text }}>{selectedRoute.recommendedDetour}</Text>
              </Text>
            </View>
          </View>
        ) : null}

        {/* Hotspot Alerts Banner */}
        {mode === 'community' && showHotspots ? (
          <View style={styles.hotspotsSection}>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm }}>
              <Ionicons name="flame" size={18} color="#FF4D4D" />
              <Text style={styles.sectionHeading}>Active St. Louis Incident Hotspots</Text>
            </View>
            <View style={styles.hotspotGrid}>
              {HAZARD_HOTSPOTS.map((spot) => (
                <View key={spot.id} style={styles.hotspotCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.hotspotTitle}>🔥 {spot.name}</Text>
                    <View style={styles.hotspotBadge}>
                      <Text style={styles.hotspotBadgeText}>{spot.incidentCount} reports</Text>
                    </View>
                  </View>
                  <Text style={styles.hotspotDesc}>{spot.description}</Text>
                  <Text style={styles.hotspotCorridor}>Corridor: {spot.corridor}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Hazard List Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.sectionHeading}>
            {mode === 'community' ? 'Community Hazard Reports' : 'Your Located Reports'} ({activePins.length})
          </Text>
          <Text style={styles.legendText}>
            🔴 High · 🟡 Medium · 🟢 Low · ⚪ Resolved
          </Text>
        </View>

        {/* Hazard Cards Grid */}
        {activePins.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No hazards match this filter</Text>
            <Text style={styles.emptySub}>Try toggling different risk levels or status filters above.</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {activePins.map((item) => {
              const isHigh = item.riskLevel === 'high';
              const isMed = item.riskLevel === 'medium';
              const isResolved = item.status === 'resolved';
              const riskColor = isResolved ? '#9BB0C4' : isHigh ? colors.danger : isMed ? colors.warn : colors.ok;
              const mapUrl = `https://www.google.com/maps/search/?api=1&query=${item.location.latitude},${item.location.longitude}`;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.card,
                    { borderLeftColor: riskColor, borderLeftWidth: 4 },
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                      <Text style={styles.cardTitle}>
                        {item.emoji} {item.title}
                      </Text>
                      {item.address ? <Text style={styles.cardAddress}>📍 {item.address}</Text> : null}
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <View style={[styles.badge, { backgroundColor: riskColor + '22', borderColor: riskColor }]}>
                        <Text style={[styles.badgeText, { color: riskColor }]}>
                          {item.riskLevel.toUpperCase()} RISK
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                        <Text style={[styles.badgeText, { color: colors.textMuted }]}>
                          {item.status.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.metaText}>
                      Ticket #{item.trackingNumber} {item.timeAgo ? `· ${item.timeAgo}` : ''}
                    </Text>

                    <Pressable
                      onPress={() => Linking.openURL(mapUrl)}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${item.title} in Google Maps`}
                      style={styles.openMapBtn}
                    >
                      <Ionicons name="map-outline" size={14} color={colors.accent} style={{ marginRight: 4 }} />
                      <Text style={styles.openMapText}>Open Map</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    header: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    modeSwitcher: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.md,
      padding: 3,
    },
    modeTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
    },
    modeTabActive: {
      backgroundColor: colors.accent,
    },
    modeText: { ...type.label, fontSize: 13, color: colors.text },
    modeTextActive: { color: colors.bg },
    filterScroll: {
      gap: spacing.xs + 2,
      paddingVertical: 2,
    },
    chip: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 999,
      paddingVertical: 5,
      paddingHorizontal: spacing.md,
    },
    chipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipText: { ...type.caption, fontSize: 12, color: colors.text, fontFamily: fonts.bold },
    chipTextActive: { color: colors.bg },
    sectionHeading: { ...type.heading, fontSize: 15, color: colors.text },
    legendText: { ...type.caption, fontSize: 11, color: colors.textMuted },
    hotspotsSection: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    hotspotGrid: {
      gap: spacing.sm,
    },
    hotspotCard: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.sm,
      padding: spacing.sm + 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    hotspotTitle: { ...type.label, fontSize: 13, color: colors.text },
    hotspotBadge: {
      backgroundColor: '#FF4D4D22',
      borderColor: '#FF4D4D',
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    hotspotBadgeText: { ...type.caption, fontSize: 10, color: '#FF4D4D', fontFamily: fonts.bold },
    hotspotDesc: { ...type.caption, fontSize: 12, color: colors.textMuted, marginTop: 2 },
    hotspotCorridor: { ...type.caption, fontSize: 11, color: colors.accent, marginTop: 2, fontFamily: fonts.bold },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    cardTitle: { ...type.heading, fontSize: 15, color: colors.text, marginBottom: 2 },
    cardAddress: { ...type.caption, fontSize: 12, color: colors.textMuted },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      borderWidth: 1,
    },
    badgeText: { ...type.caption, fontSize: 10, fontFamily: fonts.bold },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    metaText: { ...type.caption, fontSize: 11, color: colors.textMuted },
    openMapBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceAlt,
    },
    openMapText: { ...type.caption, fontSize: 12, color: colors.accent, fontFamily: fonts.bold },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    emptyTitle: { ...type.label, color: colors.text },
    emptySub: { ...type.caption, color: colors.textMuted },
    routeAlertCard: {
      backgroundColor: colors.surface,
      borderColor: colors.accent,
      borderWidth: 2,
      borderRadius: radius.lg,
      padding: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    routeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    routeHeaderTitle: { ...type.heading, fontSize: 15, color: colors.text },
    closeBtn: {
      padding: 4,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
    },
    routeTab: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    routeTabText: { ...type.caption, fontSize: 11, color: colors.text },
    routeEndpoints: { ...type.caption, fontSize: 12, color: colors.textMuted, marginVertical: 4 },
    routeHazardsList: {
      gap: 6,
      marginVertical: 4,
    },
    routeHazardItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.danger + '14',
      borderColor: colors.danger,
      borderWidth: 1,
      borderRadius: radius.sm,
      padding: spacing.sm,
    },
    routeHazardText: { ...type.caption, fontSize: 13, color: colors.danger },
    routeHazardSub: { ...type.caption, fontSize: 11, color: colors.textMuted, marginTop: 2 },
    detourBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.ok + '14',
      borderColor: colors.ok,
      borderWidth: 1,
      borderRadius: radius.sm,
      padding: spacing.sm,
      marginTop: 4,
    },
    detourText: { ...type.caption, fontSize: 12, color: colors.ok, fontFamily: fonts.bold, flex: 1 },
  });

