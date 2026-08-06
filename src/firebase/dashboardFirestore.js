/**
 * dashboardFirestore.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Firestore helpers exclusively for the Dashboard Overview page.
 * All queries reuse existing Firestore collections — no new collections created.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "./firebase";
import { getLoggedUserId } from "./firestore";

// ─── Helper: format relative time ────────────────────────────────────────────
export const formatRelativeTime = (isoStr) => {
  if (!isoStr) return "";
  try {
    const diffMs = Date.now() - new Date(isoStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  } catch {
    return "Recently";
  }
};

// ─── Helper: time remaining ───────────────────────────────────────────────────
export const formatTimeRemaining = (isoDeadline) => {
  if (!isoDeadline) return "";
  try {
    const diffMs = new Date(isoDeadline).getTime() - Date.now();
    if (diffMs < 0) return "Overdue";
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  } catch {
    return "";
  }
};

// ─── Helper: parse income range to number ────────────────────────────────────
const parseIncome = (incomeStr) => {
  if (!incomeStr) return 0;
  const nums = String(incomeStr).replace(/[^0-9]/g, "");
  return nums ? Number(nums) : 0;
};

// ─── Helper: simple eligibility score ────────────────────────────────────────
const calcSchemeScore = (scheme, profile) => {
  if (!profile) return 0;
  let passed = 0;
  let total = 0;

  const age = Number(profile.age) || 0;
  const minAge = scheme.minimumAge ?? null;
  const maxAge = scheme.maximumAge ?? null;
  if (minAge !== null || maxAge !== null) {
    total++;
    const ageOk =
      (minAge === null || age === 0 || age >= minAge) &&
      (maxAge === null || age === 0 || age <= maxAge);
    if (ageOk) passed++;
  }

  const incomeLimit = scheme.incomeLimit ?? null;
  if (incomeLimit !== null) {
    total++;
    const incVal = parseIncome(profile.incomeRange || profile.income);
    if (incVal === 0 || incVal <= incomeLimit) passed++;
  }

  const sState = (scheme.state || "").toLowerCase();
  const pState = (profile.state || "").toLowerCase();
  if (sState && sState !== "all india") {
    total++;
    if (!pState || pState === sState) passed++;
  }

  const sGender = (scheme.gender || "").toLowerCase();
  const pGender = (profile.gender || "").toLowerCase();
  if (sGender && sGender !== "all") {
    total++;
    if (!pGender || pGender === sGender) passed++;
  }

  if (total === 0) return 100;
  return Math.round((passed / total) * 100);
};

// ─── 1. Get schemes count ─────────────────────────────────────────────────────
export const getDashboardSchemesCount = async () => {
  try {
    const schemesCol = collection(db, "schemes");
    const snap = await getDocs(schemesCol);
    let count = 0;
    snap.forEach((d) => {
      const status = d.data().status;
      if (status === "active" || status === "upcoming") count++;
    });
    return { count, total: snap.size };
  } catch (err) {
    console.error("[dashboardFirestore.getDashboardSchemesCount]", err);
    return { count: 0, total: 0 };
  }
};

// ─── 2. Get upcoming deadlines ────────────────────────────────────────────────
export const getDashboardDeadlines = async () => {
  const userId = getLoggedUserId();
  if (!userId) return { count: 0, nearest: null, nearestTime: "" };
  try {
    const now = new Date().toISOString();
    const calCol = collection(db, `users/${userId}/calendarEvents`);
    const snap = await getDocs(calCol);

    const deadlines = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data.type === "deadline" || data.type === "renewal") {
        const due = data.dueDate || data.date || "";
        if (due && due > now) {
          deadlines.push({ id: d.id, ...data });
        }
      }
    });

    // Also pull scheme last dates from schemes collection
    const schemesSnap = await getDocs(collection(db, "schemes"));
    schemesSnap.forEach((d) => {
      const s = d.data();
      const last = s.lastDate || s.deadline || "";
      if (last && last > now && (s.status === "active" || s.status === "upcoming")) {
        deadlines.push({
          id: d.id,
          title: s.name,
          dueDate: last,
          type: "deadline",
        });
      }
    });

    deadlines.sort((a, b) =>
      (a.dueDate || a.date || "").localeCompare(b.dueDate || b.date || "")
    );

    const nearest = deadlines[0] || null;
    return {
      count: deadlines.length,
      nearest: nearest?.title || nearest?.name || null,
      nearestTime: nearest
        ? formatTimeRemaining(nearest.dueDate || nearest.date)
        : "",
    };
  } catch (err) {
    console.error("[dashboardFirestore.getDashboardDeadlines]", err);
    return { count: 0, nearest: null, nearestTime: "" };
  }
};

// ─── 3. Get corruption alerts ─────────────────────────────────────────────────
export const getDashboardCorruptionAlerts = async () => {
  const userId = getLoggedUserId();
  if (!userId) return { count: 0, alerts: [] };
  try {
    const notifsCol = collection(db, `users/${userId}/notifications`);
    const snap = await getDocs(notifsCol);

    const corruptionKeywords = ["corrupt", "fraud", "anomal", "alert", "warning", "discrepancy"];
    const corruptionTypes = new Set([
      "corruption", "fraud_alert", "fraud", "alert", "warning",
    ]);

    const alerts = [];
    snap.forEach((d) => {
      const n = d.data();
      const type = (n.type || "").toLowerCase();
      const title = (n.title || "").toLowerCase();
      const isAlert =
        corruptionTypes.has(type) ||
        corruptionKeywords.some((kw) => title.includes(kw));
      if (isAlert) alerts.push({ id: d.id, ...n });
    });

    return { count: alerts.length, alerts };
  } catch (err) {
    console.error("[dashboardFirestore.getDashboardCorruptionAlerts]", err);
    return { count: 0, alerts: [] };
  }
};

// ─── 4. Get unclaimed benefits ────────────────────────────────────────────────
export const getDashboardUnclaimedBenefits = async () => {
  const userId = getLoggedUserId();
  if (!userId) return { count: 0, estimatedAmount: 0 };
  try {
    // Load applied scheme IDs
    const appsCol = collection(db, `users/${userId}/applications`);
    const appsSnap = await getDocs(appsCol);
    const appliedIds = new Set();
    appsSnap.forEach((d) => {
      const appData = d.data();
      if (appData.schemeId) appliedIds.add(appData.schemeId);
    });

    // Load profile
    const citizenDoc = doc(db, "citizens", userId);
    const citizenSnap = await getDoc(citizenDoc);
    const profile = citizenSnap.exists() ? citizenSnap.data() : {};

    // Load all active schemes
    const schemesSnap = await getDocs(collection(db, "schemes"));
    let unclaimedCount = 0;
    let unclaimedEstimate = 0;

    schemesSnap.forEach((d) => {
      const s = d.data();
      if (s.status !== "active" && s.status !== "upcoming") return;
      if (appliedIds.has(d.id)) return;

      const score = calcSchemeScore(s, profile);
      if (score >= 60) {
        // This scheme is potentially eligible and unclaimed
        unclaimedCount++;
        const benefitStr = String(s.benefitAmount || s.estimatedBenefit || "0");
        const nums = benefitStr.replace(/[^0-9]/g, "");
        if (nums) {
          const val = parseInt(nums, 10);
          if (!isNaN(val)) unclaimedEstimate += Math.min(val, 100000);
        }
      }
    });

    return { count: unclaimedCount, estimatedAmount: unclaimedEstimate };
  } catch (err) {
    console.error("[dashboardFirestore.getDashboardUnclaimedBenefits]", err);
    return { count: 0, estimatedAmount: 0 };
  }
};

// ─── 5. Get activity feed (Live Pulse) ────────────────────────────────────────
export const getDashboardActivityFeed = async (maxItems = 20) => {
  const userId = getLoggedUserId();
  if (!userId) return { feed: [], unreadCount: 0 };
  try {
    const notifsCol = collection(db, `users/${userId}/notifications`);
    const snap = await getDocs(notifsCol);

    const feed = [];
    snap.forEach((d) => {
      const n = d.data();
      feed.push({
        id: d.id,
        type: n.type || "info",
        iconType: n.iconType || n.type || "info",
        title: n.title || "Notification",
        desc: n.desc || n.message || n.body || "",
        read: n.read || false,
        time: formatRelativeTime(n.createdAt || n.timestamp || ""),
        createdAt: n.createdAt || n.timestamp || "",
      });
    });

    feed.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    const unreadCount = feed.filter((f) => !f.read).length;

    return { feed: feed.slice(0, maxItems), unreadCount };
  } catch (err) {
    console.error("[dashboardFirestore.getDashboardActivityFeed]", err);
    return { feed: [], unreadCount: 0 };
  }
};

// ─── 6. Get eligibility summary ───────────────────────────────────────────────
export const getDashboardEligibility = async () => {
  const userId = getLoggedUserId();
  if (!userId) return { topSchemes: [], profileCompletionPct: 0 };
  try {
    const citizenSnap = await getDoc(doc(db, "citizens", userId));
    const profile = citizenSnap.exists() ? citizenSnap.data() : {};

    // Profile completion
    const completionFields = [
      "phone", "dob", "gender", "category", "state",
      "district", "profession", "education", "age",
    ];
    const filled = completionFields.filter((f) => profile[f] && String(profile[f]).trim()).length;
    const profileCompletionPct = Math.round((filled / completionFields.length) * 100);

    // Score all active schemes
    const schemesSnap = await getDocs(collection(db, "schemes"));
    const scored = [];
    schemesSnap.forEach((d) => {
      const s = d.data();
      if (s.status !== "active" && s.status !== "upcoming") return;
      const score = calcSchemeScore(s, profile);
      scored.push({
        id: d.id,
        name: s.name || s.schemeName || "Scheme",
        score,
        verdict: score >= 80 ? "High Match" : score >= 50 ? "Potential" : "Low Match",
      });
    });

    scored.sort((a, b) => b.score - a.score);

    return {
      topSchemes: scored.slice(0, 2),
      profileCompletionPct,
      hasProfile: citizenSnap.exists(),
    };
  } catch (err) {
    console.error("[dashboardFirestore.getDashboardEligibility]", err);
    return { topSchemes: [], profileCompletionPct: 0 };
  }
};

// ─── 7. Get GPS roadmap summary ───────────────────────────────────────────────
export const getDashboardGpsSummary = async () => {
  const userId = getLoggedUserId();
  if (!userId) return null;
  try {
    const roadmapSnap = await getDoc(doc(db, "roadmaps", userId));
    if (!roadmapSnap.exists()) {
      return {
        currentStage: "Not Started",
        completedSteps: 0,
        totalSteps: 0,
        pendingSteps: 0,
        progressPct: 0,
        nextAction: "Generate your civic roadmap",
        hasRoadmap: false,
      };
    }

    const items = roadmapSnap.data().items || [];
    const total = items.length;
    const completed = items.filter((i) => i.status === "completed").length;
    const pending = items.filter(
      (i) => i.status === "pending" || i.status === "upcoming" || i.status === "action_required"
    ).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    let currentStage = "All Steps Completed";
    let nextAction = "Apply for eligible schemes";
    for (const step of items) {
      if (step.status !== "completed") {
        currentStage = step.title || "In Progress";
        nextAction = step.desc || "Complete current step";
        break;
      }
    }

    return {
      currentStage,
      completedSteps: completed,
      totalSteps: total,
      pendingSteps: pending,
      progressPct: pct,
      nextAction,
      hasRoadmap: true,
    };
  } catch (err) {
    console.error("[dashboardFirestore.getDashboardGpsSummary]", err);
    return null;
  }
};

// ─── 8. Mark all notifications read ──────────────────────────────────────────
export const markAllDashboardNotificationsRead = async () => {
  const userId = getLoggedUserId();
  if (!userId) return;
  try {
    const notifsCol = collection(db, `users/${userId}/notifications`);
    const snap = await getDocs(notifsCol);
    const updates = [];
    snap.forEach((d) => {
      if (!d.data().read) {
        updates.push(updateDoc(doc(db, `users/${userId}/notifications`, d.id), { read: true }));
      }
    });
    await Promise.all(updates);
  } catch (err) {
    console.error("[dashboardFirestore.markAllDashboardNotificationsRead]", err);
  }
};
