/**
 * useDashboardData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom React hook that fetches ALL live data for the Dashboard Overview page.
 * Runs Firestore + FastAPI calls in parallel for maximum performance.
 * Returns structured data for every card, plus loading/error states.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getDashboardSchemesCount,
  getDashboardDeadlines,
  getDashboardCorruptionAlerts,
  getDashboardUnclaimedBenefits,
  getDashboardActivityFeed,
  getDashboardEligibility,
  getDashboardGpsSummary,
  markAllDashboardNotificationsRead,
} from "../firebase/dashboardFirestore";
import { getBillsCount, getLatestBill } from "../services/billService";
import { firestoreGetAnalytics } from "../firebase/firestore";

// ─── Default / empty state ────────────────────────────────────────────────────
const DEFAULT_STATE = {
  // Stat cards
  billsCount: null,
  schemesCount: null,
  deadlines: { count: null, nearest: null, nearestTime: "" },
  corruptionAlerts: { count: null, alerts: [] },
  unclaimedBenefits: { count: null, estimatedAmount: 0 },

  // Eligibility card
  eligibility: { topSchemes: [], profileCompletionPct: null },

  // AI Summary card
  latestBill: null,

  // GPS card
  gps: null,

  // Live Pulse Feed
  activityFeed: [],
  unreadCount: 0,

  // Impact Projection chart
  analytics: null,

  // Meta
  loading: true,
  error: null,
  lastFetched: null,
};

const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function useDashboardData() {
  const [state, setState] = useState(DEFAULT_STATE);
  const cacheRef = useRef(null); // stores { data, timestamp }
  const fetchingRef = useRef(false);

  const fetchAll = useCallback(async (force = false) => {
    // Prevent duplicate concurrent fetches
    if (fetchingRef.current) return;

    // Return cached data if still fresh
    if (
      !force &&
      cacheRef.current &&
      Date.now() - cacheRef.current.timestamp < CACHE_TTL_MS
    ) {
      setState({ ...cacheRef.current.data, loading: false, error: null });
      return;
    }

    fetchingRef.current = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // ── Run all fetches in parallel ────────────────────────────────────────
      const [
        billsResult,
        schemesResult,
        deadlinesResult,
        corruptionResult,
        unclaimedResult,
        eligibilityResult,
        latestBillResult,
        gpsResult,
        activityResult,
        analyticsResult,
      ] = await Promise.allSettled([
        getBillsCount(),                    // Card 1: Bills Analyzed
        getDashboardSchemesCount(),          // Card 2: Government Schemes
        getDashboardDeadlines(),             // Card 3: Upcoming Deadlines
        getDashboardCorruptionAlerts(),      // Card 4: Corruption Alerts
        getDashboardUnclaimedBenefits(),     // Card 5: Unclaimed Benefits
        getDashboardEligibility(),           // Status & Eligibility card
        getLatestBill(),                     // AI Summary card
        getDashboardGpsSummary(),            // Civic GPS card
        getDashboardActivityFeed(20),        // Live Pulse Feed
        firestoreGetAnalytics(),             // Impact Projection chart
      ]);

      // ── Extract values safely with fallbacks ───────────────────────────────
      const safe = (result, fallback) =>
        result.status === "fulfilled" ? result.value : fallback;

      const billsData        = safe(billsResult,       { total: 0 });
      const schemesData      = safe(schemesResult,     { count: 0 });
      const deadlinesData    = safe(deadlinesResult,   { count: 0, nearest: null, nearestTime: "" });
      const corruptionData   = safe(corruptionResult,  { count: 0, alerts: [] });
      const unclaimedData    = safe(unclaimedResult,   { count: 0, estimatedAmount: 0 });
      const eligData         = safe(eligibilityResult, { topSchemes: [], profileCompletionPct: 0 });
      const latestBillData   = safe(latestBillResult,  { bill: null });
      const gpsData          = safe(gpsResult,         null);
      const activityData     = safe(activityResult,    { feed: [], unreadCount: 0 });
      const analyticsData    = safe(analyticsResult,   null);

      // Log any failed fetches for debugging (non-blocking)
      [
        billsResult, schemesResult, deadlinesResult, corruptionResult,
        unclaimedResult, eligibilityResult, latestBillResult, gpsResult,
        activityResult, analyticsResult,
      ].forEach((r, idx) => {
        if (r.status === "rejected") {
          const names = ["bills","schemes","deadlines","corruption","unclaimed","eligibility","latestBill","gps","activity","analytics"];
          console.warn(`[useDashboardData] ${names[idx]} fetch failed:`, r.reason?.message || r.reason);
        }
      });

      const newData = {
        billsCount:       billsData.total ?? 0,
        schemesCount:     schemesData.count ?? 0,
        deadlines:        deadlinesData,
        corruptionAlerts: corruptionData,
        unclaimedBenefits: unclaimedData,
        eligibility:      eligData,
        latestBill:       latestBillData.bill ?? null,
        gps:              gpsData,
        activityFeed:     activityData.feed ?? [],
        unreadCount:      activityData.unreadCount ?? 0,
        analytics:        analyticsData?.analytics ?? null,
        lastFetched:      Date.now(),
      };

      // Save to cache
      cacheRef.current = { data: newData, timestamp: Date.now() };

      setState({
        ...newData,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error("[useDashboardData] Critical fetch error:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load dashboard data. Please refresh.",
      }));
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // ── Initial fetch on mount ────────────────────────────────────────────────
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Mark all notifications read ───────────────────────────────────────────
  const handleMarkAllRead = useCallback(async () => {
    await markAllDashboardNotificationsRead();
    // Optimistically clear unread state
    setState((prev) => ({
      ...prev,
      unreadCount: 0,
      activityFeed: prev.activityFeed.map((item) => ({ ...item, read: true })),
    }));
    // Invalidate cache so next fetch re-reads from Firestore
    cacheRef.current = null;
  }, []);

  // ── Refresh hook — call after user actions (bill upload, apply, etc.) ─────
  const refresh = useCallback(() => {
    cacheRef.current = null;
    fetchAll(true);
  }, [fetchAll]);

  return {
    ...state,
    refresh,
    handleMarkAllRead,
  };
}
