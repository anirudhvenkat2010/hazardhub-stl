import { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RiskLevel, ReportStatus, GeoPoint } from '@/types/report';
import { HAZARDS } from '@/types/report';
import { useStore } from '@/store/AppStore';
import {
  COMMUNITY_HAZARDS,
  HAZARD_HOTSPOTS,
  SAMPLE_ROUTES,
  calculateHazardRisk,
  type CommunityHazard,
  type HazardHotspot,
} from '@/data/communityReports';

import { fonts, radius, spacing, type, useTheme, type Palette } from '@/ui/theme';

const STL_CENTER = { latitude: 38.627, longitude: -90.22, latitudeDelta: 0.22, longitudeDelta: 0.22 };

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

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { reports } = useStore();

  const [mode, setMode] = useState<MapMode>('community');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showHotspots, setShowHotspots] = useState(true);
  const [selectedPin, setSelectedPin] = useState<UnifiedPin | null>(null);
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
      // Risk filter
      if (riskFilter !== 'all' && pin.riskLevel !== riskFilter) return false;
      // Status filter
      if (statusFilter === 'open' && pin.status === 'resolved') return false;
      if (statusFilter === 'resolved' && pin.status !== 'resolved') return false;
      return true;
    });
  }, [mode, communityPins, personalPins, riskFilter, statusFilter]);

  const pinColor = (pin: UnifiedPin) => {
    if (pin.status === 'resolved') return '#9BB0C4';
    if (pin.riskLevel === 'high') return colors.danger;
    if (pin.riskLevel === 'medium') return colors.warn;
    return colors.ok;
  };

  return (
    <View style={styles.root}>
      {/* Interactive Native Map */}
      <MapView
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        initialRegion={STL_CENTER}
        onPress={() => setSelectedPin(null)}
      >
        {/* Hotspot Corridor Overlays (when toggled on community map) */}
        {mode === 'community' && showHotspots
          ? HAZARD_HOTSPOTS.map((spot) => (
              <Marker
                key={spot.id}
                coordinate={spot.location}
                title={`🔥 HOTSPOT: ${spot.name}`}
                description={`${spot.incidentCount} reports along ${spot.corridor}`}
                pinColor="#FF4D4D"
                onPress={() =>
                  setSelectedPin({
                    id: spot.id,
                    title: `🔥 Hotspot: ${spot.name}`,
                    hazardType: spot.primaryHazard,
                    emoji: '🔥',
                    location: spot.location,
                    riskLevel: spot.riskLevel,
                    status: 'in_progress',
                    address: spot.corridor,
                    trackingNumber: `${spot.incidentCount} active reports in 30 days`,
                    isHotspot: true,
                  })
                }
              />
            ))
          : null}

        {/* Hazard Markers */}
        {activePins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={pin.location}
            title={`${pin.emoji} ${pin.title}`}
            description={`${pin.riskLevel.toUpperCase()} RISK · ${pin.status.replace('_', ' ').toUpperCase()}`}
            pinColor={pinColor(pin)}
            onPress={() => setSelectedPin(pin)}
          />
        ))}
      </MapView>

      {/* Top Floating Controls */}
      <View style={[styles.floatingHeader, { top: insets.top + spacing.sm }]}>
        {/* Mode Switcher */}
        <View style={styles.modeSwitcher}>
          <Pressable
            onPress={() => {
              setMode('community');
              setSelectedPin(null);
            }}
            accessibilityRole="button"
            accessibilityLabel="Live Community Map"
            style={[styles.modeTab, mode === 'community' && styles.modeTabActive]}
          >
            <Ionicons
              name="globe-outline"
              size={15}
              color={mode === 'community' ? colors.bg : colors.text}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.modeText, mode === 'community' && styles.modeTextActive]}>
              Community Live
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setMode('personal');
              setSelectedPin(null);
            }}
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
          {/* Risk Level Filters */}
          <Pressable
            onPress={() => setRiskFilter(riskFilter === 'all' ? 'high' : 'all')}
            style={[styles.chip, riskFilter === 'high' && { backgroundColor: colors.danger, borderColor: colors.danger }]}
          >
            <Text style={[styles.chipText, riskFilter === 'high' && { color: '#FFF' }]}>
              🔴 High Risk
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setRiskFilter(riskFilter === 'medium' ? 'all' : 'medium')}
            style={[styles.chip, riskFilter === 'medium' && { backgroundColor: colors.warn, borderColor: colors.warn }]}
          >
            <Text style={[styles.chipText, riskFilter === 'medium' && { color: '#000' }]}>
              🟡 Med Risk
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setRiskFilter(riskFilter === 'low' ? 'all' : 'low')}
            style={[styles.chip, riskFilter === 'low' && { backgroundColor: colors.ok, borderColor: colors.ok }]}
          >
            <Text style={[styles.chipText, riskFilter === 'low' && { color: '#FFF' }]}>
              🟢 Low Risk
            </Text>
          </Pressable>

          {/* Status Filters */}
          <Pressable
            onPress={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')}
            style={[styles.chip, statusFilter === 'open' && styles.chipActive]}
          >
            <Text style={[styles.chipText, statusFilter === 'open' && styles.chipTextActive]}>
              ⚠️ Open
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
            style={[styles.chip, statusFilter === 'resolved' && styles.chipActive]}
          >
            <Text style={[styles.chipText, statusFilter === 'resolved' && styles.chipTextActive]}>
              ✅ Resolved
            </Text>
          </Pressable>

          {/* Hotspot Toggle */}
          {mode === 'community' ? (
            <Pressable
              onPress={() => setShowHotspots(!showHotspots)}
              style={[styles.chip, showHotspots && { backgroundColor: '#FF4D4D', borderColor: '#FF4D4D' }]}
            >
              <Text style={[styles.chipText, showHotspots && { color: '#FFF' }]}>
                🔥 Hotspots
              </Text>
            </Pressable>
          ) : null}

          {/* Route Safety Alert Toggle */}
          <Pressable
            onPress={() => {
              setShowRouteAlert(!showRouteAlert);
              setSelectedPin(null);
            }}
            style={[
              styles.chip,
              showRouteAlert && { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
          >
            <Text style={[styles.chipText, showRouteAlert && { color: colors.bg }]}>
              🚗 Route Alert
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Smart Route Safety Alert Card */}
      {showRouteAlert && selectedRoute ? (
        <View style={[styles.routeAlertCard, { bottom: insets.bottom + spacing.md }]}>
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
                  <Text style={styles.routeHazardSub} numberOfLines={2}>
                    {item.warningText}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Detour Recommendation */}
          <View style={styles.detourBox}>
            <Ionicons name="checkmark-circle" size={15} color={colors.ok} style={{ marginRight: 6 }} />
            <Text style={styles.detourText} numberOfLines={2}>
              Detour: <Text style={{ color: colors.text }}>{selectedRoute.recommendedDetour}</Text>
            </Text>
          </View>
        </View>
      ) : selectedPin ? (
        /* Selected Pin Bottom Card */
        <View style={[styles.detailCard, { bottom: insets.bottom + spacing.lg }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Text style={{ fontSize: 18 }}>{selectedPin.emoji}</Text>
                <Text numberOfLines={1} style={styles.detailTitle}>
                  {selectedPin.title}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <View
                  style={[
                    styles.tag,
                    {
                      backgroundColor:
                        selectedPin.riskLevel === 'high'
                          ? colors.danger + '22'
                          : selectedPin.riskLevel === 'medium'
                          ? colors.warn + '22'
                          : colors.ok + '22',
                      borderColor:
                        selectedPin.riskLevel === 'high'
                          ? colors.danger
                          : selectedPin.riskLevel === 'medium'
                          ? colors.warn
                          : colors.ok,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      {
                        color:
                          selectedPin.riskLevel === 'high'
                            ? colors.danger
                            : selectedPin.riskLevel === 'medium'
                            ? colors.warn
                            : colors.ok,
                      },
                    ]}
                  >
                    {selectedPin.riskLevel.toUpperCase()} RISK
                  </Text>
                </View>

                <View style={[styles.tag, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Text style={[styles.tagText, { color: colors.textMuted }]}>
                    {selectedPin.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => setSelectedPin(null)}
              accessibilityRole="button"
              accessibilityLabel="Close detail card"
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          {selectedPin.address ? (
            <Text style={[styles.muted, { marginTop: spacing.sm }]} numberOfLines={2}>
              📍 {selectedPin.address}
            </Text>
          ) : null}

          <View style={styles.detailFooter}>
            <Text style={styles.metaText}>
              Ticket: {selectedPin.trackingNumber} {selectedPin.timeAgo ? `· ${selectedPin.timeAgo}` : ''}
            </Text>

            <Pressable
              onPress={() => {
                const url = `https://www.google.com/maps/search/?api=1&query=${selectedPin.location.latitude},${selectedPin.location.longitude}`;
                Linking.openURL(url);
              }}
              style={styles.navBtn}
            >
              <Ionicons name="navigate" size={14} color={colors.bg} style={{ marginRight: 4 }} />
              <Text style={styles.navBtnText}>Directions</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* Floating Summary Count */
        <View style={[styles.countBadge, { bottom: insets.bottom + spacing.md }]}>
          <Text style={styles.countText}>
            {activePins.length} {mode === 'community' ? 'community' : 'saved'} hazard
            {activePins.length === 1 ? '' : 's'} plotted
            {showHotspots && mode === 'community' ? ' · 4 hotspot zones' : ''}
          </Text>
        </View>
      )}

    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    floatingHeader: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      gap: spacing.sm,
    },
    modeSwitcher: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
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
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 999,
      paddingVertical: 5,
      paddingHorizontal: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 2,
      elevation: 2,
    },
    chipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipText: { ...type.caption, fontSize: 12, color: colors.text, fontFamily: fonts.bold },
    chipTextActive: { color: colors.bg },
    countBadge: {
      position: 'absolute',
      alignSelf: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 999,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    countText: { ...type.caption, color: colors.text, fontFamily: fonts.medium },
    detailCard: {
      position: 'absolute',
      left: spacing.lg,
      right: spacing.lg,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    detailTitle: { ...type.heading, fontSize: 16, color: colors.text, flex: 1 },
    closeBtn: {
      padding: 4,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
    },
    tag: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      borderWidth: 1,
    },
    tagText: { ...type.caption, fontSize: 10, fontFamily: fonts.bold },
    muted: { ...type.caption, color: colors.textMuted, fontSize: 13 },
    detailFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    metaText: { ...type.caption, fontSize: 11, color: colors.textMuted },
    navBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: radius.sm,
    },
    navBtnText: { ...type.caption, color: colors.bg, fontFamily: fonts.bold, fontSize: 12 },
    routeAlertCard: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      backgroundColor: colors.surface,
      borderColor: colors.accent,
      borderWidth: 2,
      borderRadius: radius.lg,
      padding: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
    },
    routeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    routeHeaderTitle: { ...type.heading, fontSize: 15, color: colors.text },
    routeTab: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    routeTabText: { ...type.caption, fontSize: 11, color: colors.text },
    routeEndpoints: { ...type.caption, fontSize: 11, color: colors.textMuted, marginVertical: 4 },
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
      padding: 6,
    },
    routeHazardText: { ...type.caption, fontSize: 12, color: colors.danger },
    routeHazardSub: { ...type.caption, fontSize: 11, color: colors.textMuted, marginTop: 1 },
    detourBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.ok + '14',
      borderColor: colors.ok,
      borderWidth: 1,
      borderRadius: radius.sm,
      padding: 6,
      marginTop: 4,
    },
    detourText: { ...type.caption, fontSize: 11, color: colors.ok, fontFamily: fonts.bold, flex: 1 },
  });

