import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { PotholeReport, ReportStatus } from '@/types/report';
import { getNextReportStatus } from '@/data/communityReports';
import { KEYS, readJSON, writeJSON } from '@/data/storage';

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  /** Teachable Machine shareable model URL for AI hazard suggestions (optional). */
  aiModelUrl?: string;
  /** Whether to run the AI suggestion after a photo is taken. */
  aiEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = { theme: 'system', aiModelUrl: '', aiEnabled: true };

interface StoreValue {
  settings: AppSettings;
  reports: PotholeReport[];
  updateSettings: (patch: Partial<AppSettings>) => void;
  saveReport: (r: PotholeReport) => void;
  deleteReport: (id: string) => void;
  updateReportStatus: (id: string, status: ReportStatus) => void;
  advanceReportStatus: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, r] = await Promise.all([
        readJSON<AppSettings>(KEYS.settings, DEFAULT_SETTINGS),
        readJSON<PotholeReport[]>(KEYS.reports, []),
      ]);
      if (cancelled) return;
      setSettings({ ...DEFAULT_SETTINGS, ...s });
      setReports(r);
      hydrated.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hydrated.current) void writeJSON(KEYS.settings, settings);
  }, [settings]);
  useEffect(() => {
    if (hydrated.current) void writeJSON(KEYS.reports, reports);
  }, [reports]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const saveReport = useCallback((r: PotholeReport) => {
    setReports((prev) => [r, ...prev.filter((x) => x.id !== r.id)]);
  }, []);

  const deleteReport = useCallback((id: string) => {
    setReports((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const updateReportStatus = useCallback((id: string, status: ReportStatus) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, statusUpdatedAt: Date.now() } : r)),
    );
  }, []);

  const advanceReportStatus = useCallback((id: string) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = getNextReportStatus(r.status);
        return { ...r, status: next, statusUpdatedAt: Date.now() };
      }),
    );
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      settings,
      reports,
      updateSettings,
      saveReport,
      deleteReport,
      updateReportStatus,
      advanceReportStatus,
    }),
    [settings, reports, updateSettings, saveReport, deleteReport, updateReportStatus, advanceReportStatus],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}


export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within AppProvider');
  return ctx;
}
